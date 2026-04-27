import { prisma } from "./prisma";

export async function getDashboardData(userId: string, organizationId: string) {
  // Fetch all events the user owns or is a member of
  const events = await prisma.event.findMany({
    where: {
      organizationId,
      deletedAt: null,
      status: { notIn: ["COMPLETED", "CANCELLED"] },
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    include: {
      owner: { select: { name: true, avatarUrl: true } },
      members: {
        include: { user: { select: { name: true, avatarUrl: true } } },
      },
      budgetItems: { select: { estimated: true, actual: true, status: true } },
      checklist: {
        where: { isCompleted: false, dueDate: { not: null } },
        orderBy: { dueDate: "asc" },
        select: { id: true, title: true, dueDate: true },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Shape events for the card
  const shapedEvents = events.map((e) => {
    const totalBudget = e.totalBudget ? Number(e.totalBudget) : null;
    const totalSpent = e.budgetItems.reduce((sum, item) => {
      const val = item.actual ?? item.estimated;
      return sum + (item.status !== "pending" ? Number(val) : 0);
    }, 0);

    return {
      id: e.id,
      title: e.title,
      status: e.status,
      startDate: e.startDate,
      endDate: e.endDate,
      venueName: e.venueName,
      venueCity: e.venueCity,
      venueState: e.venueState,
      totalBudget,
      totalSpent,
      owner: e.owner,
      members: e.members,
      nextDeadline:
        e.checklist[0] && e.checklist[0].dueDate
          ? { title: e.checklist[0].title, dueDate: e.checklist[0].dueDate }
          : null,
    };
  });

  // Upcoming deadlines across all org events (next 5, sorted by date)
  const allDeadlines = await prisma.checklistItem.findMany({
    where: {
      isCompleted: false,
      dueDate: { not: null, gte: new Date() },
      event: {
        organizationId,
        deletedAt: null,
        status: { notIn: ["COMPLETED", "CANCELLED"] },
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
    },
    orderBy: { dueDate: "asc" },
    take: 5,
    select: {
      id: true,
      title: true,
      dueDate: true,
      isCompleted: true,
      eventId: true,
      event: { select: { title: true } },
    },
  });

  const deadlines = allDeadlines.map((d) => ({
    id: d.id,
    title: d.title,
    dueDate: d.dueDate!,
    isCompleted: d.isCompleted,
    eventId: d.eventId,
    eventTitle: d.event.title,
  }));

  // Stats
  const activeCount = shapedEvents.length;
  const totalBudget = shapedEvents.reduce(
    (sum, e) => sum + (e.totalBudget ?? 0),
    0
  );

  const oneWeekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const tasksDueThisWeek = await prisma.checklistItem.count({
    where: {
      isCompleted: false,
      dueDate: { gte: new Date(), lte: oneWeekFromNow },
      event: {
        organizationId,
        deletedAt: null,
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
    },
  });

  const agentUpdates = await prisma.agentTask.count({
    where: {
      status: "COMPLETED",
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      event: { organizationId },
    },
  });

  return {
    events: shapedEvents,
    deadlines,
    stats: {
      activeCount,
      totalBudget,
      tasksDueThisWeek,
      agentUpdates,
    },
  };
}
