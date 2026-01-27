/**
 * useCodePersistence - Hook for persisting code to localStorage
 *
 * Saves user code automatically and restores it when returning to a problem.
 * Uses debounced saves to avoid excessive writes.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_KEY_PREFIX = "cortex-code-";
const DEBOUNCE_MS = 500;

interface UseCodePersistenceReturn {
  code: string;
  setCode: (code: string) => void;
  resetToStarter: () => void;
  hasChanges: boolean;
}

export function useCodePersistence(
  problemId: string,
  starterCode: string
): UseCodePersistenceReturn {
  const [code, setCodeState] = useState(starterCode);
  const [isInitialized, setIsInitialized] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const storageKey = `${STORAGE_KEY_PREFIX}${problemId}`;

  // Load saved code on mount (client-side only)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedCode = localStorage.getItem(storageKey);
    if (savedCode !== null) {
      setCodeState(savedCode);
    }
    setIsInitialized(true);
  }, [storageKey]);

  // Debounced save to localStorage
  const saveToStorage = useCallback(
    (newCode: string) => {
      if (typeof window === "undefined") return;

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new debounced save
      saveTimeoutRef.current = setTimeout(() => {
        if (newCode === starterCode) {
          // Remove from storage if code matches starter (no need to save default)
          localStorage.removeItem(storageKey);
        } else {
          localStorage.setItem(storageKey, newCode);
        }
      }, DEBOUNCE_MS);
    },
    [storageKey, starterCode]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Setter that triggers save
  const setCode = useCallback(
    (newCode: string) => {
      setCodeState(newCode);
      if (isInitialized) {
        saveToStorage(newCode);
      }
    },
    [isInitialized, saveToStorage]
  );

  // Reset to starter code and clear storage
  const resetToStarter = useCallback(() => {
    setCodeState(starterCode);
    if (typeof window !== "undefined") {
      localStorage.removeItem(storageKey);
    }
    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
  }, [starterCode, storageKey]);

  // Check if code differs from starter
  const hasChanges = code !== starterCode;

  return {
    code,
    setCode,
    resetToStarter,
    hasChanges,
  };
}
