import { prisma } from "./prisma";

export async function getAnalyticsData(organizationId: string) {
  const events = await prisma.event.findMany({
    where: { organizationId, deletedAt: null },
    include: {
      budgetItems: true,
      notes: { include: { user: { select: { id: true, name: true } } } },
      agentTasks: true,
      checklist: true,
      members: { include: { user: { select: { id: true, name: true } } } },
      owner: { select: { id: true, name: true } },
    },
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);

  // ── Overview ──────────────────────────────────────────────────────────────
  const totalEvents = events.length;
  const thisMonth = events.filter((e) => new Date(e.createdAt) >= startOfMonth).length;
  const thisQuarter = events.filter((e) => new Date(e.createdAt) >= startOfQuarter).length;

  const allBudgetEstimated = events.reduce(
    (s, e) => s + e.budgetItems.reduce((b, i) => b + Number(i.estimated), 0),
    0
  );
  const avgBudget = totalEvents > 0 ? allBudgetEstimated / totalEvents : 0;

  const statusCounts: Record<string, number> = {};
  for (const e of events) {
    statusCounts[e.status] = (statusCounts[e.status] ?? 0) + 1;
  }
  const byStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

  // ── Budget ────────────────────────────────────────────────────────────────
  const budgetByEvent = events
    .filter((e) => e.budgetItems.length > 0)
    .map((e) => ({
      name: e.title.length > 20 ? e.title.slice(0, 20) + "…" : e.title,
      estimated: e.budgetItems.reduce((s, i) => s + Number(i.estimated), 0),
      actual: e.budgetItems.reduce((s, i) => s + Number(i.actual ?? 0), 0),
    }))
    .sort((a, b) => b.estimated - a.estimated)
    .slice(0, 8);

  const categoryTotals: Record<string, number> = {};
  for (const e of events) {
    for (const item of e.budgetItems) {
      const cat = item.category || "Other";
      categoryTotals[cat] = (categoryTotals[cat] ?? 0) + Number(item.estimated);
    }
  }
  const budgetByCategory = Object.entries(categoryTotals)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  const topVariances = events
    .filter((e) => e.budgetItems.some((i) => i.actual))
    .map((e) => {
      const est = e.budgetItems.reduce((s, i) => s + Number(i.estimated), 0);
      const act = e.budgetItems.reduce((s, i) => s + Number(i.actual ?? 0), 0);
      const variance = act - est;
      const pct = est > 0 ? Math.round((variance / est) * 100) : 0;
      return { name: e.title.length > 22 ? e.title.slice(0, 22) + "…" : e.title, variance, pct };
    })
    .filter((e) => e.variance !== 0)
    .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
    .slice(0, 5);

  // ── Timeline ─────────────────────────────────────────────────────────────
  const planningDurations: number[] = [];
  const executionDurations: number[] = [];

  for (const e of events) {
    if (e.planLockedAt) {
      const days = (e.planLockedAt.getTime() - e.createdAt.getTime()) / 86400000;
      planningDurations.push(days);
    }
    if (e.planLockedAt && e.startDate) {
      const days = (e.startDate.getTime() - e.planLockedAt.getTime()) / 86400000;
      if (days > 0) executionDurations.push(days);
    }
  }

  const avgPlanningDays =
    planningDurations.length > 0
      ? Math.round(planningDurations.reduce((s, d) => s + d, 0) / planningDurations.length)
      : null;
  const avgExecutionDays =
    executionDurations.length > 0
      ? Math.round(executionDurations.reduce((s, d) => s + d, 0) / executionDurations.length)
      : null;

  const timelineEvents = events
    .filter((e) => e.startDate)
    .map((e) => ({
      name: e.title.length > 24 ? e.title.slice(0, 24) + "…" : e.title,
      startDate: e.startDate!.toISOString(),
      endDate: e.endDate?.toISOString() ?? e.startDate!.toISOString(),
      status: e.status,
    }))
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  // ── Team Activity ─────────────────────────────────────────────────────────
  const notesPerEvent = events
    .map((e) => ({
      name: e.title.length > 20 ? e.title.slice(0, 20) + "…" : e.title,
      count: e.notes.filter((n) => n.type === "USER").length,
    }))
    .filter((e) => e.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const agentTasksTotal = events.reduce((s, e) => s + e.agentTasks.length, 0);
  const agentTasksCompleted = events.reduce(
    (s, e) => s + e.agentTasks.filter((t) => t.status === "COMPLETED").length,
    0
  );

  // Message counts per user
  const memberCounts: Record<string, { name: string; count: number }> = {};
  for (const e of events) {
    for (const note of e.notes) {
      if (note.type === "USER" && note.user) {
        const key = note.user.id;
        memberCounts[key] = {
          name: note.user.name,
          count: (memberCounts[key]?.count ?? 0) + 1,
        };
      }
    }
  }
  const topMembers = Object.values(memberCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    overview: { totalEvents, thisQuarter, thisMonth, totalBudgetDeployed: allBudgetEstimated, avgBudget, byStatus },
    budget: { byEvent: budgetByEvent, byCategory: budgetByCategory, topVariances },
    timeline: { avgPlanningDays, avgExecutionDays, events: timelineEvents },
    teamActivity: { notesPerEvent, agentTasksTotal, agentTasksCompleted, topMembers },
  };
}

export type AnalyticsData = Awaited<ReturnType<typeof getAnalyticsData>>;
