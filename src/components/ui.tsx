import type { ButtonHTMLAttributes, ReactNode } from "react";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-cyan-800 text-white hover:bg-cyan-900",
        variant === "secondary" && "border border-cyan-800 bg-white text-cyan-900 hover:bg-cyan-50",
        variant === "ghost" && "text-slate-700 hover:bg-slate-100",
        className,
      )}
    />
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cx("rounded-xl border border-slate-200 bg-white p-5 shadow-sm", className)}>{children}</section>;
}

const TONES = {
  slate: "bg-slate-100 text-slate-800",
  green: "bg-emerald-100 text-emerald-900",
  amber: "bg-amber-100 text-amber-900",
  orange: "bg-orange-100 text-orange-900",
  red: "bg-rose-100 text-rose-900",
  cyan: "bg-cyan-100 text-cyan-900",
  violet: "bg-violet-100 text-violet-900",
} as const;

export type Tone = keyof typeof TONES;

export function Badge({ tone = "slate", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={cx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", TONES[tone])}>{children}</span>;
}

export function AiBadge({ demo }: { demo?: boolean }) {
  return <Badge tone="violet">✦ AI suggestion{demo ? " (demo mode)" : ""}</Badge>;
}

/** Decorative emoji with a real gap — a plain space collapses visually next to emoji glyphs. */
export function Emoji({ children }: { children: ReactNode }) {
  return <span aria-hidden className="mr-1.5 inline-block">{children}</span>;
}
