"use client";

/**
 * ProblemWorkspace - Main problem solving interface
 *
 * Combines CodeEditor, TestResults bar, and BottomSheet with HintSystem.
 */

import { useState, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CodeEditor } from "./CodeEditor";
import { TestResults } from "./TestResults";
import { BottomSheet } from "./BottomSheet";
import { LearningGuide } from "./LearningGuide";
import { UserMenu } from "./auth/UserMenu";
import { executeCode } from "@/lib/api";
import { useCodePersistence } from "@/hooks/useCodePersistence";
import type { Problem, LearningGuide as LearningGuideType, ExecutionResult, ThemeInfo } from "@/lib/types";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

interface ProblemWorkspaceProps {
  problem: Problem;
  learningGuide: LearningGuideType;
  themeId?: string;
}

export function ProblemWorkspace({ problem, learningGuide, themeId }: ProblemWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [showTestPanel, setShowTestPanel] = useState(true);

  const { code, setCode, resetToStarter, hasChanges } = useCodePersistence(
    problem.id,
    problem.starterCodePython
  );

  const handleThemeChange = useCallback(
    (newThemeId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("theme", newThemeId);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  // Handle code execution
  const handleRunCode = useCallback(
    async (codeToRun: string) => {
      setIsRunning(true);
      setExecutionResult(null);

      try {
        const result = await executeCode({
          problemId: problem.id,
          code: codeToRun,
          language: "python",
          themeId,
        });
        setExecutionResult(result);
      } catch (error) {
        setExecutionResult({
          success: false,
          total: 0,
          passed: 0,
          failed: 0,
          results: [],
          error: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setIsRunning(false);
      }
    },
    [problem.id, themeId]
  );

  // Get pattern display
  const patternDisplay = Array.isArray(problem.pattern)
    ? problem.pattern.join(", ")
    : problem.pattern;

  // Get difficulty color
  const difficultyColor = {
    easy: "text-green-400 bg-green-500/10",
    medium: "text-yellow-400 bg-yellow-500/10",
    hard: "text-red-400 bg-red-500/10",
  }[problem.difficulty];

  return (
    <div className="flex h-screen flex-col bg-surface-dark">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-700 bg-surface px-4 py-3">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1 text-gray-400 transition-colors hover:text-gray-200"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-gray-100">
              {problem.title}
            </h1>
            <div className="flex items-center gap-2 text-sm">
              <span className={`rounded px-2 py-0.5 text-xs ${difficultyColor}`}>
                {problem.difficulty}
              </span>
              <span className="text-gray-500">{patternDisplay}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {problem.availableThemes && problem.availableThemes.length > 1 && (
            <ThemeSelector
              themes={problem.availableThemes}
              activeThemeId={themeId || problem.themeId}
              onThemeChange={handleThemeChange}
            />
          )}
          <UserMenu />
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Code Editor */}
        <div className="flex-1 overflow-hidden">
          <CodeEditor
            problemId={problem.id}
            code={code}
            setCode={setCode}
            resetToStarter={resetToStarter}
            hasChanges={hasChanges}
            language="python"
            onRun={handleRunCode}
            isRunning={isRunning}
            testResults={executionResult ?? undefined}
          />
        </div>

        {/* Test Results Panel (collapsible) */}
        <div className="border-t border-gray-700 bg-surface pb-16">
          {/* Toggle header */}
          <button
            onClick={() => setShowTestPanel(!showTestPanel)}
            className="flex w-full items-center justify-between px-4 py-3 hover:bg-surface-light"
          >
            <span className="flex items-center gap-3">
              <span className="text-base font-semibold text-gray-200">Tests</span>
              {executionResult && (
                <span className={`text-sm ${executionResult.passed === executionResult.total ? "text-green-400" : "text-yellow-400"}`}>
                  {executionResult.passed}/{executionResult.total} passed
                </span>
              )}
            </span>
            {showTestPanel ? <ChevronDown className="h-5 w-5 text-gray-400" /> : <ChevronUp className="h-5 w-5 text-gray-400" />}
          </button>

          {/* Collapsible content */}
          {showTestPanel && (
            <div className="max-h-64 overflow-y-auto px-4 pb-4">
              <TestResults result={executionResult} isRunning={isRunning} />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Sheet with Learning Guide */}
      <BottomSheet isOpen={bottomSheetOpen} onOpenChange={setBottomSheetOpen}>
        <LearningGuide
          guide={learningGuide}
          problem={problem}
          userCode={code}
          starterCode={problem.starterCodePython}
        />
      </BottomSheet>
    </div>
  );
}

// =============================================================================
// Domain Selector
// =============================================================================

const domainEmojis: Record<string, string> = {
  "wizard-dungeon": "🧙",
  "medicine": "💊",
  "finance": "💸",
  "software-engineering": "🖥️",
  "space-adventure": "🚀",
  "coding-interview": "💻",
};

interface ThemeSelectorProps {
  themes: ThemeInfo[];
  activeThemeId?: string;
  onThemeChange: (themeId: string) => void;
}

function ThemeSelector({ themes, activeThemeId, onThemeChange }: ThemeSelectorProps) {
  const [open, setOpen] = useState(false);

  const activeTheme = themes.find((t) => t.themeId === activeThemeId) || themes[0];
  const activeEmoji = domainEmojis[activeTheme.themeId] || "📝";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-gray-600 px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-surface-light"
      >
        <span>{activeEmoji}</span>
        <span className="hidden sm:inline">{activeTheme.displayName}</span>
        <ChevronDown className="h-3 w-3" />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-lg border border-gray-600 bg-surface shadow-xl">
            {themes.map((theme) => (
              <button
                key={theme.themeId}
                onClick={() => {
                  onThemeChange(theme.themeId);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-surface-light ${
                  theme.themeId === activeThemeId
                    ? "bg-surface-light text-accent-primary"
                    : "text-gray-300"
                }`}
              >
                <span>{domainEmojis[theme.themeId] || "📝"}</span>
                <span className="flex-1">{theme.displayName}</span>
                {theme.themeId === activeThemeId && (
                  <span className="text-xs text-accent-primary">Active</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default ProblemWorkspace;
