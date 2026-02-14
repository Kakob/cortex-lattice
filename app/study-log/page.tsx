'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

interface StudyStats {
  totalCurriculumProblems: number;
  startedProblems: number;
  solvedProblems: number;
  coldSolves: number;
  coldSolveRate: number;
  reviewsDue: number;
}

interface Attempt {
  id: string;
  startedAt: string;
  completedAt?: string;
  status: string;
  passed: boolean;
  snapshotCount: number;
  snapshots: { id: string }[];
  stuckPoints: { id: string }[];
  reflections: { id: string }[];
}

interface StudyData {
  id: string;
  platform: string;
  url: string;
  title: string;
  attempts: Attempt[];
}

interface CurriculumProblem {
  curriculumTitle: string;
  normalizedTitle: string;
  difficulty: 'easy' | 'medium' | 'hard';
  patternKey: string;
  index: number;
  studyData: StudyData | null;
}

export default function StudyLogPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [problemsByPattern, setProblemsByPattern] = useState<Record<string, CurriculumProblem[]>>({});
  const [patternOrder, setPatternOrder] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnlyStarted, setShowOnlyStarted] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login');
    }
  }, [status]);

  useEffect(() => {
    if (session?.user) {
      fetchStudyLog();
    }
  }, [session]);

  async function fetchStudyLog() {
    try {
      const res = await fetch('/api/extension/study-log');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setProblemsByPattern(data.problemsByPattern);
        setPatternOrder(data.patternOrder);
      }
    } catch (err) {
      console.error('Failed to fetch study log:', err);
    } finally {
      setLoading(false);
    }
  }

  function getProblemStatus(problem: CurriculumProblem): 'solved' | 'in-progress' | 'attempted' | 'not-started' {
    if (!problem.studyData) return 'not-started';
    if (problem.studyData.attempts.some(a => a.passed)) return 'solved';
    if (problem.studyData.attempts.some(a => a.status === 'in_progress')) return 'in-progress';
    return 'attempted';
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'solved': return 'bg-emerald-400';
      case 'in-progress': return 'bg-amber-400';
      case 'attempted': return 'bg-red-400';
      default: return 'bg-slate-600';
    }
  }

  function getPatternProgress(pattern: string): { solved: number; total: number } {
    const problems = problemsByPattern[pattern] || [];
    const solved = problems.filter(p => getProblemStatus(p) === 'solved').length;
    return { solved, total: problems.length };
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading study log...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold">CL</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-100">GTCI Study Log</h1>
                <p className="text-sm text-slate-400">Grokking the Coding Interview Progress</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyStarted}
                  onChange={(e) => setShowOnlyStarted(e.target.checked)}
                  className="rounded bg-slate-700 border-slate-600 text-indigo-500 focus:ring-indigo-500"
                />
                Show only started
              </label>
              <a
                href="/"
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm transition-colors"
              >
                Browse Problems
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            <StatCard label="Total Problems" value={stats.totalCurriculumProblems} />
            <StatCard label="Started" value={stats.startedProblems} color="text-blue-400" />
            <StatCard label="Solved" value={stats.solvedProblems} color="text-emerald-400" />
            <StatCard label="Cold Solves" value={stats.coldSolves} color="text-indigo-400" />
            <StatCard
              label="Cold Rate"
              value={`${Math.round(stats.coldSolveRate * 100)}%`}
              color="text-purple-400"
            />
            <StatCard
              label="Reviews Due"
              value={stats.reviewsDue}
              color="text-amber-400"
              highlight={stats.reviewsDue > 0}
            />
          </div>
        )}

        {/* Progress Overview */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-8">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Pattern Progress</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {patternOrder.map(pattern => {
              const progress = getPatternProgress(pattern);
              const percentage = Math.round((progress.solved / progress.total) * 100);
              return (
                <div key={pattern} className="bg-slate-900 rounded-lg p-3">
                  <div className="text-sm font-medium text-slate-300 capitalize mb-2">
                    {pattern.replace(/-/g, ' ')}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">
                      {progress.solved}/{progress.total}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Problems by pattern */}
        <div className="space-y-8">
          {patternOrder.map((pattern) => {
            const problems = problemsByPattern[pattern] || [];
            const filteredProblems = showOnlyStarted
              ? problems.filter(p => p.studyData !== null)
              : problems;

            if (filteredProblems.length === 0) return null;

            const progress = getPatternProgress(pattern);

            return (
              <section key={pattern}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-100 capitalize">
                    {pattern.replace(/-/g, ' ')}
                  </h3>
                  <span className="text-sm text-slate-500">
                    {progress.solved}/{progress.total} solved
                  </span>
                </div>
                <div className="space-y-2">
                  {filteredProblems.map((problem) => {
                    const problemStatus = getProblemStatus(problem);

                    return (
                      <a
                        key={problem.normalizedTitle}
                        href={`/study-log/${problem.normalizedTitle}`}
                        className="block bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-slate-600 transition-colors"
                      >
                        <div className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className={`w-2 h-2 rounded-full ${getStatusColor(problemStatus)}`} />
                              <span className="text-slate-500 text-sm w-6">
                                {problem.index + 1}.
                              </span>
                              <span className="font-medium text-slate-100">
                                {problem.curriculumTitle}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                problem.difficulty === 'easy' ? 'bg-emerald-500/20 text-emerald-400' :
                                problem.difficulty === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                                {problem.difficulty}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-500">
                              {problem.studyData && (
                                <>
                                  <span>{problem.studyData.attempts.length} attempt{problem.studyData.attempts.length !== 1 ? 's' : ''}</span>
                                  <span>•</span>
                                  <span>
                                    {problem.studyData.attempts.reduce((sum: number, a: Attempt) => sum + a.snapshots.length, 0)} snapshots
                                  </span>
                                </>
                              )}
                              {!problem.studyData && (
                                <span className="text-slate-600">Not started</span>
                              )}
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  color = 'text-slate-100',
  highlight = false,
}: {
  label: string;
  value: string | number;
  color?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`bg-slate-800 rounded-xl border p-4 ${
      highlight ? 'border-amber-500/50' : 'border-slate-700'
    }`}>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-sm text-slate-500 mt-1">{label}</div>
    </div>
  );
}

