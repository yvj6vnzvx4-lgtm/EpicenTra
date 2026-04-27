"use client";

import { useState, useCallback } from "react";
import { useDebouncedCallback } from "use-debounce";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useAutoSave(eventId: string, delay = 800) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const save = useCallback(
    async (fields: Record<string, unknown>) => {
      setSaveStatus("saving");
      try {
        const res = await fetch(`/api/events/${eventId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fields),
        });
        if (!res.ok) throw new Error("Save failed");
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch {
        setSaveStatus("error");
      }
    },
    [eventId]
  );

  const debouncedSave = useDebouncedCallback(save, delay);

  return { saveStatus, save, debouncedSave };
}

export function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;
  return (
    <span
      className={`text-xs transition-opacity ${
        status === "saving"
          ? "text-slate-400"
          : status === "saved"
            ? "text-brand-green"
            : "text-brand-red"
      }`}
    >
      {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : "Save failed"}
    </span>
  );
}
