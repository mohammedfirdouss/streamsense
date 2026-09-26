import type { ButtonHTMLAttributes, ReactNode } from "react";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export const BUTTON_BASE =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-[0.95rem] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export const BUTTON_VARIANTS = {
  primary: "bg-river text-card hover:bg-river-deep",
  secondary: "border border-river bg-card text-river-deep hover:bg-river-wash",
  ghost: "text-ink-soft hover:bg-river-wash hover:text-ink",
} as const;

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof BUTTON_VARIANTS }) {
  return <button {...props} className={cx(BUTTON_BASE, BUTTON_VARIANTS[variant], className)} />;
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cx("rounded-md border border-line bg-card p-5 sm:p-6", className)}>{children}</section>;
}

const TONES = {
  slate: "border-line text-ink-soft",
  green: "border-emerald-700/40 bg-emerald-50 text-emerald-900",
  amber: "border-amber-600/40 bg-amber-50 text-amber-900",
  orange: "border-orange-700/40 bg-orange-50 text-orange-900",
  red: "border-rose-700/40 bg-rose-50 text-rose-900",
  cyan: "border-river/40 bg-river-wash text-river-deep",
  violet: "border-pencil/40 bg-pencil-wash text-pencil",
} as const;

export type Tone = keyof typeof TONES;

export function Badge({ tone = "slate", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={cx("inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs font-semibold", TONES[tone])}>{children}</span>;
}

/** Everything the AI wrote is marked in pencil blue, like a second hand on the survey card. */
export function AiBadge({ demo }: { demo?: boolean }) {
  return (
    <Badge tone="violet">
      <PencilMark className="h-3 w-3" /> AI suggestion{demo ? " (demo mode)" : ""}
    </Badge>
  );
}

export function StreamMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 20" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M2 7c4-4 8-4 11 0s7 4 10 0 8-4 11 0" />
      <path d="M2 15c4-4 8-4 11 0s7 4 10 0 8-4 11 0" opacity=".45" />
    </svg>
  );
}

export function PencilMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M2.5 13.5l1-3.5 7.5-7.5 2.5 2.5-7.5 7.5z" />
      <path d="M9.5 4l2.5 2.5" />
    </svg>
  );
}

/** Decorative emoji with a real gap — a plain space collapses visually next to emoji glyphs. */
export function Emoji({ children }: { children: ReactNode }) {
  return <span aria-hidden className="mr-1.5 inline-block">{children}</span>;
}
