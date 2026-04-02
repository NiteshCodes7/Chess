"use client";

import { useState, KeyboardEvent } from "react";
import { getSocket } from "@/lib/socket";

type ChatInputProps = {
  to?: string;
};

export default function ChatInput({ to }: ChatInputProps) {
  const [text, setText] = useState("");
  const socket = getSocket();

  const sendMessage = () => {
    const trimmed = text.trim();
    if (!trimmed || !to) return;

    socket.emit("dm", {
      to,
      content: trimmed,
    });

    setText("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="p-3 border-t border-gray-700 flex gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        className="flex-1 px-3 py-2 rounded bg-gray-900 text-white outline-none"
      />

      <button
        onClick={sendMessage}
        disabled={!text.trim()}
        className="bg-blue-600 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        Send
      </button>
    </div>
  );
}