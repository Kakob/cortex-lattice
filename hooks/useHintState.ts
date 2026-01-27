"use client";

/**
 * useHintState - Hook for managing hint reveal state
 *
 * Tracks which hints have been revealed in each category.
 */

import { useState, useCallback, useMemo } from "react";
import type { HintCategory, CategorizedHints } from "@/lib/types";

interface HintStateResult {
  revealedCounts: Record<HintCategory, number>;
  expandedCategory: HintCategory | null;
  revealNextHint: (category: HintCategory) => void;
  toggleCategory: (category: HintCategory) => void;
  resetCategory: (category: HintCategory) => void;
  resetAll: () => void;
  getVisibleHints: (category: HintCategory) => { id: string; text: string }[];
  getHintProgress: (category: HintCategory) => { revealed: number; total: number };
}

const INITIAL_REVEALED: Record<HintCategory, number> = {
  key_concepts: 0,
  common_mistakes: 0,
  project_context: 0,
  paper_reference: 0,
  solution_approach: 0,
};

export function useHintState(hints: CategorizedHints | null): HintStateResult {
  const [revealedCounts, setRevealedCounts] = useState<Record<HintCategory, number>>(
    { ...INITIAL_REVEALED }
  );
  const [expandedCategory, setExpandedCategory] = useState<HintCategory | null>(null);

  // Map category ID to hints array key
  const categoryToKey = useMemo(
    () => ({
      key_concepts: "keyConcepts",
      common_mistakes: "commonMistakes",
      project_context: "projectContext",
      paper_reference: "paperReference",
      solution_approach: "solutionApproach",
    }),
    []
  );

  // Reveal next hint in category
  const revealNextHint = useCallback((category: HintCategory) => {
    setRevealedCounts((prev) => ({
      ...prev,
      [category]: prev[category] + 1,
    }));
  }, []);

  // Toggle category expansion
  const toggleCategory = useCallback((category: HintCategory) => {
    setExpandedCategory((prev) => (prev === category ? null : category));
  }, []);

  // Reset single category
  const resetCategory = useCallback((category: HintCategory) => {
    setRevealedCounts((prev) => ({
      ...prev,
      [category]: 0,
    }));
  }, []);

  // Reset all categories
  const resetAll = useCallback(() => {
    setRevealedCounts({ ...INITIAL_REVEALED });
    setExpandedCategory(null);
  }, []);

  // Get visible hints for a category
  const getVisibleHints = useCallback(
    (category: HintCategory) => {
      if (!hints) return [];
      const key = categoryToKey[category] as keyof CategorizedHints;
      const categoryHints = hints[key] || [];
      const revealed = revealedCounts[category];
      return categoryHints.slice(0, revealed);
    },
    [hints, revealedCounts, categoryToKey]
  );

  // Get hint progress for a category
  const getHintProgress = useCallback(
    (category: HintCategory) => {
      if (!hints) return { revealed: 0, total: 0 };
      const key = categoryToKey[category] as keyof CategorizedHints;
      const categoryHints = hints[key] || [];
      return {
        revealed: revealedCounts[category],
        total: categoryHints.length,
      };
    },
    [hints, revealedCounts, categoryToKey]
  );

  return {
    revealedCounts,
    expandedCategory,
    revealNextHint,
    toggleCategory,
    resetCategory,
    resetAll,
    getVisibleHints,
    getHintProgress,
  };
}
