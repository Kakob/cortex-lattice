"use client";

/**
 * Monaco Editor - Desktop code editor
 *
 * Full-featured code editor with Python syntax highlighting.
 * Uses lazy loading for optimal bundle size.
 * Supports slash commands for inline contributions.
 */

import { useRef, useCallback, useEffect } from "react";
import Editor, { OnMount, OnChange } from "@monaco-editor/react";
import type { editor, IKeyboardEvent } from "monaco-editor";
import type { SlashAutocompleteState } from "@/lib/types";

interface MonacoEditorProps {
  initialCode: string;
  language?: string;
  onChange?: (code: string) => void;
  readOnly?: boolean;
  // Slash command props
  onLineChange?: (line: string, lineNumber: number, cursorColumn: number) => void;
  onEnterKey?: (
    code: string,
    lineNumber: number,
    cursorColumn: number,
    selectedText?: string
  ) => Promise<boolean>;
  onEscapeKey?: () => void;
  onArrowKey?: (direction: "up" | "down") => void;
  onTabKey?: () => string | undefined;
  autocompleteState?: SlashAutocompleteState;
}

export function MonacoEditor({
  initialCode,
  language = "python",
  onChange,
  readOnly = false,
  onLineChange,
  onEnterKey,
  onEscapeKey,
  onArrowKey,
  onTabKey,
  autocompleteState,
}: MonacoEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const isProcessingCommand = useRef(false);

  // Use refs to always access latest callback versions
  const callbacksRef = useRef({
    onLineChange,
    onEnterKey,
    onEscapeKey,
    onArrowKey,
    onTabKey,
  });

  // Update refs when callbacks change
  useEffect(() => {
    callbacksRef.current = {
      onLineChange,
      onEnterKey,
      onEscapeKey,
      onArrowKey,
      onTabKey,
    };
  }, [onLineChange, onEnterKey, onEscapeKey, onArrowKey, onTabKey]);

  // Store autocomplete state in ref
  const autocompleteStateRef = useRef(autocompleteState);
  useEffect(() => {
    autocompleteStateRef.current = autocompleteState;
  }, [autocompleteState]);

  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;

    // Configure Python language defaults
    monaco.languages.setLanguageConfiguration("python", {
      comments: {
        lineComment: "#",
        blockComment: ['"""', '"""'],
      },
      brackets: [
        ["(", ")"],
        ["[", "]"],
        ["{", "}"],
      ],
      autoClosingPairs: [
        { open: "(", close: ")" },
        { open: "[", close: "]" },
        { open: "{", close: "}" },
        { open: '"', close: '"' },
        { open: "'", close: "'" },
      ],
    });

    // Track cursor position changes for slash command detection
    editor.onDidChangeCursorPosition((e) => {
      const { onLineChange } = callbacksRef.current;
      if (!onLineChange) return;

      const model = editor.getModel();
      if (!model) return;

      const lineNumber = e.position.lineNumber;
      const lineContent = model.getLineContent(lineNumber);
      onLineChange(lineContent, lineNumber, e.position.column);
    });

    // Handle keyboard events for slash commands
    editor.onKeyDown(async (e: IKeyboardEvent) => {
      const { onEnterKey, onEscapeKey, onArrowKey, onTabKey } = callbacksRef.current;
      const isAutocompleteOpen = autocompleteStateRef.current?.isOpen;

      // Handle Enter key when autocomplete is NOT open (execute command)
      if (e.keyCode === monaco.KeyCode.Enter && !isAutocompleteOpen && onEnterKey) {
        const position = editor.getPosition();
        const model = editor.getModel();

        if (position && model) {
          const lineContent = model.getLineContent(position.lineNumber);
          const trimmedLine = lineContent.trim();

          // Only intercept if line starts with /
          if (trimmedLine.startsWith("/")) {
            e.preventDefault();
            e.stopPropagation();

            if (isProcessingCommand.current) return;
            isProcessingCommand.current = true;

            try {
              const code = model.getValue();
              const selection = editor.getSelection();
              const selectedText = selection
                ? model.getValueInRange(selection)
                : undefined;

              const shouldClear = await onEnterKey(
                code,
                position.lineNumber,
                position.column,
                selectedText
              );

              // Clear the command line if successful
              if (shouldClear) {
                const lineStartPos = { lineNumber: position.lineNumber, column: 1 };
                const lineEndPos = {
                  lineNumber: position.lineNumber,
                  column: model.getLineMaxColumn(position.lineNumber),
                };

                editor.executeEdits("slash-command", [
                  {
                    range: new monaco.Range(
                      lineStartPos.lineNumber,
                      lineStartPos.column,
                      lineEndPos.lineNumber,
                      lineEndPos.column
                    ),
                    text: "",
                  },
                ]);
              }
            } finally {
              isProcessingCommand.current = false;
            }
          }
        }
      }

      // Handle Escape key
      if (e.keyCode === monaco.KeyCode.Escape && onEscapeKey) {
        onEscapeKey();
      }

      // Handle arrow keys when autocomplete is open
      if (isAutocompleteOpen && onArrowKey) {
        if (e.keyCode === monaco.KeyCode.UpArrow) {
          e.preventDefault();
          e.stopPropagation();
          onArrowKey("up");
        } else if (e.keyCode === monaco.KeyCode.DownArrow) {
          e.preventDefault();
          e.stopPropagation();
          onArrowKey("down");
        }
      }

      // Handle Tab key when autocomplete is open
      if (isAutocompleteOpen && e.keyCode === monaco.KeyCode.Tab && onTabKey) {
        e.preventDefault();
        e.stopPropagation();

        const selectedSyntax = onTabKey();
        if (selectedSyntax) {
          const position = editor.getPosition();
          const model = editor.getModel();

          if (position && model) {
            // Replace current line with selected syntax
            const lineStartPos = { lineNumber: position.lineNumber, column: 1 };
            const lineEndPos = {
              lineNumber: position.lineNumber,
              column: model.getLineMaxColumn(position.lineNumber),
            };

            editor.executeEdits("slash-autocomplete", [
              {
                range: new monaco.Range(
                  lineStartPos.lineNumber,
                  lineStartPos.column,
                  lineEndPos.lineNumber,
                  lineEndPos.column
                ),
                text: selectedSyntax,
              },
            ]);

            // Move cursor to end of inserted text
            editor.setPosition({
              lineNumber: position.lineNumber,
              column: selectedSyntax.length + 1,
            });
          }
        }
      }
    });

    // Focus editor
    editor.focus();
  }, []);

  const handleChange: OnChange = useCallback(
    (value) => {
      if (onChange && value !== undefined) {
        onChange(value);
      }
    },
    [onChange]
  );

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language={language}
        defaultValue={initialCode}
        onChange={handleChange}
        onMount={handleEditorMount}
        theme="vs-dark"
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 4,
          insertSpaces: true,
          wordWrap: "on",
          folding: true,
          renderWhitespace: "selection",
          cursorBlinking: "smooth",
          smoothScrolling: true,
          padding: { top: 16, bottom: 16 },
          // Disable some features for cleaner look
          overviewRulerBorder: false,
          hideCursorInOverviewRuler: true,
          renderLineHighlight: "line",
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
        }}
        loading={
          <div className="flex h-full items-center justify-center bg-surface text-gray-400">
            Loading editor...
          </div>
        }
      />
    </div>
  );
}

export default MonacoEditor;
