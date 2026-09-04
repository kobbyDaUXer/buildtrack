"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import type { Currency } from "@/lib/types";
import { CURRENCIES } from "@/lib/types";
import { Button, Card, CardHead, Field, PageHead, inputCls, areaCls } from "@/components/ui";
import { photoStats, formatBytes } from "@/lib/photos";

export default function SettingsPage() {
  const { state, update, reset, importJSON, hydrated } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<{ count: number; bytes: number } | null>(null);

  useEffect(() => {
    let live = true;
    photoStats().then((s) => {
      if (live) setPhotos(s);
    });
    return () => {
      live = false;
    };
  }, [state.log]);

  if (!hydrated) return <div className="h-40 rounded-card bg-bg shadow-card" />;

  const p = state.project;
  const setProject = (patch: Partial<typeof p>) =>
    update((s) => ({ ...s, project: { ...s.project, ...patch } }));

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(p.name || "buildtrack").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setNote("Backup downloaded.");
    setError(null);
  };

  const onFile = async (file: File) => {
    const message = importJSON(await file.text());
    setError(message);
    setNote(message ? null : "Backup restored.");
  };

  return (
    <>
      <PageHead title="Settings" hint="Project details, currency and your data." />

      <Card>
        <CardHead title="Project" hint="Shown across the app" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Project name" wide>
            <input
              className={inputCls}
              value={p.name}
              onChange={(e) => setProject({ name: e.target.value })}
            />
          </Field>
          <Field label="Site address" wide>
            <input
              className={inputCls}
              value={p.address}
              placeholder="Plot, street, town"
              onChange={(e) => setProject({ address: e.target.value })}
            />
          </Field>
          <Field label="Start date">
            <input
              type="date"
              className={inputCls}
              value={p.startDate}
              onChange={(e) => setProject({ startDate: e.target.value })}
            />
          </Field>
          <Field label="Target completion">
            <input
              type="date"
              className={inputCls}
              value={p.targetDate}
              onChange={(e) => setProject({ targetDate: e.target.value })}
            />
          </Field>
          <Field label="Currency">
            <select
              className={inputCls}
              value={p.currency}
              onChange={(e) => setProject({ currency: e.target.value as Currency })}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Total budget ceiling">
            <input
              type="number"
              className={inputCls}
              value={p.budgetTotal}
              onChange={(e) => setProject({ budgetTotal: Number(e.target.value) })}
            />
          </Field>
          <Field label="Notes" wide>
            <textarea
              className={areaCls}
              value={p.notes}
              onChange={(e) => setProject({ notes: e.target.value })}
            />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHead
          title="Your data"
          hint="Everything lives in this browser only. Export regularly if it matters."
        />
        <p className="m-0 mb-4 text-[13px] text-tertiary">
          The backup covers phases, budget, tasks, contractors and log text.{" "}
          <span className="font-semibold text-secondary">
            Site photos are not included
          </span>{" "}
          — they are held separately on this device
          {photos ? ` (${photos.count} photo${photos.count === 1 ? "" : "s"}, ${formatBytes(photos.bytes)})` : ""}.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportJSON}>Export backup</Button>
          <Button onClick={() => fileRef.current?.click()}>Import backup</Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
              e.target.value = "";
            }}
          />
        </div>
        {note ? <p className="m-0 mt-4 text-[13px] text-done">{note}</p> : null}
        {error ? <p className="m-0 mt-4 text-[13px] text-risk">{error}</p> : null}
      </Card>

      <Card>
        <CardHead title="Start over" hint="This cannot be undone" />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="danger"
            onClick={() => {
              if (confirm("Clear everything and start with an empty project?")) {
                reset("empty");
                setNote("Cleared. Add your first phase from the Schedule tab.");
                setError(null);
              }
            }}
          >
            Clear all data
          </Button>
          <Button
            onClick={() => {
              if (confirm("Replace current data with the sample project?")) {
                reset("sample");
                setNote("Sample project restored.");
                setError(null);
              }
            }}
          >
            Restore sample project
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-5">
        {(
          [
            ["Phases", state.phases.length],
            ["Budget lines", state.budget.length],
            ["Tasks", state.tasks.length],
            ["Log entries", state.log.length],
            ["Site photos", photos?.count ?? 0],
          ] as const
        ).map(([label, n]) => (
          <div key={label} className="flex flex-col gap-0.5 rounded-mid bg-bg p-4 shadow-btn">
            <span className="text-[13px] text-tertiary">{label}</span>
            <span className="text-ink text-[18px] font-semibold">{n}</span>
          </div>
        ))}
      </div>
    </>
  );
}
