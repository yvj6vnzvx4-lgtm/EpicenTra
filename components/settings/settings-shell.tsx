"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { User, Building2, Users, Bell, Save, Shield } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";

const ROLES = ["ADMIN", "DIRECTOR", "MANAGER", "COORDINATOR"] as const;
const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin", DIRECTOR: "Director", MANAGER: "Manager", COORDINATOR: "Coordinator",
};

interface OrgUser { id: string; name: string; email: string; role: string; avatarUrl: string | null }
interface Org { id: string; name: string; logoUrl?: string | null; users: OrgUser[] }

interface Props {
  user: OrgUser;
  org: Org;
  currentUserId: string;
}

type Tab = "profile" | "organization" | "team" | "notifications";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "organization", label: "Organization", icon: Building2 },
  { id: "team", label: "Team", icon: Users },
  { id: "notifications", label: "Notifications", icon: Bell },
];

export function SettingsShell({ user, org, currentUserId }: Props) {
  const [tab, setTab] = useState<Tab>("profile");
  const isAdmin = user.role === "ADMIN";

  // Profile state
  const [profileName, setProfileName] = useState(user.name);
  const [profileEmail, setProfileEmail] = useState(user.email);
  const [savingProfile, setSavingProfile] = useState(false);

  // Org state
  const [orgName, setOrgName] = useState(org.name);
  const [savingOrg, setSavingOrg] = useState(false);

  // Team state
  const [members, setMembers] = useState<OrgUser[]>(org.users);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  // Notification state (placeholder)
  const [notifs, setNotifs] = useState({ taskComplete: true, planLocked: true, newMessage: false });

  async function saveProfile() {
    setSavingProfile(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profileName, email: profileEmail }),
      });
      if (res.ok) toast.success("Profile saved");
      else toast.error("Failed to save profile");
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveOrg() {
    setSavingOrg(true);
    try {
      const res = await fetch("/api/org", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName }),
      });
      if (res.ok) toast.success("Organization updated");
      else toast.error("Failed to update organization");
    } finally {
      setSavingOrg(false);
    }
  }

  async function updateMemberRole(userId: string, role: string) {
    setUpdatingRole(userId);
    try {
      const res = await fetch(`/api/org/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        setMembers((prev) => prev.map((m) => m.id === userId ? { ...m, role } : m));
        toast.success("Role updated");
      } else {
        toast.error("Failed to update role");
      }
    } finally {
      setUpdatingRole(null);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader title="Settings" subtitle="Profile, organization, and team" />

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <nav className="w-44 shrink-0 space-y-0.5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-left transition-all",
                tab === id
                  ? "bg-brand-blue/10 text-brand-blue"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* ── Profile ── */}
          {tab === "profile" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
              <h2 className="text-sm font-semibold text-slate-800">Profile</h2>

              <div className="flex items-center gap-4">
                <Avatar name={profileName} avatarUrl={user.avatarUrl} size="lg" />
                <div>
                  <p className="text-sm font-medium text-slate-700">{profileName}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{ROLE_LABELS[user.role] ?? user.role}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1.5">
                    Full Name
                  </label>
                  <input
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                  />
                </div>
              </div>

              <button
                onClick={saveProfile}
                disabled={savingProfile}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-blue text-white text-sm font-medium hover:bg-brand-blue-dark transition-colors disabled:opacity-60"
              >
                {savingProfile ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Profile
              </button>
            </div>
          )}

          {/* ── Organization ── */}
          {tab === "organization" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
              <h2 className="text-sm font-semibold text-slate-800">Organization</h2>

              {!isAdmin && (
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                  <Shield className="w-3.5 h-3.5" />
                  Only Admins can edit organization settings
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1.5">
                  Organization Name
                </label>
                <input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  disabled={!isAdmin}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {isAdmin && (
                <button
                  onClick={saveOrg}
                  disabled={savingOrg}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-blue text-white text-sm font-medium hover:bg-brand-blue-dark transition-colors disabled:opacity-60"
                >
                  {savingOrg ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Changes
                </button>
              )}
            </div>
          )}

          {/* ── Team ── */}
          {tab === "team" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-800">Team Members</h2>
                <span className="text-xs text-slate-400">{members.length} member{members.length !== 1 ? "s" : ""}</span>
              </div>

              <div className="space-y-2">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
                    <Avatar name={member.name} avatarUrl={member.avatarUrl} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {member.name}
                        {member.id === currentUserId && <span className="text-xs text-slate-400 ml-1.5">(you)</span>}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{member.email}</p>
                    </div>

                    {isAdmin && member.id !== currentUserId ? (
                      <select
                        value={member.role}
                        disabled={updatingRole === member.id}
                        onChange={(e) => updateMemberRole(member.id, e.target.value)}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 focus:outline-none focus:border-brand-blue bg-white disabled:opacity-60"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
                        {ROLE_LABELS[member.role] ?? member.role}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Notifications ── */}
          {tab === "notifications" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">Notifications</h2>
                <p className="text-xs text-slate-400 mt-0.5">Email notifications — coming in a future release</p>
              </div>

              {[
                { key: "taskComplete", label: "Agent task completed", desc: "When the AI finishes a task" },
                { key: "planLocked", label: "Plan locked/unlocked", desc: "When an event moves to execution" },
                { key: "newMessage", label: "New team message", desc: "When someone posts in Notes" },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                  </div>
                  <button
                    onClick={() => setNotifs((p) => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                    className={cn(
                      "w-10 h-5.5 rounded-full transition-colors relative",
                      notifs[key as keyof typeof notifs] ? "bg-brand-blue" : "bg-slate-200"
                    )}
                    style={{ height: "22px" }}
                  >
                    <span className={cn(
                      "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                      notifs[key as keyof typeof notifs] ? "translate-x-5" : "translate-x-0.5"
                    )} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
