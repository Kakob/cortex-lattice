/**
 * NextAuth.js Middleware for route protection
 *
 * Protects API routes and handles authentication redirects.
 * Also handles CORS for extension API routes.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Create NextAuth handler
const { auth } = NextAuth(authConfig);

/**
 * Add CORS headers to a response for extension API routes.
 * Reflects the Origin header to allow any Chrome extension.
 */
function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {};

  // Only allow chrome-extension:// origins or localhost for development
  if (origin && (origin.startsWith("chrome-extension://") || origin.startsWith("http://localhost"))) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
    headers["Access-Control-Allow-Methods"] = "GET, POST, PATCH, DELETE, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization";
  }

  return headers;
}

// Wrap NextAuth middleware to add CORS headers for extension routes
export default auth(function middleware(request) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get("origin");

  // Handle CORS for extension API routes
  if (pathname.startsWith("/api/extension/")) {
    // Handle OPTIONS (preflight) requests
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }

    // For other requests, continue but add CORS headers
    const response = NextResponse.next();
    const headers = corsHeaders(origin);
    for (const [key, value] of Object.entries(headers)) {
      response.headers.set(key, value);
    }
    return response;
  }

  // For non-extension routes, just continue with NextAuth middleware
  return NextResponse.next();
});

export const config = {
  // Match all routes except static files, images, and public assets
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
