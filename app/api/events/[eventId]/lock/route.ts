import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { role, id: userId, name: userName } = session.user;
  if (role !== "ADMIN" && role !== "DIRECTOR") {
    return NextResponse.json({ error: "Only Directors and Admins can lock the plan" }, { status: 403 });
  }

  const event = await prisma.event.findFirst({
    where: { id: params.eventId, organizationId: session.user.organizationId },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [updated] = await prisma.$transaction([
    prisma.event.update({
      where: { id: params.eventId },
      data: { status: "PLAN_LOCKED", planLockedAt: new Date() },
    }),
    prisma.note.create({
      data: {
        content: `Plan locked for execution by ${userName}. Specifications are now read-only.`,
        type: "SYSTEM",
        eventId: params.eventId,
        userId,
      },
    }),
  ]);

  return NextResponse.json(updated);
}
