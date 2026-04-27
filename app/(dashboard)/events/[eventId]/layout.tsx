import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WorkspaceShell } from "@/components/events/workspace-shell";

async function getEvent(eventId: string, organizationId: string) {
  return prisma.event.findFirst({
    where: { id: eventId, organizationId },
    include: {
      owner: { select: { id: true, name: true, avatarUrl: true } },
      members: {
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      },
    },
  });
}

export default async function EventWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const event = await getEvent(eventId, session.user.organizationId);
  if (!event) notFound();

  const allMembers = [
    { id: event.owner.id, name: event.owner.name, avatarUrl: event.owner.avatarUrl },
    ...event.members.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      avatarUrl: m.user.avatarUrl,
    })),
  ];

  return (
    <WorkspaceShell
      eventId={event.id}
      initialTitle={event.title}
      initialStatus={event.status}
      planLockedAt={event.planLockedAt?.toISOString() ?? null}
      currentUserRole={session.user.role}
      members={allMembers}
    >
      {children}
    </WorkspaceShell>
  );
}
