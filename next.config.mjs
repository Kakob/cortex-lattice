// Single per-build identifier shared between the client bundle (baked in via
// NEXT_PUBLIC_BUILD_ID) and the /api/version endpoint, so a stale client can
// detect that the server is on a newer build.
const buildId =
  process.env.GIT_SHA ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  `build-${Date.now()}`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  generateBuildId: async () => buildId,
  env: {
    NEXT_PUBLIC_BUILD_ID: buildId,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
