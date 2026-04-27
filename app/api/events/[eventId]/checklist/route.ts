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

  const maxOrder = await prisma.checklistItem.aggregate({
    where: { eventId: params.eventId },
    _max: { sortOrder: true },
  });

  const item = await prisma.checklistItem.create({
    data: {
      eventId: params.eventId,
      title: body.title ?? "New task",
      description: body.description ?? null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      category: body.category ?? null,
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      source: body.source ?? "manual",
      isCompleted: false,
    },
  });
  return NextResponse.json(item, { status: 201 });
}
