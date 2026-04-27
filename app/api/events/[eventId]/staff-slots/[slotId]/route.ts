import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getAuthorizedEvent,
  isEventLocked,
  lockedEventResponse,
} from "@/lib/event-guards";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string; slotId: string }> }
) {
  const { eventId, slotId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await getAuthorizedEvent(eventId, session.user.organizationId);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (isEventLocked(event.status)) return lockedEventResponse();

  const existing = await prisma.staffSlot.findFirst({
    where: { id: slotId, eventId: eventId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const slot = await prisma.staffSlot.update({
    where: { id: slotId },
    data: body,
  });
  return NextResponse.json(slot);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string; slotId: string }> }
) {
  const { eventId, slotId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await getAuthorizedEvent(eventId, session.user.organizationId);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (isEventLocked(event.status)) return lockedEventResponse();

  const existing = await prisma.staffSlot.findFirst({
    where: { id: slotId, eventId: eventId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.staffSlot.delete({ where: { id: slotId } });
  return new NextResponse(null, { status: 204 });
}
