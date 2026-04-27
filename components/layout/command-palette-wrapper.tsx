"use client";

import { useState, useEffect } from "react";
import { CommandPalette } from "./command-palette";

interface Event { id: string; title: string; status: string }

export function CommandPaletteWrapper() {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);

  // Fetch events once on mount
  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setEvents(data); })
      .catch(() => {});
  }, []);

  // Cmd+K / Ctrl+K global shortcut
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <CommandPalette
      events={events}
      open={open}
      onClose={() => setOpen(false)}
    />
  );
}
