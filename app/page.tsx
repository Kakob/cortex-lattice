/**
 * Home Page - Problem Browser
 *
 * Lists all available problems grouped by theme.
 */

import Link from "next/link";
import { getProblemsByTheme } from "@/lib/problems";
import { UserMenu } from "@/components/auth/UserMenu";
import {
  Brain,
  CheckCircle,
  ChevronRight,
  Code,
  Sparkles,
} from "lucide-react";

export default async function HomePage() {
  const problemGroups = await getProblemsByTheme();

  return (
    <div className="min-h-screen bg-surface-dark">
      {/* Navigation Bar */}
      <nav className="flex items-center justify-between border-b border-gray-800 bg-surface px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-accent-primary" />
          <span className="font-semibold text-gray-100">Cortex Lattice</span>
        </Link>
        <UserMenu />
      </nav>

      {/* Hero Section */}
      <header className="border-b border-gray-800 bg-gradient-to-b from-surface to-surface-dark px-4 py-12 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Brain className="h-10 w-10 text-accent-primary" />
            <h1 className="text-3xl font-bold text-gray-100">Cortex Lattice</h1>
          </div>
          <p className="text-lg text-gray-400">
            Learn AI Safety Through Code
          </p>
          <p className="mt-4 text-gray-500">
            Master data structures and algorithms by solving problems that map
            directly to implementing frontier AI research papers.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Features */}
        <div className="mb-12 grid gap-4 sm:grid-cols-3">
          <FeatureCard
            icon={<Code className="h-6 w-6 text-accent-primary" />}
            title="Solve Problems"
            description="Practice DSA patterns with hands-on coding challenges"
          />
          <FeatureCard
            icon={<Sparkles className="h-6 w-6 text-accent-secondary" />}
            title="Learn Patterns"
            description="Understand the algorithms behind AI safety papers"
          />
          <FeatureCard
            icon={<Brain className="h-6 w-6 text-accent-success" />}
            title="Build Projects"
            description="Apply patterns to implement real research papers"
          />
        </div>

        {/* Problem Groups */}
        <div className="space-y-8">
          {problemGroups.length === 0 ? (
            <div className="rounded-xl border border-gray-700 bg-surface p-8 text-center">
              <p className="text-gray-400">No problems available yet.</p>
              <p className="mt-2 text-sm text-gray-500">
                Add problems to the <code>problems/</code> directory to get started.
              </p>
            </div>
          ) : (
            problemGroups.map((group) => (
              <ProblemGroup key={group.theme} group={group} />
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-4 py-8 text-center text-sm text-gray-500">
        <p>
          Cortex Lattice - Teaching AI Safety Through Algorithmic Patterns
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

interface ProblemGroupProps {
  group: {
    theme: string;
    title: string;
    problems: {
      id: string;
      title: string;
      difficulty: "easy" | "medium" | "hard";
      pattern: string | string[];
      solved?: boolean;
    }[];
    solvedCount: number;
  };
}

function ProblemGroup({ group }: ProblemGroupProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-700 bg-surface">
      {/* Group Header */}
      <div className="border-b border-gray-700 bg-surface-light px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-100">{group.title}</h2>
          <span className="text-sm text-gray-500">
            {group.solvedCount}/{group.problems.length} solved
          </span>
        </div>
      </div>

      {/* Problems List */}
      <div className="divide-y divide-gray-700/50">
        {group.problems.map((problem) => (
          <ProblemCard key={problem.id} problem={problem} />
        ))}
      </div>
    </div>
  );
}

interface ProblemCardProps {
  problem: {
    id: string;
    title: string;
    difficulty: "easy" | "medium" | "hard";
    pattern: string | string[];
    solved?: boolean;
  };
}

function ProblemCard({ problem }: ProblemCardProps) {
  const difficultyColors = {
    easy: "text-green-400 bg-green-500/10",
    medium: "text-yellow-400 bg-yellow-500/10",
    hard: "text-red-400 bg-red-500/10",
  };

  const patternDisplay = Array.isArray(problem.pattern)
    ? problem.pattern.join(", ")
    : problem.pattern;

  return (
    <Link
      href={`/problems/${problem.id}`}
      className="flex items-center justify-between px-4 py-4 transition-colors hover:bg-surface-light"
    >
      <div className="flex items-center gap-3">
        {problem.solved ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <div className="h-5 w-5 rounded-full border-2 border-gray-600" />
        )}
        <div>
          <h3 className="font-medium text-gray-100">{problem.title}</h3>
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`rounded px-2 py-0.5 text-xs ${
                difficultyColors[problem.difficulty]
              }`}
            >
              {problem.difficulty}
            </span>
            <span className="text-gray-500">{patternDisplay}</span>
          </div>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-gray-500" />
    </Link>
  );
}
