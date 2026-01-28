"use client";

/**
 * YAML Preview Component
 *
 * Shows real-time YAML output from form data.
 * Sticky positioned on the right side of the form.
 */

import { useMemo } from "react";
import { stringify } from "yaml";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface YamlPreviewProps {
  data: Record<string, unknown>;
  className?: string;
}

export function YamlPreview({ data, className = "" }: YamlPreviewProps) {
  const [copied, setCopied] = useState(false);

  const yamlString = useMemo(() => {
    try {
      return stringify(data, {
        lineWidth: 0,
        defaultStringType: "PLAIN",
        defaultKeyType: "PLAIN",
      });
    } catch {
      return "# Error generating YAML";
    }
  }, [data]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(yamlString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className={`flex flex-col rounded-lg border border-gray-700 bg-surface ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-700 px-4 py-2">
        <h3 className="text-sm font-medium text-gray-300">YAML Preview</h3>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-400 hover:bg-gray-700 hover:text-white"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-green-400" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* YAML Content */}
      <div className="flex-1 overflow-auto">
        <pre className="p-4 text-xs text-gray-300">
          <code>{yamlString}</code>
        </pre>
      </div>
    </div>
  );
}
