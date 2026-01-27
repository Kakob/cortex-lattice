"use client";

/**
 * HintSystem - 5-category accordion hint system
 *
 * Categories:
 * - Key Concepts (algorithmic fundamentals)
 * - Common Mistakes (pitfalls)
 * - Project Context (AI Safety paper connections)
 * - Paper Reference (citations)
 * - Solution Approach (step-by-step)
 */

import { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb,
  AlertTriangle,
  Cpu,
  FileText,
  Target,
  ChevronDown,
  RefreshCw,
  Eye,
} from "lucide-react";
import type { HintCategory, CategorizedHints } from "@/lib/types";
import { useHintState } from "@/hooks/useHintState";

interface HintSystemProps {
  hints: CategorizedHints;
}

interface CategoryConfig {
  id: HintCategory;
  title: string;
  icon: typeof Lightbulb;
  color: string;
  bgColor: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: "key_concepts",
    title: "Key Concepts",
    icon: Lightbulb,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
  {
    id: "common_mistakes",
    title: "Common Mistakes",
    icon: AlertTriangle,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    id: "project_context",
    title: "Project Context",
    icon: Cpu,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    id: "paper_reference",
    title: "Paper Reference",
    icon: FileText,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    id: "solution_approach",
    title: "Solution Approach",
    icon: Target,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
];

export function HintSystem({ hints }: HintSystemProps) {
  const {
    expandedCategory,
    toggleCategory,
    revealNextHint,
    resetCategory,
    getVisibleHints,
    getHintProgress,
  } = useHintState(hints);

  return (
    <div className="space-y-3 pb-8">
      <h2 className="mb-4 text-lg font-semibold text-gray-100">
        Need help? Choose a hint category:
      </h2>

      {CATEGORIES.map((category) => (
        <HintCategory
          key={category.id}
          config={category}
          isExpanded={expandedCategory === category.id}
          onToggle={() => toggleCategory(category.id)}
          onReveal={() => revealNextHint(category.id)}
          onReset={() => resetCategory(category.id)}
          visibleHints={getVisibleHints(category.id)}
          progress={getHintProgress(category.id)}
        />
      ))}
    </div>
  );
}

interface HintCategoryProps {
  config: CategoryConfig;
  isExpanded: boolean;
  onToggle: () => void;
  onReveal: () => void;
  onReset: () => void;
  visibleHints: { id: string; text: string }[];
  progress: { revealed: number; total: number };
}

function HintCategory({
  config,
  isExpanded,
  onToggle,
  onReveal,
  onReset,
  visibleHints,
  progress,
}: HintCategoryProps) {
  const { id, title, icon: Icon, color, bgColor } = config;
  const { revealed, total } = progress;
  const allRevealed = revealed >= total;
  const hasHints = total > 0;

  const handleReveal = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onReveal();
    },
    [onReveal]
  );

  const handleReset = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onReset();
    },
    [onReset]
  );

  if (!hasHints) return null;

  return (
    <div className={`overflow-hidden rounded-xl border border-gray-700 ${bgColor}`}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/5"
      >
        <div className="flex items-center gap-3">
          <Icon className={`h-5 w-5 ${color}`} />
          <span className="font-medium text-gray-100">{title}</span>
          <span className="rounded-full bg-gray-700 px-2 py-0.5 text-xs text-gray-300">
            {revealed}/{total}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-5 w-5 text-gray-400" />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-700 px-4 py-4">
              {/* Revealed hints */}
              {visibleHints.length > 0 ? (
                <div className="space-y-4">
                  {visibleHints.map((hint, index) => (
                    <motion.div
                      key={hint.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="rounded-lg bg-surface-dark p-4"
                    >
                      <div className="prose prose-invert prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-300">
                          {hint.text}
                        </pre>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-gray-400">
                  No hints revealed yet
                </p>
              )}

              {/* Actions */}
              <div className="mt-4 flex items-center justify-between">
                {!allRevealed ? (
                  <button
                    onClick={handleReveal}
                    className="flex items-center gap-2 rounded-lg bg-accent-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-secondary"
                  >
                    <Eye className="h-4 w-4" />
                    Show {revealed === 0 ? "First" : "Next"} Hint
                  </button>
                ) : (
                  <span className="flex items-center gap-2 text-sm text-accent-success">
                    <Target className="h-4 w-4" />
                    All hints revealed
                  </span>
                )}

                {revealed > 0 && (
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-gray-200"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reset
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default HintSystem;
