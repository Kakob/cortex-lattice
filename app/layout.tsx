import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cortex Lattice - Learn AI Safety Through Code",
  description: "Master data structures and algorithms through AI safety research paper implementations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-surface-dark text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
