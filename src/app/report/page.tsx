"use client";

import { useMemo, useState } from "react";
import { useStore, totals } from "@/lib/store";
import { buildWeekReport, reportToText } from "@/lib/report";
import {
  Button, Card, CardHead, Chip, Empty, PageHead, Stat, Bar, Th, Td, StatusBadge,
} from "@/components/ui";
import { PhotoThumb, PhotoLightbox } from "@/components/Photos";
import { addDays, money, mondayOf, shortDate, todayISO } from "@/lib/format";

export default function ReportPage() {
  const { state, hydrated } = useStore();
  const today = todayISO();
  const [weekStart, setWeekStart] = useState(() => mondayOf(todayISO()));
  const [copied, setCopied] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const t = totals(state);
  const report = useMemo(
    () => buildWeekReport(state, weekStart, today),
    [state, weekStart, today],
  );

  if (!hydrated) return <div className="h-40 rounded-card border border-line bg-surface" />;

  const cur = state.project.currency;
  const text = reportToText(state, report, t.spent);
  const isThisWeek = weekStart === mondayOf(today);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the text is on screen to select manually */
    }
  };

  const empty =
    report.spendLines.length === 0 &&
    report.moves.length === 0 &&
    report.completed.length === 0 &&
    report.notes.length === 0;

  return (
    <>
      <PageHead
        title="Weekly report"
        hint="Built from what is already recorded — spend, materials, progress, notes and issues for one week."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => setWeekStart(addDays(weekStart, -7))}>← Previous</Button>
            <Button size="sm" onClick={() => setWeekStart(mondayOf(today))} disabled={isThisWeek}>
              This week
            </Button>
            <Button size="sm" onClick={() => setWeekStart(addDays(weekStart, 7))} disabled={isThisWeek}>
              Next →
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-[17px] font-semibold text-ink">{report.label}</h2>
          {isThisWeek ? <Chip tone="brand">Current week</Chip> : null}
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={copy}>{copied ? "Copied" : "Copy text"}</Button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(text)}`}
            target="_blank"
            rel="noopener"
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-ctl bg-brand px-2.5 text-[13px] font-semibold text-white shadow-btn transition-colors duration-150 hover:bg-brand-deep"
          >
            Share on WhatsApp
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon="spend" label="Spent this week" value={money(report.spend, cur)}
          sub={`${report.spendLines.length} payment${report.spendLines.length === 1 ? "" : "s"}`} />
        <Stat icon="check" label="Tasks completed" value={String(report.completed.length)}
          tone={report.completed.length ? "done" : "default"}
          sub={`${report.overdue.length} overdue`} />
        <Stat icon="layers" label="Material movements" value={String(report.moves.length)}
          sub={`${report.stock.length} material${report.stock.length === 1 ? "" : "s"} touched`} />
        <Stat icon={report.issues.length ? "alert" : "check"} label="Issues"
          value={String(report.issues.length)}
          tone={report.issues.length ? "risk" : "done"}
          sub={report.issues.length ? "Need attention" : "Nothing flagged"} />
      </div>

      {empty && report.issues.length === 0 ? (
        <Empty text={`Nothing was recorded in the week of ${report.label}.`} />
      ) : null}

      {report.issues.length ? (
        <Card className="bg-risk-bg">
          <div className="mb-2 flex items-baseline gap-2">
            <h2 className="text-[14px] font-semibold text-risk">Issues</h2>
            <span className="text-[12px] text-risk/70">current status, not only this week</span>
          </div>
          <ul className="flex flex-col gap-1">
            {report.issues.map((i) => (
              <li key={i} className="text-[13px] text-risk">• {i}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      {report.spendLines.length ? (
        <Card pad={false}>
          <div className="p-5 pb-2">
            <CardHead title="Money out" hint={`${money(report.spend, cur)} this week`} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead><tr><Th>Date</Th><Th>Item</Th><Th>Vendor</Th><Th align="right">Amount</Th><Th>Paid</Th></tr></thead>
              <tbody>
                {report.spendLines.map((b) => (
                  <tr key={b.id} className="hover:bg-bg">
                    <Td className="whitespace-nowrap text-tertiary tnum">{shortDate(b.date)}</Td>
                    <Td className="font-medium text-ink">{b.description}</Td>
                    <Td className="text-body">{b.vendor || "—"}</Td>
                    <Td align="right" className="font-medium text-ink">{money(b.actual, cur)}</Td>
                    <Td><Chip tone={b.paid ? "done" : "warn"}>{b.paid ? "paid" : "due"}</Chip></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {report.moves.length ? (
        <Card pad={false}>
          <div className="p-5 pb-2">
            <CardHead title="Materials" hint="Movements this week, and where the stock stands now" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px]">
              <thead><tr><Th>Date</Th><Th>Movement</Th><Th>Material</Th><Th align="right">Qty</Th><Th>Party</Th></tr></thead>
              <tbody>
                {report.moves.map((m) => (
                  <tr key={m.id} className="hover:bg-bg">
                    <Td className="whitespace-nowrap text-tertiary tnum">{shortDate(m.date)}</Td>
                    <Td><Chip tone={m.kind === "purchased" ? "brand" : m.kind === "delivered" ? "live" : "done"}>{m.kind}</Chip></Td>
                    <Td className="font-medium text-ink">{m.material}</Td>
                    <Td align="right" className="text-ink">{m.qty.toLocaleString()} <span className="text-[12px] text-tertiary">{m.unit}</span></Td>
                    <Td className="text-body">{m.party || "—"}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {report.stock.length ? (
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 border-t border-line px-5 py-3">
              {report.stock.map((s) => (
                <span key={s.material} className="text-[13px] text-tertiary">
                  Stock now — <strong className={`font-semibold ${s.onSite < 0 ? "text-risk" : "text-ink"}`}>
                    {s.material} {s.onSite.toLocaleString()} {s.unit}
                  </strong>
                </span>
              ))}
            </div>
          ) : null}
        </Card>
      ) : null}

      {report.livePhases.length ? (
        <Card>
          <CardHead title="Progress" hint="Phases active during this week" />
          <div className="flex flex-col gap-3.5">
            {report.livePhases.map((p) => (
              <div key={p.id} className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <span className="text-[13.5px] font-semibold text-ink">{p.name}</span>
                    <StatusBadge status={p.status} />
                  </span>
                  <span className="text-[12.5px] text-tertiary tnum">
                    {Math.round(p.progress)}% · due {shortDate(p.end)}
                  </span>
                </div>
                <Bar value={p.progress} tone={p.progress >= 100 ? "done" : "brand"} />
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHead title="Done this week" hint={`${report.completed.length} completed`} />
          {report.completed.length === 0 ? (
            <p className="text-[13px] text-tertiary">Nothing ticked off in this week.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {report.completed.map((t2) => (
                <li key={t2.id} className="text-[13px] text-body">• {t2.title}</li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHead title="Next week" hint={`${report.dueNext.length} due · ${report.overdue.length} overdue`} />
          {report.dueNext.length === 0 && report.overdue.length === 0 ? (
            <p className="text-[13px] text-tertiary">Nothing scheduled.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {report.overdue.map((t2) => (
                <li key={t2.id} className="text-[13px] font-medium text-risk">
                  • {t2.title} — overdue since {shortDate(t2.due)}
                </li>
              ))}
              {report.dueNext.map((t2) => (
                <li key={t2.id} className="text-[13px] text-body">
                  • {t2.title} — {shortDate(t2.due)}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {report.notes.length ? (
        <Card>
          <CardHead title="Site notes" hint={report.photoCount ? `${report.photoCount} photo${report.photoCount === 1 ? "" : "s"}` : undefined} />
          <div className="flex flex-col gap-4">
            {report.notes.map((e) => (
              <div key={e.id} className="flex flex-col gap-1.5 border-l-2 border-brand pl-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13.5px] font-semibold text-ink">{e.title}</span>
                  <span className="text-[12px] text-tertiary tnum">{shortDate(e.date)}</span>
                </div>
                {e.body ? <p className="text-[13px] text-body">{e.body}</p> : null}
                {e.photos.length ? (
                  <div className="flex flex-wrap gap-2">
                    {e.photos.map((pid) => <PhotoThumb key={pid} id={pid} onOpen={setLightbox} />)}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <Card>
        <CardHead
          title="What gets sent"
          hint="The exact text the Copy and WhatsApp buttons use"
        />
        <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-mid bg-sunk p-3.5 text-[12.5px] leading-relaxed text-body">
{text}
        </pre>
      </Card>

      {lightbox ? <PhotoLightbox id={lightbox} onClose={() => setLightbox(null)} /> : null}
    </>
  );
}
