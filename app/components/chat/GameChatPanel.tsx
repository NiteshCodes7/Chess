"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { getSocket } from "@/lib/socket";

type Message = {
  from: string;
  content: string;
  isMe: boolean;
};

type Props = {
  gameId: string;
  messages: Message[];
};

export default function GameChatPanel({ gameId, messages }: Props) {
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const socket = getSocket();
    if (!socket.connected) return;
    socket.emit("game_chat", { gameId, content: trimmed });
    setText("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      <style>{`
        .gchat-scroll::-webkit-scrollbar { width: 3px; }
        .gchat-scroll::-webkit-scrollbar-track { background: transparent; }
        .gchat-scroll::-webkit-scrollbar-thumb { background: #1a1a1a; }
      `}</style>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5 gchat-scroll">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <span
              className="text-2xl select-none"
              style={{ color: "#878383", opacity: 0.2 }}
            >
              ♛
            </span>
            <p className="text-[#333] text-xs font-light">No messages yet</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col ${msg.isMe ? "items-end" : "items-start"} gap-0.5`}
          >
            <div
              className="max-w-[78%] px-3 py-1.5 text-xs font-light leading-relaxed"
              style={{
                background: msg.isMe ? "#161410" : "#0e0e0e",
                border: `1px solid ${msg.isMe ? "#2a2010" : "#141414"}`,
                color: "#878383",
              }}
            >
              <span
                className="block text-[10px] mb-0.5 font-light"
                style={{ color: msg.isMe ? "#c8a96e" : "#555" }}
              >
                {msg.isMe ? "You" : "Opponent"}
              </span>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-t border-[#111]">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          className="flex-1 h-8 px-3 bg-[#0e0e0e] border border-[#141414] text-[#878383] placeholder-[#2a2a2a] text-xs font-light focus:outline-none focus:border-[#222] transition-colors"
          style={{ fontFamily: "inherit" }}
        />
        <button
          onClick={send}
          disabled={!text.trim()}
          className="w-8 h-8 border border-[#1a1a1a] bg-[#0e0e0e] flex items-center justify-center text-[#333] hover:border-[#c8a96e] hover:text-[#c8a96e] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="w-3.5 h-3.5"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
