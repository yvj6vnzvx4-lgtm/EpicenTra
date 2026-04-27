import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { EventReport } from "@/components/analytics/event-report";

interface Props {
  params: Promise<{ eventId: string }>;
}

export default async function ReportPage({ params }: Props) {
  const { eventId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const event = await prisma.event.findFirst({
    where: { id: eventId, organizationId: session.user.organizationId },
    include: {
      budgetItems: { orderBy: { category: "asc" } },
      checklist: { orderBy: { sortOrder: "asc" } },
      agentTasks: { where: { status: "COMPLETED" }, orderBy: { createdAt: "desc" } },
      notes: {
        where: { isPinned: true },
        orderBy: { createdAt: "asc" },
        include: { user: { select: { name: true } } },
      },
    },
  });
  if (!event) redirect("/dashboard");

  const totalEstimated = event.budgetItems.reduce((s, i) => s + Number(i.estimated), 0);
  const totalActual = event.budgetItems.reduce((s, i) => s + Number(i.actual ?? 0), 0);
  const checklistDone = event.checklist.filter((c) => c.isCompleted).length;

  return (
    <EventReport
      event={{
        id: event.id,
        title: event.title,
        status: event.status,
        description: event.description,
        startDate: event.startDate?.toISOString() ?? null,
        endDate: event.endDate?.toISOString() ?? null,
        venueName: event.venueName,
        venueCity: event.venueCity,
        venueState: event.venueState,
        expectedAttendance: event.expectedAttendance,
        totalBudget: event.totalBudget ? Number(event.totalBudget) : null,
      }}
      checklistItems={event.checklist.map((c) => ({
        title: c.title,
        isCompleted: c.isCompleted,
        dueDate: c.dueDate?.toISOString().slice(0, 10) ?? null,
      }))}
      budgetSummary={{
        totalEstimated,
        totalActual,
        variance: totalActual - totalEstimated,
        variancePct: totalEstimated > 0 ? Math.round(((totalActual - totalEstimated) / totalEstimated) * 100) : 0,
        items: event.budgetItems.map((b) => ({
          category: b.category,
          description: b.description,
          estimated: Number(b.estimated),
          actual: b.actual != null ? Number(b.actual) : null,
        })),
      }}
      checklist={{
        total: event.checklist.length,
        completed: checklistDone,
        pct: event.checklist.length > 0 ? Math.round((checklistDone / event.checklist.length) * 100) : 0,
      }}
      decisions={event.notes.map((n) => ({
        content: n.content,
        author: n.user?.name ?? "Team",
        createdAt: n.createdAt.toISOString(),
      }))}
      agentTasks={event.agentTasks.map((t) => ({
        prompt: t.prompt,
        result: t.result,
        createdAt: t.createdAt.toISOString(),
      }))}
    />
  );
}
