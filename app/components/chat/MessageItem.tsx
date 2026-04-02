"use client";

type Message = {
  content: string;
  isMe?: boolean;
  createdAt?: string;
};

type MessageItemProps = {
  message: Message;
};


export default function MessageItem({
  message,
}: MessageItemProps) {
  const isMe = message.isMe ?? false;

  return (
    <div
      className={`flex ${
        isMe ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`
          px-3 py-2 rounded-lg max-w-xs wrap-break-word
          ${isMe
            ? "bg-blue-600 text-white"
            : "bg-gray-700 text-white"}
        `}
      >
        {/* Message Content */}
        <p>{message.content}</p>

        {message.createdAt && (
          <span className="text-[10px] text-gray-300 block mt-1 text-right">
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>
    </div>
  );
}