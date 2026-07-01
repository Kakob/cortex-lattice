"use client";

import type { ReactNode } from "react";
import { Eye } from "lucide-react";

interface BlurRevealProps {
  itemId: string;
  isRevealed: boolean;
  onReveal: () => void;
  children: ReactNode;
  className?: string;
  highlight?: { label: string; tone?: "info" | "success" };
  hideCaption?: boolean;
}

export function BlurReveal({
  itemId,
  isRevealed,
  onReveal,
  children,
  className = "",
  highlight,
  hideCaption = false,
}: BlurRevealProps) {
  if (isRevealed) {
    return <div className={className}>{children}</div>;
  }

  const toneClass =
    highlight?.tone === "success"
      ? "bg-green-500/20 text-green-300 border-green-500/40"
      : "bg-purple-500/20 text-purple-300 border-purple-500/40";

  return (
    <button
      type="button"
      onClick={onReveal}
      aria-label={`Reveal ${itemId}`}
      className={`relative block w-full text-left rounded-lg cursor-pointer transition-shadow hover:ring-2 hover:ring-purple-500/40 ${className}`}
    >
      <div className="pointer-events-none select-none filter blur-[6px] transition-[filter] duration-300">
        {children}
      </div>
      {!hideCaption && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex items-center gap-1.5 rounded-full bg-gray-900/80 px-3 py-1 text-xs font-medium text-gray-200 backdrop-blur-sm">
            <Eye className="h-3 w-3" />
            Tap to reveal
          </span>
        </div>
      )}
      {highlight && (
        <div
          className={`absolute right-2 top-2 rounded-full border px-2 py-0.5 text-[10px] font-medium ${toneClass}`}
        >
          {highlight.label}
        </div>
      )}
    </button>
  );
}

export default BlurReveal;
