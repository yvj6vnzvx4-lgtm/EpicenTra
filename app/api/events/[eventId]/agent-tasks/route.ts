import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runPlanningAgent } from "@/lib/agent-service";

export async function GET(
  _req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await prisma.event.findFirst({
    where: { id: params.eventId, organizationId: session.user.organizationId },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const tasks = await prisma.agentTask.findMany({
    where: { eventId: params.eventId },
    include: { createdBy: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tasks);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await prisma.event.findFirst({
    where: { id: params.eventId, organizationId: session.user.organizationId },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const prompt: string = body.prompt?.trim();
  if (!prompt) return NextResponse.json({ error: "Prompt required" }, { status: 400 });

  // Create task as IN_PROGRESS immediately
  const task = await prisma.agentTask.create({
    data: {
      prompt,
      status: "IN_PROGRESS",
      eventId: params.eventId,
      createdById: session.user.id,
    },
    include: { createdBy: { select: { id: true, name: true, avatarUrl: true } } },
  });

  // Run agent
  let result: string;
  let status: "COMPLETED" | "FAILED";
  try {
    result = await runPlanningAgent(params.eventId, prompt);
    status = "COMPLETED";
  } catch {
    result = "The agent encountered an error. Please try again.";
    status = "FAILED";
  }

  const updated = await prisma.agentTask.update({
    where: { id: task.id },
    data: { result, status, completedAt: new Date() },
    include: { createdBy: { select: { id: true, name: true, avatarUrl: true } } },
  });

  return NextResponse.json(updated);
}
