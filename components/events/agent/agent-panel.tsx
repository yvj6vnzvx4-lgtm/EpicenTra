"use client";

import { useState } from "react";
import { Bot, Sparkles, Wand2, Zap } from "lucide-react";
import { TaskForm } from "./task-form";
import { TaskCard } from "./task-card";

interface AgentTask {
  id: string;
  prompt: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "CANCELLED";
  result: string | null;
  resultMeta: Record<string, unknown> | null;
  createdAt: string;
  completedAt: string | null;
  createdBy: { id: string; name: string; avatarUrl: string | null };
}

interface AgentPanelProps {
  eventId: string;
  initialTasks: AgentTask[];
}

export function AgentPanel({ eventId, initialTasks }: AgentPanelProps) {
  const [tasks, setTasks] = useState<AgentTask[]>(initialTasks);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [runningAgent, setRunningAgent] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  async function handleRunExecutionAgent() {
    setRunningAgent(true);
    setGenerateError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/execution-agent`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setGenerateError(data.error ?? "Failed to run execution agent.");
        return;
      }
      const newTasks: AgentTask[] = await res.json();
      setTasks((prev) => [...newTasks, ...prev]);
    } catch {
      setGenerateError("Something went wrong. Please try again.");
    } finally {
      setRunningAgent(false);
    }
  }

  async function handleSubmit(prompt: string) {
    setSubmitting(true);
    const tempId = `temp-${Date.now()}`;
    const placeholder: AgentTask = {
      id: tempId,
      prompt,
      status: "IN_PROGRESS",
      result: null,
      resultMeta: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
      createdBy: { id: "", name: "You", avatarUrl: null },
    };
    setTasks((prev) => [placeholder, ...prev]);

    try {
      const res = await fetch(`/api/events/${eventId}/agent-tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (res.ok) {
        const task: AgentTask = await res.json();
        setTasks((prev) => prev.map((t) => (t.id === tempId ? task : t)));
      } else {
        setTasks((prev) => prev.filter((t) => t.id !== tempId));
      }
    } catch {
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/agent-tasks/generate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setGenerateError(data.error ?? "Failed to generate tasks.");
        return;
      }
      setTasks((prev) => [...(data as AgentTask[]), ...prev]);
    } catch {
      setGenerateError("Something went wrong. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  function handleDelete(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  async function handleApplied() {
    const res = await fetch(`/api/events/${eventId}/agent-tasks`);
    if (res.ok) {
      const updated: AgentTask[] = await res.json();
      setTasks(updated);
    }
  }

  const executionTasks = tasks.filter((t) => t.resultMeta?.source === "execution-agent");
  const manualTasks = tasks.filter((t) => t.resultMeta?.source !== "execution-agent");

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 sm:space-y-6">

      {/* Hero — Run Execution Agent */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-4 sm:p-6 text-white shadow-lg">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="rounded-xl bg-white/10 p-2.5 sm:p-3 shrink-0">
            <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-sky-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300 mb-1">
              Execution Agent
            </p>
            <h2 className="text-base sm:text-lg font-semibold leading-snug">
              Run the agent across your full event plan
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
              Analyzes your specs, budget, vendors, and checklist — then delivers
              detailed execution guidance for each section.
            </p>

            {generateError && (
              <p className="mt-2 text-xs text-red-300">{generateError}</p>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={handleRunExecutionAgent}
                disabled={runningAgent || submitting || generating}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {runningAgent ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Agent running…
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Run Execution Agent
                  </>
                )}
              </button>

              <button
                onClick={handleGenerate}
                disabled={generating || submitting || runningAgent}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {generating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Reading chat…
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Scan Chat &amp; Generate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom task form */}
      <TaskForm onSubmit={handleSubmit} disabled={submitting || generating || runningAgent} />

      {/* Execution agent results */}
      {executionTasks.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Bot className="h-3.5 w-3.5 text-sky-500" />
            Execution Agent · {executionTasks.length} result{executionTasks.length !== 1 ? "s" : ""}
          </h3>
          <div className="space-y-3">
            {executionTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                eventId={eventId}
                onDelete={handleDelete}
                onApplied={handleApplied}
              />
            ))}
          </div>
        </div>
      )}

      {/* Manual / generated task queue */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <Bot className="h-5 w-5 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600">No tasks yet</p>
          <p className="mt-1 text-xs text-slate-400">
            Run the execution agent or assign a custom task above
          </p>
        </div>
      ) : manualTasks.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Sparkles className="h-3.5 w-3.5 text-purple-500" />
            Task Queue · {manualTasks.length} task{manualTasks.length !== 1 ? "s" : ""}
          </h3>
          <div className="space-y-3">
            {manualTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                eventId={eventId}
                onDelete={handleDelete}
                onApplied={handleApplied}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
