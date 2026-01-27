import type { Metadata } from "next";
import { auth } from "@/auth";
import { SessionProvider } from "@/components/providers/SessionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cortex Lattice - Learn AI Safety Through Code",
  description: "Master data structures and algorithms through AI safety research paper implementations",
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
