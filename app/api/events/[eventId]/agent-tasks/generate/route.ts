import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractTasksFromChat, runPlanningAgent } from "@/lib/agent-service";

export async function POST(
  _req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await prisma.event.findFirst({
    where: { id: params.eventId, organizationId: session.user.organizationId },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Step 1: extract task prompts from the chat
  const prompts = await extractTasksFromChat(params.eventId);
  if (prompts.length === 0) {
    return NextResponse.json(
      { error: "Not enough conversation to generate tasks. Add some messages to the Notes chat first." },
      { status: 422 }
    );
  }

  // Step 2: run each task sequentially and save results (1.2s delay between calls)
  const completed = [];
  for (let i = 0; i < prompts.length; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 1200));
    const prompt = prompts[i];
    const task = await prisma.agentTask.create({
      data: {
        prompt,
        status: "IN_PROGRESS",
        eventId: params.eventId,
        createdById: session.user.id,
      },
    });

    let result: string;
    let status: "COMPLETED" | "FAILED";
    try {
      result = await runPlanningAgent(params.eventId, prompt);
      status = "COMPLETED";
    } catch {
      result = "The agent encountered an error on this task.";
      status = "FAILED";
    }

    const updated = await prisma.agentTask.update({
      where: { id: task.id },
      data: { result, status, completedAt: new Date() },
      include: { createdBy: { select: { id: true, name: true, avatarUrl: true } } },
    });

    completed.push(updated);
  }

  return NextResponse.json(completed);
}
