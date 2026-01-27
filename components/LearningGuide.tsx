"use client";

/**
 * LearningGuide - Comprehensive learning panel for problem solving
 *
 * Three main sections:
 * 1. Problem Statement - AI-themed context and description
 * 2. Guidance - Key concepts, common mistakes, real-world applications
 * 3. Solution & Explanation - Step-by-step solution with code
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket,
  BookOpen,
  Lightbulb,
  AlertTriangle,
  Globe,
  Code,
  ChevronDown,
  CheckCircle,
  Clock,
  Layers,
  Copy,
  Check,
} from "lucide-react";
import type { LearningGuide as LearningGuideType } from "@/lib/types";

interface LearningGuideProps {
  guide: LearningGuideType;
}

type SectionId = "problem" | "guidance" | "solution";

interface SectionConfig {
  id: SectionId;
  title: string;
  icon: typeof Rocket;
  color: string;
  bgColor: string;
  borderColor: string;
}

const SECTIONS: SectionConfig[] = [
  {
    id: "problem",
    title: "Problem Statement",
    icon: Rocket,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
  },
  {
    id: "guidance",
    title: "Guidance",
    icon: BookOpen,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
  },
  {
    id: "solution",
    title: "Solution & Explanation",
    icon: Code,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
  },
];

export function LearningGuide({ guide }: LearningGuideProps) {
  const [expandedSection, setExpandedSection] = useState<SectionId | null>(null);

  const toggleSection = (id: SectionId) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  return (
    <div className="space-y-3 pb-8">
      <h2 className="mb-4 text-lg font-semibold text-gray-100">
        Learning Guide
      </h2>

      {SECTIONS.map((section) => (
        <Section
          key={section.id}
          config={section}
          isExpanded={expandedSection === section.id}
          onToggle={() => toggleSection(section.id)}
          guide={guide}
        />
      ))}
    </div>
  );
}

interface SectionProps {
  config: SectionConfig;
  isExpanded: boolean;
  onToggle: () => void;
  guide: LearningGuideType;
}

function Section({ config, isExpanded, onToggle, guide }: SectionProps) {
  const { id, title, icon: Icon, color, bgColor, borderColor } = config;

  return (
    <div className={`overflow-hidden rounded-xl border ${borderColor} ${bgColor}`}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/5"
      >
        <div className="flex items-center gap-3">
          <Icon className={`h-5 w-5 ${color}`} />
          <span className="font-medium text-gray-100">{title}</span>
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
            <div className="border-t border-gray-700/50 px-4 py-4">
              {id === "problem" && <ProblemSection guide={guide} />}
              {id === "guidance" && <GuidanceSection guide={guide} />}
              {id === "solution" && <SolutionSection guide={guide} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// Problem Statement Section
// =============================================================================

function ProblemSection({ guide }: { guide: LearningGuideType }) {
  const { problemContext } = guide;

  return (
    <div className="space-y-6">
      {/* Story Context (AI-themed) */}
      {problemContext.storyContext && (
        <div className="rounded-lg bg-surface-dark p-4">
          <div className="mb-2 flex items-center gap-2">
            <Rocket className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">Mission Context</span>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
            {problemContext.storyContext}
          </p>
        </div>
      )}

      {/* Pattern & Difficulty */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-lg bg-surface-dark px-3 py-2">
          <Layers className="h-4 w-4 text-purple-400" />
          <span className="text-sm text-gray-300">
            <span className="text-gray-500">Pattern:</span>{" "}
            <span className="font-medium text-purple-400">{problemContext.pattern}</span>
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-surface-dark px-3 py-2">
          <Clock className="h-4 w-4 text-yellow-400" />
          <span className="text-sm text-gray-300">
            <span className="text-gray-500">Difficulty:</span>{" "}
            <span className={`font-medium ${getDifficultyColor(problemContext.difficulty)}`}>
              {problemContext.difficulty}
            </span>
          </span>
        </div>
      </div>

      {/* Learning Objectives */}
      {problemContext.patternLearningObjectives.length > 0 && (
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-200">
            <CheckCircle className="h-4 w-4 text-green-400" />
            What You&apos;ll Learn
          </h4>
          <ul className="space-y-2">
            {problemContext.patternLearningObjectives.map((obj, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-gray-400"
              >
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-green-400" />
                {obj}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Real-World Applications */}
      {problemContext.realWorldApplications.length > 0 && (
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-200">
            <Globe className="h-4 w-4 text-blue-400" />
            Real-World Applications
          </h4>
          <ul className="space-y-2">
            {problemContext.realWorldApplications.map((app, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-gray-400"
              >
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                {app}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Guidance Section
// =============================================================================

function GuidanceSection({ guide }: { guide: LearningGuideType }) {
  const { guidance } = guide;
  const [showAllConcepts, setShowAllConcepts] = useState(false);
  const [showAllMistakes, setShowAllMistakes] = useState(false);
  const [showRealWorld, setShowRealWorld] = useState(false);

  return (
    <div className="space-y-6">
      {/* Key Concepts */}
      {guidance.keyConcepts.length > 0 && (
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-200">
            <Lightbulb className="h-4 w-4 text-yellow-400" />
            Key Concepts
            <span className="ml-auto rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-400">
              {guidance.keyConcepts.length} tips
            </span>
          </h4>
          <div className="space-y-2">
            {guidance.keyConcepts
              .slice(0, showAllConcepts ? undefined : 2)
              .map((concept, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-lg bg-surface-dark p-3"
                >
                  <p className="text-sm text-gray-300">{concept}</p>
                </motion.div>
              ))}
            {guidance.keyConcepts.length > 2 && (
              <button
                onClick={() => setShowAllConcepts(!showAllConcepts)}
                className="w-full rounded-lg border border-dashed border-gray-600 py-2 text-sm text-gray-400 transition-colors hover:border-yellow-500/50 hover:text-yellow-400"
              >
                {showAllConcepts
                  ? "Show less"
                  : `Show ${guidance.keyConcepts.length - 2} more concepts`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Common Mistakes */}
      {guidance.commonMistakes.length > 0 && (
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-200">
            <AlertTriangle className="h-4 w-4 text-orange-400" />
            Common Mistakes
            <span className="ml-auto rounded-full bg-orange-500/20 px-2 py-0.5 text-xs text-orange-400">
              {guidance.commonMistakes.length} pitfalls
            </span>
          </h4>
          <div className="space-y-2">
            {guidance.commonMistakes
              .slice(0, showAllMistakes ? undefined : 2)
              .map((mistake, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-lg bg-orange-500/5 border border-orange-500/20 p-3"
                >
                  <p className="text-sm text-gray-300">{mistake}</p>
                </motion.div>
              ))}
            {guidance.commonMistakes.length > 2 && (
              <button
                onClick={() => setShowAllMistakes(!showAllMistakes)}
                className="w-full rounded-lg border border-dashed border-gray-600 py-2 text-sm text-gray-400 transition-colors hover:border-orange-500/50 hover:text-orange-400"
              >
                {showAllMistakes
                  ? "Show less"
                  : `Show ${guidance.commonMistakes.length - 2} more mistakes`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Real-World Context */}
      {guidance.realWorld.length > 0 && (
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-200">
            <Globe className="h-4 w-4 text-blue-400" />
            Real-World Context
          </h4>
          {!showRealWorld ? (
            <button
              onClick={() => setShowRealWorld(true)}
              className="w-full rounded-lg border border-dashed border-gray-600 py-3 text-sm text-gray-400 transition-colors hover:border-blue-500/50 hover:text-blue-400"
            >
              Show real-world applications
            </button>
          ) : (
            <div className="space-y-3">
              {guidance.realWorld.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg bg-surface-dark p-4"
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
                    {item}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Solution & Explanation Section
// =============================================================================

function SolutionSection({ guide }: { guide: LearningGuideType }) {
  const { solution, patternTransfer } = guide;
  const [showCode, setShowCode] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    if (solution.codePython) {
      await navigator.clipboard.writeText(solution.codePython);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Complexity */}
      <div className="flex gap-4">
        <div className="flex-1 rounded-lg bg-surface-dark p-3 text-center">
          <div className="text-xs text-gray-500">Time</div>
          <div className="mt-1 font-mono text-lg font-medium text-green-400">
            {solution.complexity.time}
          </div>
        </div>
        <div className="flex-1 rounded-lg bg-surface-dark p-3 text-center">
          <div className="text-xs text-gray-500">Space</div>
          <div className="mt-1 font-mono text-lg font-medium text-blue-400">
            {solution.complexity.space}
          </div>
        </div>
      </div>

      {/* Core Insight */}
      {solution.coreInsight && (
        <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-4">
          <h4 className="mb-2 text-sm font-medium text-green-400">Core Insight</h4>
          <p className="whitespace-pre-wrap text-sm text-gray-300">
            {solution.coreInsight}
          </p>
        </div>
      )}

      {/* Step-by-Step Approach */}
      {solution.solutionApproach.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-medium text-gray-200">
            Step-by-Step Approach
          </h4>
          <ol className="space-y-2">
            {solution.solutionApproach.map((step, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-3 rounded-lg bg-surface-dark p-3"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500/20 text-xs font-medium text-green-400">
                  {i + 1}
                </span>
                <code className="text-sm text-gray-300">{step}</code>
              </motion.li>
            ))}
          </ol>
        </div>
      )}

      {/* Solution Code */}
      {solution.codePython && (
        <div>
          <button
            onClick={() => setShowCode(!showCode)}
            className="mb-3 flex w-full items-center justify-between rounded-lg bg-surface-dark px-4 py-3 text-left transition-colors hover:bg-surface-light"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-gray-200">
              <Code className="h-4 w-4 text-purple-400" />
              Reference Solution (Python)
            </span>
            <motion.div
              animate={{ rotate: showCode ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </motion.div>
          </button>

          <AnimatePresence>
            {showCode && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="relative">
                  <button
                    onClick={handleCopyCode}
                    className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-gray-800 px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-700 hover:text-gray-200"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-green-400" />
                        <span className="text-green-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                  <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 pr-20 text-sm">
                    <code className="text-gray-300">{solution.codePython}</code>
                  </pre>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Alternative Solutions */}
      {solution.alternativeSolutions && solution.alternativeSolutions.length > 0 && (
        <div>
          <button
            onClick={() => setShowAlternatives(!showAlternatives)}
            className="mb-3 flex w-full items-center justify-between rounded-lg border border-dashed border-gray-600 px-4 py-3 text-left transition-colors hover:border-purple-500/50"
          >
            <span className="text-sm text-gray-400">
              {showAlternatives
                ? "Hide alternative solutions"
                : `Show ${solution.alternativeSolutions.length} alternative solutions`}
            </span>
            <motion.div
              animate={{ rotate: showAlternatives ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </motion.div>
          </button>

          <AnimatePresence>
            {showAlternatives && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-3 overflow-hidden"
              >
                {solution.alternativeSolutions.map((alt, i) => (
                  <div key={i} className="rounded-lg bg-surface-dark p-4">
                    <h5 className="font-medium text-gray-200">{alt.name}</h5>
                    <p className="mt-1 text-sm text-gray-400">{alt.approach}</p>
                    <div className="mt-2 flex gap-4 text-xs">
                      <span className="text-gray-500">
                        Time: <span className="font-mono text-orange-400">{alt.time}</span>
                      </span>
                      <span className="text-gray-500">
                        Space: <span className="font-mono text-blue-400">{alt.space}</span>
                      </span>
                    </div>
                    {alt.whenToUse && (
                      <p className="mt-2 text-xs text-gray-500">
                        <span className="text-purple-400">When to use:</span> {alt.whenToUse}
                      </p>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Pattern Transfer */}
      {patternTransfer && patternTransfer.similarProblems.length > 0 && (
        <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-4">
          <h4 className="mb-3 text-sm font-medium text-purple-400">
            Pattern Transfer - Similar Problems
          </h4>
          <div className="space-y-3">
            {patternTransfer.similarProblems.map((prob, i) => (
              <div key={i} className="text-sm">
                <span className="font-medium text-gray-200">{prob.name}</span>
                {prob.invariantsShared.length > 0 && (
                  <p className="mt-1 text-xs text-gray-400">
                    Shared: {prob.invariantsShared.join(", ")}
                  </p>
                )}
                {(prob.difference || prob.modification) && (
                  <p className="mt-1 text-xs text-purple-300">
                    {prob.difference || prob.modification}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function getDifficultyColor(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case "easy":
      return "text-green-400";
    case "medium":
      return "text-yellow-400";
    case "hard":
      return "text-red-400";
    default:
      return "text-gray-400";
  }
}

export default LearningGuide;
