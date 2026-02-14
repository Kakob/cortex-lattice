/**
 * =============================================================================
 * CORTEX LATTICE - AUTHENTICATION CONFIGURATION
 * =============================================================================
 *
 * This file configures NextAuth.js (Auth.js) for user authentication.
 *
 * AUTHENTICATION METHODS:
 * -----------------------
 * 1. Google OAuth: Sign in with Google account (primary method)
 * 2. Credentials: Email/password (for users who prefer not to use OAuth)
 *
 * SESSION STRATEGY:
 * -----------------
 * Uses JWT (JSON Web Tokens) instead of database sessions.
 * JWTs are stored in cookies and verified server-side.
 * This is more scalable than database sessions (no DB lookup per request).
 *
 * DATABASE INTEGRATION:
 * ---------------------
 * Uses PrismaAdapter to store user accounts in PostgreSQL.
 * Creates/updates User, Account, Session records automatically.
 *
 * HOW IT'S USED:
 * --------------
 * - Web App: Users sign in via /api/auth/signin
 * - Extension: Uses cookie-based auth (credentials: 'include' in fetch)
 *   Extension users MUST be logged into the web app first
 *
 * ENVIRONMENT VARIABLES:
 * ----------------------
 * - GOOGLE_CLIENT_ID: OAuth client ID from Google Cloud Console
 * - GOOGLE_CLIENT_SECRET: OAuth client secret
 * - NEXTAUTH_SECRET: Random string for JWT signing (in auth.config.ts)
 * - NEXTAUTH_URL: Base URL of the app (for OAuth callbacks)
 *
 * EXPORTS:
 * --------
 * - handlers: Next.js API route handlers for /api/auth/*
 * - auth: Server-side function to get current session
 * - signIn: Function to trigger sign-in programmatically
 * - signOut: Function to trigger sign-out programmatically
 */

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Spread auth.config.ts (contains pages, callbacks, etc.)
  ...authConfig,

  // Use Prisma to store users in PostgreSQL
  adapter: PrismaAdapter(prisma),

  // Use JWT instead of database sessions for scalability
  session: {
    strategy: "jwt",
  },

  // Cookie settings for cross-origin extension requests
  // SameSite=None allows cookies to be sent in cross-origin requests
  // Note: In production, this requires HTTPS
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: true,
      },
    },
  },

  providers: [
    // ==========================================================================
    // GOOGLE OAUTH PROVIDER
    // ==========================================================================
    // Primary authentication method. Users click "Sign in with Google"
    // and are redirected to Google's OAuth flow.
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    // ==========================================================================
    // CREDENTIALS PROVIDER
    // ==========================================================================
    // Email/password authentication for users who prefer not to use OAuth.
    // Password is hashed with bcrypt before storage.
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      /**
       * Validates credentials and returns user object if valid.
       * Returns null if invalid (triggers "Invalid credentials" error).
       */
      async authorize(credentials) {
        // Validate input presence
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        // Look up user by email
        const user = await prisma.user.findUnique({
          where: { email },
        });

        // No user found, or user signed up via OAuth (no password)
        if (!user || !user.password) {
          return null;
        }

        // Verify password hash
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
          return null;
        }

        // Return user object (will be encoded in JWT)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
});
