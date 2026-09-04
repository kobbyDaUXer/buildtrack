"use client";

import { useEffect, type ReactNode, type ButtonHTMLAttributes } from "react";
import type { Status } from "@/lib/types";

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
      className={`rounded-card bg-bg shadow-card ${pad ? "p-6" : ""} ${className}`}
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
    <div className="flex items-start justify-between gap-4 mb-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-ink font-semibold text-[17px] leading-tight">{title}</h2>
        {hint ? <p className="m-0 text-[13px] text-tertiary">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}

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
    "inline-flex items-center justify-center gap-2 rounded-ctl font-semibold transition-colors duration-200 ease-linear disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap";
  const sizing = size === "sm" ? "text-[13px] px-3 h-8" : "text-[14px] px-4 h-10";
  const skin = {
    primary: "bg-accent text-white shadow-btn-accent hover:bg-[#6941C6]",
    neutral:
      "bg-bg text-secondary ring-1 ring-line shadow-btn hover:bg-bg-alt",
    ghost: "text-tertiary hover:bg-bg-alt hover:text-secondary",
    danger: "bg-bg text-risk ring-1 ring-line shadow-btn hover:bg-risk-bg",
  }[variant];
  return <button className={`${base} ${sizing} ${skin} ${className}`} {...rest} />;
}

const STATUS_SKIN: Record<Status, string> = {
  "not-started": "bg-bg-alt text-tertiary",
  "in-progress": "bg-warn-bg text-warn",
  blocked: "bg-risk-bg text-risk",
  done: "bg-ok-bg text-ok",
};

const STATUS_LABEL: Record<Status, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  blocked: "Blocked",
  done: "Done",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-chip px-2 py-0.5 text-[12px] font-semibold ${STATUS_SKIN[status]}`}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-tag bg-bg-alt px-1.5 py-0.5 text-[12px] text-tertiary">
      {children}
    </span>
  );
}

export function Bar({ value, tone = "ink" }: { value: number; tone?: "ink" | "risk" }) {
  const v = Math.max(0, Math.min(100, value || 0));
  return (
    <div className="h-1.5 w-full rounded-full bg-bg-alt overflow-hidden">
      <div
        className={`h-full rounded-full ${tone === "risk" ? "bg-risk" : "bg-ink"}`}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "risk";
}) {
  return (
    <div className="flex flex-col gap-1 rounded-mid bg-bg p-5 shadow-card">
      <span className="text-[13px] text-tertiary">{label}</span>
      <span
        className={`text-[28px] font-semibold leading-tight ${tone === "risk" ? "text-risk" : "text-ink"}`}
      >
        {value}
      </span>
      {sub ? <span className="text-[13px] text-tertiary">{sub}</span> : null}
    </div>
  );
}

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
  "h-10 w-full rounded-ctl bg-bg px-3 text-[14px] text-ink ring-1 ring-line shadow-btn placeholder:text-disabled";

export const areaCls =
  "min-h-24 w-full rounded-ctl bg-bg p-3 text-[14px] text-ink ring-1 ring-line shadow-btn placeholder:text-disabled";

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
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(23,23,23,0.35)] p-4 sm:p-8">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-xl rounded-card bg-bg shadow-lift"
      >
        <div className="flex items-center justify-between gap-4 px-6 pt-6">
          <h2 className="text-ink text-[18px] font-semibold">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            Close
          </Button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer ? (
          <div className="flex justify-end gap-2 border-t border-line px-6 py-4">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

export function Empty({ text, action }: { text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-mid bg-bg-alt px-6 py-10 text-center">
      <p className="m-0 text-[14px] text-tertiary">{text}</p>
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
      <div className="flex flex-col gap-1.5">
        <h1 className="text-ink text-[28px] font-semibold leading-tight tracking-[-0.01em]">
          {title}
        </h1>
        {hint ? <p className="m-0 text-[14px] text-tertiary">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}
