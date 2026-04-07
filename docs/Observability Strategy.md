# Observability Strategy

## 1. Next.js Server Logs

Structured log lines are emitted from the `/api/execute` route during each code submission. These appear in the terminal running `npm run dev` (or in your production log aggregator).

### Log events

- `[execute] Starting execution:` — Emitted when a request is received. Includes executor type (`modal` or `docker`), problem ID, theme ID, user ID, and code length.
- `[execute] Modal request starting:` — Emitted just before calling the Modal endpoint. Includes the endpoint URL, code length, and YAML length.
- `[execute] Modal request completed:` — Emitted when Modal responds. Includes round-trip time in ms, pass/fail/total counts, and any error message.
- `[execute] Execution complete:` — Emitted after the full request cycle. Includes executor type, problem ID, and total wall-clock time in ms.

### Where to find them

- **Local dev:** Terminal running `npm run dev`
- **Production:** Wherever your hosting provider surfaces server-side logs (e.g. Vercel Functions logs, Fly.io logs)

## 2. API Response Metadata

Every execution response now includes a `_meta` field alongside the test results:

```json
{
  "passed": 3,
  "failed": 0,
  "total": 3,
  "_meta": {
    "executor": "modal",
    "totalMs": 1823
  }
}
```

- `executor` — Which backend ran the code (`"modal"` or `"docker"`)
- `totalMs` — Total server-side time from request to response, in milliseconds

### How to check it

Open browser DevTools > Network tab, find the `execute` POST request, and inspect the response JSON. The `_meta` field confirms which executor was used and how long it took.

## 3. Modal Dashboard

Modal provides built-in observability for every function invocation at:

```
https://modal.com/apps/jacobhiggins-thatguy/main/deployed/cortex-lattice-executor
```

### What you can see there

- **Invocation history** — Every function call with timestamps
- **Logs** — Per-invocation logs from the executor, including:
  - `Received execution request: code=N bytes, yaml=N bytes`
  - `Test runner finished in Nms (exit code N)`
  - `Results: N/N passed, elapsed=Nms`
  - Any stderr output or error traces
- **Performance** — Execution duration and memory usage per invocation
- **Cold starts** — Whether an invocation hit a cold start or reused a warm container
- **Errors** — Full stack traces for any failed invocations

## 4. GET Health Check

The `GET /api/execute` endpoint returns the current executor configuration:

```json
{
  "status": "ok",
  "message": "Code execution endpoint. Use POST to execute code.",
  "executor": "modal"
}
```

Use this to quickly verify which executor backend is active without submitting code.

## 5. Neon Database (Prisma)

All database queries across every API route are instrumented via Prisma's event system in `lib/db.ts`. No per-route changes needed — any route that imports `prisma` gets observability automatically.

### Query logging

Every Prisma query is logged with its duration:

```
[db] query { duration: '3ms', query: 'SELECT "User"."id" FROM "User" WHERE ...' }
```

- In **development**, all queries are logged to the terminal.
- In **production**, only slow queries and errors are logged.

### Slow query warnings

Queries exceeding the slow query threshold (default: 200ms) get a prominent warning:

```
[db] SLOW QUERY { duration: '450ms', query: 'SELECT ...', params: '["abc123"]' }
```

Configure the threshold via environment variable:

```
SLOW_QUERY_THRESHOLD=200
```

This is especially useful for catching Neon cold-start latency. Neon suspends idle databases and the first query after wake-up can take 500ms+. Slow query warnings make these visible.

### Error logging

Database errors (connection failures, constraint violations, etc.) are logged with context:

```
[db] ERROR { message: 'Connection timed out', target: 'prisma:engine' }
```

### Warning logging

Prisma warnings (deprecated features, potential issues) are captured:

```
[db] WARN { message: '...' }
```

### Neon Dashboard

Neon provides its own observability at your project's dashboard:

- **Query statistics** — Most frequent queries, average latency, rows returned
- **Connection pooling** — Active connections, pool utilization
- **Compute usage** — Active time, suspend/wake events, compute hours consumed
- **Storage** — Database size and growth over time

### What to watch for with Neon

| Signal | What it means |
|--------|---------------|
| `[db] SLOW QUERY` on first request after idle | Neon cold start — database was suspended and needed to wake up |
| `[db] ERROR` with "connection" in message | Possible connection pool exhaustion or Neon compute suspended too aggressively |
| Repeated slow queries on the same table | Missing index — check the query plan in Neon's SQL editor |
| `[db] WARN` messages | Prisma schema or usage issues worth investigating |
