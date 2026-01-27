"use client";

/**
 * CodeMirror Editor - Mobile-friendly code editor
 *
 * Lightweight editor optimized for touch devices.
 * Uses CodeMirror 6 with Python syntax highlighting.
 * Supports slash commands for inline contributions.
 */

import { useEffect, useRef, useCallback } from "react";
import { EditorState, Prec } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching,
} from "@codemirror/language";
import { autocompletion, closeBrackets } from "@codemirror/autocomplete";
import type { SlashAutocompleteState } from "@/lib/types";

interface CodeMirrorEditorProps {
  initialCode: string;
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

export function CodeMirrorEditor({
  initialCode,
  onChange,
  readOnly = false,
  onLineChange,
  onEnterKey,
  onEscapeKey,
  onArrowKey,
  onTabKey,
  autocompleteState,
}: CodeMirrorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const isProcessingCommand = useRef(false);

  // Store callbacks in refs for stable access
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

  // Create update listener
  const handleUpdate = useCallback(
    (update: { docChanged: boolean; state: EditorState }) => {
      if (update.docChanged && onChange) {
        onChange(update.state.doc.toString());
      }
    },
    [onChange]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    // Slash command keymap (high priority)
    const slashCommandKeymap = Prec.highest(
      keymap.of([
        {
          key: "Enter",
          run: (view) => {
            const { onEnterKey } = callbacksRef.current;
            if (!onEnterKey) return false;

            const state = view.state;
            const pos = state.selection.main.head;
            const line = state.doc.lineAt(pos);
            const lineContent = line.text;
            const trimmedLine = lineContent.trim();

            // Only handle if line starts with /
            if (!trimmedLine.startsWith("/")) return false;

            if (isProcessingCommand.current) return true;
            isProcessingCommand.current = true;

            const lineNumber = line.number;
            const cursorColumn = pos - line.from + 1;
            const code = state.doc.toString();
            const selectedText = state.sliceDoc(
              state.selection.main.from,
              state.selection.main.to
            );

            // Execute async but return true to prevent default
            onEnterKey(code, lineNumber, cursorColumn, selectedText || undefined)
              .then((shouldClear) => {
                if (shouldClear && viewRef.current) {
                  // Clear the command line
                  viewRef.current.dispatch({
                    changes: {
                      from: line.from,
                      to: line.to,
                      insert: "",
                    },
                  });
                }
              })
              .finally(() => {
                isProcessingCommand.current = false;
              });

            return true;
          },
        },
        {
          key: "Escape",
          run: () => {
            const { onEscapeKey } = callbacksRef.current;
            if (onEscapeKey) {
              onEscapeKey();
              return true;
            }
            return false;
          },
        },
        {
          key: "ArrowUp",
          run: () => {
            if (!autocompleteStateRef.current?.isOpen) return false;
            const { onArrowKey } = callbacksRef.current;
            if (onArrowKey) {
              onArrowKey("up");
              return true;
            }
            return false;
          },
        },
        {
          key: "ArrowDown",
          run: () => {
            if (!autocompleteStateRef.current?.isOpen) return false;
            const { onArrowKey } = callbacksRef.current;
            if (onArrowKey) {
              onArrowKey("down");
              return true;
            }
            return false;
          },
        },
        {
          key: "Tab",
          run: (view) => {
            if (!autocompleteStateRef.current?.isOpen) return false;
            const { onTabKey } = callbacksRef.current;
            if (!onTabKey) return false;

            const selectedSyntax = onTabKey();
            if (selectedSyntax) {
              const state = view.state;
              const pos = state.selection.main.head;
              const line = state.doc.lineAt(pos);

              view.dispatch({
                changes: {
                  from: line.from,
                  to: line.to,
                  insert: selectedSyntax,
                },
                selection: { anchor: line.from + selectedSyntax.length },
              });
            }
            return true;
          },
        },
      ])
    );

    // Cursor position tracking
    const cursorTracker = EditorView.updateListener.of((update) => {
      const { onLineChange } = callbacksRef.current;
      if (!onLineChange) return;

      if (update.selectionSet || update.docChanged) {
        const pos = update.state.selection.main.head;
        const line = update.state.doc.lineAt(pos);
        const lineContent = line.text;
        const lineNumber = line.number;
        const cursorColumn = pos - line.from + 1;
        onLineChange(lineContent, lineNumber, cursorColumn);
      }
    });

    // Create editor state
    const state = EditorState.create({
      doc: initialCode,
      extensions: [
        // Slash command handling (high priority)
        slashCommandKeymap,
        cursorTracker,

        // Basic editing
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),

        // Language support
        python(),
        syntaxHighlighting(defaultHighlightStyle),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),

        // UI
        lineNumbers(),
        highlightActiveLine(),
        oneDark,

        // Read-only mode
        EditorState.readOnly.of(readOnly),

        // Update listener
        EditorView.updateListener.of(handleUpdate),

        // Mobile-friendly styling
        EditorView.theme({
          "&": {
            height: "100%",
            fontSize: "16px", // Larger font for mobile
          },
          ".cm-content": {
            padding: "12px 0",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          },
          ".cm-line": {
            padding: "0 12px",
          },
          ".cm-gutters": {
            backgroundColor: "#1a1a2e",
            borderRight: "1px solid #2d2d44",
          },
          ".cm-activeLineGutter": {
            backgroundColor: "#25253b",
          },
          ".cm-scroller": {
            overflow: "auto",
            // Smooth scrolling on mobile
            WebkitOverflowScrolling: "touch",
          },
        }),
      ],
    });

    // Create editor view
    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    // Cleanup
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [initialCode, readOnly, handleUpdate]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden rounded-lg bg-surface"
    />
  );
}

export default CodeMirrorEditor;
