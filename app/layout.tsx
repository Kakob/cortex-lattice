import type { Metadata } from "next";
import { auth } from "@/auth";
import { SessionProvider } from "@/components/providers/SessionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cortex Lattice - Learn Algorithms Through Guided Problem Solving",
  description: "Master data structures and algorithms through guided, themed problem solving",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-surface-dark text-foreground antialiased">
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  );
}
