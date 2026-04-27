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
  { params }: { params: { eventId: string; vendorId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await getAuthorizedEvent(params.eventId, session.user.organizationId);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (isEventLocked(event.status)) return lockedEventResponse();

  const existing = await prisma.eventVendor.findFirst({
    where: { id: params.vendorId, eventId: params.eventId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const vendor = await prisma.eventVendor.update({
    where: { id: params.vendorId },
    data: body,
  });
  return NextResponse.json(vendor);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { eventId: string; vendorId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await getAuthorizedEvent(params.eventId, session.user.organizationId);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (isEventLocked(event.status)) return lockedEventResponse();

  const existing = await prisma.eventVendor.findFirst({
    where: { id: params.vendorId, eventId: params.eventId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.eventVendor.delete({ where: { id: params.vendorId } });
  return new NextResponse(null, { status: 204 });
}
