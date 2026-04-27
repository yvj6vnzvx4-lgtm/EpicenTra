import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AgentPanel } from "@/components/events/agent/agent-panel";

interface Props {
  params: Promise<{ eventId: string }>;
}

export default async function AgentPage({ params }: Props) {
  const { eventId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const event = await prisma.event.findFirst({
    where: { id: eventId, organizationId: session.user.organizationId },
  });
  if (!event) redirect("/dashboard");

  const tasks = await prisma.agentTask.findMany({
    where: { eventId },
    include: { createdBy: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { createdAt: "desc" },
  });

  const serialized = tasks.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    completedAt: t.completedAt?.toISOString() ?? null,
    resultMeta: t.resultMeta as Record<string, unknown> | null,
  }));

  return <AgentPanel eventId={eventId} initialTasks={serialized} />;
}
