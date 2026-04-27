import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ActivationBriefInput,
  generateActivationPlan,
  startExecutionAgentRun,
} from "@/lib/agent-service";

function normalizeBrief(body: Record<string, unknown>): ActivationBriefInput {
  return {
    productName: String(body.productName ?? "").trim(),
    productDescription: String(body.productDescription ?? "").trim(),
    targetAudience: String(body.targetAudience ?? "").trim(),
    primaryGoal: String(body.primaryGoal ?? "").trim() || undefined,
    budget:
      body.budget === "" || body.budget == null ? null : Number(body.budget),
    city: String(body.city ?? "").trim() || undefined,
    timing: String(body.timing ?? "").trim() || undefined,
  };
}

function validateBrief(brief: ActivationBriefInput) {
  return Boolean(
    brief.productName && brief.productDescription && brief.targetAudience
  );
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as Record<string, unknown>;
  const brief = normalizeBrief(body);
  if (!validateBrief(brief)) {
    return NextResponse.json(
      { error: "Product name, product description, and target audience are required." },
      { status: 400 }
    );
  }

  const plan = await generateActivationPlan(brief);

  if (body.mode !== "create") {
    return NextResponse.json({ plan });
  }

  const event = await prisma.event.create({
    data: {
      title: plan.title,
      status: "PLANNING",
      description: plan.summary,
      targetAudience: brief.targetAudience,
      objectives: JSON.stringify(plan.objectives ?? []),
      totalBudget: brief.budget ?? undefined,
      venueCity: brief.city ?? null,
      budgetNotes: `Generated from Activation Brief Studio for ${brief.productName}.`,
      brandGuidelines: `Product: ${brief.productName}\n\nProduct description:\n${brief.productDescription}`,
      ownerId: session.user.id,
      organizationId: session.user.organizationId,
      notes: {
        create: [
          {
            content: `Activation brief created for ${brief.productName}. Target audience: ${brief.targetAudience}.`,
            type: "SYSTEM",
            userId: session.user.id,
          },
          {
            content: plan.agentMessage,
            type: "AGENT",
            metadata: {
              source: "activation-studio",
              productName: brief.productName,
            },
          },
        ],
      },
      checklist: {
        create: (plan.checklist ?? []).map((item, index) => ({
          title: item.title,
          category: item.category,
          source: "agent",
          sortOrder: index + 1,
        })),
      },
      budgetItems: {
        create: (plan.budgetItems ?? []).map((item) => ({
          category: item.category,
          description: item.description,
          estimated: item.estimated,
          status: "pending",
          notes: "Generated from Activation Brief Studio",
        })),
      },
      vendors: {
        create: (plan.vendors ?? []).map((vendor) => ({
          vendorName: vendor.vendorName,
          category: vendor.category,
          notes: vendor.notes ?? null,
          status: "prospective",
        })),
      },
      staffSlots: {
        create: (plan.staffing ?? []).map((staff) => ({
          roleName: staff.roleName,
          quantity: staff.quantity,
          notes: staff.notes ?? null,
          isFilled: false,
        })),
      },
    },
  });

  await startExecutionAgentRun(event.id, session.user.id);

  return NextResponse.json({ plan, eventId: event.id });
}
