import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const events = await prisma.event.findMany({
    where: { organizationId: session.user.organizationId },
    select: { id: true, title: true, status: true, startDate: true },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const event = await prisma.event.create({
    data: {
      title: title.trim(),
      status: "DRAFT",
      ownerId: session.user.id,
      organizationId: session.user.organizationId,
    },
  });

  return NextResponse.json(event, { status: 201 });
}
