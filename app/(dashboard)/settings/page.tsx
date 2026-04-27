import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SettingsShell } from "@/components/settings/settings-shell";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const [user, org] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true },
    }),
    prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      include: {
        users: {
          select: { id: true, name: true, email: true, role: true, avatarUrl: true },
          orderBy: { name: "asc" },
        },
      },
    }),
  ]);

  if (!user || !org) redirect("/dashboard");

  return (
    <div className="animate-slide-in">
      <SettingsShell user={user} org={org} currentUserId={user.id} />
    </div>
  );
}
