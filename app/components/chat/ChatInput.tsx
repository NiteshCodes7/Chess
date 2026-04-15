"use client";

import { useState, KeyboardEvent } from "react";
import { getSocket } from "@/lib/socket";

type ChatInputProps = {
  to?: string;
  gameId?: string;
};

export default function ChatInput({ to, gameId }: ChatInputProps) {
  const [text, setText] = useState("");

  const bannedWords = [
    "fuck",
    "shit",
    "bitch",
    "asshole",
    "bastard",
    "mc",
    "bc",
    "chutiya",
    "madarchod",
    "bhenchod",
    "boobs",
    "f**k",
    "ma*arch*d",
    "sex",
    "lund",
  ];

  const cleanedWords = (words: string[]) => {
    const censoredWords = words.map((word) => {
      const lower = word.toLowerCase();

      if (bannedWords.includes(lower)) {
        let stars = "";

        for (let i = 0; i < word.length; i++) {
          stars += "*";
        }

        return stars;
      }

      return word;
    });
    return censoredWords.join(" ");
  };

  const sendMessage = () => {
    const trimmed = text.trim();

    if (!trimmed || (!to && !gameId)) return;

    const safeMessage = cleanedWords(trimmed.split(" "));

    const socket = getSocket();
    if (!socket.connected) return;

    if (to) {
      socket.emit("dm", { to, content: safeMessage });
    } else if (gameId) {
      socket.emit("game_chat", { gameId, content: safeMessage });
    }

    setText("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  const isActive = text.trim().length > 0;

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 bg-[#0b0b0b] border-t border-[#1f1f1f]">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message…"
        className="
          flex-1 h-9 px-3
          bg-[#121212]
          border border-[#2a2a2a]
          text-[#e5e5e5]
          placeholder-[#6b6b6b]
          text-xs font-light
          rounded-md
          outline-none
          focus:border-[#e0b970]
          focus:ring-2 focus:ring-[#e0b970]/40
          transition-all duration-150
        "
      />

      <button
        onClick={sendMessage}
        disabled={!isActive}
        className={`
          w-9 h-9 flex items-center justify-center rounded-md
          border transition-all duration-150

          ${
            isActive
              ? "bg-[#e0b970] border-[#e0b970] text-black hover:bg-[#f0c980]"
              : "bg-[#121212] border-[#2a2a2a] text-[#555]"
          }

          active:scale-95
          disabled:cursor-not-allowed
        `}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="w-4 h-4"
        >
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
  );
}
