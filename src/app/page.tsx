"use client";

import Link from "next/link";
import { useStore, totals } from "@/lib/store";
import { Card, CardHead, Bar, PageHead, Empty, Button } from "@/components/ui";
import { money, shortDate, daysBetween, todayISO, pct } from "@/lib/format";

function Figure({
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
    <div className="flex min-w-[140px] flex-col gap-0.5">
      <span className="text-[13px] text-tertiary">{label}</span>
      <span
        className={`text-[26px] font-semibold leading-tight tracking-[-0.01em] ${
          tone === "risk" ? "text-risk" : "text-ink"
        }`}
      >
        {value}
      </span>
      {sub ? <span className="text-[13px] text-tertiary">{sub}</span> : null}
    </div>
  );
}

function Operator({ children }: { children: string }) {
  return (
    <span aria-hidden className="hidden pt-5 text-[20px] font-semibold text-disabled md:inline">
      {children}
    </span>
  );
}

const RULE: Record<string, string> = {
  done: "bg-ink",
  "in-progress": "bg-warn",
  blocked: "bg-risk",
  "not-started": "bg-line-subtle",
};

export default function Dashboard() {
  const { state, hydrated } = useStore();
  const { project, phases, tasks, log, budget } = state;
  const t = totals(state);

  if (!hydrated) {
    return <div className="h-40 rounded-card bg-bg shadow-card" />;
  }

  const today = todayISO();
  const daysLeft = project.targetDate ? daysBetween(today, project.targetDate) : null;
  const elapsed =
    project.startDate && project.targetDate
      ? Math.max(
          0,
          Math.min(
            100,
            (daysBetween(project.startDate, today) /
              Math.max(1, daysBetween(project.startDate, project.targetDate))) *
              100,
          ),
        )
      : 0;

  const overdue = tasks.filter((x) => !x.done && x.due && x.due < today);
  const upcoming = tasks
    .filter((x) => !x.done)
    .sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"))
    .slice(0, 5);

  const overruns = budget
    .filter((b) => b.actual > b.budgeted && b.budgeted > 0)
    .sort((a, b) => b.actual - b.budgeted - (a.actual - a.budgeted))
    .slice(0, 3);

  const live = phases.filter((p) => p.status === "in-progress");
  const recentLog = [...log].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);

  return (
    <>
      <PageHead
        title={project.name}
        hint={
          [project.address, project.targetDate ? `Target ${shortDate(project.targetDate)}` : ""]
            .filter(Boolean)
            .join(" · ") || "Set the details in Settings"
        }
        action={
          <Link href="/settings">
            <Button variant="neutral" size="sm">
              Project settings
            </Button>
          </Link>
        }
      />

      <Card>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-8">
          <div className="flex flex-1 flex-wrap items-start gap-x-5 gap-y-4">
            <Figure
              label="Budget ceiling"
              value={money(t.ceiling, project.currency)}
              sub={`${money(t.budgeted, project.currency, true)} allocated`}
            />
            <Operator>−</Operator>
            <Figure
              label="Spent to date"
              value={money(t.spent, project.currency)}
              sub={`${pct(t.usedPct)} of ceiling`}
            />
            <Operator>=</Operator>
            <Figure
              label="Remaining"
              value={money(t.remaining, project.currency)}
              tone={t.remaining < 0 ? "risk" : "default"}
              sub={t.remaining < 0 ? "Over budget" : "Left to spend"}
            />
          </div>
          <div className="border-t border-line pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <Figure
              label="Unpaid invoices"
              value={money(t.unpaid, project.currency)}
              sub={`${budget.filter((b) => !b.paid && b.actual > 0).length} outstanding`}
            />
          </div>
        </div>
      </Card>

      <Card>
        <CardHead
          title="Phases"
          hint="Progress and spend attributed to each stage"
          action={
            <Link href="/schedule">
              <Button variant="ghost" size="sm">
                Schedule
              </Button>
            </Link>
          }
        />
        {phases.length === 0 ? (
          <Empty text="No phases yet — add them from the Schedule tab." />
        ) : (
          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
            {phases.map((p) => {
              const spend = budget
                .filter((b) => b.phaseId === p.id)
                .reduce((n, b) => n + (b.actual || 0), 0);
              return (
                <div
                  key={p.id}
                  className="flex min-w-[152px] flex-1 flex-col gap-2 rounded-mid bg-bg-alt p-4"
                >
                  <span
                    className={`h-1 w-full rounded-full ${RULE[p.status] ?? "bg-line-subtle"}`}
                    aria-hidden
                  />
                  <span className="line-clamp-2 text-[13px] font-semibold text-ink">
                    {p.name}
                  </span>
                  <span className="text-[12px] text-tertiary">{pct(p.progress)} complete</span>
                  <span className="mt-auto pt-1 text-[15px] font-semibold text-ink">
                    {money(spend, project.currency, true)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHead
            title="Progress"
            hint="Average completion across all phases, against time elapsed"
            action={
              <Link href="/schedule">
                <Button variant="ghost" size="sm">
                  Schedule
                </Button>
              </Link>
            }
          />
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] text-tertiary">Work complete</span>
                <span className="text-ink text-[15px] font-semibold">{pct(t.progress)}</span>
              </div>
              <Bar value={t.progress} />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] text-tertiary">Time elapsed</span>
                <span className="text-ink text-[15px] font-semibold">
                  {pct(elapsed)}
                  {daysLeft !== null ? (
                    <span className="ml-2 font-normal text-tertiary">
                      {daysLeft >= 0 ? `${daysLeft} days left` : `${-daysLeft} days over`}
                    </span>
                  ) : null}
                </span>
              </div>
              <Bar value={elapsed} tone={elapsed > t.progress + 10 ? "risk" : "ink"} />
            </div>
            {elapsed > t.progress + 10 ? (
              <p className="m-0 rounded-mid bg-warn-bg px-4 py-3 text-[13px] text-warn">
                Time is running ahead of work done by {pct(elapsed - t.progress)} — worth checking
                the phases in progress.
              </p>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-line pt-5">
              <span className="text-[12px] font-semibold uppercase tracking-wide text-disabled">
                Live phases
              </span>
              {live.length === 0 ? (
                <p className="m-0 text-[14px] text-tertiary">No phase is marked in progress.</p>
              ) : (
                live.map((p) => (
                  <div key={p.id} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-ink text-[14px] font-semibold">{p.name}</span>
                      <span className="text-[13px] text-tertiary">
                        {pct(p.progress)} · due {shortDate(p.end)}
                      </span>
                    </div>
                    <Bar value={p.progress} />
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHead
              title="Next up"
              hint={overdue.length ? `${overdue.length} overdue` : "By due date"}
              action={
                <Link href="/tasks">
                  <Button variant="ghost" size="sm">
                    All tasks
                  </Button>
                </Link>
              }
            />
            {upcoming.length === 0 ? (
              <Empty text="Nothing open. Everything on the list is done." />
            ) : (
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {upcoming.map((task) => {
                  const late = task.due && task.due < today;
                  return (
                    <li key={task.id} className="flex items-start justify-between gap-3">
                      <span className="text-[14px] text-body">{task.title}</span>
                      <span
                        className={`shrink-0 text-[13px] ${late ? "font-semibold text-risk" : "text-tertiary"}`}
                      >
                        {task.due ? shortDate(task.due) : "—"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card>
            <CardHead title="Cost overruns" hint="Line items above their budget" />
            {overruns.length === 0 ? (
              <p className="m-0 text-[14px] text-tertiary">
                Nothing has gone over its line yet.
              </p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {overruns.map((b) => (
                  <li key={b.id} className="flex items-start justify-between gap-3">
                    <span className="text-[14px] text-body">{b.description}</span>
                    <span className="shrink-0 text-[13px] font-semibold text-risk">
                      +{money(b.actual - b.budgeted, project.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Card>
        <CardHead
          title="Recent site notes"
          action={
            <Link href="/log">
              <Button variant="ghost" size="sm">
                Full log
              </Button>
            </Link>
          }
        />
        {recentLog.length === 0 ? (
          <Empty text="No site notes yet." />
        ) : (
          <div className="flex flex-col gap-5">
            {recentLog.map((entry) => (
              <div key={entry.id} className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-ink text-[15px] font-semibold">{entry.title}</span>
                  <span className="text-[13px] text-tertiary">{shortDate(entry.date)}</span>
                </div>
                <p className="m-0 text-[14px] text-body">{entry.body}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

    </>
  );
}
