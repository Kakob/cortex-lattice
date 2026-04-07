/**
 * Home Page - Problem Browser
 *
 * Lists all available problems grouped by category.
 */

import Link from "next/link";
import { getProblemsByPattern } from "@/lib/problems";
import { UserMenu } from "@/components/auth/UserMenu";
import type { PatternGroup, AlgorithmGroup } from "@/lib/types";
import {
  Brain,
  Code,
  Sparkles,
} from "lucide-react";

export default async function HomePage() {
  const patternGroups = await getProblemsByPattern();

  return (
    <div className="min-h-screen bg-surface-dark">
      {/* Navigation Bar */}
      <nav className="flex items-center justify-between border-b border-gray-800 bg-surface px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-accent-primary" />
          <span className="font-semibold text-gray-100">Cortex Lattice</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/study-log/problems"
            className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            DSA Study Log
          </Link>
          <Link
            href="/study-log"
            className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            Progress
          </Link>
          <UserMenu />
        </div>
      </nav>

      {/* Hero Section */}
      <header className="border-b border-gray-800 bg-gradient-to-b from-surface to-surface-dark px-4 py-12 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Brain className="h-10 w-10 text-accent-primary" />
            <h1 className="text-3xl font-bold text-gray-100">Cortex Lattice</h1>
          </div>
          <p className="text-lg text-gray-400">
            Learn the Algorithms Behind Classic Coding Problems
          </p>
          <p className="mt-4 text-gray-500">
            Problems organized by algorithmic domain, with step-by-step
            guidance that helps you think through the solution — not just see it.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Features */}
        <div className="mb-12 grid gap-4 sm:grid-cols-3">
          <FeatureCard
            icon={<Code className="h-6 w-6 text-accent-primary" />}
            title="Domain-Based Problems"
            description="Problems grouped by algorithmic pattern so you build real intuition, not just memorize solutions"
          />
          <FeatureCard
            icon={<Sparkles className="h-6 w-6 text-accent-secondary" />}
            title="Guided Solving"
            description="Get hints and guidance as you work — learn to think through problems instead of jumping to the answer"
          />
          <FeatureCard
            icon={<Brain className="h-6 w-6 text-accent-success" />}
            title="Build Connections"
            description="See how patterns link across domains and build a lattice of understanding, not isolated knowledge"
          />
        </div>

        {/* Problem Groups by Pattern */}
        <div className="space-y-8">
          {patternGroups.length === 0 ? (
            <div className="rounded-xl border border-gray-700 bg-surface p-8 text-center">
              <p className="text-gray-400">No problems available yet.</p>
              <p className="mt-2 text-sm text-gray-500">
                Add problems to the <code>problems/</code> directory to get started.
              </p>
            </div>
          ) : (
            patternGroups.map((group) => (
              <PatternSection key={group.pattern} group={group} />
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-4 py-8 text-center text-sm text-gray-500">
        <p>
          Cortex Lattice - Learn Algorithms Through Guided Problem Solving
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-gray-700 bg-surface p-4">
      <div className="mb-2">{icon}</div>
      <h3 className="font-medium text-gray-100">{title}</h3>
      <p className="mt-1 text-sm text-gray-400">{description}</p>
    </div>
  );
}

function PatternSection({ group }: { group: PatternGroup }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-700 bg-surface">
      {/* Pattern Header */}
      <div className="border-b border-gray-700 bg-surface-light px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-100">{group.title}</h2>
          <span className="text-sm text-gray-500">
            {group.algorithms.length} algorithm{group.algorithms.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Algorithms */}
      <div className="divide-y divide-gray-700/50">
        {group.algorithms.map((algorithm) => (
          <AlgorithmCard key={algorithm.algorithmId} algorithm={algorithm} />
        ))}
      </div>
    </div>
  );
}

const difficultyColors = {
  easy: "text-green-400 bg-green-500/10",
  medium: "text-yellow-400 bg-yellow-500/10",
  hard: "text-red-400 bg-red-500/10",
};

const domainEmojis: Record<string, string> = {
  "wizard-dungeon": "🧙",
  "medicine": "💊",
  "finance": "💸",
  "software-engineering": "🖥️",
  "space-adventure": "🚀",
  "coding-interview": "💻",
};

function AlgorithmCard({ algorithm }: { algorithm: AlgorithmGroup }) {
  const firstVariant = algorithm.variants[0];
  const defaultHref = `/problems/${algorithm.algorithmId}?theme=${firstVariant.themeId}`;

  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-2">
        <Link
          href={defaultHref}
          className="font-medium text-gray-100 hover:text-white transition-colors"
        >
          {algorithm.algorithmName}
        </Link>
        <span
          className={`rounded px-2 py-0.5 text-xs ${difficultyColors[algorithm.difficulty]}`}
        >
          {algorithm.difficulty}
        </span>
      </div>
      <div className="mt-3 flex justify-center gap-6">
        {algorithm.variants.map((variant) => (
          <Link
            key={variant.themeId}
            href={`/problems/${algorithm.algorithmId}?theme=${variant.themeId}`}
            className="flex flex-col items-center gap-1.5 rounded-lg px-3 py-2 transition-colors hover:bg-surface-light"
          >
            <span className="text-2xl">
              {domainEmojis[variant.themeId] || "📝"}
            </span>
            <span className="text-xs text-gray-400">
              {variant.title}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
