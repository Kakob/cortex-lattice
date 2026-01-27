/**
 * useSessionContext - Hook for tracking session timing and attempts
 *
 * Manages session state including:
 * - Session ID generation
 * - Time tracking
 * - Attempt counting
 * - Recent problem contribution IDs for auto-linking
 * - Integration with NextAuth for authenticated user IDs
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import type { SessionContext } from "@/lib/types";

const SESSION_STORAGE_PREFIX = "cortex-session-";

interface UseSessionContextReturn {
  session: SessionContext;
  incrementAttempt: () => void;
  addRecentProblem: (contributionId: string) => void;
  getTimeSinceStart: () => number;
  resetSession: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Generate a unique session ID.
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export function useSessionContext(problemId: string): UseSessionContextReturn {
  const { data: authSession, status } = useSession();
  const isAuthenticated = status === "authenticated" && !!authSession?.user?.id;
  const isLoading = status === "loading";

  const [session, setSession] = useState<SessionContext>(() => ({
    sessionId: "",
    problemId,
    userId: "",
    startTime: Date.now(),
    attemptCount: 1,
    recentProblems: [],
  }));

  const isInitialized = useRef(false);
  const lastUserId = useRef<string>("");

  // Get user ID from NextAuth session
  const userId = authSession?.user?.id || "";

  // Initialize session on mount and when auth status changes
  useEffect(() => {
    // Skip if still loading auth
    if (isLoading) return;

    // Skip if not authenticated
    if (!isAuthenticated || !userId) return;

    // Skip if already initialized with the same user
    if (isInitialized.current && lastUserId.current === userId) return;

    isInitialized.current = true;
    lastUserId.current = userId;

    const storageKey = `${SESSION_STORAGE_PREFIX}${problemId}`;

    // Try to restore existing session
    const stored = typeof window !== "undefined"
      ? sessionStorage.getItem(storageKey)
      : null;

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Check if session is still valid (less than 2 hours old) and for same user
        const sessionAge = Date.now() - parsed.startTime;
        const maxAge = 2 * 60 * 60 * 1000; // 2 hours

        if (sessionAge < maxAge && parsed.problemId === problemId && parsed.userId === userId) {
          setSession({
            ...parsed,
            userId, // Always use current userId
          });
          return;
        }
      } catch {
        // Invalid stored session, create new one
      }
    }

    // Create new session
    const newSession: SessionContext = {
      sessionId: generateSessionId(),
      problemId,
      userId,
      startTime: Date.now(),
      attemptCount: 1,
      recentProblems: [],
    };

    setSession(newSession);

    if (typeof window !== "undefined") {
      sessionStorage.setItem(storageKey, JSON.stringify(newSession));
    }
  }, [problemId, userId, isAuthenticated, isLoading]);

  // Persist session changes
  useEffect(() => {
    if (!session.sessionId) return;

    const storageKey = `${SESSION_STORAGE_PREFIX}${problemId}`;
    if (typeof window !== "undefined") {
      sessionStorage.setItem(storageKey, JSON.stringify(session));
    }
  }, [session, problemId]);

  const incrementAttempt = useCallback(() => {
    setSession((prev) => ({
      ...prev,
      attemptCount: prev.attemptCount + 1,
    }));
  }, []);

  const addRecentProblem = useCallback((contributionId: string) => {
    setSession((prev) => ({
      ...prev,
      recentProblems: [contributionId, ...prev.recentProblems].slice(0, 10),
    }));
  }, []);

  const getTimeSinceStart = useCallback(() => {
    return Date.now() - session.startTime;
  }, [session.startTime]);

  const resetSession = useCallback(() => {
    if (!userId) return;

    const storageKey = `${SESSION_STORAGE_PREFIX}${problemId}`;

    const newSession: SessionContext = {
      sessionId: generateSessionId(),
      problemId,
      userId,
      startTime: Date.now(),
      attemptCount: 1,
      recentProblems: [],
    };

    setSession(newSession);

    if (typeof window !== "undefined") {
      sessionStorage.setItem(storageKey, JSON.stringify(newSession));
    }
  }, [problemId, userId]);

  return {
    session,
    incrementAttempt,
    addRecentProblem,
    getTimeSinceStart,
    resetSession,
    isAuthenticated,
    isLoading,
  };
}
