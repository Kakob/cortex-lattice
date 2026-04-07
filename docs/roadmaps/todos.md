
  Must-Do (Can't deploy without these)

  1. Cloud database — Your .env points to localhost:5433. You need
  a hosted Postgres (Neon, Railway, Supabase) and to run prisma db
  push against it.
  2. Remote code executor — /api/execute shells out to local
  Docker. You need a cloud executor service (Modal, Fly.io, or
  Lambda) and to update the route to call it remotely.
  3. Production secrets — NEXTAUTH_SECRET is literally
  "dev-secret-change-in-production". You also need real
  GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET for OAuth.
  4. Deployment target — No vercel.json, fly.toml, or Dockerfile
  for the web app itself. Pick a host and configure it.

  Should-Do (Shippable without, but rough)

  5. Completion tracking — solved: false is hardcoded everywhere.
  When tests pass, nothing gets saved. Users can't see their
  progress.
  6. Landing page — / goes straight to the problem browser. No
  marketing page, no meta tags, no Open Graph.
  7. Error boundaries & loading states — No skeleton screens or
  graceful error handling for production failures.
  8. CI/CD — No .github/workflows/ directory. Deploys would be
  manual.

  Can Wait

  9. Content expansion — You have 5 two-pointer algorithms with ~15
   themed variants. Sliding Window, Binary Search, etc. have 0
  problems built yet. Fine for a soft launch.
  10. Stripe/payments — SDK not installed, no subscription models
  in the schema. Launch free first.
  11. Analytics/monitoring — No Sentry, PostHog, or uptime checks
  configured.
