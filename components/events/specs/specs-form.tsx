/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  DollarSign,
  Flag,
  MapPin,
  Palette,
  Users,
  WalletCards,
} from "lucide-react";
import { useAutoSave, SaveIndicator } from "@/lib/hooks/use-auto-save";
import { BudgetTable } from "./budget-table";
import { VendorTable } from "./vendor-table";
import { StaffTable } from "./staff-table";
import { ChecklistSection } from "./checklist-section";
import { ObjectivesInput } from "./objectives-input";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
];

interface SpecsFormProps {
  eventId: string;
  isLocked?: boolean;
  initialData: {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    timezone: string;
    venueName: string;
    venueAddress: string;
    venueCity: string;
    venueState: string;
    venueZip: string;
    venueNotes: string;
    objectives: string[];
    targetAudience: string;
    expectedAttendance: string | number;
    brandGuidelines: string;
    totalBudget: string | number;
    budgetNotes: string;
  };
  initialBudgetItems: Record<string, unknown>[];
  initialVendors: Record<string, unknown>[];
  initialStaffSlots: Record<string, unknown>[];
  initialChecklist: Record<string, unknown>[];
}

type PlannerStage = {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  tip: string;
  icon: React.ComponentType<{ className?: string }>;
  iconIdle: string;
  iconActive: string;
};

const STAGES: PlannerStage[] = [
  {
    id: "brief",
    title: "Brief & Goals",
    eyebrow: "Frame",
    description: "Define what this event is trying to achieve before the team starts making logistics decisions.",
    tip: "Write the event description like a one-paragraph brief a producer could hand to a teammate.",
    icon: Flag,
    iconIdle: "bg-sky-100 text-sky-600",
    iconActive: "bg-gradient-to-br from-sky-500 to-cyan-400 text-white",
  },
  {
    id: "logistics",
    title: "Date & Venue",
    eyebrow: "Ground",
    description: "Lock down where and when the event happens so every downstream decision has real-world constraints.",
    tip: "If venue details are incomplete, use notes to capture unknowns instead of leaving the team guessing.",
    icon: MapPin,
    iconIdle: "bg-emerald-100 text-emerald-600",
    iconActive: "bg-gradient-to-br from-emerald-500 to-teal-400 text-white",
  },
  {
    id: "audience",
    title: "Audience & Outcomes",
    eyebrow: "Align",
    description: "Connect the event’s goals to the people it is designed for and the turnout you expect.",
    tip: "Use objective bullets that are measurable or observable during the event, not just aspirational.",
    icon: Users,
    iconIdle: "bg-violet-100 text-violet-600",
    iconActive: "bg-gradient-to-br from-violet-500 to-purple-400 text-white",
  },
  {
    id: "brand",
    title: "Brand System",
    eyebrow: "Guide",
    description: "Capture the visual and messaging rules that vendors, designers, and producers should follow.",
    tip: "Treat this like a compact creative brief. Include tone, colors, do’s, and don’ts.",
    icon: Palette,
    iconIdle: "bg-rose-100 text-rose-600",
    iconActive: "bg-gradient-to-br from-rose-500 to-pink-400 text-white",
  },
  {
    id: "budget",
    title: "Budget Planning",
    eyebrow: "Control",
    description: "Turn the event plan into cost categories, approvals, and a clear remaining budget picture.",
    tip: "List every known cost early. A rough item is better than a hidden expense.",
    icon: DollarSign,
    iconIdle: "bg-amber-100 text-amber-600",
    iconActive: "bg-gradient-to-br from-amber-500 to-yellow-400 text-white",
  },
  {
    id: "vendors",
    title: "Vendor Plan",
    eyebrow: "Source",
    description: "Track the external partners needed to actually deliver the experience on site.",
    tip: "Keep vendor status current so the team can see what is still exploratory versus committed.",
    icon: WalletCards,
    iconIdle: "bg-indigo-100 text-indigo-600",
    iconActive: "bg-gradient-to-br from-indigo-500 to-blue-400 text-white",
  },
  {
    id: "staffing",
    title: "Staffing Plan",
    eyebrow: "Staff",
    description: "Make sure setup, guest experience, and teardown roles are covered before execution starts.",
    tip: "Think in moments of the event, not just job titles. Who owns setup, guest flow, and teardown?",
    icon: Users,
    iconIdle: "bg-orange-100 text-orange-600",
    iconActive: "bg-gradient-to-br from-orange-500 to-amber-400 text-white",
  },
  {
    id: "checklist",
    title: "Launch Checklist",
    eyebrow: "Execute",
    description: "Translate the whole plan into trackable tasks so the team can move confidently toward lock.",
    tip: "A checklist item should be specific enough that someone else could finish it without extra explanation.",
    icon: ClipboardList,
    iconIdle: "bg-teal-100 text-teal-600",
    iconActive: "bg-gradient-to-br from-teal-500 to-green-400 text-white",
  },
];

function formatDateLabel(value: string) {
  if (!value) return "Not scheduled";
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? "Not scheduled"
    : parsed.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function safeNumber(value: string | number) {
  if (value === "" || value == null) return null;
  const next = Number(value);
  return Number.isFinite(next) ? next : null;
}

export function SpecsForm({
  eventId,
  isLocked = false,
  initialData,
  initialBudgetItems,
  initialVendors,
  initialStaffSlots,
  initialChecklist,
}: SpecsFormProps) {
  const { saveStatus, debouncedSave, save } = useAutoSave(eventId);
  const [data, setData] = useState(initialData);
  const [activeStageId, setActiveStageId] = useState(() => {
    const totalBudget = safeNumber(initialData.totalBudget);
    const expectedAttendance = safeNumber(initialData.expectedAttendance);
    const initialCompletion = {
      brief: Boolean(initialData.description.trim()),
      logistics: Boolean(initialData.startDate || initialData.venueName || initialData.venueCity),
      audience:
        initialData.objectives.length > 0 ||
        Boolean(initialData.targetAudience.trim()) ||
        expectedAttendance != null,
      brand: Boolean(initialData.brandGuidelines.trim()),
      budget: totalBudget != null || initialBudgetItems.length > 0,
      vendors: initialVendors.length > 0,
      staffing: initialStaffSlots.length > 0,
      checklist: initialChecklist.length > 0,
    };

    return STAGES.find((stage) => !initialCompletion[stage.id as keyof typeof initialCompletion])?.id ?? STAGES[0].id;
  });

  function handleField(field: string, value: unknown) {
    setData((prev) => ({ ...prev, [field]: value }));
    debouncedSave({ [field]: value });
  }

  function handleImmediateField(field: string, value: unknown) {
    setData((prev) => ({ ...prev, [field]: value }));
    save({ [field]: value });
  }

  const stageCompletion = useMemo(() => {
    const totalBudget = safeNumber(data.totalBudget);
    const expectedAttendance = safeNumber(data.expectedAttendance);

    return {
      brief: Boolean(data.description.trim()),
      logistics: Boolean(data.startDate || data.venueName || data.venueCity),
      audience: data.objectives.length > 0 || Boolean(data.targetAudience.trim()) || expectedAttendance != null,
      brand: Boolean(data.brandGuidelines.trim()),
      budget: totalBudget != null || initialBudgetItems.length > 0,
      vendors: initialVendors.length > 0,
      staffing: initialStaffSlots.length > 0,
      checklist: initialChecklist.length > 0,
    };
  }, [data, initialBudgetItems.length, initialChecklist.length, initialStaffSlots.length, initialVendors.length]);

  const completedStages = STAGES.filter((stage) => stageCompletion[stage.id as keyof typeof stageCompletion]).length;
  const progressPercent = Math.round((completedStages / STAGES.length) * 100);

  const summaryCards = [
    {
      label: "Event Window",
      value: data.startDate ? `${formatDateLabel(data.startDate)}${data.endDate ? ` to ${formatDateLabel(data.endDate)}` : ""}` : "Add dates",
      hint: data.timezone || "Timezone not set",
      icon: CalendarDays,
      iconClass: "text-blue-500",
    },
    {
      label: "Venue",
      value: data.venueName || "Choose a venue",
      hint: [data.venueCity, data.venueState].filter(Boolean).join(", ") || "Location still open",
      icon: MapPin,
      iconClass: "text-emerald-500",
    },
    {
      label: "Audience",
      value: data.targetAudience || "Define your audience",
      hint: safeNumber(data.expectedAttendance) != null ? `${safeNumber(data.expectedAttendance)} expected attendees` : "Attendance still unestimated",
      icon: Users,
      iconClass: "text-violet-500",
    },
    {
      label: "Budget",
      value: safeNumber(data.totalBudget) != null ? `$${safeNumber(data.totalBudget)?.toLocaleString()}` : "Set total budget",
      hint: initialBudgetItems.length > 0 ? `${initialBudgetItems.length} line items started` : "No line items yet",
      icon: DollarSign,
      iconClass: "text-amber-500",
    },
  ];

  const stageSnapshots = {
    brief: data.description.trim() ? "Event brief captured" : "Add the event story and success signal",
    logistics:
      [data.startDate ? formatDateLabel(data.startDate) : "", data.venueName || data.venueCity || ""]
        .filter(Boolean)
        .join(" · ") || "Dates and venue still open",
    audience:
      data.targetAudience.trim() ||
      (safeNumber(data.expectedAttendance) != null
        ? `${safeNumber(data.expectedAttendance)} expected attendees`
        : "Define audience and turnout goals"),
    brand: data.brandGuidelines.trim() ? "Creative rules documented" : "Capture visual and messaging direction",
    budget:
      initialBudgetItems.length > 0
        ? `${initialBudgetItems.length} budget lines in progress`
        : safeNumber(data.totalBudget) != null
          ? `Budget cap: $${safeNumber(data.totalBudget)?.toLocaleString()}`
          : "Set the budget frame",
    vendors:
      initialVendors.length > 0 ? `${initialVendors.length} vendor records active` : "No vendors tracked yet",
    staffing:
      initialStaffSlots.length > 0 ? `${initialStaffSlots.length} staffing roles planned` : "No staffing coverage yet",
    checklist:
      initialChecklist.length > 0 ? `${initialChecklist.length} launch tasks active` : "Checklist still empty",
  } satisfies Record<string, string>;

  return (
    <fieldset disabled={isLocked} className="space-y-8 disabled:pointer-events-none disabled:opacity-60">
      {isLocked && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
          <span className="font-medium">Specifications are read-only.</span>{" "}
          <span className="text-indigo-500">Unlock the plan to continue editing this workflow.</span>
        </div>
      )}

      {!isLocked && (
        <div className="flex justify-end">
          <SaveIndicator status={saveStatus} />
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_310px]">
        <div className="space-y-6">
          <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(145deg,#ffffff_0%,#f8fbff_100%)] p-4 sm:rounded-[28px] sm:p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-5 sm:gap-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0">
                  <span className="rounded-full bg-sky-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700">
                    Guided Planner
                  </span>
                  <h2 className="mt-3 text-xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                    Build the event plan from brief to execution readiness
                  </h2>
                </div>

                <div className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm lg:w-auto lg:min-w-[220px]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Plan Completion
                  </p>
                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-3xl font-bold text-slate-950">{progressPercent}%</span>
                    <span className="pb-1 text-xs text-slate-500">{completedStages} of {STAGES.length} stages active</span>
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full bg-[linear-gradient(90deg,#0ea5e9,#6366f1,#14b8a6)] transition-all"
                      style={{ width: `${Math.max(progressPercent, 8)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
                {summaryCards.map(({ label, value, hint, icon: Icon, iconClass }) => (
                  <div key={label} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 sm:px-4 sm:py-4 shadow-sm">
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      <Icon className={`h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 ${iconClass}`} />
                      <span className="truncate">{label}</span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs sm:text-sm font-semibold text-slate-900">{value}</p>
                    <p className="mt-0.5 text-[11px] leading-4 text-slate-500 hidden sm:block">{hint}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar xl:hidden">
                {STAGES.map((stage) => {
                  const active = activeStageId === stage.id;
                  const complete = stageCompletion[stage.id as keyof typeof stageCompletion];
                  const Icon = stage.icon;
                  return (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => setActiveStageId(stage.id)}
                      className={`min-w-[185px] rounded-2xl border px-3 py-3 text-left transition ${
                        active
                          ? "border-sky-300 bg-sky-50 shadow-sm"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                          complete ? "bg-emerald-500 text-white" : active ? stage.iconActive : stage.iconIdle
                        }`}>
                          {complete ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">{stage.title}</p>
                          <p className="text-xs text-slate-500">{stageSnapshots[stage.id]}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <PlannerSection
            stage={STAGES[0]}
            completed={stageCompletion.brief}
            snapshot={stageSnapshots.brief}
            isOpen={activeStageId === STAGES[0].id}
            onToggle={() => setActiveStageId((current) => (current === STAGES[0].id ? "" : STAGES[0].id))}
          >
            <Field label="Event Description">
              <textarea
                rows={5}
                value={data.description}
                onChange={(e) => handleField("description", e.target.value)}
                placeholder="Describe the event concept, why it matters, and what success should feel like for guests and stakeholders."
                className="input-base resize-none"
              />
            </Field>
          </PlannerSection>

          <PlannerSection
            stage={STAGES[1]}
            completed={stageCompletion.logistics}
            snapshot={stageSnapshots.logistics}
            isOpen={activeStageId === STAGES[1].id}
            onToggle={() => setActiveStageId((current) => (current === STAGES[1].id ? "" : STAGES[1].id))}
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <Field label="Start Date">
                <input
                  type="date"
                  value={data.startDate}
                  onChange={(e) => handleImmediateField("startDate", e.target.value || null)}
                  className="input-base"
                />
              </Field>
              <Field label="End Date">
                <input
                  type="date"
                  value={data.endDate}
                  onChange={(e) => handleImmediateField("endDate", e.target.value || null)}
                  className="input-base"
                />
              </Field>
              <Field label="Timezone">
                <select
                  value={data.timezone}
                  onChange={(e) => handleImmediateField("timezone", e.target.value)}
                  className="input-base"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Venue Name">
                <input
                  type="text"
                  value={data.venueName}
                  onChange={(e) => handleField("venueName", e.target.value)}
                  placeholder="Spring Studios"
                  className="input-base"
                />
              </Field>
              <Field label="Street Address" className="lg:col-span-2">
                <input
                  type="text"
                  value={data.venueAddress}
                  onChange={(e) => handleField("venueAddress", e.target.value)}
                  placeholder="123 Main St"
                  className="input-base"
                />
              </Field>
              <Field label="City">
                <input
                  type="text"
                  value={data.venueCity}
                  onChange={(e) => handleField("venueCity", e.target.value)}
                  placeholder="New York"
                  className="input-base"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="State">
                  <input
                    type="text"
                    value={data.venueState}
                    onChange={(e) => handleField("venueState", e.target.value)}
                    placeholder="NY"
                    maxLength={2}
                    className="input-base uppercase"
                  />
                </Field>
                <Field label="ZIP">
                  <input
                    type="text"
                    value={data.venueZip}
                    onChange={(e) => handleField("venueZip", e.target.value)}
                    placeholder="10013"
                    className="input-base"
                  />
                </Field>
              </div>
              <Field label="Venue Notes" className="lg:col-span-2">
                <textarea
                  rows={3}
                  value={data.venueNotes}
                  onChange={(e) => handleField("venueNotes", e.target.value)}
                  placeholder="Loading dock access, setup windows, parking rules, power constraints, security checkpoints..."
                  className="input-base resize-none"
                />
              </Field>
            </div>
          </PlannerSection>

          <PlannerSection
            stage={STAGES[2]}
            completed={stageCompletion.audience}
            snapshot={stageSnapshots.audience}
            isOpen={activeStageId === STAGES[2].id}
            onToggle={() => setActiveStageId((current) => (current === STAGES[2].id ? "" : STAGES[2].id))}
          >
            <div className="space-y-5">
              <Field label="Objectives">
                <ObjectivesInput
                  values={data.objectives}
                  onChange={(vals) => {
                    setData((prev) => ({ ...prev, objectives: vals }));
                    debouncedSave({ objectives: JSON.stringify(vals) });
                  }}
                />
              </Field>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                <Field label="Target Audience">
                  <textarea
                    rows={3}
                    value={data.targetAudience}
                    onChange={(e) => handleField("targetAudience", e.target.value)}
                    placeholder="Sneakerheads and urban fashion enthusiasts, ages 18-35, highly engaged on social."
                    className="input-base resize-none"
                  />
                </Field>
                <Field label="Expected Attendance">
                  <input
                    type="number"
                    min={0}
                    value={data.expectedAttendance}
                    onChange={(e) =>
                      handleField("expectedAttendance", e.target.value ? Number(e.target.value) : null)
                    }
                    placeholder="500"
                    className="input-base"
                  />
                </Field>
              </div>
            </div>
          </PlannerSection>

          <PlannerSection
            stage={STAGES[3]}
            completed={stageCompletion.brand}
            snapshot={stageSnapshots.brand}
            isOpen={activeStageId === STAGES[3].id}
            onToggle={() => setActiveStageId((current) => (current === STAGES[3].id ? "" : STAGES[3].id))}
          >
            <Field label="Brand Guidelines (Markdown supported)">
              <textarea
                rows={9}
                value={data.brandGuidelines}
                onChange={(e) => handleField("brandGuidelines", e.target.value)}
                placeholder={`## Colors\n- Primary: #FF6B35\n- Secondary: #1A1A2E\n\n## Messaging\nBold, energetic, inclusive…\n\n## Do's\n- Use lifestyle photography\n\n## Don'ts\n- No competitor references`}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 font-mono text-sm text-slate-800 placeholder:text-slate-400 transition-all hover:border-slate-300 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </Field>
          </PlannerSection>

          <PlannerSection
            stage={STAGES[4]}
            completed={stageCompletion.budget}
            snapshot={stageSnapshots.budget}
            isOpen={activeStageId === STAGES[4].id}
            onToggle={() => setActiveStageId((current) => (current === STAGES[4].id ? "" : STAGES[4].id))}
          >
            <div className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                <Field label="Total Budget ($)">
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={data.totalBudget}
                    onChange={(e) =>
                      handleField("totalBudget", e.target.value ? Number(e.target.value) : null)
                    }
                    placeholder="85000"
                    className="input-base"
                  />
                </Field>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-600">
                  Track the cap first, then refine line items.
                </div>
              </div>
              <BudgetTable
                eventId={eventId}
                initialItems={initialBudgetItems as any}
                totalBudget={safeNumber(data.totalBudget)}
              />
            </div>
          </PlannerSection>

          <PlannerSection
            stage={STAGES[5]}
            completed={stageCompletion.vendors}
            snapshot={stageSnapshots.vendors}
            isOpen={activeStageId === STAGES[5].id}
            onToggle={() => setActiveStageId((current) => (current === STAGES[5].id ? "" : STAGES[5].id))}
          >
            <VendorTable eventId={eventId} initialItems={initialVendors as any} />
          </PlannerSection>

          <PlannerSection
            stage={STAGES[6]}
            completed={stageCompletion.staffing}
            snapshot={stageSnapshots.staffing}
            isOpen={activeStageId === STAGES[6].id}
            onToggle={() => setActiveStageId((current) => (current === STAGES[6].id ? "" : STAGES[6].id))}
          >
            <StaffTable eventId={eventId} initialItems={initialStaffSlots as any} />
          </PlannerSection>

          <PlannerSection
            stage={STAGES[7]}
            completed={stageCompletion.checklist}
            snapshot={stageSnapshots.checklist}
            isOpen={activeStageId === STAGES[7].id}
            onToggle={() => setActiveStageId((current) => (current === STAGES[7].id ? "" : STAGES[7].id))}
          >
            <ChecklistSection eventId={eventId} initialItems={initialChecklist as any} />
          </PlannerSection>
        </div>

        <aside className="hidden space-y-4 xl:sticky xl:top-6 xl:block xl:self-start">
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Stage Checklist
            </p>
            <div className="mt-4 space-y-3">
              {STAGES.map((stage) => {
                const complete = stageCompletion[stage.id as keyof typeof stageCompletion];
                const active = activeStageId === stage.id;
                const Icon = stage.icon;
                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => setActiveStageId(stage.id)}
                    className={`w-full rounded-2xl border px-3 py-3 text-left transition-colors ${
                      active
                        ? "border-sky-200 bg-sky-50"
                        : complete
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-2xl ${
                        complete ? "bg-emerald-500 text-white" : active ? stage.iconActive : stage.iconIdle
                      }`}>
                        {complete ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{stage.title}</p>
                        <p className="text-xs text-slate-500 truncate">{complete || active ? stageSnapshots[stage.id] : "Needs attention"}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </fieldset>
  );
}

function PlannerSection({
  stage,
  completed,
  snapshot,
  isOpen,
  onToggle,
  children,
}: {
  stage: PlannerStage;
  completed: boolean;
  snapshot: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const Icon = stage.icon;

  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 px-5 py-5 text-left transition hover:bg-slate-50 sm:px-6"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
            completed ? "bg-emerald-500 text-white" : isOpen ? stage.iconActive : stage.iconIdle
          }`}>
            {completed ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {stage.eyebrow}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                completed
                  ? "bg-emerald-100 text-emerald-700"
                  : isOpen
                  ? "bg-sky-100 text-sky-700"
                  : "bg-slate-100 text-slate-500"
              }`}>
                {completed ? "Done" : isOpen ? "Active" : "To Do"}
              </span>
            </div>
            <h3 className="mt-0.5 text-lg font-semibold tracking-tight text-slate-950 sm:text-xl">{stage.title}</h3>
            {!isOpen && <p className="mt-0.5 text-sm text-slate-500 truncate">{snapshot}</p>}
          </div>
        </div>
        <ChevronDown
          className={`mt-1 h-5 w-5 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="border-t border-slate-200 px-5 py-5 sm:px-6 space-y-5">
          <p className="text-sm leading-6 text-slate-500">{stage.description}</p>
          {children}
          {stage.tip && (
            <div className="flex gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
              <span className="mt-0.5 text-sky-500 shrink-0">💡</span>
              <p className="text-sm text-sky-700 leading-5">
                <span className="font-semibold">Tip: </span>{stage.tip}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </label>
      {children}
    </div>
  );
}
