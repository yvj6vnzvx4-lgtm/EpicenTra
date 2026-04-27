import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getAuthorizedEvent,
  isEventLocked,
  lockedEventResponse,
} from "@/lib/event-guards";

export async function POST(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await getAuthorizedEvent(params.eventId, session.user.organizationId);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (isEventLocked(event.status)) return lockedEventResponse();

  const body = await req.json();
  const slot = await prisma.staffSlot.create({
    data: {
      eventId: params.eventId,
      roleName: body.roleName ?? "New Role",
      quantity: body.quantity ?? 1,
      startTime: body.startTime ?? null,
      endTime: body.endTime ?? null,
      hourlyRate: body.hourlyRate ?? null,
      notes: body.notes ?? null,
      isFilled: false,
    },
  });
  return NextResponse.json(slot, { status: 201 });
}
