import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runPlanningAgent } from "@/lib/agent-service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await prisma.event.findFirst({
    where: { id: eventId, organizationId: session.user.organizationId },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const notes = await prisma.note.findMany({
    where: { eventId: eventId },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(notes);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await prisma.event.findFirst({
    where: { id: eventId, organizationId: session.user.organizationId },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const content: string = body.content?.trim();
  if (!content) return NextResponse.json({ error: "Content required" }, { status: 400 });

  // Save the user's note
  const userNote = await prisma.note.create({
    data: {
      content,
      type: "USER",
      eventId: eventId,
      userId: session.user.id,
    },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  });

  // Check if message mentions @agent
  const isAgentMention =
    content.toLowerCase().includes("@agent") ||
    content.toLowerCase().startsWith("/agent");

  if (!isAgentMention) {
    return NextResponse.json({ userNote, agentNote: null });
  }

  // Strip @agent / /agent prefix for the prompt
  const prompt = content
    .replace(/^\/agent\s*/i, "")
    .replace(/@agent\s*/gi, "")
    .trim() || content;

  // Call Groq
  const agentResponse = await runPlanningAgent(eventId, prompt);

  const agentNote = await prisma.note.create({
    data: {
      content: agentResponse,
      type: "AGENT",
      eventId: eventId,
      userId: null,
      metadata: { triggeredBy: userNote.id },
    },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  });

  return NextResponse.json({ userNote, agentNote });
}
