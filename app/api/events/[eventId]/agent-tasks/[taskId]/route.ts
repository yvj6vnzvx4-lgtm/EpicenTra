import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string; taskId: string }> }
) {
  const { eventId, taskId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await prisma.event.findFirst({
    where: { id: eventId, organizationId: session.user.organizationId },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const task = await prisma.agentTask.findFirst({
    where: { id: taskId, eventId: eventId },
    include: { createdBy: { select: { id: true, name: true, avatarUrl: true } } },
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(task);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string; taskId: string }> }
) {
  const { eventId, taskId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await prisma.event.findFirst({
    where: { id: eventId, organizationId: session.user.organizationId },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const task = await prisma.agentTask.findFirst({
    where: { id: taskId, eventId: eventId },
    select: { id: true },
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.agentTask.delete({ where: { id: taskId } });
  return new NextResponse(null, { status: 204 });
}
