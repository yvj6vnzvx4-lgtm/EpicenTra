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
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await getAuthorizedEvent(eventId, session.user.organizationId);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (isEventLocked(event.status)) return lockedEventResponse();

  const body = await req.json();
  const vendor = await prisma.eventVendor.create({
    data: {
      eventId: eventId,
      vendorName: body.vendorName ?? "New Vendor",
      category: body.category ?? "misc",
      contactName: body.contactName ?? null,
      contactEmail: body.contactEmail ?? null,
      contactPhone: body.contactPhone ?? null,
      status: body.status ?? "prospective",
      cost: body.cost ?? null,
      notes: body.notes ?? null,
    },
  });
  return NextResponse.json(vendor, { status: 201 });
}
