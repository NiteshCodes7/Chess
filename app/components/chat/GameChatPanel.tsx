"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { getSocket } from "@/lib/socket";
import { useGameStore } from "@/store/useGameStore";

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
  const [tab, setTab] = useState<"chat" | "moves">("chat");
  const bottomRef = useRef<HTMLDivElement>(null);

  const moves = useGameStore((s) => s.moves);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, moves, tab]);

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

  const pairedMoves = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairedMoves.push({
      no: i / 2 + 1,
      white: moves[i]?.san ?? "",
      black: moves[i + 1]?.san ?? "",
    });
  }

  return (
    <div className="flex flex-col h-full bg-transparent">
      <style>{`
        .gchat-scroll::-webkit-scrollbar { width: 3px; }
        .gchat-scroll::-webkit-scrollbar-track { background: transparent; }
        .gchat-scroll::-webkit-scrollbar-thumb { background: #1a1a1a; }
      `}</style>

      {/* Tabs */}
      <div className="grid grid-cols-2 border-b border-[#111]">
        <button
          onClick={() => setTab("chat")}
          className={`h-10 text-[11px] uppercase tracking-[0.22em] transition-colors ${
            tab === "chat"
              ? "text-[#c8a96e] bg-[#0f0f0f]"
              : "text-[#444] hover:text-[#888]"
          }`}
        >
          Chat
        </button>

        <button
          onClick={() => setTab("moves")}
          className={`h-10 text-[11px] uppercase tracking-[0.22em] transition-colors ${
            tab === "moves"
              ? "text-[#c8a96e] bg-[#0f0f0f]"
              : "text-[#444] hover:text-[#888]"
          }`}
        >
          Moves
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-3 gchat-scroll">
        {/* CHAT TAB */}
        {tab === "chat" && (
          <div className="space-y-1.5">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <span
                  className="text-2xl select-none"
                  style={{ color: "#878383", opacity: 0.2 }}
                >
                  ♛
                </span>
                <p className="text-[#333] text-xs font-light">
                  No messages yet
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${
                  msg.isMe ? "items-end" : "items-start"
                } gap-0.5`}
              >
                <div
                  className="max-w-[78%] px-3 py-1.5 text-xs font-light leading-relaxed"
                  style={{
                    background: msg.isMe ? "#1b1710" : "#121212",
                    border: `1px solid ${msg.isMe ? "#4a3820" : "#242424"}`,
                    color: "#d0c8b8",
                  }}
                >
                  <span
                    className="block text-[10px] mb-0.5 font-light"
                    style={{
                      color: msg.isMe ? "#c8a96e" : "#8a8a8a",
                    }}
                  >
                    {msg.isMe ? "You" : "Opponent"}
                  </span>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MOVES TAB */}
        {tab === "moves" && (
          <div className="space-y-1">
            {pairedMoves.length === 0 ? (
              <div className="flex items-center justify-center h-full text-[#333] text-xs">
                No moves yet
              </div>
            ) : (
              pairedMoves.map((row) => (
                <div
                  key={row.no}
                  className="grid grid-cols-[34px_1fr_1fr] gap-2 items-center py-1.5 border-b border-[#111] text-xs"
                >
                  <span className="text-[#555]">{row.no}.</span>

                  <span className="text-[#d0c8b8] truncate">{row.white}</span>

                  <span className="text-[#878383] truncate">{row.black}</span>
                </div>
              ))
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input only on Chat tab */}
      {tab === "chat" && (
        <div className="flex items-center gap-2 px-3 py-2.5 border-t border-[#111]">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            className="flex-1 h-8 px-3 bg-[#121212] border-[#2a2a2a] text-[#e0d8c8] placeholder-[#666] focus:border-[#c8a96e] text-xs font-light focus:outline-none transition-colors"
          />

          <button
            onClick={send}
            disabled={!text.trim()}
            className="w-8 h-8 border text-[#777] border-[#2a2a2a] hover:text-[#c8a96e] hover:border-[#c8a96e] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
