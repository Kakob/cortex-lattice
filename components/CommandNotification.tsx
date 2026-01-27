/**
 * CommandNotification - Toast notification for command results
 *
 * Shows success/error messages after executing slash commands.
 * Auto-dismisses after a timeout.
 */

"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, X, Link } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { CommandResult } from "@/lib/types";

interface CommandNotificationProps {
  result: CommandResult | null;
  onDismiss: () => void;
  autoDismissMs?: number;
}

export function CommandNotification({
  result,
  onDismiss,
  autoDismissMs = 4000,
}: CommandNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Show notification when result changes
  useEffect(() => {
    if (result) {
      setIsVisible(true);
    }
  }, [result]);

  // Auto-dismiss timer
  useEffect(() => {
    if (!result || !isVisible) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
      // Wait for exit animation before calling onDismiss
      setTimeout(onDismiss, 200);
    }, autoDismissMs);

    return () => clearTimeout(timer);
  }, [result, isVisible, autoDismissMs, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 200);
  };

  if (!result) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={`fixed right-4 top-4 z-50 max-w-md rounded-lg border shadow-lg ${
            result.success
              ? "border-green-500/30 bg-green-950/90"
              : "border-red-500/30 bg-red-950/90"
          }`}
        >
          <div className="flex items-start gap-3 p-4">
            {/* Icon */}
            <div className="flex-shrink-0">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <XCircle className="h-5 w-5 text-red-400" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium ${
                  result.success ? "text-green-200" : "text-red-200"
                }`}
              >
                {result.success ? "Success" : "Error"}
              </p>
              <p className="mt-1 text-sm text-gray-300">{result.message}</p>

              {/* Show linked contributions if any */}
              {result.linkedContributions &&
                result.linkedContributions.length > 0 && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                    <Link className="h-3 w-3" />
                    <span>
                      {result.linkedContributions.length} link
                      {result.linkedContributions.length > 1 ? "s" : ""} created
                    </span>
                  </div>
                )}

              {/* Show contribution ID for reference */}
              {result.contributionId && (
                <p className="mt-2 font-mono text-xs text-gray-500">
                  ID: {result.contributionId.slice(0, 12)}...
                </p>
              )}
            </div>

            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 rounded p-1 text-gray-400 hover:bg-gray-700/50 hover:text-gray-200 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Progress bar for auto-dismiss */}
          {result.success && (
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: autoDismissMs / 1000, ease: "linear" }}
              className="h-0.5 origin-left bg-green-500/50"
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CommandNotification;
