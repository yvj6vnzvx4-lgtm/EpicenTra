import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ExecutionBoard } from "@/components/events/execution/execution-board";

interface Props {
  params: Promise<{ eventId: string }>;
}

export default async function ExecutionPage({ params }: Props) {
  const { eventId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const event = await prisma.event.findFirst({
    where: { id: eventId, organizationId: session.user.organizationId },
    include: {
      budgetItems: true,
      vendors: true,
      checklist: { orderBy: { sortOrder: "asc" } },
      agentTasks: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!event) redirect("/dashboard");

  if (event.status !== "PLAN_LOCKED" && event.status !== "IN_EXECUTION") {
    redirect(`/events/${eventId}/specs`);
  }

  return (
    <ExecutionBoard
      event={{
        title: event.title,
        status: event.status,
        startDate: event.startDate?.toISOString() ?? null,
        totalBudget: event.totalBudget ? Number(event.totalBudget) : null,
        planLockedAt: event.planLockedAt?.toISOString() ?? null,
      }}
      vendors={event.vendors}
      budgetItems={event.budgetItems.map((b) => ({
        ...b,
        estimated: Number(b.estimated),
        actual: b.actual != null ? Number(b.actual) : null,
      }))}
      checklist={event.checklist.map((c) => ({
        ...c,
        dueDate: c.dueDate?.toISOString() ?? null,
      }))}
      agentTasks={event.agentTasks.map((t) => ({
        ...t,
        createdAt: t.createdAt.toISOString(),
      }))}
    />
  );
}
