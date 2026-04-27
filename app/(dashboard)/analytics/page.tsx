import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAnalyticsData } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const [data, events] = await Promise.all([
    getAnalyticsData(session.user.organizationId),
    prisma.event.findMany({
      where: { organizationId: session.user.organizationId },
      select: { id: true, title: true, status: true, startDate: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="animate-slide-in">
      <AnalyticsDashboard
        data={data}
        events={events.map((e) => ({
          ...e,
          startDate: e.startDate?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
