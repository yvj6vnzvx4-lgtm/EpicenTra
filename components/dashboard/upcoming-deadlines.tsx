import { formatDate } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { SectionCard } from "@/components/ui/section-card";

interface Deadline {
  id: string;
  title: string;
  dueDate: Date;
  isCompleted: boolean;
  eventId: string;
  eventTitle: string;
}

interface UpcomingDeadlinesProps {
  deadlines: Deadline[];
}

export function UpcomingDeadlines({ deadlines }: UpcomingDeadlinesProps) {
  const now = Date.now();

  if (deadlines.length === 0) {
    return (
      <SectionCard title="Upcoming Deadlines" tone="dark">
        <p className="text-sm text-slate-500 text-center py-4">No upcoming deadlines</p>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Upcoming Deadlines" tone="dark">
      <div className="space-y-1">
        {deadlines.map((d) => {
          const msUntil = new Date(d.dueDate).getTime() - now;
          const isOverdue = msUntil < 0;
          const isSoon = msUntil < 3 * 24 * 60 * 60 * 1000 && !isOverdue;

          return (
            <Link key={d.id} href={`/events/${d.eventId}`}>
              <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer group">
                <div className="mt-0.5 shrink-0">
                  {d.isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-brand-green" />
                  ) : isOverdue ? (
                    <AlertCircle className="w-4 h-4 text-brand-red" />
                  ) : isSoon ? (
                    <AlertCircle className="w-4 h-4 text-brand-amber" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors truncate">
                    {d.title}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{d.eventTitle}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`text-xs font-medium ${isOverdue ? "text-brand-red" : isSoon ? "text-brand-amber" : "text-slate-500"}`}>
                    {formatDate(d.dueDate)}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </SectionCard>
  );
}
