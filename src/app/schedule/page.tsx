"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Phase, Status } from "@/lib/types";
import { STATUSES } from "@/lib/types";
import {
  Button, Card, Empty, Field, Modal, PageHead, StatusBadge, inputCls, areaCls,
} from "@/components/ui";
import { PhaseTimeline } from "@/components/PhaseTimeline";
import { shortDate, todayISO, uid, pct, daysBetween } from "@/lib/format";

const emptyPhase = (): Phase => ({
  id: uid(),
  name: "",
  status: "not-started",
  start: todayISO(),
  end: todayISO(),
  progress: 0,
  notes: "",
});

export default function SchedulePage() {
  const { state, update, hydrated } = useStore();
  const [draft, setDraft] = useState<Phase | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [view, setView] = useState<"timeline" | "list">("timeline");

  if (!hydrated) return <div className="h-40 rounded-card bg-bg shadow-card" />;

  const phases = [...state.phases].sort((a, b) => (a.start || "").localeCompare(b.start || ""));
  const today = todayISO();

  const openNew = () => {
    setDraft(emptyPhase());
    setIsNew(true);
  };
  const openEdit = (p: Phase) => {
    setDraft({ ...p });
    setIsNew(false);
  };

  const save = () => {
    if (!draft || !draft.name.trim()) return;
    update((s) => ({
      ...s,
      phases: isNew
        ? [...s.phases, draft]
        : s.phases.map((p) => (p.id === draft.id ? draft : p)),
    }));
    setDraft(null);
  };

  const remove = (id: string) =>
    update((s) => ({
      ...s,
      phases: s.phases.filter((p) => p.id !== id),
      budget: s.budget.map((b) => (b.phaseId === id ? { ...b, phaseId: null } : b)),
      tasks: s.tasks.map((t) => (t.phaseId === id ? { ...t, phaseId: null } : t)),
    }));

  const bump = (p: Phase, progress: number) => {
    const status: Status =
      progress >= 100 ? "done" : progress > 0 ? "in-progress" : p.status === "blocked" ? "blocked" : "not-started";
    update((s) => ({
      ...s,
      phases: s.phases.map((x) => (x.id === p.id ? { ...x, progress, status } : x)),
    }));
  };

  return (
    <>
      <PageHead
        title="Schedule"
        hint={
          view === "timeline"
            ? "Phases on a shared time axis — overlaps and slippage are visible at a glance."
            : "Phases in start order. Drag the slider as work moves."
        }
        action={
          <div className="flex gap-2">
            <div className="flex gap-1 rounded-mid bg-sunk p-1">
              {(["timeline", "list"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`rounded-chip px-3 py-1.5 text-[13px] font-semibold capitalize transition-colors duration-200 ease-linear ${
                    view === v ? "bg-bg text-ink shadow-btn" : "text-tertiary hover:text-secondary"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <Button variant="primary" onClick={openNew}>
              Add phase
            </Button>
          </div>
        }
      />

      {phases.length > 0 && view === "timeline" ? (
        <Card>
          <PhaseTimeline phases={phases} onEdit={openEdit} />
        </Card>
      ) : null}

      {phases.length === 0 ? (
        <Empty
          text="No phases yet. Break the build into stages so progress and spend can be attributed."
          action={
            <Button variant="primary" size="sm" onClick={openNew}>
              Add the first phase
            </Button>
          }
        />
      ) : view === "list" ? (
        <div className="flex flex-col gap-3">
          {phases.map((p) => {
            const late = p.status !== "done" && p.end && p.end < today;
            const span = daysBetween(p.start, p.end);
            return (
              <Card key={p.id}>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-ink text-[16px] font-semibold">{p.name}</h2>
                        <StatusBadge status={p.status} />
                        {late ? (
                          <span className="text-[12px] font-semibold text-risk">Past its end date</span>
                        ) : null}
                      </div>
                      <span className="text-[13px] text-tertiary">
                        {shortDate(p.start)} → {shortDate(p.end)}
                        {span > 0 ? ` · ${span} days` : ""}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => openEdit(p)}>
                        Edit
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => remove(p.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>

                  {p.notes ? <p className="m-0 text-[14px] text-body">{p.notes}</p> : null}

                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={p.progress}
                      onChange={(e) => bump(p, Number(e.target.value))}
                      aria-label={`Progress for ${p.name}`}
                      className="h-1.5 flex-1 accent-[#1C1917]"
                    />
                    <span className="w-12 text-right text-[14px] font-semibold text-ink">
                      {pct(p.progress)}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : null}

      <Modal
        open={draft !== null}
        title={isNew ? "Add phase" : "Edit phase"}
        onClose={() => setDraft(null)}
        footer={
          <>
            <Button onClick={() => setDraft(null)}>Cancel</Button>
            <Button variant="primary" onClick={save} disabled={!draft?.name.trim()}>
              Save phase
            </Button>
          </>
        }
      >
        {draft ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phase name" wide>
              <input
                className={inputCls}
                value={draft.name}
                placeholder="e.g. Roofing"
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </Field>
            <Field label="Start">
              <input
                type="date"
                className={inputCls}
                value={draft.start}
                onChange={(e) => setDraft({ ...draft, start: e.target.value })}
              />
            </Field>
            <Field label="End">
              <input
                type="date"
                className={inputCls}
                value={draft.end}
                onChange={(e) => setDraft({ ...draft, end: e.target.value })}
              />
            </Field>
            <Field label="Status">
              <select
                className={inputCls}
                value={draft.status}
                onChange={(e) => setDraft({ ...draft, status: e.target.value as Status })}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("-", " ")}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Progress (%)">
              <input
                type="number"
                min={0}
                max={100}
                className={inputCls}
                value={draft.progress}
                onChange={(e) => setDraft({ ...draft, progress: Number(e.target.value) })}
              />
            </Field>
            <Field label="Notes" wide>
              <textarea
                className={areaCls}
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              />
            </Field>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
