import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DesignStudioShell } from "@/components/events/design/design-studio-shell";
import type { LayoutData } from "@/components/events/design/types";

export default async function DesignPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const event = await prisma.event.findFirst({
    where: { id: eventId, organizationId: session.user.organizationId },
    select: { id: true, layoutData: true },
  });
  if (!event) notFound();

  return (
    <DesignStudioShell
      eventId={event.id}
      initialLayout={event.layoutData as LayoutData | null}
    />
  );
}
