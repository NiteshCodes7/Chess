"use client";

import { useState, KeyboardEvent } from "react";
import { getSocket } from "@/lib/socket";

type ChatInputProps = {
  to?: string;
  gameId?: string;
};

export default function ChatInput({ to, gameId }: ChatInputProps) {
  const [text, setText] = useState("");

  const chatSocket = getSocket();
  const gameSocket = getSocket();

  const sendMessage = () => {
    const trimmed = text.trim();

    if (!trimmed) return;

    if (!to && !gameId) {
      console.warn("No target provided");
      return;
    }

    // DM
    if (to) {
      if (!chatSocket.connected) {
        console.warn("Chat socket not connected");
        return;
      }

      chatSocket.emit("dm", {
        to,
        content: trimmed,
      });
    }

    // GAME CHAT
    else if (gameId) {
      if (!gameSocket.connected) {
        console.warn("Game socket not connected");
        return;
      }

      gameSocket.emit("game_chat", {
        gameId,
        content: trimmed,
      });
    }

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
        className="bg-blue-600 px-4 rounded hover:bg-blue-700 disabled:opacity-50 transition"
      >
        Send
      </button>
    </div>
  );
}