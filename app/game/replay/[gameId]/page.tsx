"use client";

import ChessBoard from "@/app/components/chess/ChessBoard";
import { api } from "@/lib/api";
import { initialBoard } from "@/lib/initialBoard";
import { useGameStore } from "@/store/useGameStore";
import { useRouter } from "next/navigation";
import React, { use, useEffect, useState } from "react";

type Move = {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
};

const ReplayPage = ({ params }: { params: Promise<{ gameId: string }> }) => {
  const { gameId } = use(params);
  const router = useRouter();

  const [moves, setMoves] = useState<Move[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const setBoard = useGameStore((s) => s.setBoard);
  const applyRemoteMove = useGameStore((s) => s.applyRemoteMove);
  const resetGame = useGameStore((s) => s.resetGame);

  useEffect(() => {
    const fetchGame = async () => {
      setLoading(true);
      resetGame();
      const res = await api.get(`/game/${gameId}`);
      setMoves(res.data.moves);
      setIndex(0);
      setLoading(false);
    };
    fetchGame();
  }, [gameId, resetGame]);

  useEffect(() => {
    setBoard(initialBoard);
    for (let i = 0; i < index; i++) {
      const move = moves[i];
      if (!move) break;
      applyRemoteMove({
        from: { row: move.fromRow, col: move.fromCol },
        to: { row: move.toRow, col: move.toCol },
        turn: i % 2 === 0 ? "white" : "black",
      });
    }
  }, [index, moves, setBoard, applyRemoteMove]);

  const progress = moves.length > 0 ? (index / moves.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e8e0d0] flex flex-col items-center justify-center px-4 py-10 gap-6">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fadeUp 0.5s ease both; }
      `}</style>

      {/* Subtle grid background */}
      <div
        className="fixed inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#c8a96e 1px, transparent 1px), linear-gradient(90deg, #c8a96e 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Back Button */}
      <div
        className="relative z-10 w-full max-w-126 animate-fade-up"
        style={{ animationDelay: "0.02s" }}
      >
        <button
          onClick={() => router.back()}
          className="group flex items-center gap-2 text-[#8b8578] hover:text-[#c8a96e] transition-colors duration-150"
          title="Go back"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="w-4 h-4"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>

          <span className="text-xs tracking-[0.18em] uppercase font-light">
            Back
          </span>
        </button>
      </div>

      {/* Header */}
      <div className="relative z-10 flex flex-col items-center gap-2 animate-fade-up">
        <div className="flex items-center gap-3">
          <span className="block w-8 h-px bg-[#c8a96e] opacity-40" />
          <span className="text-[#c8a96e] text-xs tracking-[0.25em] uppercase">
            Game replay
          </span>
          <span className="block w-8 h-px bg-[#c8a96e] opacity-40" />
        </div>
        <p
          className="text-[#7a7468] text-xs tracking-[0.15em] font-light"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {loading ? "Loading moves…" : `${moves.length} moves`}
        </p>
      </div>

      {/* Board */}
      <div
        className="relative z-10 animate-fade-up"
        style={{ animationDelay: "0.1s" }}
      >
        <ChessBoard spectator />
      </div>

      {/* Move counter */}
      <div
        className="relative z-10 flex items-center gap-3 animate-fade-up"
        style={{ animationDelay: "0.15s" }}
      >
        <span className="text-[#8b8578] text-xs font-light tracking-widest">
          Move
        </span>
        <span
          className="text-[#c8a96e] text-lg font-light tabular-nums leading-none"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {index}
        </span>
        <span className="text-[#666056] text-xs">/</span>
        <span className="text-[#8b8578] text-xs font-light tabular-nums">
          {moves.length}
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="relative z-10 w-full animate-fade-up"
        style={{
          maxWidth: "clamp(280px, 80vw, 504px)",
          animationDelay: "0.2s",
        }}
      >
        <div className="h-px bg-[#1a1a1a] w-full relative overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-[#c8a96e] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div
        className="relative z-10 flex items-center gap-1 border border-[#1a1a1a] animate-fade-up"
        style={{ animationDelay: "0.25s" }}
      >
        {/* Reset */}
        <button
          onClick={() => {
            setIndex(0);
            resetGame();
          }}
          disabled={index === 0}
          className="group flex flex-col items-center justify-center w-14 h-12 border-r border-[#1a1a1a] hover:bg-[#111] disabled:opacity-20 disabled:cursor-not-allowed transition-colors duration-150"
          title="Reset"
        >
          <svg
            className="w-4 h-4 text-[#b2aa9b] group-hover:text-[#c8a96e] transition-colors"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 .49-5" />
          </svg>
        </button>

        {/* Previous */}
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="group flex flex-col items-center justify-center w-14 h-12 border-r border-[#1a1a1a] hover:bg-[#111] disabled:opacity-20 disabled:cursor-not-allowed transition-colors duration-150"
          title="Previous move"
        >
          <svg
            className="w-4 h-4 text-[#8b8578] group-hover:text-[#c8a96e] transition-colors"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Move number display */}
        <div className="flex items-center justify-center w-16 h-12 border-r border-[#1a1a1a]">
          <span
            className="text-[#8b8578] text-xs tabular-nums"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {index}/{moves.length}
          </span>
        </div>

        {/* Next */}
        <button
          onClick={() => setIndex((i) => Math.min(moves.length, i + 1))}
          disabled={index === moves.length}
          className="group flex flex-col items-center justify-center w-14 h-12 border-r border-[#1a1a1a] hover:bg-[#111] disabled:opacity-20 disabled:cursor-not-allowed transition-colors duration-150"
          title="Next move"
        >
          <svg
            className="w-4 h-4 text-[#8b8578] group-hover:text-[#c8a96e] transition-colors"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {/* Jump to end */}
        <button
          onClick={() => setIndex(moves.length)}
          disabled={index === moves.length}
          className="group flex flex-col items-center justify-center w-14 h-12 hover:bg-[#111] disabled:opacity-20 disabled:cursor-not-allowed transition-colors duration-150"
          title="Jump to end"
        >
          <svg
            className="w-4 h-4 text-[#8b8578] group-hover:text-[#c8a96e] transition-colors"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <polyline points="13 17 18 12 13 7" />
            <polyline points="6 17 11 12 6 7" />
          </svg>
        </button>
      </div>

      {/* Keyboard hint */}
      <p
        className="relative z-10 text-[#6f6a60] text-xs font-light tracking-widest animate-fade-up"
        style={{ animationDelay: "0.3s" }}
      >
        Use ← → arrow keys to navigate
      </p>
    </div>
  );
};

export default ReplayPage;
