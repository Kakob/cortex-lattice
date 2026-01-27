"use client";

/**
 * TestResults - Display pass/fail test results
 *
 * Shows summary bar and expandable test details.
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  ChevronDown,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import type { ExecutionResult, TestResult } from "@/lib/types";

interface TestResultsProps {
  result: ExecutionResult | null;
  isRunning: boolean;
}

export function TestResults({ result, isRunning }: TestResultsProps) {
  const [expandedTest, setExpandedTest] = useState<string | null>(null);

  const toggleTest = useCallback((testId: string) => {
    setExpandedTest((prev) => (prev === testId ? null : testId));
  }, []);

  // Loading state
  if (isRunning) {
    return (
      <div className="flex items-center justify-center gap-2 py-4 text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Running tests...</span>
      </div>
    );
  }

  // No results yet
  if (!result) {
    return (
      <div className="py-4 text-center text-sm text-gray-500">
        Click &quot;Run Tests&quot; to execute your code
      </div>
    );
  }

  // Error state
  if (!result.success && result.error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
          <div>
            <h3 className="font-medium text-red-400">Execution Error</h3>
            <pre className="mt-2 whitespace-pre-wrap text-sm text-red-300">
              {result.error}
            </pre>
            {result.traceback && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-red-400 hover:text-red-300">
                  Show traceback
                </summary>
                <pre className="mt-2 overflow-x-auto text-xs text-red-300/70">
                  {result.traceback}
                </pre>
              </details>
            )}
          </div>
        </div>
      </div>
    );
  }

  const allPassed = result.passed === result.total;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div
        className={`flex items-center justify-between rounded-lg p-4 ${
          allPassed
            ? "border border-green-500/30 bg-green-500/10"
            : "border border-yellow-500/30 bg-yellow-500/10"
        }`}
      >
        <div className="flex items-center gap-3">
          {allPassed ? (
            <CheckCircle className="h-6 w-6 text-green-500" />
          ) : (
            <XCircle className="h-6 w-6 text-yellow-500" />
          )}
          <span className="font-medium text-gray-100">
            {result.passed}/{result.total} tests passed
          </span>
        </div>
        {allPassed && (
          <span className="text-sm text-green-400">All tests pass!</span>
        )}
      </div>

      {/* Individual test results */}
      <div className="space-y-2">
        {result.results.map((test) => (
          <TestResultItem
            key={test.id}
            test={test}
            isExpanded={expandedTest === test.id}
            onToggle={() => toggleTest(test.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface TestResultItemProps {
  test: TestResult;
  isExpanded: boolean;
  onToggle: () => void;
}

function TestResultItem({ test, isExpanded, onToggle }: TestResultItemProps) {
  return (
    <div
      className={`overflow-hidden rounded-lg border ${
        test.passed
          ? "border-green-500/20 bg-green-500/5"
          : "border-red-500/20 bg-red-500/5"
      }`}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/5"
      >
        <div className="flex items-center gap-3">
          {test.passed ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
          <span className="font-mono text-sm text-gray-200">
            {test.id || "Test"}
          </span>
          {test.executionTimeMs !== undefined && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              {test.executionTimeMs}ms
            </span>
          )}
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-5 w-5 text-gray-400" />
        </motion.div>
      </button>

      {/* Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-gray-700/50 p-4">
              {/* Input */}
              <div>
                <label className="text-xs font-medium uppercase text-gray-500">
                  Input
                </label>
                <pre className="mt-1 overflow-x-auto rounded bg-surface-dark p-2 text-sm text-gray-300">
                  {JSON.stringify(test.input, null, 2)}
                </pre>
              </div>

              {/* Expected */}
              <div>
                <label className="text-xs font-medium uppercase text-gray-500">
                  Expected
                </label>
                <pre className="mt-1 overflow-x-auto rounded bg-surface-dark p-2 text-sm text-green-400">
                  {JSON.stringify(test.expected, null, 2)}
                </pre>
              </div>

              {/* Actual */}
              <div>
                <label className="text-xs font-medium uppercase text-gray-500">
                  {test.error ? "Error" : "Your Output"}
                </label>
                <pre
                  className={`mt-1 overflow-x-auto rounded bg-surface-dark p-2 text-sm ${
                    test.passed ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {test.error || JSON.stringify(test.output, null, 2)}
                </pre>
              </div>

              {/* Explanation */}
              {test.explanation && (
                <div className="rounded bg-surface-dark p-2 text-sm text-gray-400">
                  {test.explanation}
                </div>
              )}

              {/* Traceback */}
              {test.traceback && (
                <details>
                  <summary className="cursor-pointer text-sm text-red-400 hover:text-red-300">
                    Show traceback
                  </summary>
                  <pre className="mt-2 overflow-x-auto text-xs text-red-300/70">
                    {test.traceback}
                  </pre>
                </details>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TestResults;
