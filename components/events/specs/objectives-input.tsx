"use client";

import { useState, KeyboardEvent } from "react";
import { X, Plus } from "lucide-react";

interface ObjectivesInputProps {
  values: string[];
  onChange: (values: string[]) => void;
}

export function ObjectivesInput({ values, onChange }: ObjectivesInputProps) {
  const [draft, setDraft] = useState("");

  function addItem() {
    const trimmed = draft.trim();
    if (!trimmed || values.includes(trimmed)) return;
    onChange([...values, trimmed]);
    setDraft("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem();
    }
    if (e.key === "Backspace" && !draft && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  }

  function removeItem(i: number) {
    onChange(values.filter((_, idx) => idx !== i));
  }

  return (
    <div className="flex flex-wrap gap-2 p-2.5 rounded-lg border border-slate-200 bg-white min-h-[42px] focus-within:ring-2 focus-within:ring-brand-blue focus-within:border-transparent transition-all hover:border-slate-300">
      {values.map((v, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1.5 bg-brand-blue/10 text-brand-blue text-xs font-medium px-2.5 py-1 rounded-full"
        >
          {v}
          <button
            type="button"
            onClick={() => removeItem(i)}
            className="hover:text-brand-blue-dark transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <div className="flex items-center gap-1 flex-1 min-w-[160px]">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={values.length === 0 ? "Add an objective and press Enter…" : "Add another…"}
          className="flex-1 text-sm bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
        />
        {draft && (
          <button
            type="button"
            onClick={addItem}
            className="text-brand-blue hover:text-brand-blue-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
