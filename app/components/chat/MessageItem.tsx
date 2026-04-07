"use client";

type Message = {
  content: string;
  isMe?: boolean;
  createdAt?: string;
};

type MessageItemProps = {
  message: Message;
  isGameChat: boolean;
};

export default function MessageItem({ message, isGameChat }: MessageItemProps) {
  const isMe = message.isMe ?? false;

  const time = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div
      className={`flex flex-col ${isMe ? "items-end" : "items-start"} gap-1`}
    >
      <div
        className={`
          max-w-[75%] px-3 py-2
          ${isGameChat ? "text-[11px]" : "text-xs"}
          font-light leading-relaxed rounded-md
        `}
        style={{
          background: isMe ? "#1f1a14" : "#111111",
          border: `1px solid ${isMe ? "#3a2f1f" : "#1c1c1c"}`,
          color: isMe ? "#e6d3a3" : "#d1d1d1",
        }}
      >
        {/* Sender indicator for game chat */}
        {isGameChat && (
          <span
            className="block text-[10px] mb-1 font-medium tracking-wide"
            style={{
              color: isMe ? "#d4b06a" : "#6b7280",
            }}
          >
            {isMe ? "You" : "Opponent"}
          </span>
        )}

        {message.content}
      </div>

      {/* Timestamp */}
      {time && (
        <span className="text-[10px] font-light" style={{ color: "#555" }}>
          {time}
        </span>
      )}
    </div>
  );
}
