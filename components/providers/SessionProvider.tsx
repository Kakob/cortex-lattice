"use client";

/**
 * SessionProvider - Client-side session provider wrapper
 *
 * Wraps the application with NextAuth's SessionProvider for client-side
 * session access via useSession hook.
 */

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

interface SessionProviderProps {
  children: React.ReactNode;
  session?: Session | null;
}

export function SessionProvider({ children, session }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider session={session}>
      {children}
    </NextAuthSessionProvider>
  );
}
