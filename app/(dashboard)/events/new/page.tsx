"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";

export default function NewEventPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() }),
    });

    if (!res.ok) {
      setError("Failed to create event. Please try again.");
      setLoading(false);
      return;
    }

    const event = await res.json();
    router.push(`/events/${event.id}/specs`);
  }

  return (
    <div className="max-w-lg mx-auto animate-slide-in">
      <PageHeader
        title="Create Event"
        subtitle="Name the event to open its workspace"
        actions={
          <Link
            href="/events"
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>
        }
      />

      <div className="mt-6 bg-white rounded-xl border border-slate-200 p-8">

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="title"
            label="Event Name"
            placeholder="e.g. Nike Air Max Day Pop-Up"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            required
          />

          {error && (
            <p className="text-sm text-brand-red">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" loading={loading} className="flex-1">
              Create Event
            </Button>
            <Link href="/events">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
