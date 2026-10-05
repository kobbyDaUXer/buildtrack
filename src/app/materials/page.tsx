"use client";

import { useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import type { MaterialMove, MovementKind } from "@/lib/types";
import { MOVEMENT_KINDS, UNITS } from "@/lib/types";
import {
  Button, Card, CardHead, Chip, Empty, Field, Modal, PageHead, Stat,
  Th, Td, inputCls, areaCls,
} from "@/components/ui";
import { PhotoThumb, PhotoLightbox } from "@/components/Photos";
import { savePhoto, deletePhotos } from "@/lib/photos";
import { money, shortDate, todayISO, uid } from "@/lib/format";

const emptyMove = (): MaterialMove => ({
  id: uid(),
  date: todayISO(),
  material: "",
  unit: "bags",
  qty: 0,
  kind: "purchased",
  phaseId: null,
  party: "",
  cost: 0,
  note: "",
  photos: [],
});

const KIND_TONE: Record<MovementKind, "brand" | "live" | "done"> = {
  purchased: "brand",
  delivered: "live",
  used: "done",
};

interface Stock {
  key: string;
  material: string;
  unit: string;
  purchased: number;
  delivered: number;
  used: number;
  spend: number;
  haulage: number;
}

export default function MaterialsPage() {
  const { state, update, hydrated } = useStore();
  const [draft, setDraft] = useState<MaterialMove | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [filter, setFilter] = useState<"all" | MovementKind>("all");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const addedRef = useRef<string[]>([]);
  const originalRef = useRef<string[]>([]);

  const currency = state.project.currency;

  const stock = useMemo(() => {
    const map = new Map<string, Stock>();
    for (const m of state.materials) {
      const key = `${m.material.trim().toLowerCase()}|${m.unit.trim().toLowerCase()}`;
      const row =
        map.get(key) ??
        { key, material: m.material.trim(), unit: m.unit, purchased: 0, delivered: 0, used: 0, spend: 0, haulage: 0 };
      if (m.kind === "purchased") {
        row.purchased += m.qty || 0;
        row.spend += m.cost || 0;
      } else if (m.kind === "delivered") {
        row.delivered += m.qty || 0;
        row.haulage += m.cost || 0;
      } else {
        row.used += m.qty || 0;
      }
      map.set(key, row);
    }
    return [...map.values()].sort((a, b) => a.material.localeCompare(b.material));
  }, [state.materials]);

  if (!hydrated) return <div className="h-40 rounded-card border border-line bg-surface" />;

  const phaseName = (id: string | null) => state.phases.find((p) => p.id === id)?.name ?? "—";

  // Used more than was delivered — the discrepancy this screen exists to catch.
  const short = stock.filter((s) => s.used > s.delivered);
  const totalSpend = stock.reduce((n, s) => n + s.spend, 0);
  const totalHaulage = stock.reduce((n, s) => n + s.haulage, 0);

  const moves = [...state.materials]
    .filter((m) => filter === "all" || m.kind === filter)
    .sort((a, b) => b.date.localeCompare(a.date));

  const openNew = () => {
    addedRef.current = [];
    originalRef.current = [];
    setDraft(emptyMove());
    setIsNew(true);
  };

  const openEdit = (m: MaterialMove) => {
    addedRef.current = [];
    originalRef.current = m.photos;
    setDraft({ ...m });
    setIsNew(false);
  };

  const cancel = () => {
    if (addedRef.current.length) void deletePhotos(addedRef.current);
    addedRef.current = [];
    setDraft(null);
  };

  const save = () => {
    if (!draft || !draft.material.trim()) return;
    const dropped = originalRef.current.filter((id) => !draft.photos.includes(id));
    if (dropped.length) void deletePhotos(dropped);
    addedRef.current = [];
    update((s) => ({
      ...s,
      materials: isNew
        ? [...s.materials, draft]
        : s.materials.map((m) => (m.id === draft.id ? draft : m)),
    }));
    setDraft(null);
  };

  const remove = (id: string) => {
    const m = state.materials.find((x) => x.id === id);
    if (m?.photos.length) void deletePhotos(m.photos);
    update((s) => ({ ...s, materials: s.materials.filter((x) => x.id !== id) }));
  };

  const addFiles = async (files: FileList) => {
    setUploading(true);
    try {
      const ids: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        ids.push(await savePhoto(file));
      }
      addedRef.current = [...addedRef.current, ...ids];
      setDraft((d) => (d ? { ...d, photos: [...d.photos, ...ids] } : d));
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <PageHead
        title="Materials"
        hint="What was bought, what reached site, what was used — and what should still be there."
        action={<Button variant="primary" onClick={openNew}>Record movement</Button>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon="layers" label="Materials tracked" value={String(stock.length)}
          sub={`${state.materials.length} movements`} />
        <Stat icon="wallet" label="Purchase value" value={money(totalSpend, currency)}
          sub="Recorded on movements" />
        <Stat icon="spend" label="Haulage" value={money(totalHaulage, currency)}
          sub="Delivery costs" />
        <Stat icon={short.length ? "alert" : "check"} label="Discrepancies"
          value={String(short.length)}
          tone={short.length ? "risk" : "done"}
          sub={short.length ? "Used exceeds delivered" : "Stock reconciles"} />
      </div>

      {short.length > 0 ? (
        <Card className="border-risk/30 bg-risk-bg">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-[14px] font-semibold text-risk">
              {short.length} material{short.length === 1 ? "" : "s"} used beyond what was delivered
            </h2>
            {short.map((s) => (
              <p key={s.key} className="text-[13px] text-risk">
                <strong className="font-semibold">{s.material}</strong>: {s.used.toLocaleString()}{" "}
                {s.unit} used against {s.delivered.toLocaleString()} delivered — short by{" "}
                {(s.used - s.delivered).toLocaleString()} {s.unit}.
              </p>
            ))}
          </div>
        </Card>
      ) : null}

      <Card pad={false}>
        <div className="p-5 pb-2">
          <CardHead
            title="Stock on site"
            hint="On site = delivered − used. Owed = purchased − delivered."
          />
        </div>
        {stock.length === 0 ? (
          <div className="p-5 pt-0">
            <Empty
              text="No movements yet. Record what you buy, what lands on site, and what gets used."
              action={<Button variant="primary" size="sm" onClick={openNew}>Record the first</Button>}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr>
                  <Th>Material</Th>
                  <Th align="right">Purchased</Th>
                  <Th align="right">Delivered</Th>
                  <Th align="right">Used</Th>
                  <Th align="right">On site</Th>
                  <Th align="right">Owed</Th>
                  <Th align="right">Spend</Th>
                </tr>
              </thead>
              <tbody>
                {stock.map((s) => {
                  const onSite = s.delivered - s.used;
                  const owed = s.purchased - s.delivered;
                  return (
                    <tr key={s.key} className="hover:bg-bg">
                      <Td className="font-medium text-ink">
                        {s.material}
                        <span className="ml-1.5 text-[12px] font-normal text-tertiary">{s.unit}</span>
                      </Td>
                      <Td align="right" className="text-body">{s.purchased.toLocaleString()}</Td>
                      <Td align="right" className="text-body">{s.delivered.toLocaleString()}</Td>
                      <Td align="right" className="text-body">{s.used.toLocaleString()}</Td>
                      <Td align="right"
                        className={`font-semibold ${onSite < 0 ? "text-risk" : onSite === 0 ? "text-warn" : "text-ink"}`}>
                        {onSite.toLocaleString()}
                      </Td>
                      <Td align="right" className={owed > 0 ? "font-semibold text-warn" : "text-tertiary"}>
                        {owed > 0 ? owed.toLocaleString() : "—"}
                      </Td>
                      <Td align="right" className="text-ink">{money(s.spend + s.haulage, currency, true)}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card pad={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-3">
          <h2 className="text-[15px] font-semibold text-ink">Movement log</h2>
          <div className="flex gap-1 rounded-mid bg-sunk p-1">
            {(["all", ...MOVEMENT_KINDS] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-chip px-2.5 py-1 text-[12.5px] font-semibold capitalize transition-colors duration-150 ${
                  filter === f ? "bg-surface text-ink shadow-btn" : "text-tertiary hover:text-secondary"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        {moves.length === 0 ? (
          <div className="p-5 pt-0"><Empty text="Nothing matches this filter." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead>
                <tr>
                  <Th>Date</Th><Th>Movement</Th><Th>Material</Th><Th align="right">Qty</Th>
                  <Th>Phase</Th><Th>Party</Th><Th align="right">Cost</Th><Th /><Th />
                </tr>
              </thead>
              <tbody>
                {moves.map((m) => (
                  <tr key={m.id} className="align-top hover:bg-bg">
                    <Td className="whitespace-nowrap text-tertiary tnum">{shortDate(m.date)}</Td>
                    <Td><Chip tone={KIND_TONE[m.kind]}>{m.kind}</Chip></Td>
                    <Td className="font-medium text-ink">
                      {m.material}
                      {m.note ? <span className="block text-[12px] font-normal text-tertiary">{m.note}</span> : null}
                    </Td>
                    <Td align="right" className="font-medium text-ink">
                      {m.qty.toLocaleString()} <span className="text-[12px] font-normal text-tertiary">{m.unit}</span>
                    </Td>
                    <Td className="text-tertiary">{phaseName(m.phaseId)}</Td>
                    <Td className="text-body">{m.party || "—"}</Td>
                    <Td align="right" className="text-body">{m.cost ? money(m.cost, currency) : "—"}</Td>
                    <Td>
                      {m.photos.length ? (
                        <span className="flex gap-1">
                          {m.photos.slice(0, 2).map((pid) => (
                            <span key={pid} className="block size-8 overflow-hidden rounded-tag">
                              <PhotoThumb id={pid} onOpen={setLightbox} />
                            </span>
                          ))}
                        </span>
                      ) : null}
                    </Td>
                    <Td>
                      <span className="flex justify-end gap-1.5">
                        <Button size="sm" onClick={() => openEdit(m)}>Edit</Button>
                        <Button variant="danger" size="sm" onClick={() => remove(m.id)}>Delete</Button>
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="text-[12.5px] text-tertiary">
        Costs here are for reference and are deliberately <strong className="font-semibold text-secondary">not</strong>{" "}
        added to the budget totals — record the money once, on the Budget screen, and the quantities here.
      </p>

      <Modal
        open={draft !== null}
        title={isNew ? "Record movement" : "Edit movement"}
        onClose={cancel}
        footer={
          <>
            <Button onClick={cancel}>Cancel</Button>
            <Button variant="primary" onClick={save} disabled={!draft?.material.trim()}>Save movement</Button>
          </>
        }
      >
        {draft ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Movement">
              <select className={inputCls} value={draft.kind}
                onChange={(e) => setDraft({ ...draft, kind: e.target.value as MovementKind })}>
                {MOVEMENT_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </Field>
            <Field label="Date">
              <input type="date" className={inputCls} value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
            </Field>
            <Field label="Material">
              <input className={inputCls} list="material-names" value={draft.material}
                placeholder="e.g. Cement"
                onChange={(e) => setDraft({ ...draft, material: e.target.value })} />
              <datalist id="material-names">
                {stock.map((s) => <option key={s.key} value={s.material} />)}
              </datalist>
            </Field>
            <Field label="Unit">
              <input className={inputCls} list="material-units" value={draft.unit}
                onChange={(e) => setDraft({ ...draft, unit: e.target.value })} />
              <datalist id="material-units">
                {UNITS.map((u) => <option key={u} value={u} />)}
              </datalist>
            </Field>
            <Field label="Quantity">
              <input type="number" min={0} className={inputCls} value={draft.qty}
                onChange={(e) => setDraft({ ...draft, qty: Number(e.target.value) })} />
            </Field>
            <Field label={draft.kind === "delivered" ? `Haulage (${currency})` : `Cost (${currency})`}>
              <input type="number" min={0} className={inputCls} value={draft.cost}
                disabled={draft.kind === "used"}
                onChange={(e) => setDraft({ ...draft, cost: Number(e.target.value) })} />
            </Field>
            <Field label="Phase">
              <select className={inputCls} value={draft.phaseId ?? ""}
                onChange={(e) => setDraft({ ...draft, phaseId: e.target.value || null })}>
                <option value="">Unassigned</option>
                {state.phases.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label={draft.kind === "used" ? "Used by" : draft.kind === "delivered" ? "Haulier" : "Supplier"}>
              <input className={inputCls} list="material-parties" value={draft.party}
                onChange={(e) => setDraft({ ...draft, party: e.target.value })} />
              <datalist id="material-parties">
                {state.contractors.map((c) => <option key={c.id} value={c.name} />)}
              </datalist>
            </Field>
            <Field label="Note" wide>
              <textarea className={areaCls} value={draft.note}
                onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
            </Field>
            <Field label="Receipt or delivery note" wide>
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                  {draft.photos.map((pid) => (
                    <PhotoThumb key={pid} id={pid} onOpen={setLightbox}
                      onRemove={(rid) =>
                        setDraft((d) => (d ? { ...d, photos: d.photos.filter((x) => x !== rid) } : d))} />
                  ))}
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                    className="flex size-20 shrink-0 flex-col items-center justify-center gap-1 rounded-chip bg-sunk text-[12px] font-semibold text-tertiary transition-colors duration-150 hover:text-secondary disabled:opacity-50">
                    <span className="text-[18px] leading-none">+</span>
                    {uploading ? "Saving" : "Add"}
                  </button>
                </div>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={(e) => { if (e.target.files?.length) void addFiles(e.target.files); e.target.value = ""; }} />
                <span className="text-[12px] text-tertiary">
                  Stored on this device only — not part of the JSON backup.
                </span>
              </div>
            </Field>
          </div>
        ) : null}
      </Modal>

      {lightbox ? <PhotoLightbox id={lightbox} onClose={() => setLightbox(null)} /> : null}
    </>
  );
}
