import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Plus, CalendarDays } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { EventCard } from "@/components/dashboard/event-card";
import { cn } from "@/lib/utils";

const STATUS_TABS = [
  { label: "All",          value: "all" },
  { label: "Draft",        value: "DRAFT" },
  { label: "Planning",     value: "PLANNING" },
  { label: "Plan Locked",  value: "PLAN_LOCKED" },
  { label: "In Execution", value: "IN_EXECUTION" },
  { label: "Completed",    value: "COMPLETED" },
  { label: "Deleted",      value: "DELETED" },
] as const;

async function getEvents(userId: string, organizationId: string, status: string) {
  const isDeleted = status === "DELETED";

  const events = await prisma.event.findMany({
    where: {
      organizationId,
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      ...(isDeleted
        ? { deletedAt: { not: null } }
        : {
            deletedAt: null,
            ...(status !== "all" ? { status } : {}),
          }),
    },
    include: {
      owner: { select: { name: true, avatarUrl: true } },
      members: { include: { user: { select: { name: true, avatarUrl: true } } } },
      budgetItems: { select: { estimated: true, actual: true, status: true } },
      checklist: {
        where: { isCompleted: false, dueDate: { not: null } },
        orderBy: { dueDate: "asc" },
        select: { title: true, dueDate: true },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return events.map((e) => ({
    id: e.id,
    title: e.title,
    status: e.status,
    startDate: e.startDate,
    endDate: e.endDate,
    venueName: e.venueName,
    venueCity: e.venueCity,
    venueState: e.venueState,
    totalBudget: e.totalBudget ? Number(e.totalBudget) : null,
    totalSpent: e.budgetItems.reduce((sum, item) => {
      const val = item.actual ?? item.estimated;
      return sum + (item.status !== "pending" ? Number(val) : 0);
    }, 0),
    owner: e.owner,
    members: e.members,
    nextDeadline:
      e.checklist[0]?.dueDate
        ? { title: e.checklist[0].title, dueDate: e.checklist[0].dueDate }
        : null,
    isDeleted: !!e.deletedAt,
  }));
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const session = await getServerSession(authOptions);
  const user = session!.user;
  const activeStatus = status ?? "all";
  const [events, deletedCount] = await Promise.all([
    getEvents(user.id, user.organizationId, activeStatus),
    prisma.event.count({
      where: {
        organizationId: user.organizationId,
        deletedAt: { not: null },
        OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
      },
    }),
  ]);
  const isDeletedTab = activeStatus === "DELETED";
  const showDeletedTab = deletedCount > 0 || isDeletedTab;

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader
        title="Events"
        subtitle={`${events.length} event${events.length !== 1 ? "s" : ""}`}
        actions={
          !isDeletedTab && (
            <Link href="/events/new">
              <Button variant="primary">
                <Plus className="w-4 h-4" />
                New Event
              </Button>
            </Link>
          )
        }
      />

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.filter((tab) => tab.value !== "DELETED" || showDeletedTab).map((tab) => (
          <Link
            key={tab.value}
            href={tab.value === "all" ? "/events" : `/events?status=${tab.value}`}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
              activeStatus === tab.value
                ? tab.value === "DELETED"
                  ? "bg-red-500 text-white border-red-500 shadow-sm"
                  : "bg-brand-blue text-white border-brand-blue shadow-sm"
                : "bg-navy-800 text-slate-400 border-white/[0.08] hover:text-slate-200 hover:border-white/[0.16]"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {events.length === 0 ? (
        <div className="bg-navy-800 rounded-xl border border-white/[0.06] border-dashed p-16 text-center">
          <div className="w-12 h-12 rounded-full bg-navy-700 flex items-center justify-center mx-auto mb-4">
            <CalendarDays className="w-6 h-6 text-slate-500" />
          </div>
          <h3 className="font-semibold text-slate-300 mb-1">
            {isDeletedTab ? "No deleted events" : activeStatus === "all" ? "No events yet" : `No ${activeStatus.toLowerCase().replace("_", " ")} events`}
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            {isDeletedTab
              ? "Deleted events will appear here and can be restored."
              : activeStatus === "all"
              ? "Create your first event to get started with EpicenTra."
              : "Try a different filter or create a new event."}
          </p>
          {activeStatus === "all" && (
            <Link href="/events/new">
              <Button variant="primary" size="sm">
                <Plus className="w-4 h-4" />
                Create Event
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
