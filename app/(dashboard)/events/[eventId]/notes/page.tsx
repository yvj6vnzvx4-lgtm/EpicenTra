import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { NotesChat } from "@/components/events/notes/notes-chat";

interface Props {
  params: Promise<{ eventId: string }>;
}

export default async function NotesPage({ params }: Props) {
  const { eventId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const event = await prisma.event.findFirst({
    where: { id: eventId, organizationId: session.user.organizationId },
  });
  if (!event) redirect("/dashboard");

  const notes = await prisma.note.findMany({
    where: { eventId },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { createdAt: "asc" },
  });

  const serialized = notes.map((n) => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
    metadata: undefined,
  }));

  return (
    <div className="h-full flex flex-col min-h-0" style={{ height: "calc(100vh - 120px)" }}>
      <NotesChat eventId={eventId} initialNotes={serialized} />
    </div>
  );
}
