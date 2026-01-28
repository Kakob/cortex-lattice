"use client";

/**
 * Code Editor Field
 *
 * Monaco editor wrapper for use in forms.
 * Supports Python and JavaScript with proper error display.
 */

import { useCallback } from "react";
import Editor from "@monaco-editor/react";

interface CodeEditorFieldProps {
  value: string;
  onChange: (value: string) => void;
  language?: "python" | "javascript" | "yaml";
  label: string;
  error?: string;
  required?: boolean;
  height?: string;
  readOnly?: boolean;
}

export function CodeEditorField({
  value,
  onChange,
  language = "python",
  label,
  error,
  required = false,
  height = "200px",
  readOnly = false,
}: CodeEditorFieldProps) {
  const handleChange = useCallback(
    (newValue: string | undefined) => {
      onChange(newValue ?? "");
    },
    [onChange]
  );

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </label>
      <div
        className={`overflow-hidden rounded-lg border ${
          error ? "border-red-500" : "border-gray-700"
        }`}
      >
        <Editor
          height={height}
          language={language}
          value={value}
          onChange={handleChange}
          theme="vs-dark"
          options={{
            readOnly,
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            wordWrap: "on",
            padding: { top: 8, bottom: 8 },
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
            renderLineHighlight: "none",
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
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
