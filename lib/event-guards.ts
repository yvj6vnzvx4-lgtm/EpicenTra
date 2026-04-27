import { NextResponse } from "next/server";
import { prisma } from "./prisma";

export async function getAuthorizedEvent(eventId: string, organizationId: string) {
  return prisma.event.findFirst({
    where: { id: eventId, organizationId },
    select: { id: true, status: true },
  });
}

export function isEventLocked(status: string) {
  return status === "PLAN_LOCKED" || status === "IN_EXECUTION";
}

export function lockedEventResponse() {
  return NextResponse.json(
    { error: "Plan is locked for execution" },
    { status: 423 }
  );
}
