"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Task, Priority } from "@/lib/types";
import { Button, Card, Chip, Empty, Field, Modal, PageHead, Tag, inputCls } from "@/components/ui";
import { shortDate, todayISO, uid } from "@/lib/format";

const emptyTask = (): Task => ({
  id: uid(),
  title: "",
  phaseId: null,
  assignee: "",
  due: todayISO(),
  priority: "medium",
  done: false,
});

const PRIORITY: Priority[] = ["high", "medium", "low"];

export default function TasksPage() {
  const { state, update, hydrated } = useStore();
  const [draft, setDraft] = useState<Task | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [quick, setQuick] = useState("");

  if (!hydrated) return <div className="h-40 rounded-card bg-bg shadow-card" />;

  const today = todayISO();
  const phaseName = (id: string | null) => state.phases.find((p) => p.id === id)?.name;

  const order = { high: 0, medium: 1, low: 2 } as const;
  const visible = state.tasks
    .filter((t) => showDone || !t.done)
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      const d = (a.due || "9999").localeCompare(b.due || "9999");
      return d !== 0 ? d : order[a.priority] - order[b.priority];
    });

  const toggle = (id: string) =>
    update((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    }));

  const remove = (id: string) =>
    update((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));

  const save = () => {
    if (!draft || !draft.title.trim()) return;
    update((s) => ({
      ...s,
      tasks: isNew ? [...s.tasks, draft] : s.tasks.map((t) => (t.id === draft.id ? draft : t)),
    }));
    setDraft(null);
  };

  const addQuick = () => {
    const title = quick.trim();
    if (!title) return;
    update((s) => ({ ...s, tasks: [...s.tasks, { ...emptyTask(), title }] }));
    setQuick("");
  };

  const openCount = state.tasks.filter((t) => !t.done).length;
  const overdueCount = state.tasks.filter((t) => !t.done && t.due && t.due < today).length;

  return (
    <>
      <PageHead
        title="Tasks"
        hint={`${openCount} open${overdueCount ? ` · ${overdueCount} overdue` : ""}`}
        action={
          <div className="flex gap-2">
            <Button onClick={() => setShowDone((v) => !v)}>
              {showDone ? "Hide done" : "Show done"}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setDraft(emptyTask());
                setIsNew(true);
              }}
            >
              Add task
            </Button>
          </div>
        }
      />

      <Card>
        <div className="flex gap-2">
          <input
            className={inputCls}
            placeholder="Quick add — press Enter"
            value={quick}
            onChange={(e) => setQuick(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addQuick();
            }}
          />
          <Button variant="primary" onClick={addQuick} disabled={!quick.trim()}>
            Add
          </Button>
        </div>
      </Card>

      {visible.length === 0 ? (
        <Empty text="No tasks to show." />
      ) : (
        <Card pad={false}>
          <ul className="m-0 flex list-none flex-col p-0">
            {visible.map((task) => {
              const late = !task.done && task.due && task.due < today;
              return (
                <li
                  key={task.id}
                  className="flex items-start gap-3 border-b border-line-soft px-4 py-2.5 last:border-b-0 hover:bg-bg"
                >
                  <span
                    className={`mt-1 h-5 w-[3px] shrink-0 rounded-full ${
                      task.done
                        ? "bg-line"
                        : task.priority === "high"
                          ? "bg-risk"
                          : task.priority === "medium"
                            ? "bg-warn"
                            : "bg-line"
                    }`}
                    aria-hidden
                  />
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => toggle(task.id)}
                    className="mt-0.5 size-4 shrink-0 accent-[#1C1917]"
                    aria-label={`Mark "${task.title}" done`}
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span
                      className={`text-[14px] ${
                        task.done ? "text-disabled line-through" : "font-semibold text-ink"
                      }`}
                    >
                      {task.title}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {task.phaseId && phaseName(task.phaseId) ? (
                        <Tag>{phaseName(task.phaseId)}</Tag>
                      ) : null}
                      {task.assignee ? <Tag>{task.assignee}</Tag> : null}
                      {!task.done && task.priority !== "low" ? (
                        <Chip tone={task.priority === "high" ? "risk" : "warn"}>{task.priority}</Chip>
                      ) : null}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 text-[13px] ${late ? "font-semibold text-risk" : "text-tertiary"}`}
                  >
                    {task.due ? shortDate(task.due) : "—"}
                  </span>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setDraft({ ...task });
                        setIsNew(false);
                      }}
                    >
                      Edit
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => remove(task.id)}>
                      Delete
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <Modal
        open={draft !== null}
        title={isNew ? "Add task" : "Edit task"}
        onClose={() => setDraft(null)}
        footer={
          <>
            <Button onClick={() => setDraft(null)}>Cancel</Button>
            <Button variant="primary" onClick={save} disabled={!draft?.title.trim()}>
              Save task
            </Button>
          </>
        }
      >
        {draft ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Task" wide>
              <input
                className={inputCls}
                value={draft.title}
                placeholder="e.g. Order roof sheets"
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
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
            <Field label="Owner">
              <input
                className={inputCls}
                list="contractor-names"
                value={draft.assignee}
                onChange={(e) => setDraft({ ...draft, assignee: e.target.value })}
              />
              <datalist id="contractor-names">
                {state.contractors.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </Field>
            <Field label="Due">
              <input
                type="date"
                className={inputCls}
                value={draft.due}
                onChange={(e) => setDraft({ ...draft, due: e.target.value })}
              />
            </Field>
            <Field label="Priority">
              <select
                className={inputCls}
                value={draft.priority}
                onChange={(e) => setDraft({ ...draft, priority: e.target.value as Priority })}
              >
                {PRIORITY.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
