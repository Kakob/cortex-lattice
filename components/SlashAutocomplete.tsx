/**
 * SlashAutocomplete - Dropdown showing slash command suggestions
 *
 * Features:
 * - Filters suggestions as user types
 * - Keyboard navigation (arrow keys + Enter)
 * - Shows command syntax and examples
 */

"use client";

import { useEffect, useRef } from "react";
import { Terminal, Lightbulb, MessageSquare } from "lucide-react";
import type { SlashAutocompleteState } from "@/lib/types";

interface SlashAutocompleteProps {
  state: SlashAutocompleteState;
  onSelect: (index: number) => void;
  onClose: () => void;
}

/**
 * Get icon for command type.
 */
function CommandIcon({ command }: { command: string }) {
  switch (command) {
    case "/problem":
      return <Terminal className="h-4 w-4 text-red-400" />;
    case "/solution":
      return <Lightbulb className="h-4 w-4 text-green-400" />;
    case "/guidance":
      return <MessageSquare className="h-4 w-4 text-blue-400" />;
    default:
      return <Terminal className="h-4 w-4 text-gray-400" />;
  }
}

export function SlashAutocomplete({
  state,
  onSelect,
  onClose,
}: SlashAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLDivElement>(null);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [state.selectedIndex]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    if (state.isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [state.isOpen, onClose]);

  if (!state.isOpen || state.suggestions.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="absolute z-50 w-80 overflow-hidden rounded-lg border border-gray-700 bg-surface shadow-xl"
      style={{
        // Position will be controlled by parent
        maxHeight: "300px",
      }}
    >
      {/* Header */}
      <div className="border-b border-gray-700 bg-surface-light px-3 py-2">
        <span className="text-xs font-medium text-gray-400">
          Slash Commands
        </span>
      </div>

      {/* Suggestions list */}
      <div className="max-h-60 overflow-y-auto">
        {state.suggestions.map((suggestion, index) => (
          <div
            key={suggestion.command}
            ref={index === state.selectedIndex ? selectedRef : null}
            className={`cursor-pointer px-3 py-2 transition-colors ${
              index === state.selectedIndex
                ? "bg-accent-primary/20"
                : "hover:bg-surface-light"
            }`}
            onClick={() => onSelect(index)}
          >
            <div className="flex items-start gap-2">
              <div className="mt-0.5">
                <CommandIcon command={suggestion.command} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-white">
                    {suggestion.command}
                  </span>
                  <span className="text-xs text-gray-400">
                    {suggestion.label}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-gray-500 truncate">
                  {suggestion.description}
                </p>
                <p className="mt-1 font-mono text-xs text-gray-600 truncate">
                  {suggestion.syntax}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer hint */}
      <div className="border-t border-gray-700 bg-surface-light px-3 py-1.5">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            <kbd className="rounded bg-surface px-1 py-0.5 text-xs">↑↓</kbd> navigate
          </span>
          <span>
            <kbd className="rounded bg-surface px-1 py-0.5 text-xs">Tab</kbd> select
          </span>
          <span>
            <kbd className="rounded bg-surface px-1 py-0.5 text-xs">Esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}

export default SlashAutocomplete;
