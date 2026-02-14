import React, { useEffect, useState } from 'react';

const WEB_APP_URL = 'http://localhost:3001'; // Change to production URL when deployed

interface Stats {
  totalProblems: number;
  reviewsDueToday: number;
  coldSolveRate: number;
  currentStreak: number;
}

export default function Popup() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_STATS' });
      if (response) {
        setStats(response as Stats);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  }

  function openDashboard() {
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/components/dashboard/index.html'),
    });
  }

  function openWebDashboard() {
    chrome.tabs.create({
      url: `${WEB_APP_URL}/study-log`,
    });
  }

  if (loading) {
    return (
      <div className="popup-container p-4 flex items-center justify-center">
        <div className="text-cortex-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="popup-container p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-cortex-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">CL</span>
          </div>
          <h1 className="text-lg font-semibold text-cortex-text">Cortex Lattice</h1>
        </div>
        <button
          onClick={openDashboard}
          className="text-cortex-muted hover:text-cortex-text transition-colors"
          title="Open Local Dashboard"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
          </svg>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="stat-card">
          <div className="stat-value text-cortex-primary">
            {stats?.reviewsDueToday ?? 0}
          </div>
          <div className="stat-label">Due Today</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-cortex-accent">
            {stats?.totalProblems ?? 0}
          </div>
          <div className="stat-label">Problems</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-yellow-400">
            {stats?.currentStreak ?? 0}
          </div>
          <div className="stat-label">Day Streak</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {stats ? Math.round(stats.coldSolveRate * 100) : 0}%
          </div>
          <div className="stat-label">Cold Solve</div>
        </div>
      </div>

      {/* Cold Solve Rate Progress Bar */}
      <div className="card mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-cortex-muted">Cold Solve Rate</span>
          <span className="text-lg font-semibold text-cortex-accent">
            {stats ? Math.round(stats.coldSolveRate * 100) : 0}%
          </span>
        </div>
        <div className="mt-2 h-2 bg-cortex-bg rounded-full overflow-hidden">
          <div
            className="h-full bg-cortex-accent rounded-full transition-all duration-500"
            style={{ width: `${(stats?.coldSolveRate ?? 0) * 100}%` }}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={openWebDashboard}
          className="btn btn-primary flex-1 text-sm"
        >
          Open Study Log
        </button>
        <button
          onClick={() => chrome.tabs.create({ url: 'https://leetcode.com/problemset/' })}
          className="btn btn-secondary flex-1 text-sm"
        >
          LeetCode
        </button>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-cortex-muted">
        Press <kbd className="px-1.5 py-0.5 bg-cortex-surface rounded text-cortex-text">
          Cmd+Shift+S
        </kbd> to log while solving
      </div>
    </div>
  );
}
