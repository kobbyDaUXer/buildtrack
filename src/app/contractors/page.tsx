"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Contractor } from "@/lib/types";
import { Button, Card, Empty, Field, Modal, PageHead, inputCls, areaCls } from "@/components/ui";
import { money, uid } from "@/lib/format";

const emptyContractor = (): Contractor => ({
  id: uid(),
  name: "",
  trade: "",
  phone: "",
  email: "",
  rate: "",
  notes: "",
});

export default function ContractorsPage() {
  const { state, update, hydrated } = useStore();
  const [draft, setDraft] = useState<Contractor | null>(null);
  const [isNew, setIsNew] = useState(false);

  if (!hydrated) return <div className="h-40 rounded-card bg-bg shadow-card" />;

  const currency = state.project.currency;

  const paidTo = (name: string) =>
    state.budget
      .filter((b) => b.vendor.trim().toLowerCase() === name.trim().toLowerCase())
      .reduce((n, b) => n + (b.actual || 0), 0);

  const openTasksFor = (name: string) =>
    state.tasks.filter(
      (t) => !t.done && t.assignee.trim().toLowerCase() === name.trim().toLowerCase(),
    ).length;

  const save = () => {
    if (!draft || !draft.name.trim()) return;
    update((s) => ({
      ...s,
      contractors: isNew
        ? [...s.contractors, draft]
        : s.contractors.map((c) => (c.id === draft.id ? draft : c)),
    }));
    setDraft(null);
  };

  const remove = (id: string) =>
    update((s) => ({ ...s, contractors: s.contractors.filter((c) => c.id !== id) }));

  return (
    <>
      <PageHead
        title="Contractors"
        hint="Who is on the job, what they cost, and what is outstanding with them."
        action={
          <Button
            variant="primary"
            onClick={() => {
              setDraft(emptyContractor());
              setIsNew(true);
            }}
          >
            Add contractor
          </Button>
        }
      />

      {state.contractors.length === 0 ? (
        <Empty
          text="No contractors yet."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setDraft(emptyContractor());
                setIsNew(true);
              }}
            >
              Add the first one
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {state.contractors.map((c) => {
            const paid = paidTo(c.name);
            const open = openTasksFor(c.name);
            return (
              <Card key={c.id}>
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-0.5">
                      <h2 className="text-ink text-[16px] font-semibold">{c.name}</h2>
                      <span className="text-[13px] text-tertiary">{c.trade || "Trade not set"}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setDraft({ ...c });
                          setIsNew(false);
                        }}
                      >
                        Edit
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => remove(c.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>

                  <dl className="m-0 grid grid-cols-2 gap-3 text-[13px]">
                    <div className="flex flex-col gap-0.5">
                      <dt className="text-tertiary">Paid to date</dt>
                      <dd className="m-0 font-semibold text-ink">{money(paid, currency)}</dd>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <dt className="text-tertiary">Open tasks</dt>
                      <dd className="m-0 font-semibold text-ink">{open}</dd>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <dt className="text-tertiary">Rate</dt>
                      <dd className="m-0 text-body">{c.rate || "—"}</dd>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <dt className="text-tertiary">Contact</dt>
                      <dd className="m-0 text-body">
                        {c.phone ? (
                          <a className="text-accent-text" href={`tel:${c.phone}`}>
                            {c.phone}
                          </a>
                        ) : c.email ? (
                          <a className="text-accent-text" href={`mailto:${c.email}`}>
                            {c.email}
                          </a>
                        ) : (
                          "—"
                        )}
                      </dd>
                    </div>
                  </dl>

                  {c.notes ? <p className="m-0 text-[14px] text-body">{c.notes}</p> : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={draft !== null}
        title={isNew ? "Add contractor" : "Edit contractor"}
        onClose={() => setDraft(null)}
        footer={
          <>
            <Button onClick={() => setDraft(null)}>Cancel</Button>
            <Button variant="primary" onClick={save} disabled={!draft?.name.trim()}>
              Save contractor
            </Button>
          </>
        }
      >
        {draft ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <input
                className={inputCls}
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </Field>
            <Field label="Trade">
              <input
                className={inputCls}
                value={draft.trade}
                placeholder="e.g. Electrician"
                onChange={(e) => setDraft({ ...draft, trade: e.target.value })}
              />
            </Field>
            <Field label="Phone">
              <input
                className={inputCls}
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              />
            </Field>
            <Field label="Email">
              <input
                className={inputCls}
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              />
            </Field>
            <Field label="Rate / basis" wide>
              <input
                className={inputCls}
                value={draft.rate}
                placeholder="e.g. Day rate, lump sum per phase"
                onChange={(e) => setDraft({ ...draft, rate: e.target.value })}
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

      <p className="m-0 text-[13px] text-tertiary">
        Paid-to-date matches budget line items whose vendor name is identical to the contractor
        name — keep the spelling consistent and the totals stay in sync.
      </p>
    </>
  );
}
