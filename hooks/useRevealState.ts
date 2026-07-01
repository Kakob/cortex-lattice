"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY_PREFIX = "cortex-reveals-";

interface UseRevealStateReturn {
  ready: boolean;
  isRevealed: (id: string) => boolean;
  reveal: (id: string) => void;
  reset: () => void;
}

export function useRevealState(problemId: string): UseRevealStateReturn {
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  const storageKey = `${STORAGE_KEY_PREFIX}${problemId}`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setRevealed(new Set(parsed.filter((v): v is string => typeof v === "string")));
        }
      }
    } catch {
      // Ignore malformed storage
    }
    setReady(true);
  }, [storageKey]);

  const persist = useCallback(
    (next: Set<string>) => {
      if (typeof window === "undefined") return;
      try {
        localStorage.setItem(storageKey, JSON.stringify([...next]));
      } catch {
        // Storage full or unavailable — fail silently
      }
    },
    [storageKey]
  );

  const isRevealed = useCallback(
    (id: string) => revealed.has(id),
    [revealed]
  );

  const reveal = useCallback(
    (id: string) => {
      setRevealed((prev) => {
        if (prev.has(id)) return prev;
        const next = new Set(prev);
        next.add(id);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const reset = useCallback(() => {
    setRevealed(new Set());
    if (typeof window !== "undefined") {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  return { ready, isRevealed, reveal, reset };
}
