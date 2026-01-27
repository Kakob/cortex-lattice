"use client";

/**
 * CodeEditor - Responsive code editor component
 *
 * Conditionally loads Monaco (desktop) or CodeMirror (mobile) editor.
 * Includes toolbar with Run button and code persistence.
 * Supports slash commands for inline contributions.
 */

import { useCallback, Suspense, lazy, useState, useRef } from "react";
import { Play, Loader2, RotateCcw } from "lucide-react";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useCodePersistence } from "@/hooks/useCodePersistence";
import { useSessionContext } from "@/hooks/useSessionContext";
import { useSlashCommands } from "@/hooks/useSlashCommands";
import SlashAutocomplete from "./SlashAutocomplete";
import CommandNotification from "./CommandNotification";
import type { ExecutionResult, CommandResult } from "@/lib/types";

// Lazy load editors for code splitting
const MonacoEditor = lazy(() => import("./editors/MonacoEditor"));
const CodeMirrorEditor = lazy(() => import("./editors/CodeMirrorEditor"));

interface CodeEditorProps {
  problemId: string;
  initialCode: string;
  language?: string;
  onRun?: (code: string) => void;
  isRunning?: boolean;
  readOnly?: boolean;
  testResults?: ExecutionResult;
  revealedHints?: string[];
}

function EditorLoading() {
  return (
    <div className="flex h-full items-center justify-center bg-surface text-gray-400">
      <Loader2 className="h-6 w-6 animate-spin" />
      <span className="ml-2">Loading editor...</span>
    </div>
  );
}

export function CodeEditor({
  problemId,
  initialCode,
  language = "python",
  onRun,
  isRunning = false,
  readOnly = false,
  testResults,
  revealedHints,
}: CodeEditorProps) {
  const { code, setCode, resetToStarter, hasChanges } = useCodePersistence(
    problemId,
    initialCode
  );
  const isMobile = useIsMobile();

  // Session context for slash commands
  const { session } = useSessionContext(problemId);

  // Notification state
  const [notification, setNotification] = useState<CommandResult | null>(null);

  // Autocomplete container ref for positioning
  const autocompleteContainerRef = useRef<HTMLDivElement>(null);
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });

  // Slash commands hook
  const {
    autocompleteState,
    handleLineChange,
    handleEnterKey,
    selectSuggestion,
    closeAutocomplete,
    moveSelection,
    isExecuting,
    lastResult,
  } = useSlashCommands({
    session,
    testResults,
    revealedHints,
    onCommandExecuted: (result) => {
      setNotification(result);
    },
  });

  const handleCodeChange = useCallback(
    (newCode: string) => {
      setCode(newCode);
    },
    [setCode]
  );

  const handleRun = useCallback(() => {
    if (onRun && !isRunning) {
      onRun(code);
    }
  }, [code, onRun, isRunning]);

  // Handle line changes for slash command detection
  const handleEditorLineChange = useCallback(
    (line: string, lineNumber: number, cursorColumn: number) => {
      handleLineChange(line, lineNumber, cursorColumn);

      // Update autocomplete position (approximate based on line number)
      // In a real implementation, you'd get exact pixel position from the editor
      const lineHeight = 20; // Approximate line height in pixels
      const topOffset = 60; // Toolbar height
      setAutocompletePosition({
        top: topOffset + lineNumber * lineHeight,
        left: cursorColumn * 8, // Approximate character width
      });
    },
    [handleLineChange]
  );

  // Handle Tab key for autocomplete selection
  const handleTabKey = useCallback(() => {
    if (autocompleteState.isOpen) {
      return selectSuggestion(autocompleteState.selectedIndex);
    }
    return undefined;
  }, [autocompleteState.isOpen, autocompleteState.selectedIndex, selectSuggestion]);

  // Handle autocomplete selection click
  const handleAutocompleteSelect = useCallback(
    (index: number) => {
      const syntax = selectSuggestion(index);
      // The editor will handle inserting the syntax via onTabKey
      // For click selection, we need a different approach
      // This is handled by the editor's onTabKey callback
    },
    [selectSuggestion]
  );

  // Dismiss notification
  const handleDismissNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-700 bg-surface-light px-4 py-2">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="rounded bg-surface px-2 py-0.5 text-xs uppercase">
            {language}
          </span>
          {hasChanges && (
            <span className="rounded bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400">
              Draft
            </span>
          )}
          {isExecuting && (
            <span className="rounded bg-purple-500/20 px-2 py-0.5 text-xs text-purple-400 flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && !readOnly && (
            <button
              onClick={resetToStarter}
              disabled={isRunning}
              className="flex items-center gap-1 rounded-lg border border-gray-600 px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-surface hover:text-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
              title="Reset to starter code"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
          <button
            onClick={handleRun}
            disabled={isRunning || readOnly}
            className="flex items-center gap-2 rounded-lg bg-accent-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run Tests
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor with autocomplete overlay */}
      <div className="relative flex-1 overflow-hidden" ref={autocompleteContainerRef}>
        <Suspense fallback={<EditorLoading />}>
          {isMobile ? (
            <CodeMirrorEditor
              initialCode={code}
              onChange={handleCodeChange}
              readOnly={readOnly}
              onLineChange={handleEditorLineChange}
              onEnterKey={handleEnterKey}
              onEscapeKey={closeAutocomplete}
              onArrowKey={moveSelection}
              onTabKey={handleTabKey}
              autocompleteState={autocompleteState}
            />
          ) : (
            <MonacoEditor
              initialCode={code}
              language={language}
              onChange={handleCodeChange}
              readOnly={readOnly}
              onLineChange={handleEditorLineChange}
              onEnterKey={handleEnterKey}
              onEscapeKey={closeAutocomplete}
              onArrowKey={moveSelection}
              onTabKey={handleTabKey}
              autocompleteState={autocompleteState}
            />
          )}
        </Suspense>

        {/* Slash command autocomplete */}
        {autocompleteState.isOpen && (
          <div
            className="absolute z-50"
            style={{
              top: Math.min(autocompletePosition.top, 200), // Cap position
              left: Math.max(16, Math.min(autocompletePosition.left, 100)),
            }}
          >
            <SlashAutocomplete
              state={autocompleteState}
              onSelect={handleAutocompleteSelect}
              onClose={closeAutocomplete}
            />
          </div>
        )}
      </div>

      {/* Command notification */}
      <CommandNotification
        result={notification}
        onDismiss={handleDismissNotification}
      />
    </div>
  );
}

export default CodeEditor;
