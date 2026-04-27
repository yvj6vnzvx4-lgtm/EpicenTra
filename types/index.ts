import { Role, EventStatus } from "@prisma/client";

export type { Role, EventStatus };

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl: string | null;
  organizationId: string;
  organizationName: string;
}

export interface EventWithRelations {
  id: string;
  title: string;
  status: EventStatus;
  description: string | null;
  startDate: Date | null;
  endDate: Date | null;
  totalBudget: number | null;
  venueName: string | null;
  venueCity: string | null;
  venueState: string | null;
  owner: { id: string; name: string; avatarUrl: string | null };
  members: Array<{
    id: string;
    role: string;
    user: { id: string; name: string; avatarUrl: string | null };
  }>;
  checklist: Array<{ id: string; isCompleted: boolean; dueDate: Date | null }>;
  budgetItems: Array<{
    id: string;
    estimated: number;
    actual: number | null;
  }>;
}
