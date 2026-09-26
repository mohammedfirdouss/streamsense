import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  title: "StreamSense — AI-supported citizen stream assessment",
  description:
    "Assess urban streams with a photo assistant that suggests, explains and never decides. From streams to systems: One Health intelligence from citizen science.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:m-2 focus:rounded focus:bg-white focus:p-2">
          Skip to content
        </a>
        <header className="border-b border-slate-200 bg-white">
          <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3" aria-label="Main">
            <Link href="/" className="flex items-center gap-2 font-semibold text-cyan-900">
              <span aria-hidden className="text-xl">〰️</span> StreamSense
            </Link>
            <div className="flex flex-wrap gap-4 text-sm text-slate-700">
              <Link href="/assess" className="hover:text-cyan-800">New survey</Link>
              <Link href="/review" className="hover:text-cyan-800">Review queue</Link>
              <Link href="/how-it-works" className="hover:text-cyan-800">How the AI works</Link>
            </div>
          </nav>
        </header>
        <main id="main" className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-600">
          From streams to systems: turning citizen science into actionable One Health intelligence.
        </footer>
      </body>
    </html>
  );
}
