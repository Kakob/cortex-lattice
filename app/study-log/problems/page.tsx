/**
 * Study Log Problems Page
 *
 * Displays all DesignGurus problems from dsa-study-log.yaml grouped by pattern.
 */

import Link from "next/link";
import { getStudyProblemsByPattern, getStudyProgress, type StudyProblem } from "@/lib/study-log-yaml";
import { normalizeTitle } from "@/lib/curriculum";
import {
  Brain,
  CheckCircle,
  ChevronDown,
  Code,
  Lightbulb,
  Target,
} from "lucide-react";

export default async function StudyLogProblemsPage() {
  const [patternGroups, progress] = await Promise.all([
    getStudyProblemsByPattern(),
    getStudyProgress(),
  ]);

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
            href="/study-log"
            className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            Study Progress
          </Link>
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            Browse Problems
          </Link>
        </div>
      </nav>

      {/* Header */}
      <header className="border-b border-gray-800 bg-gradient-to-b from-surface to-surface-dark px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-8 w-8 text-accent-primary" />
            <h1 className="text-2xl font-bold text-gray-100">DSA Study Log</h1>
          </div>
          <p className="text-gray-400">
            DesignGurus problems organized by pattern. Track your progress toward cold solve mastery.
          </p>
        </div>
      </header>

      {/* Stats */}
      <div className="border-b border-gray-800 bg-surface px-4 py-4">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              icon={<Code className="h-5 w-5" />}
              label="Total Problems"
              value={progress.totalProblems}
            />
            <StatCard
              icon={<Target className="h-5 w-5" />}
              label="Patterns"
              value={progress.patterns}
            />
            <StatCard
              icon={<Lightbulb className="h-5 w-5" />}
              label="With Insight"
              value={progress.withInsight}
              color="text-yellow-400"
            />
            <StatCard
              icon={<CheckCircle className="h-5 w-5" />}
              label="Cold Solves"
              value={progress.canSolveCold}
              color="text-green-400"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-6">
          {patternGroups.length === 0 ? (
            <div className="rounded-xl border border-gray-700 bg-surface p-8 text-center">
              <p className="text-gray-400">No study log found.</p>
              <p className="mt-2 text-sm text-gray-500">
                Make sure <code>problems/dsa-study-log.yaml</code> exists.
              </p>
            </div>
          ) : (
            patternGroups.map((group) => (
              <PatternGroup key={group.pattern} group={group} />
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-4 py-8 text-center text-sm text-gray-500">
        <p>Keep studying - cold solve mastery takes time.</p>
      </footer>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color = "text-gray-100",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-700 bg-surface-light p-3">
      <div className="text-gray-500">{icon}</div>
      <div>
        <div className={`text-xl font-bold ${color}`}>{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  );
}

interface PatternGroupProps {
  group: {
    pattern: string;
    title: string;
    whenToUse: string;
    template: string;
    problems: StudyProblem[];
    stats: {
      total: number;
      withInsight: number;
      canSolveCold: number;
    };
  };
}

function PatternGroup({ group }: PatternGroupProps) {
  return (
    <details className="group overflow-hidden rounded-xl border border-gray-700 bg-surface">
      {/* Group Header */}
      <summary className="cursor-pointer list-none border-b border-gray-700 bg-surface-light px-4 py-3 hover:bg-gray-800/50 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChevronDown className="h-5 w-5 text-gray-500 transition-transform group-open:rotate-180" />
            <h2 className="font-semibold text-gray-100">{group.title}</h2>
            <span className="rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-400">
              {group.stats.total} problems
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              {group.stats.withInsight}
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              {group.stats.canSolveCold}
            </span>
          </div>
        </div>
      </summary>

      {/* Pattern Info */}
      <div className="border-b border-gray-700/50 bg-gray-800/30 px-4 py-3">
        <div className="mb-2 text-sm">
          <span className="text-gray-500">When to use: </span>
          <span className="text-gray-300">{group.whenToUse}</span>
        </div>
        <details className="text-sm">
          <summary className="cursor-pointer text-gray-500 hover:text-gray-300">
            View template
          </summary>
          <pre className="mt-2 overflow-x-auto rounded bg-black/50 p-3 text-xs text-gray-300">
            {group.template}
          </pre>
        </details>
      </div>

      {/* Problems List */}
      <div className="divide-y divide-gray-700/50">
        {group.problems.map((problem, index) => (
          <ProblemCard key={index} problem={problem} />
        ))}
      </div>
    </details>
  );
}

function ProblemCard({ problem }: { problem: StudyProblem }) {
  const difficultyColors = {
    easy: "text-green-400 bg-green-500/10",
    medium: "text-yellow-400 bg-yellow-500/10",
    hard: "text-red-400 bg-red-500/10",
  };

  const hasInsight = problem.key_insight && problem.key_insight.trim() !== "";
  const hasAttempted = problem.first_attempt && problem.first_attempt.trim() !== "";
  const slug = normalizeTitle(problem.title);

  return (
    <Link
      href={`/study-log/${slug}`}
      className="flex items-start justify-between px-4 py-4 hover:bg-surface-light transition-colors group"
    >
      <div className="flex items-start gap-3">
        {problem.can_solve_cold ? (
          <CheckCircle className="mt-0.5 h-5 w-5 text-green-500" />
        ) : hasInsight ? (
          <Lightbulb className="mt-0.5 h-5 w-5 text-yellow-500" />
        ) : (
          <div className="mt-0.5 h-5 w-5 rounded-full border-2 border-gray-600" />
        )}
        <div className="flex-1">
          <h3 className="font-medium text-gray-100 group-hover:text-indigo-400 transition-colors">
            {problem.title}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span
              className={`rounded px-2 py-0.5 text-xs ${difficultyColors[problem.difficulty]}`}
            >
              {problem.difficulty}
            </span>
            {hasAttempted && (
              <span className="text-xs text-gray-500">
                Attempted: {problem.first_attempt}
              </span>
            )}
            {problem.bugs.length > 0 && (
              <span className="text-xs text-orange-400">
                {problem.bugs.length} bug{problem.bugs.length !== 1 ? "s" : ""} logged
              </span>
            )}
            {problem.peeked_at.length > 0 && (
              <span className="text-xs text-purple-400">
                Peeked: {problem.peeked_at.join(", ")}
              </span>
            )}
          </div>
          {hasInsight && (
            <p className="mt-2 rounded bg-yellow-500/10 px-2 py-1 text-sm text-yellow-300">
              {problem.key_insight}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
