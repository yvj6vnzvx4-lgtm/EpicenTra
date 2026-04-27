import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getMetadataObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {};
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { eventId: string; noteId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await prisma.event.findFirst({
    where: { id: params.eventId, organizationId: session.user.organizationId },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await prisma.note.findFirst({
    where: { id: params.noteId, eventId: params.eventId },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const metadata = getMetadataObject(existing.metadata);
  const nextPinned = typeof body.isPinned === "boolean" ? body.isPinned : existing.isPinned;

  let nextType = existing.type;
  let nextMetadata = metadata;

  if (typeof body.isPinned === "boolean") {
    if (body.isPinned) {
      if (existing.type !== "DECISION") {
        nextMetadata = { ...metadata, previousType: existing.type };
      }
      nextType = "DECISION";
    } else {
      const previousType = typeof metadata.previousType === "string"
        ? metadata.previousType
        : existing.type === "DECISION"
          ? "USER"
          : existing.type;
      nextType = previousType;
      const rest = { ...metadata };
      delete rest.previousType;
      nextMetadata = rest;
    }
  }

  const note = await prisma.note.update({
    where: { id: params.noteId },
    data: {
      isPinned: nextPinned,
      type: nextType,
      metadata: nextMetadata,
    },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  });

  return NextResponse.json(note);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { eventId: string; noteId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await prisma.event.findFirst({
    where: { id: params.eventId, organizationId: session.user.organizationId },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await prisma.note.findFirst({
    where: { id: params.noteId, eventId: params.eventId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.note.delete({ where: { id: params.noteId } });
  return new NextResponse(null, { status: 204 });
}
