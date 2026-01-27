"use client";

/**
 * CodeEditor - Responsive code editor component
 *
 * Conditionally loads Monaco (desktop) or CodeMirror (mobile) editor.
 * Includes toolbar with Run button and code persistence.
 */

import { useCallback, Suspense, lazy } from "react";
import { Play, Loader2, RotateCcw } from "lucide-react";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useCodePersistence } from "@/hooks/useCodePersistence";

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
}: CodeEditorProps) {
  const { code, setCode, resetToStarter, hasChanges } = useCodePersistence(
    problemId,
    initialCode
  );
  const isMobile = useIsMobile();

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

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<EditorLoading />}>
          {isMobile ? (
            <CodeMirrorEditor
              initialCode={code}
              onChange={handleCodeChange}
              readOnly={readOnly}
            />
          ) : (
            <MonacoEditor
              initialCode={code}
              language={language}
              onChange={handleCodeChange}
              readOnly={readOnly}
            />
          )}
        </Suspense>
      </div>
    </div>
  );
}

export default CodeEditor;
