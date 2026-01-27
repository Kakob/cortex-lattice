"use client";

/**
 * ProblemWorkspace - Main problem solving interface
 *
 * Combines CodeEditor, TestResults bar, and BottomSheet with HintSystem.
 */

import { useState, useCallback } from "react";
import { CodeEditor } from "./CodeEditor";
import { TestResults } from "./TestResults";
import { BottomSheet } from "./BottomSheet";
import { LearningGuide } from "./LearningGuide";
import { executeCode } from "@/lib/api";
import type { Problem, LearningGuide as LearningGuideType, ExecutionResult } from "@/lib/types";
import { ArrowLeft, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

interface ProblemWorkspaceProps {
  problem: Problem;
  learningGuide: LearningGuideType;
}

export function ProblemWorkspace({ problem, learningGuide }: ProblemWorkspaceProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [showTestPanel, setShowTestPanel] = useState(true);

  // Handle code execution
  const handleRunCode = useCallback(
    async (code: string) => {
      setIsRunning(true);
      setExecutionResult(null);

      try {
        const result = await executeCode({
          problemId: problem.id,
          code,
          language: "python",
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
    [problem.id]
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
        <button
          onClick={() => setShowDescription(!showDescription)}
          className="flex items-center gap-2 rounded-lg border border-gray-600 px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-surface-light"
        >
          <BookOpen className="h-4 w-4" />
          <span className="hidden sm:inline">Problem</span>
        </button>
      </header>

      {/* Problem Description Panel (collapsible) */}
      {showDescription && (
        <div className="border-b border-gray-700 bg-surface-light p-4">
          <div className="mx-auto max-w-3xl space-y-4">
            {/* Story context */}
            {problem.storyContext && (
              <div className="rounded-lg bg-surface p-4 text-sm text-gray-300">
                {problem.storyContext}
              </div>
            )}

            {/* Description */}
            <div className="prose prose-invert prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-gray-300">
                {problem.description}
              </pre>
            </div>

            {/* Examples */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-200">Examples</h3>
              {problem.examples.map((example, i) => (
                <div key={i} className="rounded-lg bg-surface p-4 text-sm">
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

            {/* Constraints */}
            <div>
              <h3 className="font-medium text-gray-200">Constraints</h3>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-400">
                {problem.constraints.map((constraint, i) => (
                  <li key={i} className="font-mono">
                    {constraint}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Code Editor */}
        <div className="flex-1 overflow-hidden">
          <CodeEditor
            problemId={problem.id}
            initialCode={problem.starterCodePython}
            language="python"
            onRun={handleRunCode}
            isRunning={isRunning}
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
        <LearningGuide guide={learningGuide} />
      </BottomSheet>
    </div>
  );
}

export default ProblemWorkspace;
