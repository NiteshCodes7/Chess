"use client";

import { getSocket } from "@/lib/socket";

type Message = {
  id: string;
  to: string;
  content: string;
  isMe?: boolean;
  createdAt?: string;
};

type MessageItemProps = {
  message: Message;
  isGameChat: boolean;
  onDelete: (message: string) => void;
};

export default function MessageItem({ message, isGameChat,onDelete }: MessageItemProps) {
  const isMe = message.isMe ?? false;
  const socket = getSocket();

  function handleDelete() {
    if(isMe){
      socket.emit("delete_message", { messageId: message.id, to: message.to });
    } else {
      onDelete(message.id);
    }
  }

  const time = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div
      className={`flex flex-col ${isMe ? "items-end" : "items-start"} gap-1 group`}
    >
      <div className="relative max-w-[75%]">
        {/* Delete button */}
          <button
            onClick={handleDelete}
            className={`absolute ${isMe ? "-left-6 top-1/2 -translate-y-1/2" : "-right-6 top-1/2 -translate-y-1/2"}  opacity-0 group-hover:opacity-100 transition-opacity text-[#555] hover:text-[#c06060]`}
            title="Delete"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="w-3 h-3"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
          </button>

        {/* Bubble */}
        <div
          className={`px-3 py-2 ${isGameChat ? "text-[11px]" : "text-xs"} font-light leading-relaxed rounded-md`}
          style={{
            background: isMe ? "#1f1a14" : "#111111",
            border: `1px solid ${isMe ? "#3a2f1f" : "#1c1c1c"}`,
            color: isMe ? "#e6d3a3" : "#d1d1d1",
          }}
        >
          {isGameChat && (
            <span
              className="block text-[10px] mb-1 font-medium tracking-wide"
              style={{ color: isMe ? "#d4b06a" : "#6b7280" }}
            >
              {isMe ? "You" : "Opponent"}
            </span>
          )}
          {message.content}
        </div>
      </div>

      {time && (
        <span className="text-[10px] font-light" style={{ color: "#555" }}>
          {time}
        </span>
      )}
    </div>
  );
}
