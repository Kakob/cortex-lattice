"use client";

/**
 * LearningGuide - Comprehensive learning panel for problem solving
 *
 * Three main sections:
 * 1. Problem Statement - AI-themed context and description
 * 2. Guidance - Key concepts, common mistakes, real-world applications (each blurred)
 * 3. Solution & Explanation - Unified approach cards (each blurred), each with
 *    blurred step-by-step and optional code. An approach detected from the
 *    user's in-progress code is highlighted but stays blurred.
 */

import { useMemo, useState } from "react";
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
import type {
  LearningGuide as LearningGuideType,
  Problem,
  ApproachVariant,
} from "@/lib/types";
import { useRevealState } from "@/hooks/useRevealState";
import { BlurReveal } from "./BlurReveal";
import { detectApproach } from "@/lib/approachDetection";

interface LearningGuideProps {
  guide: LearningGuideType;
  problem?: Problem;
  userCode?: string;
  starterCode?: string;
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

interface RevealApi {
  isRevealed: (id: string) => boolean;
  reveal: (id: string) => void;
}

export function LearningGuide({
  guide,
  problem,
  userCode,
  starterCode,
}: LearningGuideProps) {
  const [expandedSection, setExpandedSection] = useState<SectionId | null>(null);
  const reveal = useRevealState(problem?.id ?? "unknown");

  const toggleSection = (id: SectionId) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  return (
    <div className="space-y-3 pb-[20vh]">
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
          problem={problem}
          reveal={reveal}
          userCode={userCode}
          starterCode={starterCode}
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
  problem?: Problem;
  reveal: RevealApi;
  userCode?: string;
  starterCode?: string;
}

function Section({
  config,
  isExpanded,
  onToggle,
  guide,
  problem,
  reveal,
  userCode,
  starterCode,
}: SectionProps) {
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
              {id === "problem" && <ProblemSection guide={guide} problem={problem} />}
              {id === "guidance" && <GuidanceSection guide={guide} reveal={reveal} />}
              {id === "solution" && (
                <SolutionSection
                  guide={guide}
                  reveal={reveal}
                  userCode={userCode}
                  starterCode={starterCode}
                />
              )}
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

function ProblemSection({ guide, problem }: { guide: LearningGuideType; problem?: Problem }) {
  const { problemContext } = guide;
  const description = problem?.description ?? problemContext.description;

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

      {/* Description */}
      {description && (
        <div>
          <h4 className="mb-2 text-sm font-medium text-gray-200">Description</h4>
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-300">
            {description}
          </pre>
        </div>
      )}

      {/* Examples */}
      {problem && problem.examples.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-medium text-gray-200">Examples</h4>
          <div className="space-y-3">
            {problem.examples.map((example, i) => (
              <div key={i} className="rounded-lg bg-surface-dark p-4 text-sm">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <span className="text-xs font-medium uppercase text-gray-500">
                      Input
                    </span>
                    <pre className="mt-1 text-gray-300">
                      {JSON.stringify(example.input, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <span className="text-xs font-medium uppercase text-gray-500">
                      Output
                    </span>
                    <pre className="mt-1 text-green-400">
                      {JSON.stringify(example.output, null, 2)}
                    </pre>
                  </div>
                </div>
                {example.explanation && (
                  <p className="mt-2 text-gray-400">{example.explanation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Constraints */}
      {problem && problem.constraints.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium text-gray-200">Constraints</h4>
          <ul className="list-inside list-disc space-y-1 text-sm text-gray-400">
            {problem.constraints.map((constraint, i) => (
              <li key={i} className="font-mono">
                {constraint}
              </li>
            ))}
          </ul>
        </div>
      )}

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

function GuidanceSection({
  guide,
  reveal,
}: {
  guide: LearningGuideType;
  reveal: RevealApi;
}) {
  const { guidance } = guide;

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
            {guidance.keyConcepts.map((concept, i) => {
              const id = `guidance:keyConcepts:${i}`;
              return (
                <BlurReveal
                  key={i}
                  itemId={id}
                  isRevealed={reveal.isRevealed(id)}
                  onReveal={() => reveal.reveal(id)}
                >
                  <div className="rounded-lg bg-surface-dark p-3">
                    <p className="text-sm text-gray-300">{concept}</p>
                  </div>
                </BlurReveal>
              );
            })}
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
            {guidance.commonMistakes.map((mistake, i) => {
              const id = `guidance:commonMistakes:${i}`;
              return (
                <BlurReveal
                  key={i}
                  itemId={id}
                  isRevealed={reveal.isRevealed(id)}
                  onReveal={() => reveal.reveal(id)}
                >
                  <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3">
                    <p className="text-sm text-gray-300">{mistake}</p>
                  </div>
                </BlurReveal>
              );
            })}
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
          <div className="space-y-3">
            {guidance.realWorld.map((item, i) => {
              const id = `guidance:realWorld:${i}`;
              return (
                <BlurReveal
                  key={i}
                  itemId={id}
                  isRevealed={reveal.isRevealed(id)}
                  onReveal={() => reveal.reveal(id)}
                >
                  <div className="rounded-lg bg-surface-dark p-4">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
                      {item}
                    </p>
                  </div>
                </BlurReveal>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Solution & Explanation Section
// =============================================================================

function SolutionSection({
  guide,
  reveal,
  userCode,
  starterCode,
}: {
  guide: LearningGuideType;
  reveal: RevealApi;
  userCode?: string;
  starterCode?: string;
}) {
  const { solution, patternTransfer } = guide;

  const detectedId = useMemo(
    () => detectApproach(userCode ?? "", solution.approaches, starterCode ?? ""),
    [userCode, solution.approaches, starterCode]
  );

  const overviewId = "solution:overview";

  return (
    <div className="space-y-6">
      {/* Overview: Complexity + Core Insight */}
      <BlurReveal
        itemId={overviewId}
        isRevealed={reveal.isRevealed(overviewId)}
        onReveal={() => reveal.reveal(overviewId)}
      >
        <div className="space-y-4">
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

          {solution.coreInsight && (
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
              <h4 className="mb-2 text-sm font-medium text-green-400">Core Insight</h4>
              <p className="whitespace-pre-wrap text-sm text-gray-300">
                {solution.coreInsight}
              </p>
            </div>
          )}
        </div>
      </BlurReveal>

      {/* Approach Cards */}
      {solution.approaches.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-200">Solution Approaches</h4>
          {solution.approaches.map((variant, i) => (
            <ApproachCard
              key={variant.id}
              variant={variant}
              index={i}
              reveal={reveal}
              highlighted={variant.id === detectedId}
            />
          ))}
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
// Approach Card
// =============================================================================

function ApproachCard({
  variant,
  index,
  reveal,
  highlighted,
}: {
  variant: ApproachVariant;
  index: number;
  reveal: RevealApi;
  highlighted: boolean;
}) {
  const metaId = `solution:approach:${variant.id}:meta`;
  const codeId = `solution:approach:${variant.id}:code`;
  const metaRevealed = reveal.isRevealed(metaId);
  const [showSteps, setShowSteps] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    if (variant.codePython) {
      await navigator.clipboard.writeText(variant.codePython);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!metaRevealed) {
    return (
      <BlurReveal
        itemId={metaId}
        isRevealed={false}
        onReveal={() => reveal.reveal(metaId)}
        highlight={
          highlighted
            ? { label: "We think you're attempting this approach", tone: "info" }
            : undefined
        }
      >
        <div className="rounded-lg bg-surface-dark p-4">
          <div className="font-medium text-gray-200">
            Approach #{index + 1}
            {variant.isPrimary && " (Primary)"}
          </div>
          <p className="mt-1 text-sm text-gray-400">
            Hidden — tap to reveal name, complexity, and description.
          </p>
        </div>
      </BlurReveal>
    );
  }

  // Revealed: show metadata, plus controls for steps and code.
  return (
    <div
      className={`rounded-lg border ${
        variant.isPrimary
          ? "border-green-500/30 bg-green-500/5"
          : "border-gray-700/50 bg-surface-dark"
      } p-4 space-y-3`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h5 className="font-medium text-gray-100">
            {variant.name}
            {variant.isPrimary && (
              <span className="ml-2 rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-medium text-green-300">
                Primary
              </span>
            )}
          </h5>
          {variant.approach && (
            <p className="mt-1 text-sm text-gray-400">{variant.approach}</p>
          )}
          <div className="mt-2 flex gap-4 text-xs">
            <span className="text-gray-500">
              Time:{" "}
              <span className="font-mono text-orange-400">
                {variant.complexity.time}
              </span>
            </span>
            <span className="text-gray-500">
              Space:{" "}
              <span className="font-mono text-blue-400">
                {variant.complexity.space}
              </span>
            </span>
          </div>
          {variant.whenToUse && (
            <p className="mt-2 text-xs text-gray-500">
              <span className="text-purple-400">When to use:</span> {variant.whenToUse}
            </p>
          )}
        </div>
      </div>

      {/* Steps */}
      <div>
        <button
          onClick={() => setShowSteps((s) => !s)}
          className="flex w-full items-center justify-between rounded-md bg-gray-800/50 px-3 py-2 text-left text-xs text-gray-300 transition-colors hover:bg-gray-800"
        >
          <span>{showSteps ? "Hide step-by-step" : "Show step-by-step"}</span>
          <motion.div
            animate={{ rotate: showSteps ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </motion.div>
        </button>

        <AnimatePresence>
          {showSteps && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-2 space-y-2">
                {variant.stepByStep && variant.stepByStep.length > 0 ? (
                  variant.stepByStep.map((step, i) => {
                    const stepId = `solution:approach:${variant.id}:step:${i}`;
                    return (
                      <BlurReveal
                        key={i}
                        itemId={stepId}
                        isRevealed={reveal.isRevealed(stepId)}
                        onReveal={() => reveal.reveal(stepId)}
                      >
                        <div className="flex gap-3 rounded-md bg-gray-900/50 p-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500/20 text-xs font-medium text-green-400">
                            {step.step ?? i + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm text-gray-200">{step.action}</p>
                            {step.why && (
                              <p className="mt-1 text-xs text-gray-500">{step.why}</p>
                            )}
                          </div>
                        </div>
                      </BlurReveal>
                    );
                  })
                ) : (
                  <p className="rounded-md bg-gray-900/50 p-3 text-xs italic text-gray-500">
                    Steps not yet authored for this approach.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Code */}
      {variant.codePython && (
        <div>
          <button
            onClick={() => setShowCode((s) => !s)}
            className="flex w-full items-center justify-between rounded-md bg-gray-800/50 px-3 py-2 text-left text-xs text-gray-300 transition-colors hover:bg-gray-800"
          >
            <span className="flex items-center gap-2">
              <Code className="h-3.5 w-3.5 text-purple-400" />
              {showCode ? "Hide code" : "Show code"}
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
                <div className="mt-2">
                  <BlurReveal
                    itemId={codeId}
                    isRevealed={reveal.isRevealed(codeId)}
                    onReveal={() => reveal.reveal(codeId)}
                  >
                    <div className="relative">
                      <button
                        onClick={handleCopyCode}
                        className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md bg-gray-800 px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-700 hover:text-gray-200"
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
                        <code className="text-gray-300">{variant.codePython}</code>
                      </pre>
                    </div>
                  </BlurReveal>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
