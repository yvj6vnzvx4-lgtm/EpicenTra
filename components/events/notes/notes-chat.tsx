"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Pin, ChevronDown, ChevronUp, Users } from "lucide-react";
import { getSocket } from "@/lib/socket-client";
import { MessageBubble } from "./message-bubble";
import { MessageInput } from "./message-input";
import { AvatarStack } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Note {
  id: string;
  content: string;
  type: string;
  isPinned: boolean;
  createdAt: string;
  user: { id: string; name: string; avatarUrl: string | null } | null;
}

interface PresenceUser {
  userId: string;
  name: string;
  avatarUrl: string | null;
}

interface NotesChatProps {
  eventId: string;
  initialNotes: Note[];
}

export function NotesChat({ eventId, initialNotes }: NotesChatProps) {
  const { data: session } = useSession();
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [presence, setPresence] = useState<PresenceUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [pinnedOpen, setPinnedOpen] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);

  const pinnedNotes = notes.filter((n) => n.isPinned || n.type === "DECISION");

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [notes, scrollToBottom]);

  // Socket.io setup
  useEffect(() => {
    if (!session?.user) return;

    const socket = getSocket();
    socketRef.current = socket;

    socket.emit("join-event", {
      eventId,
      userId: session.user.id,
      name: session.user.name,
      avatarUrl: session.user.avatarUrl ?? null,
    });

    socket.on("presence-update", (users: PresenceUser[]) => {
      setPresence(users.filter((u) => u.userId !== session.user.id));
    });

    socket.on("new-note", (note: Note) => {
      setNotes((prev) => {
        // Avoid duplicates (we optimistically add our own)
        if (prev.find((n) => n.id === note.id)) return prev;
        return [...prev, note];
      });
    });

    socket.on("note-updated", (updated: Note) => {
      setNotes((prev) =>
        prev.map((n) => (n.id === updated.id ? updated : n))
      );
    });

    socket.on("user-typing", ({ name }: { userId: string; name: string }) => {
      setTypingUsers((prev) =>
        prev.includes(name) ? prev : [...prev, name]
      );
    });

    socket.on("user-stopped-typing", ({ name }: { userId: string; name: string }) => {
      setTypingUsers((prev) => prev.filter((n) => n !== name));
    });

    return () => {
      socket.off("presence-update");
      socket.off("new-note");
      socket.off("note-updated");
      socket.off("user-typing");
      socket.off("user-stopped-typing");
    };
  }, [eventId, session]);

  async function handleSend(content: string) {
    if (!session?.user || sending) return;
    setSending(true);

    try {
      const res = await fetch(`/api/events/${eventId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) throw new Error("Failed to send");

      const { userNote, agentNote } = await res.json();

      // Add to local state
      setNotes((prev) => {
        const next = [...prev];
        if (!next.find((n) => n.id === userNote.id)) next.push(userNote);
        if (agentNote && !next.find((n) => n.id === agentNote.id)) next.push(agentNote);
        return next;
      });

      // Broadcast via socket so other clients see it
      socketRef.current?.emit("broadcast-note", { eventId, note: userNote });
      if (agentNote) {
        socketRef.current?.emit("broadcast-note", { eventId, note: agentNote });
      }
    } catch (err) {
      console.error("[notes] send error:", err);
    } finally {
      setSending(false);
    }
  }

  async function handlePin(noteId: string, pinned: boolean) {
    const res = await fetch(`/api/events/${eventId}/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: pinned }),
    });
    if (!res.ok) return;
    const updated: Note = await res.json();
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    socketRef.current?.emit("note-updated", { eventId, note: updated });
  }

  function handleTypingStart() {
    socketRef.current?.emit("typing-start", {
      eventId,
      userId: session?.user?.id,
      name: session?.user?.name,
    });
  }

  function handleTypingStop() {
    socketRef.current?.emit("typing-stop", {
      eventId,
      userId: session?.user?.id,
      name: session?.user?.name,
    });
  }

  if (!session?.user) return null;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Team Notes</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Collaborate in real-time · type @agent for AI assistance
          </p>
        </div>

        {/* Online presence */}
        {presence.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {presence.length} online
            </span>
            <AvatarStack
              users={presence.map((p) => ({
                name: p.name,
                avatarUrl: p.avatarUrl,
              }))}
              max={4}
            />
          </div>
        )}
      </div>

      {/* Pinned decisions */}
      {pinnedNotes.length > 0 && (
        <div className="shrink-0 border-b border-amber-200 bg-amber-50">
          <button
            onClick={() => setPinnedOpen((v) => !v)}
            className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
          >
            <Pin className="w-3.5 h-3.5" />
            <span>{pinnedNotes.length} Pinned Decision{pinnedNotes.length !== 1 ? "s" : ""}</span>
            <span className="ml-auto">
              {pinnedOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          </button>

          {pinnedOpen && (
            <div className="px-4 pb-3 space-y-1.5">
              {pinnedNotes.map((note) => (
                <div key={note.id} className="flex items-start gap-2 text-xs text-slate-700">
                  <Pin className="w-3 h-3 text-brand-amber mt-0.5 shrink-0" />
                  <p className="leading-relaxed line-clamp-2">{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Message feed */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">No messages yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Start the conversation or type @agent to ask the AI
            </p>
          </div>
        ) : (
          notes.map((note) => (
            <MessageBubble
              key={note.id}
              note={note}
              currentUserId={session.user.id}
              onPin={handlePin}
            />
          ))
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 px-1">
            <div className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce",
                  )}
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
            <span className="text-xs text-slate-400">
              {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing…
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0">
        <MessageInput
          onSend={handleSend}
          disabled={sending}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
        />
      </div>
    </div>
  );
}
