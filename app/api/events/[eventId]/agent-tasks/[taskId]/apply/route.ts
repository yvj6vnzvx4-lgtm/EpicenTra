import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getAuthorizedEvent,
  isEventLocked,
  lockedEventResponse,
} from "@/lib/event-guards";

interface ApplyItem {
  type: "checklist" | "budget" | "vendor";
  title?: string;
  category?: string;
  description?: string;
  estimated?: number;
  vendorName?: string;
  status?: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { eventId: string; taskId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await getAuthorizedEvent(params.eventId, session.user.organizationId);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (isEventLocked(event.status)) return lockedEventResponse();

  const task = await prisma.agentTask.findFirst({
    where: { id: params.taskId, eventId: params.eventId },
    select: { id: true },
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const items: ApplyItem[] = body.items ?? [];

  const results = { checklist: 0, budget: 0, vendor: 0 };

  for (const item of items) {
    if (item.type === "checklist" && item.title) {
      const maxSort = await prisma.checklistItem.aggregate({
        where: { eventId: params.eventId },
        _max: { sortOrder: true },
      });
      await prisma.checklistItem.create({
        data: {
          title: item.title,
          category: item.category ?? "General",
          source: "agent",
          sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
          eventId: params.eventId,
        },
      });
      results.checklist++;
    } else if (item.type === "budget" && item.description) {
      await prisma.budgetItem.create({
        data: {
          category: item.category ?? "Other",
          description: item.description,
          estimated: item.estimated ?? 0,
          eventId: params.eventId,
        },
      });
      results.budget++;
    } else if (item.type === "vendor" && item.vendorName) {
      await prisma.eventVendor.create({
        data: {
          vendorName: item.vendorName,
          category: item.category ?? "Other",
          status: "PENDING",
          eventId: params.eventId,
        },
      });
      results.vendor++;
    }
  }

  await prisma.agentTask.update({
    where: { id: params.taskId },
    data: { resultMeta: { applied: true, appliedAt: new Date().toISOString(), counts: results } },
  });

  return NextResponse.json({ success: true, results });
}
