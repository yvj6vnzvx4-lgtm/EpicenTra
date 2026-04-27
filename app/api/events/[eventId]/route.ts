import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getAuthorizedEvent,
  isEventLocked,
  lockedEventResponse,
} from "@/lib/event-guards";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await prisma.event.findFirst({
    where: { id: eventId, organizationId: session.user.organizationId },
    include: {
      owner: { select: { id: true, name: true, avatarUrl: true } },
      members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
      budgetItems: { orderBy: { createdAt: "asc" } },
      vendors: { orderBy: { createdAt: "asc" } },
      staffSlots: { orderBy: { createdAt: "asc" } },
      checklist: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(event);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await getAuthorizedEvent(eventId, session.user.organizationId);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  // Allow restore (deletedAt: null) to bypass lock check
  const isRestore = "deletedAt" in body && body.deletedAt === null;
  if (!isRestore && isEventLocked(event.status)) return lockedEventResponse();

  const allowed = [
    "title", "description", "status",
    "startDate", "endDate", "timezone",
    "venueName", "venueAddress", "venueCity", "venueState", "venueZip", "venueNotes",
    "objectives", "targetAudience", "expectedAttendance", "brandGuidelines",
    "totalBudget", "budgetNotes", "layoutData", "deletedAt",
  ];

  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  const updated = await prisma.event.update({ where: { id: eventId }, data });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await getAuthorizedEvent(eventId, session.user.organizationId);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Soft delete — just stamp deletedAt
  await prisma.event.update({
    where: { id: eventId },
    data: { deletedAt: new Date() },
  });
  return NextResponse.json({ success: true });
}
