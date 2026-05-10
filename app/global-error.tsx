"use client";

import { useEffect } from "react";

const CHUNK_ERROR_RX = /Loading chunk .* failed|ChunkLoadError/;
const RELOAD_GUARD_KEY = "chunk-reload-at";
const RELOAD_GUARD_WINDOW_MS = 10_000;

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const isChunkError =
      error.name === "ChunkLoadError" || CHUNK_ERROR_RX.test(error.message);
    if (!isChunkError) return;

    // Loop guard: if we already reloaded within the last few seconds, the
    // chunk is genuinely missing — stop reloading and let the UI render.
    const last = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) || 0);
    if (Date.now() - last < RELOAD_GUARD_WINDOW_MS) return;

    sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
    window.location.reload();
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-surface-dark text-foreground antialiased">
        <div className="flex min-h-screen items-center justify-center p-8">
          <div className="max-w-md text-center">
            <h1 className="text-xl font-semibold text-gray-100">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              {error.message || "An unexpected error occurred."}
            </p>
            <button
              onClick={reset}
              className="mt-6 rounded-lg bg-accent-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-secondary"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
