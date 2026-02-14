import React, { useEffect, useState } from 'react';
import ReviewQueue from './ReviewQueue';
import ActivityHistory from './ActivityHistory';
import ProblemList from './ProblemList';
import type { StatsResponse } from '../../types/messages';

const WEB_APP_URL = 'http://localhost:3001';

export default function Dashboard() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'problems' | 'reviews' | 'activity'>('problems');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_STATS' });
      if (response) {
        setStats(response as StatsResponse);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  }

  function openWebDashboard() {
    window.open(`${WEB_APP_URL}/study-log`, '_blank');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cortex-bg flex items-center justify-center">
        <div className="text-cortex-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cortex-bg">
      {/* Header */}
      <header className="bg-cortex-surface border-b border-cortex-border">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cortex-primary rounded-xl flex items-center justify-center">
                <span className="text-white font-bold">CL</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-cortex-text">Cortex Lattice</h1>
                <p className="text-sm text-cortex-muted">Problem Solving Tracker</p>
              </div>
            </div>
            <button
              onClick={openWebDashboard}
              className="btn btn-primary text-sm flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
              </svg>
              Open Web Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Problems Solved"
            value={stats?.totalProblems ?? 0}
            color="text-cortex-text"
          />
          <StatCard
            label="Reviews Due"
            value={stats?.reviewsDueToday ?? 0}
            color="text-cortex-primary"
            highlight={stats?.reviewsDueToday ? stats.reviewsDueToday > 0 : false}
          />
          <StatCard
            label="Cold Solve Rate"
            value={`${Math.round((stats?.coldSolveRate ?? 0) * 100)}%`}
            color="text-emerald-400"
          />
          <StatCard
            label="Day Streak"
            value={stats?.currentStreak ?? 0}
            color="text-yellow-400"
            icon="🔥"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-cortex-border mb-6">
          <button
            onClick={() => setActiveTab('problems')}
            className={`pb-3 px-1 text-sm font-medium transition-colors ${
              activeTab === 'problems'
                ? 'text-cortex-primary border-b-2 border-cortex-primary'
                : 'text-cortex-muted hover:text-cortex-text'
            }`}
          >
            All Problems
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 px-1 text-sm font-medium transition-colors ${
              activeTab === 'reviews'
                ? 'text-cortex-primary border-b-2 border-cortex-primary'
                : 'text-cortex-muted hover:text-cortex-text'
            }`}
          >
            Review Queue
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`pb-3 px-1 text-sm font-medium transition-colors ${
              activeTab === 'activity'
                ? 'text-cortex-primary border-b-2 border-cortex-primary'
                : 'text-cortex-muted hover:text-cortex-text'
            }`}
          >
            Activity History
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'problems' && <ProblemList />}
        {activeTab === 'reviews' && <ReviewQueue />}
        {activeTab === 'activity' && <ActivityHistory />}
      </main>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  color: string;
  highlight?: boolean;
  icon?: string;
}

function StatCard({ label, value, color, highlight, icon }: StatCardProps) {
  return (
    <div className={`card ${highlight ? 'ring-2 ring-cortex-primary' : ''}`}>
      <div className={`text-3xl font-bold ${color} flex items-center gap-2`}>
        {icon && <span>{icon}</span>}
        {value}
      </div>
      <div className="text-sm text-cortex-muted mt-1">{label}</div>
    </div>
  );
}
