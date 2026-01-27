/**
 * NextAuth.js Edge-compatible configuration
 *
 * This config is used by the middleware and doesn't include the Prisma adapter
 * since Prisma doesn't work in the Edge runtime.
 */

import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnProtectedApi = nextUrl.pathname.startsWith("/api/contributions") ||
        nextUrl.pathname.startsWith("/api/contribution-links") ||
        nextUrl.pathname.startsWith("/api/execute");
      const isOnAuthPage = nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/register");

      if (isOnProtectedApi) {
        if (isLoggedIn) return true;
        // Return 401 for API routes instead of redirecting
        return Response.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }

      if (isOnAuthPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // Authorization is handled in the main auth.ts file
      authorize: async () => null,
    }),
  ],
};
