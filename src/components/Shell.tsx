"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useStore, totals } from "@/lib/store";
import { money, pct } from "@/lib/format";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/schedule", label: "Schedule" },
  { href: "/budget", label: "Budget" },
  { href: "/tasks", label: "Tasks" },
  { href: "/contractors", label: "Contractors" },
  { href: "/log", label: "Site log" },
  { href: "/settings", label: "Settings" },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { state, hydrated } = useStore();
  const [open, setOpen] = useState(false);
  const t = totals(state);

  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = item.href === "/" ? path === "/" : path.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-mid px-3 py-2 text-[14px] transition-colors duration-200 ease-linear ${
              active
                ? "bg-bg text-ink font-semibold shadow-btn"
                : "text-body hover:bg-bg hover:text-ink"
            }`}
          >
            <span
              className={`size-1.5 rounded-full ${active ? "bg-accent" : "bg-transparent"}`}
              aria-hidden
            />
            {item.label}
            {item.href === "/tasks" && t.openTasks > 0 ? (
              <span className="ml-auto rounded-tag bg-bg-alt px-1.5 text-[12px] text-tertiary">
                {t.openTasks}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-bg-alt">
      <div className="mx-auto flex w-full max-w-[1320px] flex-col lg:flex-row">
        {/* mobile bar */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 lg:hidden">
          <span className="text-ink text-[15px] font-semibold">
            {hydrated ? state.project.name : "BuildTrack"}
          </span>
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-ctl bg-bg px-3 py-1.5 text-[13px] font-semibold text-secondary shadow-btn"
            aria-expanded={open}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>

        <aside
          className={`${open ? "block" : "hidden"} shrink-0 px-5 pb-5 lg:block lg:w-64 lg:py-8`}
        >
          <div className="flex flex-col gap-6 lg:sticky lg:top-8">
            <div className="hidden flex-col gap-0.5 lg:flex">
              <span className="text-ink text-[16px] font-semibold leading-tight">
                {hydrated ? state.project.name : "BuildTrack"}
              </span>
              <span className="text-[13px] text-tertiary">
                {hydrated && state.project.address ? state.project.address : "Construction tracker"}
              </span>
            </div>
            {nav}
            <div className="flex flex-col gap-2 rounded-mid bg-bg p-4 shadow-btn">
              <span className="text-[12px] font-semibold uppercase tracking-wide text-disabled">
                At a glance
              </span>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[13px] text-tertiary">Build progress</span>
                <span className="text-[13px] font-semibold text-ink">{pct(t.progress)}</span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[13px] text-tertiary">Spent</span>
                <span className="text-[13px] font-semibold text-ink">
                  {money(t.spent, state.project.currency, true)}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[13px] text-tertiary">Left</span>
                <span
                  className={`text-[13px] font-semibold ${t.remaining < 0 ? "text-risk" : "text-ink"}`}
                >
                  {money(t.remaining, state.project.currency, true)}
                </span>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-5 pb-16 lg:py-8 lg:pl-2 lg:pr-8">
          <div className="flex flex-col gap-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
