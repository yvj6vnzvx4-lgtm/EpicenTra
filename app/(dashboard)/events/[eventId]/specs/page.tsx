import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SpecsForm } from "@/components/events/specs/specs-form";

async function getEventSpecs(eventId: string, organizationId: string) {
  return prisma.event.findFirst({
    where: { id: eventId, organizationId },
    include: {
      budgetItems: { orderBy: { createdAt: "asc" } },
      vendors: { orderBy: { createdAt: "asc" } },
      staffSlots: { orderBy: { createdAt: "asc" } },
      checklist: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export default async function SpecsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const event = await getEventSpecs(eventId, session.user.organizationId);
  if (!event) notFound();

  const isLocked = event.status === "PLAN_LOCKED" || event.status === "IN_EXECUTION";

  return (
    <SpecsForm
      eventId={event.id}
      isLocked={isLocked}
      initialData={{
        title: event.title,
        description: event.description ?? "",
        startDate: event.startDate?.toISOString().slice(0, 10) ?? "",
        endDate: event.endDate?.toISOString().slice(0, 10) ?? "",
        timezone: event.timezone ?? "America/New_York",
        venueName: event.venueName ?? "",
        venueAddress: event.venueAddress ?? "",
        venueCity: event.venueCity ?? "",
        venueState: event.venueState ?? "",
        venueZip: event.venueZip ?? "",
        venueNotes: event.venueNotes ?? "",
        objectives: event.objectives
          ? (JSON.parse(event.objectives) as string[])
          : [],
        targetAudience: event.targetAudience ?? "",
        expectedAttendance: event.expectedAttendance ?? "",
        brandGuidelines: event.brandGuidelines ?? "",
        totalBudget: event.totalBudget ? Number(event.totalBudget) : "",
        budgetNotes: event.budgetNotes ?? "",
      }}
      initialBudgetItems={event.budgetItems.map((b) => ({
        ...b,
        estimated: Number(b.estimated),
        actual: b.actual != null ? Number(b.actual) : null,
      }))}
      initialVendors={event.vendors.map((v) => ({
        ...v,
        cost: v.cost != null ? Number(v.cost) : null,
      }))}
      initialStaffSlots={event.staffSlots.map((s) => ({
        ...s,
        hourlyRate: s.hourlyRate != null ? Number(s.hourlyRate) : null,
        startTime: s.startTime?.toISOString().slice(0, 16) ?? "",
        endTime: s.endTime?.toISOString().slice(0, 16) ?? "",
      }))}
      initialChecklist={event.checklist.map((c) => ({
        ...c,
        dueDate: c.dueDate?.toISOString().slice(0, 10) ?? "",
      }))}
    />
  );
}
