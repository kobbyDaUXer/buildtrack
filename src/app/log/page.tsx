"use client";

import { useRef, useState } from "react";
import { useStore } from "@/lib/store";
import type { LogEntry } from "@/lib/types";
import { Button, Card, Empty, Field, Modal, PageHead, Tag, inputCls, areaCls } from "@/components/ui";
import { PhotoThumb, PhotoLightbox } from "@/components/Photos";
import { savePhoto, deletePhotos } from "@/lib/photos";
import { shortDate, todayISO, uid } from "@/lib/format";

const emptyEntry = (): LogEntry => ({
  id: uid(),
  date: todayISO(),
  title: "",
  body: "",
  weather: "",
  crewOnSite: 0,
  photos: [],
});

export default function LogPage() {
  const { state, update, hydrated } = useStore();
  const [draft, setDraft] = useState<LogEntry | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [query, setQuery] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  /** Photos added in this modal session, so cancelling does not orphan blobs. */
  const addedRef = useRef<string[]>([]);
  /** The entry's photos as they were when the modal opened. */
  const originalRef = useRef<string[]>([]);

  if (!hydrated) return <div className="h-40 rounded-card bg-bg shadow-card" />;

  const q = query.trim().toLowerCase();
  const entries = [...state.log]
    .filter((e) => !q || `${e.title} ${e.body}`.toLowerCase().includes(q))
    .sort((a, b) => b.date.localeCompare(a.date));

  const openNew = () => {
    const entry = emptyEntry();
    addedRef.current = [];
    originalRef.current = [];
    setDraft(entry);
    setIsNew(true);
  };

  const openEdit = (entry: LogEntry) => {
    addedRef.current = [];
    originalRef.current = entry.photos;
    setDraft({ ...entry });
    setIsNew(false);
  };

  const cancel = () => {
    // Blobs written during this session are unreferenced once we discard the draft.
    if (addedRef.current.length) void deletePhotos(addedRef.current);
    addedRef.current = [];
    setDraft(null);
  };

  const save = () => {
    if (!draft || !draft.title.trim()) return;
    const dropped = originalRef.current.filter((id) => !draft.photos.includes(id));
    if (dropped.length) void deletePhotos(dropped);
    addedRef.current = [];
    update((s) => ({
      ...s,
      log: isNew ? [...s.log, draft] : s.log.map((e) => (e.id === draft.id ? draft : e)),
    }));
    setDraft(null);
  };

  const remove = (id: string) => {
    const entry = state.log.find((e) => e.id === id);
    if (entry?.photos.length) void deletePhotos(entry.photos);
    update((s) => ({ ...s, log: s.log.filter((e) => e.id !== id) }));
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
        title="Site log"
        hint="A dated record of what happened on site. The thing you will wish you had kept."
        action={
          <Button variant="primary" onClick={openNew}>
            New entry
          </Button>
        }
      />

      <Card>
        <input
          className={inputCls}
          placeholder="Search entries"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </Card>

      {entries.length === 0 ? (
        <Empty text={q ? "No entries match that search." : "No entries yet."} />
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-ink text-[16px] font-semibold">{entry.title}</h2>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] text-tertiary">{shortDate(entry.date)}</span>
                      {entry.weather ? <Tag>{entry.weather}</Tag> : null}
                      {entry.crewOnSite > 0 ? <Tag>{entry.crewOnSite} on site</Tag> : null}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => openEdit(entry)}>
                      Edit
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => remove(entry.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
                {entry.body ? (
                  <p className="m-0 whitespace-pre-wrap text-[14px] text-body">{entry.body}</p>
                ) : null}
                {entry.photos.length ? (
                  <div className="flex flex-wrap gap-2">
                    {entry.photos.map((pid) => (
                      <PhotoThumb key={pid} id={pid} onOpen={setLightbox} />
                    ))}
                  </div>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={draft !== null}
        title={isNew ? "New site note" : "Edit site note"}
        onClose={cancel}
        footer={
          <>
            <Button onClick={cancel}>Cancel</Button>
            <Button variant="primary" onClick={save} disabled={!draft?.title.trim()}>
              Save entry
            </Button>
          </>
        }
      >
        {draft ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Headline" wide>
              <input
                className={inputCls}
                value={draft.title}
                placeholder="e.g. Lintel beam cast"
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
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
            <Field label="Weather">
              <input
                className={inputCls}
                value={draft.weather}
                placeholder="e.g. Heavy rain"
                onChange={(e) => setDraft({ ...draft, weather: e.target.value })}
              />
            </Field>
            <Field label="Crew on site">
              <input
                type="number"
                min={0}
                className={inputCls}
                value={draft.crewOnSite}
                onChange={(e) => setDraft({ ...draft, crewOnSite: Number(e.target.value) })}
              />
            </Field>
            <Field label="What happened" wide>
              <textarea
                className={areaCls}
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              />
            </Field>
            <Field label="Photos" wide>
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  {draft.photos.map((pid) => (
                    <PhotoThumb
                      key={pid}
                      id={pid}
                      onOpen={setLightbox}
                      onRemove={(rid) =>
                        setDraft((d) =>
                          d ? { ...d, photos: d.photos.filter((x) => x !== rid) } : d,
                        )
                      }
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex size-20 shrink-0 flex-col items-center justify-center gap-1 rounded-chip bg-bg-alt text-[12px] font-semibold text-tertiary transition-colors duration-200 ease-linear hover:text-secondary disabled:opacity-50"
                  >
                    <span className="text-[18px] leading-none">+</span>
                    {uploading ? "Saving" : "Add"}
                  </button>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) void addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
                <span className="text-[12px] text-tertiary">
                  Resized to 1600px on the way in. Stored on this device only — photos are not
                  part of the JSON backup.
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
