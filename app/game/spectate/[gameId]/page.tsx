"use client";

import { use, useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";
import { useGameStore } from "@/store/useGameStore";
import ChessBoard from "@/app/components/chess/ChessBoard";
import { StateUpdatePayload } from "@/types/socket";
import Link from "next/link";

export default function SpectatePage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = use(params);
  const applyRemote = useGameStore((s) => s.applyRemoteMove);
  const turn = useGameStore((s) => s.turn);
  const status = useGameStore((s) => s.status);
  const [moveCount, setMoveCount] = useState(0);

  useEffect(() => {
    const socket = getSocket();

    socket.emit("spectate", gameId);

    socket.on("state_update", (payload: StateUpdatePayload) => {
      const { board, turn, time, lastTimestamp, promotionPending } = payload;
      useGameStore.setState({
        board,
        turn,
        serverTime: { white: time.white, black: time.black },
        lastTimestamp,
        promotionPending,
      });
      setMoveCount((prev) => prev + 1);
    });

    socket.on("authoritative_move", (move) => {
      applyRemote(move);
    });

    return () => {
      socket.off("state_update");
      socket.off("authoritative_move");
    };
  }, [gameId, applyRemote]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e8e0d0] flex flex-col items-center justify-center px-4 py-10 gap-6 relative overflow-hidden">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.4s ease both; }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .live-dot { animation: blink 1.5s ease-in-out infinite; }
      `}</style>

      {/* Grid bg */}
      <div
        className="fixed inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#c8a96e 1px, transparent 1px), linear-gradient(90deg, #c8a96e 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4">
        <Link
          href="/"
          className="text-[#c8a96e] text-sm tracking-widest uppercase font-light hover:opacity-70 transition-opacity no-underline"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Chessify
        </Link>

        {/* Live badge */}
        <div className="flex items-center gap-2 border border-[#1a1a1a] px-3 py-1.5 bg-[#0e0e0e]">
          <div className="live-dot w-1.5 h-1.5 rounded-full bg-red-500" />
          <span className="text-[#878383] text-[10px] tracking-[0.2em] uppercase font-light">
            Live
          </span>
        </div>
      </nav>

      {/* Header */}
      <div className="relative z-10 flex flex-col items-center gap-2 fade-up pt-8">
        <div className="flex items-center gap-3">
          <span className="block w-8 h-px bg-[#c8a96e] opacity-40" />
          <span className="text-[#c8a96e] text-xs tracking-[0.25em] uppercase">
            Spectating
          </span>
          <span className="block w-8 h-px bg-[#c8a96e] opacity-40" />
        </div>
        <p
          className="text-[#333] text-xs font-light tracking-widest"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {gameId.slice(0, 8)}…
        </p>
      </div>

      {/* Board */}
      <div className="relative z-10 fade-up" style={{ animationDelay: "0.1s" }}>
        <ChessBoard spectator={true} />
      </div>

      {/* Game info bar */}
      <div
        className="relative z-10 flex border border-[#141414] fade-up"
        style={{
          maxWidth: "clamp(280px, 80vw, 504px)",
          width: "100%",
          animationDelay: "0.15s",
        }}
      >
        {/* Turn */}
        <div className="flex-1 px-5 py-3 border-r border-[#141414]">
          <p className="text-[#444] text-[10px] tracking-[0.18em] uppercase mb-1">To move</p>
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 border"
              style={{
                background: turn === "white" ? "#f0ebe0" : "#1a1a1a",
                borderColor: turn === "white" ? "#999" : "#333",
              }}
            />
            <span
              className="text-[#d0c8b8] text-sm font-light capitalize"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {turn}
            </span>
          </div>
        </div>

        {/* Move count */}
        <div className="flex-1 px-5 py-3 border-r border-[#141414]">
          <p className="text-[#444] text-[10px] tracking-[0.18em] uppercase mb-1">Moves</p>
          <span
            className="text-[#c8a96e] text-sm font-light"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {moveCount}
          </span>
        </div>

        {/* Status */}
        <div className="flex-1 px-5 py-3">
          <p className="text-[#444] text-[10px] tracking-[0.18em] uppercase mb-1">Status</p>
          <span
            className="text-sm font-light capitalize"
            style={{
              fontFamily: "Georgia, serif",
              color:
                status.state === "playing"
                  ? "#878383"
                  : status.state === "check"
                    ? "#c8a96e"
                    : "#d0c8b8",
            }}
          >
            {status.state}
          </span>
        </div>
      </div>

      {/* Footer hint */}
      <p
        className="relative z-10 text-[#222] text-xs font-light tracking-widest fade-up"
        style={{ animationDelay: "0.2s" }}
      >
        You are watching as a spectator
      </p>
    </div>
  );
}