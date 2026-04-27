"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChevronDown, ChevronUp, Sparkles, Clock, CheckCircle, XCircle, Loader2, PlusSquare, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddToPlanModal, type ParsedItem } from "./add-to-plan-modal";

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

interface TaskCardProps {
  task: AgentTask;
  eventId: string;
  onDelete: (taskId: string) => void;
  onApplied: () => void;
}

const STATUS_META = {
  PENDING: { icon: Clock, color: "text-slate-500", bg: "bg-slate-100", label: "Pending" },
  IN_PROGRESS: { icon: Loader2, color: "text-purple-600", bg: "bg-purple-100", label: "In Progress", spin: true },
  COMPLETED: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-100", label: "Completed" },
  FAILED: { icon: XCircle, color: "text-red-500", bg: "bg-red-100", label: "Failed" },
  CANCELLED: { icon: XCircle, color: "text-slate-400", bg: "bg-slate-100", label: "Cancelled" },
};

// Parse agent markdown response for structured items
function parseAgentItems(result: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  const lines = result.split("\n");

  for (const line of lines) {
    const trimmed = line.replace(/^[-*•]\s*/, "").trim();
    if (!trimmed) continue;

    // Budget: lines with $ amounts like "- Catering: $5,000" or "- **Catering** — $5,000"
    const budgetMatch = trimmed.match(/^(.+?)(?::|—|-)\s*\$([0-9,]+)/);
    if (budgetMatch) {
      const estimated = parseInt(budgetMatch[2].replace(/,/g, ""), 10);
      if (!isNaN(estimated) && estimated > 0) {
        items.push({
          id: `budget-${items.length}`,
          type: "budget",
          label: budgetMatch[1].replace(/\*\*/g, "").trim(),
          description: budgetMatch[1].replace(/\*\*/g, "").trim(),
          category: "Agent Suggestion",
          estimated,
        });
        continue;
      }
    }

    // Vendor: lines mentioning vendor/company keywords
    if (/vendor|supplier|contractor|company|provider|agency/i.test(trimmed) && trimmed.length < 120) {
      items.push({
        id: `vendor-${items.length}`,
        type: "vendor",
        label: trimmed.replace(/\*\*/g, ""),
        vendorName: trimmed.replace(/\*\*/g, "").slice(0, 80),
        category: "Agent Suggestion",
      });
      continue;
    }

    // Checklist: action items — lines starting with a verb or containing "□", "[ ]", "TODO"
    if (
      /^(confirm|book|hire|contact|create|send|schedule|review|finalize|arrange|obtain|set up|prepare|coordinate|check|verify|submit|get|secure)/i.test(trimmed) ||
      /\[ \]|□|todo/i.test(trimmed)
    ) {
      items.push({
        id: `checklist-${items.length}`,
        type: "checklist",
        label: trimmed.replace(/\[ \]|□/g, "").replace(/\*\*/g, "").trim(),
        title: trimmed.replace(/\[ \]|□/g, "").replace(/\*\*/g, "").trim().slice(0, 200),
        category: "Agent",
      });
    }
  }

  return items;
}

export function TaskCard({ task, eventId, onDelete, onApplied }: TaskCardProps) {
  const [expanded, setExpanded] = useState(task.status === "COMPLETED");
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const meta = STATUS_META[task.status];
  const Icon = meta.icon;
  const isApplied = !!(task.resultMeta as Record<string, unknown> | null)?.applied;
  const parsedItems = task.result ? parseAgentItems(task.result) : [];

  async function handleDelete() {
    setDeleting(true);
    await fetch(`/api/events/${eventId}/agent-tasks/${task.id}`, { method: "DELETE" });
    onDelete(task.id);
  }

  async function handleApply(selected: ParsedItem[]) {
    await fetch(`/api/events/${eventId}/agent-tasks/${task.id}/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: selected }),
    });
    setShowModal(false);
    onApplied();
  }

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start gap-3 p-4">
          <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-800 leading-snug">{task.prompt}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
              <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full shrink-0", meta.bg, meta.color)}>
                <Icon className={cn("w-3 h-3", (meta as { spin?: boolean }).spin && "animate-spin")} />
                {meta.label}
              </span>
              <span className="text-xs text-slate-400 shrink-0">
                {new Date(task.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                {" · "}
                {new Date(task.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
              {isApplied && (
                <span className="text-xs text-green-600 font-medium shrink-0">✓ Applied</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {task.status === "COMPLETED" && task.result && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1.5 text-slate-300 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Result */}
        {expanded && task.result && (
          <div className="border-t border-slate-100">
            <div className="px-4 py-3 prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-headings:text-slate-800 prose-code:text-purple-700 prose-code:bg-purple-50 text-slate-700">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{task.result}</ReactMarkdown>
            </div>

            {parsedItems.length > 0 && !isApplied && (
              <div className="px-4 pb-4">
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-xs font-medium hover:bg-purple-700 transition-colors"
                >
                  <PlusSquare className="w-3.5 h-3.5" />
                  Add to Plan ({parsedItems.length} item{parsedItems.length !== 1 ? "s" : ""} found)
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <AddToPlanModal
          items={parsedItems}
          onConfirm={handleApply}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
