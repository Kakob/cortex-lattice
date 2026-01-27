/**
 * useSlashCommands - Hook for slash command detection and execution
 *
 * Manages:
 * - Detecting slash commands in editor input
 * - Showing/hiding autocomplete
 * - Executing commands
 * - Clearing command lines after execution
 */

"use client";

import { useState, useCallback, useRef } from "react";
import type {
  SlashAutocompleteState,
  SlashCommandSuggestion,
  CommandResult,
  ContributionContext,
  SessionContext,
  ExecutionResult,
} from "@/lib/types";
import {
  parseSlashCommand,
  isTypingSlashCommand,
  executeSlashCommand,
  captureEditorContext,
} from "@/lib/slashCommands";

/** Default slash command suggestions */
const DEFAULT_SUGGESTIONS: SlashCommandSuggestion[] = [
  {
    command: "/problem",
    label: "Problem",
    description: "Document a confusion point or stuck moment",
    syntax: '/problem new "content"',
    example: '/problem new "I don\'t understand the time complexity"',
  },
  {
    command: "/solution",
    label: "Solution",
    description: "Capture a breakthrough or insight",
    syntax: '/solution new "content"',
    example: '/solution new "The key is to track visited nodes"',
  },
  {
    command: "/guidance",
    label: "Guidance",
    description: "Create teaching guidance from problems and solutions",
    syntax: '/guidance /select ref1 ref2 "content"',
    example: '/guidance /select prob_123 sol_456 "Think about edge cases first"',
  },
];

interface UseSlashCommandsParams {
  session: SessionContext;
  testResults?: ExecutionResult;
  revealedHints?: string[];
  onCommandExecuted?: (result: CommandResult) => void;
  onCommandLineCleared?: (lineNumber: number) => void;
}

interface UseSlashCommandsReturn {
  autocompleteState: SlashAutocompleteState;
  handleLineChange: (line: string, lineNumber: number, cursorColumn: number) => void;
  handleEnterKey: (code: string, lineNumber: number, cursorColumn: number, selectedText?: string) => Promise<boolean>;
  selectSuggestion: (index: number) => string;
  closeAutocomplete: () => void;
  moveSelection: (direction: "up" | "down") => void;
  isExecuting: boolean;
  lastResult: CommandResult | null;
}

export function useSlashCommands({
  session,
  testResults,
  revealedHints,
  onCommandExecuted,
  onCommandLineCleared,
}: UseSlashCommandsParams): UseSlashCommandsReturn {
  const [autocompleteState, setAutocompleteState] = useState<SlashAutocompleteState>({
    isOpen: false,
    suggestions: [],
    selectedIndex: 0,
    inputValue: "",
    position: { x: 0, y: 0 },
  });

  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<CommandResult | null>(null);

  const currentLineRef = useRef<{ line: string; lineNumber: number }>({
    line: "",
    lineNumber: 0,
  });

  /**
   * Filter suggestions based on current input.
   */
  const filterSuggestions = useCallback((input: string): SlashCommandSuggestion[] => {
    if (!input || input === "/") {
      return DEFAULT_SUGGESTIONS;
    }

    const searchTerm = input.toLowerCase();
    return DEFAULT_SUGGESTIONS.filter(
      (s) =>
        s.command.toLowerCase().startsWith(searchTerm) ||
        s.label.toLowerCase().includes(searchTerm.slice(1))
    );
  }, []);

  /**
   * Handle line content changes to detect slash commands.
   */
  const handleLineChange = useCallback(
    (line: string, lineNumber: number, cursorColumn: number) => {
      currentLineRef.current = { line, lineNumber };

      const trimmedLine = line.trim();

      // Check if typing a slash command
      if (isTypingSlashCommand(trimmedLine)) {
        const suggestions = filterSuggestions(trimmedLine);

        setAutocompleteState({
          isOpen: suggestions.length > 0,
          suggestions,
          selectedIndex: 0,
          inputValue: trimmedLine,
          position: { x: cursorColumn, y: lineNumber },
        });
      } else {
        // Close autocomplete if not typing a slash command
        setAutocompleteState((prev) => ({
          ...prev,
          isOpen: false,
        }));
      }
    },
    [filterSuggestions]
  );

  /**
   * Handle Enter key press to execute command.
   * Returns true if a command was executed (line should be cleared).
   */
  const handleEnterKey = useCallback(
    async (
      code: string,
      lineNumber: number,
      cursorColumn: number,
      selectedText?: string
    ): Promise<boolean> => {
      const { line } = currentLineRef.current;
      const trimmedLine = line.trim();

      // Check if this line is a complete slash command
      if (!trimmedLine.startsWith("/")) {
        return false;
      }

      // Parse the command
      const parsed = parseSlashCommand(trimmedLine);

      // If not valid, don't execute
      if (!parsed.isValid) {
        // Show error but don't clear line
        setLastResult({
          success: false,
          message: parsed.error || "Invalid command",
          error: parsed.error,
        });

        if (onCommandExecuted) {
          onCommandExecuted({
            success: false,
            message: parsed.error || "Invalid command",
            error: parsed.error,
          });
        }

        return false;
      }

      // Execute the command
      setIsExecuting(true);
      setAutocompleteState((prev) => ({ ...prev, isOpen: false }));

      try {
        // Capture editor context
        const context: ContributionContext = captureEditorContext({
          code,
          cursorLine: lineNumber,
          cursorColumn,
          selectedText,
          language: "python",
          testResults,
          revealedHints,
        });

        // Execute command
        const result = await executeSlashCommand(parsed, session, context);

        setLastResult(result);

        if (onCommandExecuted) {
          onCommandExecuted(result);
        }

        // If successful, signal to clear the command line
        if (result.success && onCommandLineCleared) {
          onCommandLineCleared(lineNumber);
        }

        return result.success;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        const result: CommandResult = {
          success: false,
          message: `Error executing command: ${errorMessage}`,
          error: errorMessage,
        };

        setLastResult(result);

        if (onCommandExecuted) {
          onCommandExecuted(result);
        }

        return false;
      } finally {
        setIsExecuting(false);
      }
    },
    [session, testResults, revealedHints, onCommandExecuted, onCommandLineCleared]
  );

  /**
   * Select an autocomplete suggestion.
   * Returns the selected command text.
   */
  const selectSuggestion = useCallback(
    (index: number): string => {
      const suggestion = autocompleteState.suggestions[index];
      if (!suggestion) {
        return autocompleteState.inputValue;
      }

      setAutocompleteState((prev) => ({ ...prev, isOpen: false }));
      return suggestion.syntax;
    },
    [autocompleteState.suggestions, autocompleteState.inputValue]
  );

  /**
   * Close the autocomplete dropdown.
   */
  const closeAutocomplete = useCallback(() => {
    setAutocompleteState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  /**
   * Move the selection up or down in the autocomplete list.
   */
  const moveSelection = useCallback((direction: "up" | "down") => {
    setAutocompleteState((prev) => {
      const maxIndex = prev.suggestions.length - 1;
      let newIndex = prev.selectedIndex;

      if (direction === "up") {
        newIndex = newIndex > 0 ? newIndex - 1 : maxIndex;
      } else {
        newIndex = newIndex < maxIndex ? newIndex + 1 : 0;
      }

      return { ...prev, selectedIndex: newIndex };
    });
  }, []);

  return {
    autocompleteState,
    handleLineChange,
    handleEnterKey,
    selectSuggestion,
    closeAutocomplete,
    moveSelection,
    isExecuting,
    lastResult,
  };
}
