"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Send, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
  onTypingStart: () => void;
  onTypingStop: () => void;
}

export function MessageInput({
  onSend,
  disabled,
  onTypingStart,
  onTypingStop,
}: MessageInputProps) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTyping = useRef(false);

  const hasAgent = value.toLowerCase().includes("@agent") || value.startsWith("/agent");

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);

    // Typing indicator logic
    if (!isTyping.current) {
      isTyping.current = true;
      onTypingStart();
    }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      isTyping.current = false;
      onTypingStop();
    }, 1500);
  }

  async function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || sending || disabled) return;
    setSending(true);
    setValue("");
    if (typingTimer.current) clearTimeout(typingTimer.current);
    isTyping.current = false;
    onTypingStop();
    await onSend(trimmed);
    setSending(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="border-t border-slate-200 bg-white p-4">
      {hasAgent && (
        <div className="flex items-center gap-2 mb-2 px-1">
          <Bot className="w-3.5 h-3.5 text-purple-500" />
          <span className="text-xs text-purple-600 font-medium">
            EpicenTra Agent will respond to this message
          </span>
        </div>
      )}
      <div
        className={cn(
          "flex items-end gap-3 rounded-xl border bg-white px-4 py-3 transition-all",
          hasAgent
            ? "border-purple-200 ring-1 ring-purple-200"
            : "border-slate-200 focus-within:border-brand-blue focus-within:ring-1 focus-within:ring-brand-blue"
        )}
      >
        <textarea
          rows={1}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder='Message the team… or type @agent to ask the AI'
          disabled={disabled || sending}
          className="flex-1 resize-none bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none max-h-40 min-h-[24px]"
          style={{ height: "auto" }}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = `${el.scrollHeight}px`;
          }}
        />
        <button
          onClick={handleSend}
          disabled={!value.trim() || sending || disabled}
          className={cn(
            "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all",
            value.trim() && !sending
              ? hasAgent
                ? "bg-purple-500 text-white hover:bg-purple-600"
                : "bg-brand-blue text-white hover:bg-brand-blue-dark"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          )}
        >
          {sending ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
      <p className="text-xs text-slate-400 mt-1.5 px-1">
        ⌘+Enter to send · @agent to ask the Planning Agent
      </p>
    </div>
  );
}
