"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Lightbulb,
  Sparkles,
  Target,
  Users,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/section-card";

interface ActivationBriefValues {
  productName: string;
  productDescription: string;
  targetAudience: string;
  primaryGoal: string;
  budget: string;
  city: string;
  timing: string;
}

interface ActivationPlan {
  title: string;
  concept: string;
  summary: string;
  audienceFit: string;
  experienceHighlights: string[];
  objectives: string[];
  workflow: Array<{ stage: string; summary: string }>;
  checklist: Array<{ title: string; category: string }>;
  staffing: Array<{ roleName: string; quantity: number; notes?: string }>;
  vendors: Array<{ vendorName: string; category: string; notes?: string }>;
  budgetItems: Array<{ category: string; description: string; estimated: number }>;
  agentMessage: string;
}

const starterPrompt: ActivationBriefValues = {
  productName: "",
  productDescription: "",
  targetAudience: "",
  primaryGoal: "",
  budget: "",
  city: "",
  timing: "",
};

export function ActivationStudio() {
  const router = useRouter();
  const [form, setForm] = useState<ActivationBriefValues>(starterPrompt);
  const [plan, setPlan] = useState<ActivationPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField(field: keyof ActivationBriefValues, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/activation-studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Unable to generate an activation concept.");
        return;
      }
      setPlan(data.plan);
    } catch {
      setError("Unable to generate an activation concept right now.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateEvent() {
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/activation-studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, mode: "create" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Unable to create the event.");
        return;
      }
      router.push(`/events/${data.eventId}/design`);
      router.refresh();
    } catch {
      setError("Unable to create the event right now.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="rounded-[32px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_30px_90px_rgba(15,23,42,0.10)] backdrop-blur-sm">
      <div className="grid gap-4 xl:grid-cols-[400px_minmax(0,1fr)]">
        <div className="rounded-[28px] bg-[linear-gradient(160deg,#0D1B3E_0%,#132347_45%,#2B5CC8_100%)] p-5 text-white shadow-[0_28px_80px_rgba(13,27,62,0.24)]">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7DD3F0]">
            <Sparkles className="h-3.5 w-3.5" />
            Activation Brief
          </div>
          <h2 className="mt-3 text-xl font-bold tracking-tight leading-snug">
            Turn product strategy into a live activation plan
          </h2>

          <div className="mt-4 space-y-3">
            <FormField label="Product Name">
              <input
                value={form.productName}
                onChange={(e) => updateField("productName", e.target.value)}
                placeholder="e.g. Whitman Capstone Day 2026"
                className="studio-input"
              />
            </FormField>

            <FormField label="Product Description">
              <textarea
                value={form.productDescription}
                onChange={(e) => updateField("productDescription", e.target.value)}
                placeholder="A clean-energy beverage focused on sustained energy, no crash, and a bold visual identity."
                rows={2}
                className="studio-input resize-none"
              />
            </FormField>

            <FormField label="Target Audience">
              <textarea
                value={form.targetAudience}
                onChange={(e) => updateField("targetAudience", e.target.value)}
                placeholder="Urban Gen Z and younger millennials who care about performance, design, and social shareability."
                rows={2}
                className="studio-input resize-none"
              />
            </FormField>

            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Primary Goal">
                <input
                  value={form.primaryGoal}
                  onChange={(e) => updateField("primaryGoal", e.target.value)}
                  placeholder="Drive trial and social buzz"
                  className="studio-input"
                />
              </FormField>
              <FormField label="Budget">
                <input
                  type="number"
                  value={form.budget}
                  onChange={(e) => updateField("budget", e.target.value)}
                  placeholder="85000"
                  className="studio-input"
                />
              </FormField>
              <FormField label="City">
                <input
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="New York"
                  className="studio-input"
                />
              </FormField>
              <FormField label="Timing">
                <input
                  value={form.timing}
                  onChange={(e) => updateField("timing", e.target.value)}
                  placeholder="Late summer launch"
                  className="studio-input"
                />
              </FormField>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={handleGenerate} loading={loading} className="bg-white text-slate-950 hover:bg-slate-100 focus:ring-white">
              <Wand2 className="h-4 w-4" />
              Generate Activation
            </Button>
            <button
              type="button"
              onClick={() =>
                setForm({
                  productName: "Whitman Spring Capstone Day 2026",
                  productDescription: "Annual Whitman School of Management capstone pitch competition. 25 student teams present original business plans to 18 industry judges across 6 presentation rooms. Includes a judges lunch, awards reception, and winner announcement ceremony.",
                  targetAudience: "MBA and undergraduate students, industry judges, Whitman faculty and staff, and alumni attendees. 220 expected across students, judges, and guests.",
                  primaryGoal: "Run a seamless multi-room pitch competition and deliver a professional experience for judges and student teams",
                  budget: "6400",
                  city: "Syracuse, NY",
                  timing: "April 24, 2026 — Whitman School of Management",
                })
              }
              className="rounded-2xl border border-white/15 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10"
            >
              Load Example
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <SectionCard
            title="Activation Preview"
            icon={Bot}
            className="bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] py-3"
            contentClassName="hidden"
          >
            <></>
          </SectionCard>

          {plan ? (
            <>
              {/* Concept header row */}
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
                <div className="flex-1 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#EEF3FF] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2B5CC8]">
                    <Lightbulb className="h-3 w-3" />
                    Activation Concept
                  </div>
                  <h3 className="mt-2 text-lg font-bold tracking-tight text-slate-950">{plan.title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-slate-600">{plan.concept}</p>
                </div>
                <div className="rounded-[24px] bg-slate-950 px-4 py-3.5 text-white shadow-sm lg:w-[280px]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7DD3F0]">Agent Readout</p>
                  <p className="mt-1.5 line-clamp-3 text-sm leading-5 text-slate-300">{plan.agentMessage}</p>
                </div>
              </div>

              {/* Main grid */}
              <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_280px]">
                <div className="space-y-3">
                  <PreviewCard
                    icon={Target}
                    title="Why It Fits the Audience"
                    description={plan.audienceFit}
                    items={plan.experienceHighlights}
                  />
                  <PreviewCard
                    icon={Users}
                    title="Objectives"
                    description="Core outcomes the agent thinks the activation should optimize for."
                    items={plan.objectives}
                  />
                  <SectionCard title="Planning Sequence" icon={CheckCircle2} className="rounded-[24px]">
                    <div className="mt-3 space-y-2">
                      {plan.workflow.slice(0, 4).map((step, index) => (
                        <div key={`${step.stage}-${index}`} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-950">{step.stage}</p>
                            <p className="line-clamp-1 text-xs text-slate-500">{step.summary}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                </div>

                <div className="space-y-3">
                  <MiniListCard title="Checklist Draft" items={plan.checklist.map((item) => `${item.title} (${item.category})`)} />
                  <MiniListCard title="Staffing Draft" items={plan.staffing.map((item) => `${item.roleName} x${item.quantity}`)} />
                  <MiniListCard title="Vendor Draft" items={plan.vendors.map((item) => `${item.vendorName} (${item.category})`)} />
                  <MiniListCard title="Budget Draft" items={plan.budgetItems.map((item) => `${item.description} — $${item.estimated.toLocaleString()}`)} />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={handleCreateEvent} loading={creating}>
                  <ArrowRight className="h-4 w-4" />
                  Create Event From This Plan
                </Button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Regenerate
                </button>
              </div>
            </>
          ) : (
            <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
              <p className="text-base font-semibold text-slate-700">Start with product strategy</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Fill in the brief and click <span className="font-medium text-slate-700">Generate Activation</span> — the agent will return a full concept, workflow, staffing plan, vendor outline, and budget draft.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium uppercase tracking-wider text-slate-300">
        {label}
      </label>
      {children}
    </div>
  );
}

function PreviewCard({
  icon: Icon,
  title,
  description,
  items,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  items: string[];
}) {
  return (
    <SectionCard title={title} icon={Icon} className="rounded-[24px]">
      <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-600">{description}</p>
      <div className="mt-2 space-y-1.5">
        {items.slice(0, 3).map((item) => (
          <div key={item} className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700">
            {item}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function MiniListCard({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <SectionCard title={title} className="rounded-[20px] p-3">
      <div className="mt-2 space-y-1.5">
        {items.slice(0, 4).map((item) => (
          <div key={item} className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-700 truncate">
            {item}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
