"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { AvatarStack } from "@/components/ui/avatar";
import { SaveIndicator, useAutoSave } from "@/lib/hooks/use-auto-save";
import { cn } from "@/lib/utils";
import {
  FileText, LayoutGrid, Bot, MessageSquare,
  ChevronLeft, ChevronDown, ChevronRight,
  UserPlus, Lock, Unlock, Activity, X, FileBarChart, CheckCircle2,
} from "lucide-react";

const EVENT_STATUSES = [
  "DRAFT", "PLANNING", "PLAN_LOCKED", "IN_EXECUTION", "LIVE", "COMPLETED", "CANCELLED",
] as const;

interface WorkspaceShellProps {
  eventId: string;
  initialTitle: string;
  initialStatus: string;
  planLockedAt: string | null;
  currentUserRole: string;
  members: Array<{ id: string; name: string; avatarUrl: string | null }>;
  children: React.ReactNode;
}

interface WorkflowStep {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function WorkspaceShell({
  eventId,
  initialTitle,
  initialStatus,
  planLockedAt,
  currentUserRole,
  members,
  children,
}: WorkspaceShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { saveStatus, debouncedSave, save } = useAutoSave(eventId);

  const [title, setTitle] = useState(initialTitle);
  const [status, setStatus] = useState(initialStatus);
  const [statusOpen, setStatusOpen] = useState(false);
  const [lockModal, setLockModal] = useState<"lock" | "unlock" | null>(null);
  const [locking, setLocking] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  const canLock = currentUserRole === "ADMIN" || currentUserRole === "DIRECTOR";
  const isLocked = status === "PLAN_LOCKED" || status === "IN_EXECUTION";
  const showReport = isLocked || status === "COMPLETED" || status === "LIVE";
  const baseTabPath = `/events/${eventId}`;

  const workflowSteps: WorkflowStep[] = [
    { href: "specs",     label: "Event Brief",       icon: FileText    },
    { href: "design",    label: "Space Design",       icon: LayoutGrid  },
    { href: "agent",     label: "Execution Agent",    icon: Bot         },
    { href: "notes",     label: "Team Notes",         icon: MessageSquare },
    ...(isLocked  ? [{ href: "execution", label: "Execution Board",   icon: Activity   }] : []),
    ...(showReport ? [{ href: "report",   label: "Post-Event Report", icon: FileBarChart }] : []),
  ];

  const currentStep =
    workflowSteps.find((step) => pathname.startsWith(`${baseTabPath}/${step.href}`)) ??
    workflowSteps[0];
  const currentStepIndex = workflowSteps.findIndex((s) => s.href === currentStep.href);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setStatusOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTitle(e.target.value);
    debouncedSave({ title: e.target.value });
  }

  async function handleStatusChange(newStatus: string) {
    setStatus(newStatus);
    setStatusOpen(false);
    await save({ status: newStatus });
  }

  async function handleLockToggle() {
    setLocking(true);
    const endpoint = isLocked ? "unlock" : "lock";
    const res = await fetch(`/api/events/${eventId}/${endpoint}`, { method: "POST" });
    if (res.ok) {
      const updated = await res.json();
      setStatus(updated.status);
      if (!isLocked) {
        toast.success("Plan locked — execution mode active");
        router.push(`/events/${eventId}/execution`);
      } else {
        toast.success("Plan unlocked — back to planning mode");
        router.push(`/events/${eventId}/specs`);
      }
      router.refresh();
    } else {
      toast.error("Failed to update plan status");
    }
    setLocking(false);
    setLockModal(null);
  }

  return (
    <div className="flex min-h-full flex-col -m-4 animate-slide-in sm:-m-6 bg-slate-50">
      {/* Locked banner */}
      {isLocked && (
        <div className="flex items-center justify-center gap-2 bg-indigo-600 px-4 py-1.5 text-center text-xs text-white">
          <Lock className="h-3 w-3" />
          Plan locked for execution
          {planLockedAt && (
            <span className="text-indigo-300">
              · {new Date(planLockedAt).toLocaleDateString([], { month: "short", day: "numeric" })}
            </span>
          )}
        </div>
      )}

      {/* Compact title bar */}
      <div className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Back */}
          <Link
            href="/events"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>

          {/* Editable title */}
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            disabled={isLocked}
            className="-mx-1.5 min-w-0 flex-1 rounded-lg bg-transparent px-1.5 py-1 text-base font-semibold text-slate-900 outline-none transition-colors placeholder:text-slate-300 hover:bg-slate-50 focus:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            placeholder="Untitled Event"
          />

          {/* Status badge — clickable to update */}
          <div className="relative shrink-0" ref={statusRef}>
            <button
              onClick={() => !isLocked && setStatusOpen(!statusOpen)}
              className={cn(
                "flex items-center gap-1 transition-opacity",
                isLocked ? "cursor-default" : "hover:opacity-75"
              )}
            >
              <Badge variant="status" value={status} />
              {!isLocked && <ChevronDown className="h-3 w-3 text-slate-400" />}
            </button>
            {statusOpen && !isLocked && (
              <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-2xl border border-slate-200 bg-white py-1 shadow-lg animate-fade-in">
                {EVENT_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-slate-50",
                      s === status && "bg-slate-50"
                    )}
                  >
                    <Badge variant="status" value={s} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Members */}
          <div className="hidden items-center gap-2 sm:flex shrink-0">
            <AvatarStack users={members} max={4} size="xs" />
            <button className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-dashed border-slate-300 text-slate-400 transition-colors hover:border-brand-blue hover:text-brand-blue">
              <UserPlus className="h-3 w-3" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2">
            {showReport && (
              <Link
                href={`/events/${eventId}/report`}
                className="hidden items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 sm:inline-flex"
              >
                <FileBarChart className="h-3.5 w-3.5" />
                Report
              </Link>
            )}
            {canLock && (
              <button
                onClick={() => setLockModal(isLocked ? "unlock" : "lock")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all",
                  isLocked
                    ? "border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                    : "bg-slate-900 text-white hover:bg-slate-800"
                )}
              >
                {isLocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{isLocked ? "Unlock" : "Lock Plan"}</span>
              </button>
            )}
            <div className="hidden sm:block">
              <SaveIndicator status={saveStatus} />
            </div>
          </div>
        </div>
      </div>

      {/* Workflow step navigation */}
      <div className="border-b border-slate-200 bg-white">
        <nav className="hide-scrollbar flex items-center overflow-x-auto px-4 sm:px-6">
          {workflowSteps.map((step, index) => {
            const Icon = step.icon;
            const active = currentStep.href === step.href;
            const complete = index < currentStepIndex;

            return (
              <div key={step.href} className="flex shrink-0 items-center">
                <Link
                  href={`${baseTabPath}/${step.href}`}
                  className={cn(
                    "flex items-center gap-2 border-b-2 px-3 py-3.5 text-sm font-medium whitespace-nowrap transition-colors",
                    active
                      ? "border-brand-blue text-brand-blue"
                      : complete
                      ? "border-transparent text-slate-500 hover:text-slate-700"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                      active
                        ? "bg-brand-blue text-white"
                        : complete
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-200 text-slate-500"
                    )}
                  >
                    {complete ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <span className="text-[10px] font-bold leading-none">{index + 1}</span>
                    )}
                  </span>
                  <span className="hidden sm:inline">{step.label}</span>
                  <Icon className={cn("h-3.5 w-3.5 sm:hidden", active ? "text-brand-blue" : "text-slate-400")} />
                </Link>
                {index < workflowSteps.length - 1 && (
                  <ChevronRight className="mx-0.5 h-3.5 w-3.5 shrink-0 text-slate-300" />
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Page content */}
      <div className="flex-1 p-4 sm:p-6">
        <div className="workflow-panel rounded-[24px] border border-slate-200/80 p-4 shadow-[0_8px_40px_rgba(15,23,42,0.06)] sm:rounded-[28px] sm:p-6">
          {children}
        </div>
      </div>

      {/* Lock confirmation modal */}
      {lockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setLockModal(null)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <button
              onClick={() => setLockModal(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>

            <div className={cn(
              "mb-4 flex h-10 w-10 items-center justify-center rounded-xl",
              lockModal === "lock" ? "bg-slate-900" : "bg-indigo-50"
            )}>
              {lockModal === "lock"
                ? <Lock className="h-5 w-5 text-white" />
                : <Unlock className="h-5 w-5 text-indigo-600" />
              }
            </div>

            <h2 className="mb-2 text-base font-semibold text-slate-800">
              {lockModal === "lock" ? "Lock Plan for Execution?" : "Unlock Plan?"}
            </h2>
            <p className="mb-6 text-sm text-slate-500">
              {lockModal === "lock"
                ? "Once locked, the plan moves to execution. Specifications become read-only. You can unlock if changes are needed."
                : "This will return the event to planning mode. Specifications will be editable again and a note will be posted to the team chat."}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setLockModal(null)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm text-slate-600 transition-colors hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLockToggle}
                disabled={locking}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-white transition-all",
                  lockModal === "lock" ? "bg-slate-900 hover:bg-slate-800" : "bg-indigo-600 hover:bg-indigo-700",
                  locking && "cursor-not-allowed opacity-60"
                )}
              >
                {locking ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : lockModal === "lock" ? (
                  <><Lock className="h-3.5 w-3.5" /> Lock Plan</>
                ) : (
                  <><Unlock className="h-3.5 w-3.5" /> Unlock Plan</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
