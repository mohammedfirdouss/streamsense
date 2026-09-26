import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Next, Zilla_Slab } from "next/font/google";
import Link from "next/link";
import { StreamMark } from "@/components/ui";
import "./globals.css";

const body = Atkinson_Hyperlegible_Next({
  variable: "--font-body",
  subsets: ["latin"],
  // Next has no metrics for this font yet, so name the fallback ourselves.
  adjustFontFallback: false,
  fallback: ["system-ui", "sans-serif"],
});

const slab = Zilla_Slab({
  variable: "--font-slab",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StreamSense: check the health of your local stream",
  description:
    "Check the health of a city stream in about 10 minutes. A photo assistant suggests and explains. You decide.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${body.variable} ${slab.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:m-2 focus:rounded focus:bg-card focus:p-2">
          Skip to content
        </a>
        <header className="border-b border-line bg-card">
          <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3" aria-label="Main">
            <Link href="/" className="flex items-center gap-2 font-display text-2xl font-semibold text-river-deep">
              <StreamMark className="h-5 w-9 text-river" /> StreamSense
            </Link>
            <div className="flex flex-wrap gap-5 text-[0.95rem] text-ink-soft">
              <Link href="/assess" className="underline-offset-4 hover:text-river-deep hover:underline">New survey</Link>
              <Link href="/review" className="underline-offset-4 hover:text-river-deep hover:underline">Review queue</Link>
              <Link href="/how-it-works" className="underline-offset-4 hover:text-river-deep hover:underline">How the AI works</Link>
            </div>
          </nav>
        </header>
        <main id="main" className="flex-1">{children}</main>
        <footer className="border-t border-line py-6 text-center text-sm text-ink-soft">
          People, animals and nature share the same water.
        </footer>
      </body>
    </html>
  );
}
