"use client";

import { useState } from "react";
import { Bot, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const EXAMPLE_PROMPTS = [
  "Find venue options under $15K in Brooklyn",
  "Draft a staffing plan for 500 attendees",
  "Create a wet-weather contingency plan",
  "Suggest a day-of run-of-show timeline",
  "Identify permit requirements for outdoor activation in NYC",
];

interface TaskFormProps {
  onSubmit: (prompt: string) => Promise<void>;
  disabled?: boolean;
}

export function TaskForm({ onSubmit, disabled }: TaskFormProps) {
  const [prompt, setPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed || submitting || disabled) return;
    setSubmitting(true);
    setPrompt("");
    await onSubmit(trimmed);
    setSubmitting(false);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
          <Bot className="w-4 h-4 text-purple-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Assign a Task to the Agent</h3>
          <p className="text-xs text-slate-500">The agent will analyze your event and deliver a detailed response</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="What would you like the agent to work on?"
          rows={3}
          disabled={disabled || submitting}
          className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-purple-300 focus:ring-1 focus:ring-purple-300 transition-all"
        />

        {/* Example prompt chips */}
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPrompt(p)}
              disabled={disabled || submitting}
              className="text-xs px-3 py-1.5 rounded-full border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={!prompt.trim() || submitting || disabled}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all",
            prompt.trim() && !submitting
              ? "bg-purple-600 text-white hover:bg-purple-700"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          )}
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Agent is working…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Assign to Agent
            </>
          )}
        </button>
      </form>
    </div>
  );
}
