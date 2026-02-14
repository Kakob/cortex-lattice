'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Snapshot {
  id: string;
  timestamp: string;
  trigger: string;
  code: string;
  testResult?: string;
}

interface StuckPoint {
  id: string;
  timestamp: string;
  description: string;
  codeSnapshot?: string;
  intendedAction: string;
}

interface Reflection {
  id: string;
  timestamp: string;
  type: string;
  content: string;
  codeSnapshot?: string;
  coldHint?: string;
  confidence?: string;
}

interface Attempt {
  id: string;
  startedAt: string;
  completedAt?: string;
  status: string;
  passed: boolean;
  snapshotCount: number;
  snapshots: Snapshot[];
  stuckPoints: StuckPoint[];
  reflections: Reflection[];
}

interface SpacedRepetition {
  nextReview: string;
  intervalDays: number;
  easeFactor: number;
  reviewCount: number;
  lastReviewed?: string;
}

interface CurriculumInfo {
  title: string;
  normalizedTitle: string;
  difficulty: 'easy' | 'medium' | 'hard';
  patternKey: string;
  index: number;
}

interface StudyData {
  id: string;
  platform: string;
  url: string;
  title: string;
  createdAt: string;
  attempts: Attempt[];
  spacedRepetition: SpacedRepetition | null;
}

interface TimelineEntry {
  type: 'snapshot' | 'stuck' | 'thought' | 'aha' | 'strategy' | 'reflection';
  timestamp: Date;
  attemptIndex: number;
  data: Snapshot | StuckPoint | Reflection;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ProblemDetailPage() {
  const { normalizedTitle } = useParams<{ normalizedTitle: string }>();
  const { data: session, status: authStatus } = useSession();
  const [curriculum, setCurriculum] = useState<CurriculumInfo | null>(null);
  const [studyData, setStudyData] = useState<StudyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      redirect('/login');
    }
  }, [authStatus]);

  useEffect(() => {
    if (session?.user && normalizedTitle) {
      fetchProblem();
    }
  }, [session, normalizedTitle]);

  async function fetchProblem() {
    try {
      const res = await fetch(
        `/api/extension/study-log/${encodeURIComponent(normalizedTitle)}`
      );
      if (res.status === 404) {
        setError('Problem not found in curriculum.');
        return;
      }
      if (!res.ok) {
        setError('Failed to load problem data.');
        return;
      }
      const data = await res.json();
      setCurriculum(data.curriculum);
      setStudyData(data.studyData);
    } catch {
      setError('Failed to load problem data.');
    } finally {
      setLoading(false);
    }
  }

  function getTimeline(): TimelineEntry[] {
    if (!studyData) return [];
    const entries: TimelineEntry[] = [];

    studyData.attempts.forEach((attempt, attemptIndex) => {
      for (const snapshot of attempt.snapshots) {
        entries.push({
          type: 'snapshot',
          timestamp: new Date(snapshot.timestamp),
          attemptIndex,
          data: snapshot,
        });
      }
      for (const stuck of attempt.stuckPoints) {
        entries.push({
          type: 'stuck',
          timestamp: new Date(stuck.timestamp),
          attemptIndex,
          data: stuck,
        });
      }
      for (const reflection of attempt.reflections) {
        entries.push({
          type:
            reflection.type === 'aha'
              ? 'aha'
              : reflection.type === 'thought'
                ? 'thought'
                : reflection.type === 'strategy'
                  ? 'strategy'
                  : 'reflection',
          timestamp: new Date(reflection.timestamp),
          attemptIndex,
          data: reflection,
        });
      }
    });

    return entries.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  // -------------------------------------------------------------------------
  // Loading / Error / Auth states
  // -------------------------------------------------------------------------

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (error || !curriculum) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4">
        <div className="text-slate-400">{error ?? 'Problem not found.'}</div>
        <Link
          href="/study-log"
          className="text-indigo-400 hover:text-indigo-300 text-sm"
        >
          Back to Study Log
        </Link>
      </div>
    );
  }

  const timeline = getTimeline();
  const totalSnapshots = studyData
    ? studyData.attempts.reduce((s, a) => s + a.snapshots.length, 0)
    : 0;
  const totalReflections = studyData
    ? studyData.attempts.reduce((s, a) => s + a.reflections.length, 0)
    : 0;
  const totalStuckPoints = studyData
    ? studyData.attempts.reduce((s, a) => s + a.stuckPoints.length, 0)
    : 0;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link
            href="/study-log"
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            &larr; Study Log
          </Link>

          <div className="mt-3 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-100">
                {curriculum.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    curriculum.difficulty === 'easy'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : curriculum.difficulty === 'medium'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {curriculum.difficulty}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-400 capitalize">
                  {curriculum.patternKey.replace(/-/g, ' ')}
                </span>
                {studyData?.url && (
                  <a
                    href={studyData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-500 hover:text-indigo-400 transition-colors"
                  >
                    Open on {studyData.platform === 'grokking' ? 'DesignGurus' : 'LeetCode'} &rarr;
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* ---------------------------------------------------------------- */}
        {/* Stats Row                                                        */}
        {/* ---------------------------------------------------------------- */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MiniStat
            label="Attempts"
            value={studyData?.attempts.length ?? 0}
          />
          <MiniStat label="Snapshots" value={totalSnapshots} />
          <MiniStat label="Reflections" value={totalReflections} />
          <MiniStat label="Stuck Points" value={totalStuckPoints} />
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Attempts                                                         */}
        {/* ---------------------------------------------------------------- */}
        {studyData && studyData.attempts.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-slate-100 mb-3">
              Attempts
            </h2>
            <div className="flex flex-wrap gap-2">
              {studyData.attempts.map((attempt, i) => (
                <div
                  key={attempt.id}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    attempt.passed
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : attempt.status === 'in_progress'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  <span className="font-semibold">#{i + 1}</span>
                  {' \u2014 '}
                  {attempt.passed
                    ? 'Passed'
                    : attempt.status === 'in_progress'
                      ? 'In Progress'
                      : 'Failed'}
                  <span className="ml-2 opacity-60">
                    {formatDate(new Date(attempt.startedAt))}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Spaced Repetition                                                */}
        {/* ---------------------------------------------------------------- */}
        {studyData?.spacedRepetition && (
          <section className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <h2 className="text-sm font-semibold text-slate-300 mb-2">
              Spaced Repetition
            </h2>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-400">
              <span>
                Next review:{' '}
                <span className="text-slate-200">
                  {new Date(
                    studyData.spacedRepetition.nextReview
                  ).toLocaleDateString()}
                </span>
              </span>
              <span>
                Interval:{' '}
                <span className="text-slate-200">
                  {Math.round(studyData.spacedRepetition.intervalDays)}d
                </span>
              </span>
              <span>
                Reviews:{' '}
                <span className="text-slate-200">
                  {studyData.spacedRepetition.reviewCount}
                </span>
              </span>
            </div>
          </section>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Timeline                                                         */}
        {/* ---------------------------------------------------------------- */}
        <section>
          <h2 className="text-lg font-semibold text-slate-100 mb-4">
            Timeline
          </h2>

          {timeline.length === 0 ? (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
              <p className="text-slate-400">No activity logged yet.</p>
              <p className="text-slate-600 text-sm mt-2">
                Visit this problem on DesignGurus or LeetCode with the Cortex
                Lattice extension installed to start tracking.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 border-l-2 border-slate-700 space-y-4">
              {timeline.map((entry, i) => (
                <TimelineCard
                  key={i}
                  entry={entry}
                  totalAttempts={studyData!.attempts.length}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
      <div className="text-2xl font-bold text-slate-100">{value}</div>
      <div className="text-sm text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

const ICON: Record<string, string> = {
  snapshot: '\u{1F4F8}',
  stuck: '\u{1F914}',
  thought: '\u{1F4AD}',
  aha: '\u{1F4A1}',
  strategy: '\u{1F3AF}',
  reflection: '\u{1F4DD}',
};

const LABEL: Record<string, string> = {
  snapshot: 'Code Snapshot',
  stuck: 'Stuck Point',
  thought: 'Thought',
  aha: 'Aha Moment',
  strategy: 'Strategy',
  reflection: 'Reflection',
};

const DOT_COLOR: Record<string, string> = {
  snapshot: 'bg-blue-500',
  stuck: 'bg-orange-500',
  thought: 'bg-purple-500',
  aha: 'bg-yellow-500',
  strategy: 'bg-cyan-500',
  reflection: 'bg-green-500',
};

function TimelineCard({
  entry,
  totalAttempts,
}: {
  entry: TimelineEntry;
  totalAttempts: number;
}) {
  return (
    <div className="relative">
      {/* Dot on the timeline rail */}
      <div
        className={`absolute -left-[25px] w-4 h-4 rounded-full ${DOT_COLOR[entry.type]} flex items-center justify-center text-[10px]`}
      >
        {ICON[entry.type]}
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        {/* Header row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-200">
              {LABEL[entry.type]}
            </span>
            {totalAttempts > 1 && (
              <span className="text-xs text-slate-600">
                Attempt #{entry.attemptIndex + 1}
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500">
            {formatDate(entry.timestamp)}
          </span>
        </div>

        {/* Body */}
        {entry.type === 'snapshot' && (
          <SnapshotBody snapshot={entry.data as Snapshot} />
        )}
        {entry.type === 'stuck' && (
          <StuckBody stuck={entry.data as StuckPoint} />
        )}
        {entry.type === 'strategy' && (
          <StrategyBody reflection={entry.data as Reflection} />
        )}
        {(entry.type === 'thought' ||
          entry.type === 'aha' ||
          entry.type === 'reflection') && (
          <ReflectionBody reflection={entry.data as Reflection} />
        )}
      </div>
    </div>
  );
}

function SnapshotBody({ snapshot }: { snapshot: Snapshot }) {
  return (
    <div className="text-sm">
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${
            snapshot.trigger === 'submit'
              ? 'bg-indigo-500/20 text-indigo-400'
              : 'bg-slate-600/50 text-slate-400'
          }`}
        >
          {snapshot.trigger.toUpperCase()}
        </span>
        {snapshot.testResult && (
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${
              snapshot.testResult === 'pass'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {snapshot.testResult.toUpperCase()}
          </span>
        )}
      </div>
      <CodeBlock code={snapshot.code} />
    </div>
  );
}

function StuckBody({ stuck }: { stuck: StuckPoint }) {
  return (
    <div className="text-sm space-y-2">
      <p className="text-slate-300">{stuck.description}</p>
      <p className="text-xs text-slate-500">
        Action: {stuck.intendedAction.replace(/_/g, ' ')}
      </p>
      {stuck.codeSnapshot && (
        <CodeBlock code={stuck.codeSnapshot} label="Code at this point" />
      )}
    </div>
  );
}

function ReflectionBody({ reflection }: { reflection: Reflection }) {
  return (
    <div className="text-sm space-y-2">
      <p className="text-slate-300">{reflection.content}</p>
      {reflection.coldHint && (
        <p className="p-2 bg-amber-500/10 rounded text-amber-400 text-xs">
          Hint for next time: {reflection.coldHint}
        </p>
      )}
      {reflection.confidence && (
        <p className="text-xs text-slate-500">
          Confidence: {reflection.confidence}
        </p>
      )}
      {reflection.codeSnapshot && (
        <CodeBlock code={reflection.codeSnapshot} label="Code at this point" />
      )}
    </div>
  );
}

function StrategyBody({ reflection }: { reflection: Reflection }) {
  const problemMatch = reflection.content.match(/\*\*Problem:\*\*\s*([\s\S]*?)(?=\n\n\*\*Approach:\*\*|$)/);
  const approachMatch = reflection.content.match(/\*\*Approach:\*\*\s*([\s\S]*?)$/);
  const problem = problemMatch?.[1]?.trim();
  const approach = approachMatch?.[1]?.trim();

  return (
    <div className="text-sm space-y-3">
      {problem && (
        <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
          <p className="text-xs font-medium text-cyan-400 mb-1">Problem</p>
          <p className="text-slate-300">{problem}</p>
        </div>
      )}
      {approach && (
        <div className="p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
          <p className="text-xs font-medium text-indigo-400 mb-1">Approach</p>
          <p className="text-slate-300">{approach}</p>
        </div>
      )}
      {!problem && !approach && (
        <p className="text-slate-300">{reflection.content}</p>
      )}
      {reflection.codeSnapshot && (
        <CodeBlock code={reflection.codeSnapshot} label="Code at this point" />
      )}
    </div>
  );
}

function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <details>
      <summary className="cursor-pointer text-slate-500 hover:text-slate-300 text-xs">
        {label ?? 'View code'}
      </summary>
      <pre className="mt-2 p-3 bg-black/50 rounded text-xs overflow-x-auto max-h-64 overflow-y-auto text-slate-300">
        {code}
      </pre>
    </details>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}
