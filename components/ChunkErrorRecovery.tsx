"use client";

/**
 * ChunkErrorRecovery — survives deploy-induced ChunkLoadErrors.
 *
 * 1. Auto-reload when a lazy/dynamic chunk fails to load (hash-mismatch after
 *    a deploy). Includes a session-storage loop guard so a genuinely missing
 *    chunk doesn't trap users in a reload cycle.
 * 2. Poll /api/version on mount, on focus, and every 5 minutes; show a toast
 *    prompting the user to refresh when the server has shipped a new build.
 */

import { useEffect, useState } from "react";

const CHUNK_ERROR_RX = /Loading chunk .* failed|ChunkLoadError/;
const RELOAD_GUARD_KEY = "chunk-reload-at";
const RELOAD_GUARD_WINDOW_MS = 10_000;
const VERSION_POLL_MS = 5 * 60 * 1000;

function isChunkError(value: unknown): boolean {
  if (!value) return false;
  if (typeof value === "string") return CHUNK_ERROR_RX.test(value);
  const err = value as { name?: unknown; message?: unknown };
  if (err.name === "ChunkLoadError") return true;
  return typeof err.message === "string" && CHUNK_ERROR_RX.test(err.message);
}

function reloadOnce() {
  const last = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) || 0);
  if (Date.now() - last < RELOAD_GUARD_WINDOW_MS) return;
  sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
  window.location.reload();
}

export function ChunkErrorRecovery() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const onRejection = (e: PromiseRejectionEvent) => {
      if (isChunkError(e.reason)) {
        e.preventDefault();
        reloadOnce();
      }
    };
    const onError = (e: ErrorEvent) => {
      if (isChunkError(e.error) || isChunkError(e.message)) {
        reloadOnce();
      }
    };
    window.addEventListener("unhandledrejection", onRejection);
    window.addEventListener("error", onError);
    return () => {
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener("error", onError);
    };
  }, []);

  useEffect(() => {
    const myBuildId = process.env.NEXT_PUBLIC_BUILD_ID;
    if (!myBuildId) return;

    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { buildId?: string };
        if (!cancelled && data.buildId && data.buildId !== myBuildId) {
          setUpdateAvailable(true);
        }
      } catch {
        // Network blips are fine; next interval will retry.
      }
    };

    check();
    const interval = setInterval(check, VERSION_POLL_MS);
    const onFocus = () => check();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  if (!updateAvailable) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 right-4 z-[60] flex items-center gap-3 rounded-lg border border-gray-700 bg-surface-light px-4 py-3 text-sm text-gray-200 shadow-lg"
    >
      <span>A new version is available.</span>
      <button
        onClick={() => window.location.reload()}
        className="rounded-md bg-accent-primary px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-accent-secondary"
      >
        Refresh
      </button>
      <button
        onClick={() => setUpdateAvailable(false)}
        className="text-xs text-gray-400 transition-colors hover:text-gray-200"
        aria-label="Dismiss update notification"
      >
        Dismiss
      </button>
    </div>
  );
}

export default ChunkErrorRecovery;
