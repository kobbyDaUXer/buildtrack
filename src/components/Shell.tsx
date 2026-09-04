"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useStore, totals } from "@/lib/store";
import { money, pct, todayISO } from "@/lib/format";
import { Bar } from "@/components/ui";

const GROUPS: { label: string; items: { href: string; label: string }[] }[] = [
  {
    label: "Build",
    items: [
      { href: "/", label: "Dashboard" },
      { href: "/schedule", label: "Schedule" },
      { href: "/tasks", label: "Tasks" },
    ],
  },
  {
    label: "Money",
    items: [
      { href: "/budget", label: "Budget" },
      { href: "/contractors", label: "Contractors" },
    ],
  },
  {
    label: "Record",
    items: [
      { href: "/log", label: "Site log" },
      { href: "/plans", label: "Plans" },
    ],
  },
  { label: "", items: [{ href: "/settings", label: "Settings" }] },
];

function Mark() {
  return (
    <span
      className="flex size-8 shrink-0 items-center justify-center rounded-mid bg-brand text-white"
      aria-hidden
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-[18px]">
        <path d="M4 20h16M6 20V9l6-4 6 4v11" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M10 20v-5h4v5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { state, hydrated } = useStore();
  const [open, setOpen] = useState(false);
  const t = totals(state);
  const today = todayISO();
  const overdue = state.tasks.filter((x) => !x.done && x.due && x.due < today).length;

  const nav = (
    <nav className="flex flex-col gap-5">
      {GROUPS.map((group, gi) => (
        <div key={group.label || `g${gi}`} className="flex flex-col gap-0.5">
          {group.label ? (
            <span className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-disabled">
              {group.label}
            </span>
          ) : null}
          {group.items.map((item) => {
            const active = item.href === "/" ? path === "/" : path.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`relative flex items-center gap-2 rounded-ctl px-2 py-1.5 text-[13.5px] transition-colors duration-150 ${
                  active
                    ? "bg-brand-tint font-semibold text-brand-deep"
                    : "text-body hover:bg-sunk hover:text-ink"
                }`}
              >
                {active ? (
                  <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-brand" />
                ) : null}
                <span className="pl-1.5">{item.label}</span>
                {item.href === "/tasks" && t.openTasks > 0 ? (
                  <span
                    className={`ml-auto rounded-tag px-1.5 text-[11px] font-semibold tnum ${
                      overdue > 0 ? "bg-risk-bg text-risk" : "bg-sunk text-tertiary"
                    }`}
                  >
                    {overdue > 0 ? overdue : t.openTasks}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col lg:flex-row">
        <div className="flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3 lg:hidden">
          <span className="flex items-center gap-2">
            <Mark />
            <span className="text-[14px] font-semibold text-ink">
              {hydrated ? state.project.name : "BuildTrack"}
            </span>
          </span>
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-ctl border border-line bg-surface px-2.5 py-1.5 text-[13px] font-semibold text-secondary shadow-btn"
            aria-expanded={open}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>

        <aside
          className={`${open ? "block" : "hidden"} shrink-0 border-line px-4 pb-6 lg:block lg:w-60 lg:border-r lg:py-5`}
        >
          <div className="flex flex-col gap-6 lg:sticky lg:top-5">
            <div className="hidden items-center gap-2.5 lg:flex">
              <Mark />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[14px] font-semibold leading-tight text-ink">
                  {hydrated ? state.project.name : "BuildTrack"}
                </span>
                <span className="truncate text-[12px] text-tertiary">
                  {hydrated && state.project.address ? state.project.address : "Construction tracker"}
                </span>
              </span>
            </div>

            {nav}

            <div className="flex flex-col gap-3 rounded-card border border-line bg-surface p-3.5 shadow-card">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[12px] text-tertiary">Build progress</span>
                <span className="tnum text-[13px] font-semibold text-ink">{pct(t.progress)}</span>
              </div>
              <Bar value={t.progress} tone="brand" />
              <div className="flex items-baseline justify-between gap-2 border-t border-line-soft pt-2.5">
                <span className="text-[12px] text-tertiary">Spent</span>
                <span className="tnum text-[13px] font-semibold text-ink">
                  {money(t.spent, state.project.currency, true)}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[12px] text-tertiary">Left</span>
                <span
                  className={`tnum text-[13px] font-semibold ${t.remaining < 0 ? "text-risk" : "text-ink"}`}
                >
                  {money(t.remaining, state.project.currency, true)}
                </span>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 pb-16 lg:px-6 lg:py-5">
          <div className="flex flex-col gap-5">{children}</div>
        </main>
      </div>
    </div>
  );
}
