import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { getGreeting, formatCurrency } from "@/lib/utils";
import { CalendarDays, DollarSign, CheckSquare, Bot, Plus, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { EventCard } from "@/components/dashboard/event-card";
import { UpcomingDeadlines } from "@/components/dashboard/upcoming-deadlines";
import { PageHeader } from "@/components/layout/page-header";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const user = session!.user;

  const { events, deadlines, stats } = await getDashboardData(
    user.id,
    user.organizationId
  );

  const greeting = getGreeting(user.name);

  return (
    <div className="space-y-8 animate-slide-in">
      <PageHeader
        eyebrow={user.organizationName ?? "EpicenTra"}
        title={greeting}
        subtitle="AI-powered brand activation platform"
        actions={
          <>
            <Link href="/events">
              <Button variant="secondary" size="sm">
                All Events
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <Link href="/events/new">
              <Button variant="primary">
                <Plus className="w-4 h-4" />
                New Event
              </Button>
            </Link>
          </>
        }
      />

      <div className="rounded-[24px] border border-[#2B5CC8]/20 bg-[#EEF3FF] px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2B5CC8]/10 text-[#2B5CC8]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0D1B3E]">Strategy Studio</p>
              <p className="text-sm text-[#6B7A99]">Briefs, audience, and activation chat</p>
            </div>
          </div>
          <Link href="/strategy">
            <Button variant="secondary">
              Open Strategy Studio
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Active Events"
          value={stats.activeCount}
          icon={CalendarDays}
          gradient="from-[#2B5CC8] to-[#7DD3F0]"
          glow="glow-blue"
        />
        <StatCard
          label="Total Budget"
          value={formatCurrency(stats.totalBudget)}
          icon={DollarSign}
          gradient="from-emerald-500 to-teal-400"
          glow="glow-green"
          sub="across active events"
        />
        <StatCard
          label="Tasks Due This Week"
          value={stats.tasksDueThisWeek}
          icon={CheckSquare}
          gradient="from-amber-500 to-yellow-400"
          glow="glow-amber"
        />
        <StatCard
          label="Agent Updates"
          value={stats.agentUpdates}
          icon={Bot}
          gradient="from-[#F47B5A] to-[#2B5CC8]"
          glow="glow-coral"
          sub="last 7 days"
        />
      </div>

      {/* Main content: events grid + deadlines sidebar */}
      {events.length === 0 ? (
        <div className="bg-navy-800 rounded-xl border border-white/[0.06] border-dashed p-16 text-center">
          <div className="w-12 h-12 rounded-full bg-navy-700 flex items-center justify-center mx-auto mb-4">
            <CalendarDays className="w-6 h-6 text-slate-500" />
          </div>
          <h3 className="font-semibold text-slate-300 mb-1">No active events</h3>
          <p className="text-sm text-slate-500 mb-4">
            Create your first event to get started with EpicenTra.
          </p>
          <Link href="/events/new">
            <Button variant="primary" size="sm">
              <Plus className="w-4 h-4" />
              Create Event
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex gap-6">
          {/* Events grid */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-200">Active Events</h2>
              <Link
                href="/events"
                className="text-xs text-brand-blue hover:text-brand-blue-mid transition-colors flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>

          {/* Deadlines sidebar */}
          <div className="w-72 shrink-0">
            <UpcomingDeadlines deadlines={deadlines} />
          </div>
        </div>
      )}
    </div>
  );
}
