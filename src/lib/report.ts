import type { AppState, BudgetItem, LogEntry, MaterialMove, Phase, Task } from "./types";
import { addDays, money, shortDate, weekLabel } from "./format";

export interface StockLine {
  material: string;
  unit: string;
  delivered: number;
  used: number;
  purchased: number;
  onSite: number;
}

export interface WeekReport {
  start: string;
  end: string;
  label: string;
  spend: number;
  spendLines: BudgetItem[];
  moves: MaterialMove[];
  stock: StockLine[];
  livePhases: Phase[];
  completed: Task[];
  overdue: Task[];
  dueNext: Task[];
  notes: LogEntry[];
  photoCount: number;
  issues: string[];
}

const within = (d: string, start: string, end: string) => !!d && d >= start && d <= end;

/**
 * Everything that happened in one Monday-to-Sunday window, derived from the
 * records already in the app. Nothing here is typed twice by the user.
 */
export function buildWeekReport(state: AppState, start: string, today: string): WeekReport {
  const end = addDays(start, 6);
  const nextEnd = addDays(end, 7);

  const spendLines = state.budget.filter((b) => within(b.date, start, end) && b.actual > 0);
  const spend = spendLines.reduce((n, b) => n + b.actual, 0);

  const moves = state.materials
    .filter((m) => within(m.date, start, end))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Running stock position for every material touched this week.
  const touched = new Set(moves.map((m) => `${m.material.trim().toLowerCase()}|${m.unit.trim().toLowerCase()}`));
  const totals = new Map<string, StockLine>();
  for (const m of state.materials) {
    const key = `${m.material.trim().toLowerCase()}|${m.unit.trim().toLowerCase()}`;
    if (!touched.has(key)) continue;
    const row =
      totals.get(key) ??
      { material: m.material.trim(), unit: m.unit, delivered: 0, used: 0, purchased: 0, onSite: 0 };
    if (m.kind === "delivered") row.delivered += m.qty || 0;
    else if (m.kind === "used") row.used += m.qty || 0;
    else row.purchased += m.qty || 0;
    totals.set(key, row);
  }
  const stock = [...totals.values()]
    .map((r) => ({ ...r, onSite: r.delivered - r.used }))
    .sort((a, b) => a.material.localeCompare(b.material));

  const livePhases = state.phases.filter(
    (p) => p.status === "in-progress" || (p.start && p.end && p.start <= end && p.end >= start && p.status !== "done"),
  );

  const completed = state.tasks.filter((t) => t.done && within(t.completedAt, start, end));
  const overdue = state.tasks.filter((t) => !t.done && t.due && t.due < today);
  const dueNext = state.tasks
    .filter((t) => !t.done && t.due && t.due > end && t.due <= nextEnd)
    .sort((a, b) => a.due.localeCompare(b.due));

  const notes = state.log
    .filter((e) => within(e.date, start, end))
    .sort((a, b) => a.date.localeCompare(b.date));
  const photoCount = notes.reduce((n, e) => n + e.photos.length, 0) +
    moves.reduce((n, m) => n + m.photos.length, 0);

  const issues: string[] = [];
  for (const s of stock) {
    if (s.used > s.delivered) {
      issues.push(
        `${s.material}: ${s.used.toLocaleString()} ${s.unit} used against ${s.delivered.toLocaleString()} delivered — short by ${(s.used - s.delivered).toLocaleString()}.`,
      );
    }
  }
  for (const b of state.budget) {
    if (b.budgeted > 0 && b.actual > b.budgeted && within(b.date, start, end)) {
      issues.push(
        `${b.description} is over its line by ${money(b.actual - b.budgeted, state.project.currency)}.`,
      );
    }
  }
  for (const p of state.phases) {
    if (p.status === "blocked") issues.push(`${p.name} is blocked.`);
    else if (p.status !== "done" && p.end && p.end < today) {
      issues.push(`${p.name} passed its end date (${shortDate(p.end)}) at ${Math.round(p.progress)}%.`);
    }
  }
  if (overdue.length) {
    issues.push(`${overdue.length} task${overdue.length === 1 ? " is" : "s are"} overdue.`);
  }

  return {
    start, end, label: weekLabel(start, end),
    spend, spendLines, moves, stock, livePhases,
    completed, overdue, dueNext, notes, photoCount, issues,
  };
}

/** WhatsApp-friendly plain text. Asterisks render as bold there. */
export function reportToText(state: AppState, r: WeekReport, spentToDate: number): string {
  const cur = state.project.currency;
  const L: string[] = [];
  const push = (s = "") => L.push(s);

  push(`*${state.project.name}*`);
  push(`Site report — ${r.label}`);
  push();

  push("*MONEY*");
  push(`Spent this week: ${money(r.spend, cur)}`);
  push(`Spent to date: ${money(spentToDate, cur)}${state.project.budgetTotal ? ` of ${money(state.project.budgetTotal, cur)}` : ""}`);
  if (r.spendLines.length) {
    for (const b of r.spendLines) push(`• ${b.description} — ${money(b.actual, cur)}${b.paid ? "" : " (unpaid)"}`);
  }
  push();

  if (r.moves.length) {
    push("*MATERIALS*");
    for (const m of r.moves) {
      push(`• ${m.material} — ${m.qty.toLocaleString()} ${m.unit} ${m.kind}${m.party ? ` (${m.party})` : ""}`);
    }
    for (const s of r.stock) push(`Stock now: ${s.material} — ${s.onSite.toLocaleString()} ${s.unit}`);
    push();
  }

  if (r.livePhases.length) {
    push("*PROGRESS*");
    for (const p of r.livePhases) push(`• ${p.name} — ${Math.round(p.progress)}%`);
    push();
  }

  if (r.completed.length) {
    push("*DONE THIS WEEK*");
    for (const t of r.completed) push(`• ${t.title}`);
    push();
  }

  if (r.notes.length) {
    push("*SITE NOTES*");
    for (const e of r.notes) push(`• ${shortDate(e.date)} — ${e.title}`);
    if (r.photoCount) push(`${r.photoCount} photo${r.photoCount === 1 ? "" : "s"} on file.`);
    push();
  }

  if (r.issues.length) {
    push("*ISSUES* (current)");
    for (const i of r.issues) push(`• ${i}`);
    push();
  }

  if (r.dueNext.length) {
    push("*NEXT WEEK*");
    for (const t of r.dueNext) push(`• ${t.title} (due ${shortDate(t.due)})`);
    push();
  }

  if (r.overdue.length) {
    push("*OVERDUE*");
    for (const t of r.overdue) push(`• ${t.title} (was due ${shortDate(t.due)})`);
  }

  return L.join("\n").trim();
}
