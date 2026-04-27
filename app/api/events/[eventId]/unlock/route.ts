import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { role, id: userId, name: userName } = session.user;
  if (role !== "ADMIN" && role !== "DIRECTOR") {
    return NextResponse.json({ error: "Only Directors and Admins can unlock the plan" }, { status: 403 });
  }

  const event = await prisma.event.findFirst({
    where: { id: eventId, organizationId: session.user.organizationId },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [updated] = await prisma.$transaction([
    prisma.event.update({
      where: { id: eventId },
      data: { status: "PLANNING", planLockedAt: null },
    }),
    prisma.note.create({
      data: {
        content: `Plan unlocked by ${userName} — returning to planning mode.`,
        type: "SYSTEM",
        eventId: eventId,
        userId,
      },
    }),
  ]);

  return NextResponse.json(updated);
}
