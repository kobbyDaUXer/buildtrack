"use client";

import Link from "next/link";
import { useStore, totals } from "@/lib/store";
import {
  Card, CardHead, Bar, Stat, PageHead, Empty, Button, StatusBadge, Chip,
  Th, Td, STATUS_TONE,
} from "@/components/ui";
import { money, shortDate, daysBetween, todayISO, pct } from "@/lib/format";

export default function Dashboard() {
  const { state, hydrated } = useStore();
  const { project, phases, tasks, log, budget } = state;
  const t = totals(state);

  if (!hydrated) return <div className="h-40 rounded-card border border-line bg-surface" />;

  const today = todayISO();
  const daysLeft = project.targetDate ? daysBetween(today, project.targetDate) : null;
  const elapsed =
    project.startDate && project.targetDate
      ? Math.max(0, Math.min(100,
          (daysBetween(project.startDate, today) /
            Math.max(1, daysBetween(project.startDate, project.targetDate))) * 100))
      : 0;

  const overdue = tasks.filter((x) => !x.done && x.due && x.due < today);
  const upcoming = tasks
    .filter((x) => !x.done)
    .sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"))
    .slice(0, 6);

  const overruns = budget
    .filter((b) => b.actual > b.budgeted && b.budgeted > 0)
    .sort((a, b) => b.actual - b.budgeted - (a.actual - a.budgeted))
    .slice(0, 4);

  const recentLog = [...log].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const live = phases.filter((p) => p.status === "in-progress").length;
  const unpaidCount = budget.filter((b) => !b.paid && b.actual > 0).length;

  const spendFor = (id: string) =>
    budget.filter((b) => b.phaseId === id).reduce((n, b) => n + (b.actual || 0), 0);

  const ordered = [...phases].sort((a, b) => (a.start || "9999").localeCompare(b.start || "9999"));

  return (
    <>
      <PageHead
        title={project.name}
        hint={
          [
            project.address,
            project.startDate && project.targetDate
              ? `${shortDate(project.startDate)} → ${shortDate(project.targetDate)}`
              : "",
          ].filter(Boolean).join(" · ") || "Set the details in Settings"
        }
        action={
          <div className="flex items-center gap-2">
            <Chip tone={live > 0 ? "live" : "idle"}>
              {live > 0 ? `${live} phase${live === 1 ? "" : "s"} live` : "Pre-construction"}
            </Chip>
            <Link href="/settings">
              <Button size="sm">Settings</Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon="wallet" label="Budget ceiling" value={money(t.ceiling, project.currency)}
          sub={`${money(t.budgeted, project.currency, true)} allocated to lines`} />
        <Stat icon="spend" label="Spent to date" value={money(t.spent, project.currency)}
          sub={`${pct(t.usedPct)} of ceiling`} bar={t.usedPct}
          tone={t.usedPct > 100 ? "risk" : "brand"} />
        <Stat icon="check" label="Remaining" value={money(t.remaining, project.currency)}
          tone={t.remaining < 0 ? "risk" : "done"}
          sub={t.remaining < 0 ? "Over budget" : "Left to spend"} />
        <Stat icon="alert" label="Unpaid invoices" value={money(t.unpaid, project.currency)}
          tone={unpaidCount > 0 ? "risk" : "default"}
          sub={`${unpaidCount} outstanding`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.75fr_1fr]">
        <Card pad={false}>
          <div className="p-5 pb-3">
            <CardHead
              title="Phases"
              hint="Every stage, in start order — progress and spend attributed"
              action={<Link href="/schedule"><Button variant="ghost" size="sm">Timeline</Button></Link>}
            />
            <div className="flex flex-col gap-2.5">
              <div className="flex items-baseline justify-between">
                <span className="text-[12px] text-tertiary">Work complete</span>
                <span className="tnum text-[13px] font-semibold text-ink">{pct(t.progress)}</span>
              </div>
              <Bar value={t.progress} tone="brand" />
              <div className="flex items-baseline justify-between">
                <span className="text-[12px] text-tertiary">Time elapsed</span>
                <span className="tnum text-[13px] font-semibold text-ink">
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
          </div>

          {phases.length === 0 ? (
            <div className="p-5 pt-0"><Empty text="No phases yet — add them from the Schedule tab." /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr><Th>Phase</Th><Th>Status</Th><Th>Window</Th><Th>Progress</Th><Th align="right">Spend</Th></tr>
                </thead>
                <tbody>
                  {ordered.map((p) => (
                    <tr key={p.id} className="hover:bg-bg">
                      <Td className="font-medium text-ink">
                        <span className="flex items-center gap-2.5">
                          <span className={`h-6 w-[3px] shrink-0 rounded-full ${STATUS_TONE[p.status].rail}`} />
                          {p.name}
                        </span>
                      </Td>
                      <Td><StatusBadge status={p.status} /></Td>
                      <Td className="whitespace-nowrap text-tertiary tnum">
                        {p.start ? `${shortDate(p.start)} → ${shortDate(p.end)}` : "—"}
                      </Td>
                      <Td>
                        <span className="flex items-center gap-2">
                          <span className="w-16"><Bar value={p.progress} tone={p.progress >= 100 ? "done" : "brand"} /></span>
                          <span className="tnum text-[12px] text-tertiary">{pct(p.progress)}</span>
                        </span>
                      </Td>
                      <Td align="right" className="font-medium text-ink">
                        {money(spendFor(p.id), project.currency, true)}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-4">
          <Card pad={false}>
            <div className="p-5 pb-2">
              <CardHead
                title="Next up"
                hint={overdue.length ? `${overdue.length} overdue` : "By due date"}
                action={<Link href="/tasks"><Button variant="ghost" size="sm">All</Button></Link>}
              />
            </div>
            {upcoming.length === 0 ? (
              <div className="p-5 pt-0"><Empty text="Nothing open." /></div>
            ) : (
              <ul className="flex flex-col">
                {upcoming.map((task) => {
                  const late = task.due && task.due < today;
                  const rail = task.priority === "high" ? "bg-risk" : task.priority === "medium" ? "bg-warn" : "bg-line";
                  return (
                    <li key={task.id} className="flex items-start gap-2.5 border-b border-line-soft px-5 py-2.5 last:border-b-0 hover:bg-bg">
                      <span className={`mt-0.5 h-4 w-[3px] shrink-0 rounded-full ${rail}`} />
                      <span className="flex-1 text-[13px] text-body">{task.title}</span>
                      <span className={`shrink-0 text-[12px] tnum ${late ? "font-semibold text-risk" : "text-tertiary"}`}>
                        {task.due ? shortDate(task.due) : "—"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card>
            <CardHead title="Cost overruns" hint="Lines above their budget" />
            {overruns.length === 0 ? (
              <p className="text-[13px] text-tertiary">Nothing has gone over its line yet.</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {overruns.map((b) => (
                  <li key={b.id} className="flex items-start justify-between gap-3">
                    <span className="text-[13px] text-body">{b.description}</span>
                    <span className="shrink-0 text-[13px] font-semibold text-risk tnum">
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
          action={<Link href="/log"><Button variant="ghost" size="sm">Full log</Button></Link>}
        />
        {recentLog.length === 0 ? (
          <Empty text="No site notes yet." />
        ) : (
          <div className="flex flex-col gap-4">
            {recentLog.map((entry) => (
              <div key={entry.id} className="flex flex-col gap-1 border-l-2 border-brand pl-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13.5px] font-semibold text-ink">{entry.title}</span>
                  <span className="text-[12px] text-tertiary tnum">{shortDate(entry.date)}</span>
                  {entry.photos.length ? <Chip tone="brand">{entry.photos.length} photo</Chip> : null}
                </div>
                <p className="text-[13px] text-body">{entry.body}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
