"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Avatar } from "@/components/ui/avatar";
import { Pin, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface Note {
  id: string;
  content: string;
  type: string;
  isPinned: boolean;
  createdAt: string;
  user: { id: string; name: string; avatarUrl: string | null } | null;
}

interface MessageBubbleProps {
  note: Note;
  currentUserId: string;
  onPin: (noteId: string, pinned: boolean) => void;
}

function timeLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function MessageBubble({ note, currentUserId, onPin }: MessageBubbleProps) {
  const isOwn = note.user?.id === currentUserId;
  const isAgent = note.type === "AGENT";
  const isSystem = note.type === "SYSTEM";
  const isDecision = note.type === "DECISION" || note.isPinned;

  // System messages — centered muted row
  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-3 py-1">
          {note.content}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex gap-3 group px-1",
        isOwn && !isAgent ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div className="shrink-0 mt-0.5">
        {isAgent ? (
          <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center ring-2 ring-white">
            <Bot className="w-4 h-4 text-purple-600" />
          </div>
        ) : (
          <Avatar
            name={note.user?.name ?? "?"}
            avatarUrl={note.user?.avatarUrl}
            size="sm"
          />
        )}
      </div>

      {/* Bubble */}
      <div className={cn("flex flex-col max-w-[72%]", isOwn && !isAgent && "items-end")}>
        {/* Name + time */}
        <div
          className={cn(
            "flex items-center gap-2 mb-1",
            isOwn && !isAgent ? "flex-row-reverse" : "flex-row"
          )}
        >
          <span className="text-xs font-medium text-slate-600">
            {isAgent ? "EpicenTra Agent" : (note.user?.name ?? "Unknown")}
          </span>
          <span className="text-xs text-slate-400">{timeLabel(note.createdAt)}</span>
          {isDecision && (
            <span className="text-xs font-medium text-brand-amber flex items-center gap-1">
              <Pin className="w-3 h-3" /> Decision
            </span>
          )}
        </div>

        {/* Content */}
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isAgent
              ? "bg-purple-50 border border-purple-100 text-slate-800 rounded-tl-sm"
              : isOwn
                ? "bg-brand-blue text-white rounded-tr-sm"
                : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm",
            isDecision && !isAgent && !isOwn && "border-brand-amber/40 bg-amber-50"
          )}
        >
          {isAgent ? (
            <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-headings:text-slate-800 prose-code:text-purple-700 prose-code:bg-purple-50">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content}</ReactMarkdown>
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{note.content}</p>
          )}
        </div>

        {/* Pin action */}
        <button
          onClick={() => onPin(note.id, !note.isPinned)}
          className={cn(
            "mt-1 flex items-center gap-1 text-xs transition-all opacity-0 group-hover:opacity-100",
            note.isPinned ? "text-brand-amber" : "text-slate-400 hover:text-brand-amber"
          )}
        >
          <Pin className="w-3 h-3" />
          {note.isPinned ? "Unpin" : "Pin as Decision"}
        </button>
      </div>
    </div>
  );
}
