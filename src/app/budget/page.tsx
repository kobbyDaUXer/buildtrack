"use client";

import { useMemo, useState } from "react";
import { useStore, totals } from "@/lib/store";
import type { BudgetItem, CostCategory } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import {
  Button, Card, CardHead, Empty, Field, Modal, PageHead, Stat, Bar, inputCls,
} from "@/components/ui";
import { money, shortDate, todayISO, uid, pct } from "@/lib/format";

const emptyItem = (): BudgetItem => ({
  id: uid(),
  description: "",
  category: "Materials",
  phaseId: null,
  budgeted: 0,
  actual: 0,
  vendor: "",
  paid: false,
  date: todayISO(),
});

export default function BudgetPage() {
  const { state, update, hydrated } = useStore();
  const [draft, setDraft] = useState<BudgetItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [filter, setFilter] = useState<"all" | "unpaid" | "over">("all");

  const t = totals(state);
  const currency = state.project.currency;

  const byCategory = useMemo(() => {
    const map = new Map<CostCategory, { budgeted: number; actual: number }>();
    for (const item of state.budget) {
      const row = map.get(item.category) ?? { budgeted: 0, actual: 0 };
      row.budgeted += item.budgeted || 0;
      row.actual += item.actual || 0;
      map.set(item.category, row);
    }
    return [...map.entries()].sort((a, b) => b[1].budgeted - a[1].budgeted);
  }, [state.budget]);

  if (!hydrated) return <div className="h-40 rounded-card bg-bg shadow-card" />;

  const phaseName = (id: string | null) =>
    state.phases.find((p) => p.id === id)?.name ?? "Unassigned";

  const rows = state.budget.filter((b) => {
    if (filter === "unpaid") return !b.paid && b.actual > 0;
    if (filter === "over") return b.actual > b.budgeted && b.budgeted > 0;
    return true;
  });

  const save = () => {
    if (!draft || !draft.description.trim()) return;
    update((s) => ({
      ...s,
      budget: isNew ? [...s.budget, draft] : s.budget.map((b) => (b.id === draft.id ? draft : b)),
    }));
    setDraft(null);
  };

  const remove = (id: string) =>
    update((s) => ({ ...s, budget: s.budget.filter((b) => b.id !== id) }));

  const togglePaid = (id: string) =>
    update((s) => ({
      ...s,
      budget: s.budget.map((b) => (b.id === id ? { ...b, paid: !b.paid } : b)),
    }));

  return (
    <>
      <PageHead
        title="Budget"
        hint="Every line of the build, budgeted against what it actually cost."
        action={
          <Button
            variant="primary"
            onClick={() => {
              setDraft(emptyItem());
              setIsNew(true);
            }}
          >
            Add line item
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon="wallet" label="Ceiling" value={money(t.ceiling, currency)} sub="Set in Settings" />
        <Stat icon="layers" label="Allocated" value={money(t.budgeted, currency)} sub="Sum of line budgets" />
        <Stat
          icon="spend"
          label="Actual spend"
          value={money(t.spent, currency)}
          sub={`${pct(t.usedPct)} of ceiling`}
          bar={t.usedPct}
          tone={t.usedPct > 100 ? "risk" : "brand"}
        />
        <Stat
          icon={t.spent > t.budgeted ? "alert" : "check"}
          label="Variance"
          value={money(t.budgeted - t.spent, currency)}
          tone={t.spent > t.budgeted ? "risk" : "done"}
          sub={t.spent > t.budgeted ? "Over the allocated lines" : "Under the allocated lines"}
        />
      </div>

      <Card>
        <CardHead title="By category" hint="Where the money is going" />
        {byCategory.length === 0 ? (
          <Empty text="No line items yet." />
        ) : (
          <div className="flex flex-col gap-4">
            {byCategory.map(([cat, row]) => {
              const over = row.actual > row.budgeted;
              return (
                <div key={cat} className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-[14px] font-semibold text-ink">{cat}</span>
                    <span className={`text-[13px] ${over ? "text-risk" : "text-tertiary"}`}>
                      {money(row.actual, currency)} of {money(row.budgeted, currency)}
                    </span>
                  </div>
                  <Bar
                    value={row.budgeted ? (row.actual / row.budgeted) * 100 : 0}
                    tone={over ? "risk" : "ink"}
                  />
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card pad={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-6">
          <h2 className="text-ink text-[17px] font-semibold">Line items</h2>
          <div className="flex gap-1 rounded-mid bg-sunk p-1">
            {(["all", "unpaid", "over"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-chip px-3 py-1.5 text-[13px] font-semibold transition-colors duration-200 ease-linear ${
                  filter === f ? "bg-bg text-ink shadow-btn" : "text-tertiary hover:text-secondary"
                }`}
              >
                {f === "all" ? "All" : f === "unpaid" ? "Unpaid" : "Over budget"}
              </button>
            ))}
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="p-6">
            <Empty text="Nothing matches this filter." />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[840px] border-collapse text-left">
              <thead>
                <tr className="border-y border-line text-[12px] uppercase tracking-wide text-disabled">
                  <th className="px-6 py-3 font-semibold">Item</th>
                  <th className="px-3 py-3 font-semibold">Phase</th>
                  <th className="px-3 py-3 text-right font-semibold">Budgeted</th>
                  <th className="px-3 py-3 text-right font-semibold">Actual</th>
                  <th className="px-3 py-3 text-right font-semibold">Variance</th>
                  <th className="px-3 py-3 font-semibold">Paid</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => {
                  const variance = b.budgeted - b.actual;
                  return (
                    <tr key={b.id} className="border-b border-line-soft align-top">
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[14px] font-semibold text-ink">
                            {b.description}
                          </span>
                          <span className="text-[13px] text-tertiary">
                            {b.category}
                            {b.vendor ? ` · ${b.vendor}` : ""}
                            {b.date ? ` · ${shortDate(b.date)}` : ""}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-[13px] text-tertiary">
                        {phaseName(b.phaseId)}
                      </td>
                      <td className="px-3 py-4 text-right text-[14px] text-body">
                        {money(b.budgeted, currency)}
                      </td>
                      <td className="px-3 py-4 text-right text-[14px] text-body">
                        {money(b.actual, currency)}
                      </td>
                      <td
                        className={`px-3 py-4 text-right text-[14px] font-semibold ${
                          variance < 0 ? "text-risk" : "text-done"
                        }`}
                      >
                        {variance < 0 ? "+" : ""}
                        {money(Math.abs(variance), currency)}
                      </td>
                      <td className="px-3 py-4">
                        <label className="flex items-center gap-2 text-[13px] text-tertiary">
                          <input
                            type="checkbox"
                            checked={b.paid}
                            onChange={() => togglePaid(b.id)}
                            className="size-4 accent-[#1C1917]"
                            aria-label={`Mark ${b.description} paid`}
                          />
                          {b.paid ? "Paid" : "Due"}
                        </label>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setDraft({ ...b });
                              setIsNew(false);
                            }}
                          >
                            Edit
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => remove(b.id)}>
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={draft !== null}
        title={isNew ? "Add line item" : "Edit line item"}
        onClose={() => setDraft(null)}
        footer={
          <>
            <Button onClick={() => setDraft(null)}>Cancel</Button>
            <Button variant="primary" onClick={save} disabled={!draft?.description.trim()}>
              Save item
            </Button>
          </>
        }
      >
        {draft ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Description" wide>
              <input
                className={inputCls}
                value={draft.description}
                placeholder="e.g. Cement — 420 bags"
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </Field>
            <Field label="Category">
              <select
                className={inputCls}
                value={draft.category}
                onChange={(e) =>
                  setDraft({ ...draft, category: e.target.value as CostCategory })
                }
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Phase">
              <select
                className={inputCls}
                value={draft.phaseId ?? ""}
                onChange={(e) => setDraft({ ...draft, phaseId: e.target.value || null })}
              >
                <option value="">Unassigned</option>
                {state.phases.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={`Budgeted (${currency})`}>
              <input
                type="number"
                className={inputCls}
                value={draft.budgeted}
                onChange={(e) => setDraft({ ...draft, budgeted: Number(e.target.value) })}
              />
            </Field>
            <Field label={`Actual (${currency})`}>
              <input
                type="number"
                className={inputCls}
                value={draft.actual}
                onChange={(e) => setDraft({ ...draft, actual: Number(e.target.value) })}
              />
            </Field>
            <Field label="Vendor / supplier">
              <input
                className={inputCls}
                value={draft.vendor}
                onChange={(e) => setDraft({ ...draft, vendor: e.target.value })}
              />
            </Field>
            <Field label="Date">
              <input
                type="date"
                className={inputCls}
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              />
            </Field>
            <Field label="Payment" wide>
              <label className="flex items-center gap-2 text-[14px] text-body">
                <input
                  type="checkbox"
                  checked={draft.paid}
                  onChange={(e) => setDraft({ ...draft, paid: e.target.checked })}
                  className="size-4 accent-[#1C1917]"
                />
                Settled in full
              </label>
            </Field>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
