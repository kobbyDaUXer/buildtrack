"use client";

import { useEffect, type ReactNode, type ButtonHTMLAttributes } from "react";
import type { Status } from "@/lib/types";

/* ---------------------------------------------------------------- icons */

const PATHS: Record<string, string> = {
  wallet: "M3 7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm14 5h2M3 7v0",
  spend: "M12 3v18M17 7H9.5a2.5 2.5 0 0 0 0 5h5a2.5 2.5 0 0 1 0 5H6",
  clock: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  alert: "M12 9v4m0 4h.01M10.3 3.9 2.4 17.1A2 2 0 0 0 4.1 20h15.8a2 2 0 0 0 1.7-2.9L13.7 3.9a2 2 0 0 0-3.4 0Z",
  layers: "m12 3 9 5-9 5-9-5 9-5Zm9 11-9 5-9-5",
  check: "m5 13 4 4L19 7",
  home: "M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-9.5Z",
};

export function Icon({
  name,
  className = "size-4",
}: {
  name: keyof typeof PATHS | string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d={PATHS[name] ?? PATHS.layers} />
    </svg>
  );
}

/* ------------------------------------------------------------- surfaces */

export function Card({
  children,
  className = "",
  pad = true,
}: {
  children: ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return (
    <section
      className={`rounded-card border border-line bg-surface shadow-card ${pad ? "p-5" : ""} ${className}`}
    >
      {children}
    </section>
  );
}

export function CardHead({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-[15px] font-semibold leading-tight text-ink">{title}</h2>
        {hint ? <p className="text-[13px] text-tertiary">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function PageHead({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.015em] text-ink">
          {title}
        </h1>
        {hint ? <p className="max-w-2xl text-[13px] text-tertiary">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}

/* -------------------------------------------------------------- buttons */

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "neutral" | "ghost" | "danger";
  size?: "sm" | "md";
};

export function Button({
  variant = "neutral",
  size = "md",
  className = "",
  ...rest
}: BtnProps) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-ctl font-semibold whitespace-nowrap transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed";
  const sizing = size === "sm" ? "h-8 px-2.5 text-[13px]" : "h-9 px-3.5 text-[13px]";
  const skin = {
    primary: "bg-brand text-white shadow-btn hover:bg-brand-deep",
    neutral: "border border-line bg-surface text-secondary shadow-btn hover:bg-sunk",
    ghost: "text-tertiary hover:bg-sunk hover:text-secondary",
    danger: "border border-line bg-surface text-risk shadow-btn hover:bg-risk-bg",
  }[variant];
  return <button className={`${base} ${sizing} ${skin} ${className}`} {...rest} />;
}

/* --------------------------------------------------------------- status */

export const STATUS_TONE: Record<Status, { text: string; bg: string; dot: string; rail: string }> = {
  done: { text: "text-done", bg: "bg-done-bg", dot: "bg-done", rail: "bg-done" },
  "in-progress": { text: "text-live", bg: "bg-live-bg", dot: "bg-live", rail: "bg-live" },
  blocked: { text: "text-risk", bg: "bg-risk-bg", dot: "bg-risk", rail: "bg-risk" },
  "not-started": { text: "text-idle", bg: "bg-idle-bg", dot: "bg-disabled", rail: "bg-line" },
};

const STATUS_LABEL: Record<Status, string> = {
  "not-started": "Planned",
  "in-progress": "In progress",
  blocked: "Blocked",
  done: "Done",
};

export function StatusBadge({ status }: { status: Status }) {
  const t = STATUS_TONE[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-chip px-2 py-0.5 text-[12px] font-semibold ${t.bg} ${t.text}`}
    >
      <span className={`size-1.5 rounded-full ${t.dot}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Chip({
  children,
  tone = "idle",
}: {
  children: ReactNode;
  tone?: "idle" | "done" | "live" | "risk" | "warn" | "brand";
}) {
  const skin = {
    idle: "bg-sunk text-tertiary",
    done: "bg-done-bg text-done",
    live: "bg-live-bg text-live",
    risk: "bg-risk-bg text-risk",
    warn: "bg-warn-bg text-warn",
    brand: "bg-brand-tint text-brand-deep",
  }[tone];
  return (
    <span className={`inline-flex rounded-tag px-1.5 py-0.5 text-[12px] font-medium ${skin}`}>
      {children}
    </span>
  );
}

export const Tag = ({ children }: { children: ReactNode }) => <Chip>{children}</Chip>;

/* ----------------------------------------------------------------- bars */

export function Bar({
  value,
  tone = "ink",
}: {
  value: number;
  tone?: "ink" | "risk" | "done" | "live" | "brand";
}) {
  const v = Math.max(0, Math.min(100, value || 0));
  const fill = {
    ink: "bg-ink",
    risk: "bg-risk",
    done: "bg-done",
    live: "bg-live",
    brand: "bg-brand",
  }[tone];
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-sunk">
      <div className={`h-full rounded-full ${fill}`} style={{ width: `${v}%` }} />
    </div>
  );
}

/* ------------------------------------------------------------ stat tile */

export function Stat({
  label,
  value,
  sub,
  tone = "default",
  icon,
  bar,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "risk" | "done" | "live" | "brand";
  icon?: string;
  bar?: number;
}) {
  const badge = {
    default: "bg-sunk text-tertiary",
    risk: "bg-risk-bg text-risk",
    done: "bg-done-bg text-done",
    live: "bg-live-bg text-live",
    brand: "bg-brand-tint text-brand-deep",
  }[tone];
  const barTone = tone === "default" ? "ink" : (tone as "risk" | "done" | "live" | "brand");

  return (
    <div className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 shadow-card">
      <div className="flex items-center gap-2">
        {icon ? (
          <span className={`flex size-7 shrink-0 items-center justify-center rounded-chip ${badge}`}>
            <Icon name={icon} className="size-4" />
          </span>
        ) : null}
        <span className="text-[13px] font-medium text-tertiary">{label}</span>
      </div>
      <div className="flex flex-col gap-1">
        <span
          className={`tnum text-[22px] font-semibold leading-none ${tone === "risk" ? "text-risk" : "text-ink"}`}
        >
          {value}
        </span>
        {sub ? <span className="text-[12px] text-tertiary">{sub}</span> : null}
      </div>
      {typeof bar === "number" ? <Bar value={bar} tone={barTone} /> : null}
    </div>
  );
}

/* ---------------------------------------------------------------- forms */

export function Field({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${wide ? "sm:col-span-2" : ""}`}>
      <span className="text-[13px] font-semibold text-secondary">{label}</span>
      {children}
    </label>
  );
}

export const inputCls =
  "h-9 w-full rounded-ctl border border-line bg-surface px-2.5 text-[14px] text-ink shadow-btn placeholder:text-disabled focus:border-brand";

export const areaCls =
  "min-h-24 w-full rounded-ctl border border-line bg-surface p-2.5 text-[14px] text-ink shadow-btn placeholder:text-disabled focus:border-brand";

/* --------------------------------------------------------------- tables */

export function Th({
  children,
  align = "left",
  className = "",
}: {
  children?: ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <th
      className={`whitespace-nowrap border-b border-line px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-disabled ${
        align === "right" ? "text-right" : "text-left"
      } ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = "left",
  className = "",
}: {
  children?: ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <td
      className={`border-b border-line-soft px-3 py-2.5 text-[13px] ${
        align === "right" ? "text-right tnum" : "text-left"
      } ${className}`}
    >
      {children}
    </td>
  );
}

/* ---------------------------------------------------------------- modal */

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(28,25,23,0.45)] p-4 sm:p-8">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-xl rounded-card border border-line bg-surface shadow-lift"
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            Close
          </Button>
        </div>
        <div className="px-5 py-5">{children}</div>
        {footer ? (
          <div className="flex justify-end gap-2 border-t border-line bg-bg px-5 py-3">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

export function Empty({ text, action }: { text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-mid border border-dashed border-line bg-bg px-6 py-8 text-center">
      <p className="text-[13px] text-tertiary">{text}</p>
      {action}
    </div>
  );
}
