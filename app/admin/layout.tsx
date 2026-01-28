/**
 * Admin Layout with Auth Protection
 *
 * Server component that checks session and restricts access to admin users.
 * Uses email allowlist for MVP admin access control.
 */

import { redirect } from "next/navigation";
import { auth } from "@/auth";

// Admin email allowlist - add authorized admin emails here
const ADMIN_EMAILS = [
  // Add your admin emails here
  process.env.ADMIN_EMAIL, // Set via environment variable
].filter(Boolean);

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Redirect if not logged in
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin/problems/new");
  }

  // Check if user is an admin
  const userEmail = session.user.email;
  const isAdmin = userEmail && ADMIN_EMAILS.includes(userEmail);

  // For development, allow any authenticated user if no admin emails configured
  const isDevelopment = process.env.NODE_ENV === "development";
  const allowAccess = isAdmin || (isDevelopment && ADMIN_EMAILS.length === 0);

  if (!allowAccess) {
    redirect("/?error=unauthorized");
  }

  return (
    <div className="min-h-screen bg-surface-dark">
      {/* Admin Header */}
      <header className="border-b border-gray-800 bg-surface px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="text-gray-400 hover:text-white">
              &larr; Back to App
            </a>
            <span className="text-gray-600">|</span>
            <h1 className="text-lg font-semibold text-white">Admin</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{session.user.email}</span>
            <span className="rounded bg-purple-600/20 px-2 py-1 text-xs text-purple-400">
              Admin
            </span>
          </div>
        </div>
      </header>

      {/* Admin Navigation */}
      <nav className="border-b border-gray-800 bg-surface-dark px-6 py-2">
        <div className="mx-auto max-w-7xl">
          <ul className="flex gap-6">
            <li>
              <a
                href="/admin/problems/new"
                className="text-sm text-gray-400 hover:text-white"
              >
                New Problem
              </a>
            </li>
          </ul>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
