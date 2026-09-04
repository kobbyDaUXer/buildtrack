"use client";

import { useEffect, useState } from "react";
import { loadPhoto } from "@/lib/photos";

/** Object URLs are created per mount and revoked on unmount. */
function usePhotoURL(id: string): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let revoked = false;
    let created: string | null = null;

    loadPhoto(id).then((blob) => {
      if (!blob || revoked) return;
      created = URL.createObjectURL(blob);
      setUrl(created);
    });

    return () => {
      revoked = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [id]);

  return url;
}

export function PhotoThumb({
  id,
  onOpen,
  onRemove,
}: {
  id: string;
  onOpen?: (id: string) => void;
  onRemove?: (id: string) => void;
}) {
  const url = usePhotoURL(id);

  return (
    <div className="relative size-20 shrink-0 overflow-hidden rounded-chip bg-bg-alt">
      {url ? (
        <button
          type="button"
          onClick={() => onOpen?.(id)}
          className="size-full"
          aria-label="Open photo"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="size-full object-cover" />
        </button>
      ) : null}
      {onRemove ? (
        <button
          type="button"
          onClick={() => onRemove(id)}
          aria-label="Remove photo"
          className="absolute right-1 top-1 rounded-tag bg-[rgba(23,23,23,0.72)] px-1.5 text-[12px] font-semibold text-white"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}

export function PhotoLightbox({ id, onClose }: { id: string; onClose: () => void }) {
  const url = usePhotoURL(id);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(23,23,23,0.82)] p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Site photo"
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="max-h-full max-w-full rounded-mid object-contain" />
      ) : (
        <span className="text-[14px] text-white">Loading…</span>
      )}
    </div>
  );
}
