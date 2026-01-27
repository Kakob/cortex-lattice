"use client";

/**
 * CodeMirror Editor - Mobile-friendly code editor
 *
 * Lightweight editor optimized for touch devices.
 * Uses CodeMirror 6 with Python syntax highlighting.
 */

import { useEffect, useRef, useCallback } from "react";
import { EditorState } from "@codemirror/state";
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

interface CodeMirrorEditorProps {
  initialCode: string;
  onChange?: (code: string) => void;
  readOnly?: boolean;
}

export function CodeMirrorEditor({
  initialCode,
  onChange,
  readOnly = false,
}: CodeMirrorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

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

    // Create editor state
    const state = EditorState.create({
      doc: initialCode,
      extensions: [
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
