"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Phase } from "@/lib/types";
import { daysBetween, shortDate, todayISO, pct } from "@/lib/format";

const NAME_COL_WIDE = 220;
const NAME_COL_NARROW = 128;
const ROW_H = 52;

type Zoom = "fit" | "normal" | "wide";

const ZOOMS: { id: Zoom; label: string }[] = [
  { id: "fit", label: "Fit" },
  { id: "normal", label: "Normal" },
  { id: "wide", label: "Wide" },
];

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function parse(iso: string): Date {
  return new Date(iso + "T00:00:00");
}

/**
 * Date-positioned bars on a shared time axis, so overlapping phases read as
 * overlapping. The left name column is sticky; everything right of it scrolls.
 */
export function PhaseTimeline({
  phases,
  onEdit,
}: {
  phases: Phase[];
  onEdit: (p: Phase) => void;
}) {
  const [zoom, setZoom] = useState<Zoom>("fit");
  const [containerW, setContainerW] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const today = todayISO();

  const model = useMemo(() => {
    const dated = phases.filter((p) => p.start && p.end);
    if (dated.length === 0) return null;

    const first = dated.reduce((a, p) => (p.start < a ? p.start : a), dated[0].start);
    const last = dated.reduce((a, p) => (p.end > a ? p.end : a), dated[0].end);

    // Pad out to whole months so the header reads cleanly.
    const fd = parse(first);
    const ld = parse(last);
    const rangeStart = toISO(new Date(fd.getFullYear(), fd.getMonth(), 1));
    const rangeEnd = toISO(new Date(ld.getFullYear(), ld.getMonth() + 1, 0));
    const totalDays = daysBetween(rangeStart, rangeEnd) + 1;

    const months: { key: string; label: string; offset: number; days: number }[] = [];
    const cursor = new Date(fd.getFullYear(), fd.getMonth(), 1);
    const endD = parse(rangeEnd);
    while (cursor <= endD) {
      const monthDays = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
      months.push({
        key: toISO(cursor),
        label: cursor.toLocaleDateString("en", { month: "short", year: "2-digit" }),
        offset: daysBetween(rangeStart, toISO(cursor)),
        days: monthDays,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return { rangeStart, rangeEnd, totalDays, months, rows: dated };
  }, [phases]);

  const measure = useCallback(
    (node: HTMLDivElement | null) => {
      scrollRef.current = node;
    },
    [],
  );

  const totalDaysForFit = model?.totalDays ?? 0;

  useEffect(() => {
    const node = scrollRef.current;
    if (!node || totalDaysForFit === 0) return;
    const ro = new ResizeObserver(() => setContainerW(node.clientWidth));
    ro.observe(node);
    return () => ro.disconnect();
  }, [totalDaysForFit]);

  if (!model) {
    return (
      <p className="m-0 text-[14px] text-tertiary">
        Give your phases start and end dates to see them on a timeline.
      </p>
    );
  }

  const { rangeStart, totalDays, months, rows } = model;

  // The name column gives way first on a narrow screen; only then does the
  // day scale shrink, so "Fit" really does fit instead of quietly overflowing.
  const nameCol = containerW > 0 && containerW < 560 ? NAME_COL_NARROW : NAME_COL_WIDE;
  const fitPx =
    containerW > 0 ? Math.max(0.45, (containerW - nameCol - 8) / totalDays) : 5;
  const px = zoom === "normal" ? 5 : zoom === "wide" ? 11 : fitPx;
  const trackW = totalDays * px;
  // Label every nth month so the axis stays readable when months get narrow.
  const labelStep = Math.max(1, Math.ceil(46 / (30.4 * px)));
  const offsetOf = (iso: string) => daysBetween(rangeStart, iso) * px;
  const todayInRange = today >= rangeStart && daysBetween(rangeStart, today) <= totalDays;
  const todayX = todayInRange ? offsetOf(today) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 text-[12px] text-tertiary">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-5 rounded-full bg-done" /> Done
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-5 rounded-full bg-line" /> Planned
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-5 rounded-full bg-risk" /> Blocked
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3.5 w-px bg-risk" /> Today
          </span>
        </div>
        <div className="flex gap-1 rounded-mid bg-sunk p-1">
          {ZOOMS.map((z) => (
            <button
              key={z.id}
              onClick={() => setZoom(z.id)}
              className={`rounded-chip px-3 py-1.5 text-[13px] font-semibold transition-colors duration-200 ease-linear ${
                zoom === z.id ? "bg-bg text-ink shadow-btn" : "text-tertiary hover:text-secondary"
              }`}
            >
              {z.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto" ref={measure}>
        <div style={{ minWidth: nameCol + trackW }}>
          {/* month axis */}
          <div className="flex">
            <div
              className="sticky left-0 z-20 shrink-0 bg-bg"
              style={{ width: nameCol }}
              aria-hidden
            />
            <div className="relative" style={{ width: trackW, height: 28 }}>
              {months.map((m, i) => (
                <div
                  key={m.key}
                  className="absolute top-0 flex h-full items-center whitespace-nowrap border-l border-line pl-1.5 text-[11px] uppercase tracking-wide text-disabled"
                  style={{ left: m.offset * px, width: m.days * px }}
                >
                  {i % labelStep === 0 ? m.label : ""}
                </div>
              ))}
            </div>
          </div>

          <div className="relative border-t border-line">
            {/* gridlines and today marker, behind the rows */}
            <div
              className="pointer-events-none absolute inset-y-0 z-0"
              style={{ left: nameCol, width: trackW }}
              aria-hidden
            >
              {months.map((m) => (
                <div
                  key={m.key}
                  className="absolute inset-y-0 w-px bg-line"
                  style={{ left: m.offset * px }}
                />
              ))}
              {todayX !== null ? (
                <div className="absolute inset-y-0 w-px bg-risk" style={{ left: todayX }} />
              ) : null}
            </div>

            {rows.map((p) => {
              const left = offsetOf(p.start);
              const width = Math.max(px * 2, (daysBetween(p.start, p.end) + 1) * px);
              const span = daysBetween(p.start, p.end) + 1;
              const late = p.status !== "done" && p.end < today;

              return (
                <div
                  key={p.id}
                  className="flex items-center border-b border-line-soft last:border-b-0"
                >
                  <button
                    onClick={() => onEdit(p)}
                    style={{ width: nameCol, height: ROW_H }}
                    className="sticky left-0 z-20 flex shrink-0 flex-col justify-center gap-0.5 bg-bg px-4 text-left transition-colors duration-200 ease-linear hover:bg-sunk"
                  >
                    <span className="truncate text-[14px] font-semibold text-ink">{p.name}</span>
                    <span className="text-[12px] text-tertiary">
                      {span} days{late ? " · late" : ""}
                    </span>
                  </button>

                  <div className="relative" style={{ width: trackW, height: ROW_H }}>
                    <div
                      title={`${p.name} · ${shortDate(p.start)} → ${shortDate(p.end)} · ${pct(p.progress)}`}
                      className={`absolute top-1/2 -translate-y-1/2 overflow-hidden rounded-chip ${
                        p.status === "done"
                          ? "bg-done"
                          : p.status === "blocked"
                            ? "bg-risk"
                            : p.status === "in-progress"
                              ? "bg-live-bg"
                              : "bg-line"
                      }`}
                      style={{ left, width, height: 14 }}
                    >
                      {p.status === "in-progress" ? (
                        <div
                          className="h-full rounded-chip bg-live"
                          style={{ width: `${Math.max(0, Math.min(100, p.progress))}%` }}
                        />
                      ) : null}
                    </div>
                    {p.status !== "done" && p.progress > 0 ? (
                      <span
                        className="absolute top-1/2 -translate-y-1/2 text-[12px] font-semibold text-tertiary"
                        style={{ left: left + width + 8 }}
                      >
                        {pct(p.progress)}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
