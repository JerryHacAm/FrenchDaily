import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { AskFrenchSlot } from "@/components/AskFrenchSlot";
import { Nav } from "@/components/Nav";
import { AI_MODE, APP_MODE, STORAGE } from "@/lib/config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "French Daily",
  description: "Learn French by writing real sentences every day.",
  appleWebApp: { title: "French Daily", capable: true, statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1014" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {AI_MODE === "mock" && (
          <div className="bg-warn-soft px-4 py-2 text-center text-xs text-warn">
            Mock AI: feedback is fake (only catches le/la and j&apos;). Add CLAUDE_API_KEY to .env for real checking.
          </div>
        )}
        <header className="border-b border-line bg-surface">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-sm text-accent-fg">
                Fr
              </span>
              French Daily
              {APP_MODE === "test" && <span className="text-xs font-normal text-muted">test mode</span>}
            </Link>
            <Nav />
          </div>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:py-8">{children}</main>
        <footer className="mx-auto w-full max-w-3xl px-4 pb-24 text-xs text-muted">
          <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-4">
            <span>French Daily · Jerry &amp; quantrungvu</span>
            <Link href="/stats" className="hover:text-foreground">
              Pilot stats
            </Link>
            {STORAGE === "supabase" && (
              <Link href="/logout" className="hover:text-foreground">
                Sign out
              </Link>
            )}
          </div>
        </footer>
        <Suspense fallback={null}>
          <AskFrenchSlot />
        </Suspense>
      </body>
    </html>
  );
}
