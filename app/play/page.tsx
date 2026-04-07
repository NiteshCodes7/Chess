"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";
import { useGameStore } from "@/store/useGameStore";
import { useToast } from "@/store/useToast";

export default function PlayPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [banRemaining, setBanRemaining] = useState<number | null>(null);
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "." : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const socket = getSocket();
    let emitted = false;

    const onMatchFound = ({
      gameId,
      color,
      timeMs,
      incrementMs,
      lastTimestamp,
    }: {
      gameId: string;
      color: "white" | "black";
      timeMs: number;
      incrementMs: number;
      lastTimestamp: number;
    }) => {
      useGameStore.setState({
        playerColor: color,
        serverTime: { white: timeMs, black: timeMs },
        lastTimestamp,
        incrementMs,
      });
      router.push(`/game/${gameId}`);
    };

    const onMatchTimeout = () =>
      addToast("No opponent found. Try again later.", "info");
    const onMatchCanceled = () => router.push("/");

    const onMatchFoundHandler = onMatchFound;
    socket.on("match_found", onMatchFoundHandler);
    socket.on("match_timeout", onMatchTimeout);
    socket.on("match_canceled", onMatchCanceled);

    const emitFindMatch = () => {
      if (emitted) return;
      emitted = true;
      socket.emit("find_match");
    };

    if (socket.connected) {
      emitFindMatch();
    } else {
      socket.once("connect", emitFindMatch);
    }

    return () => {
      socket.off("match_found", onMatchFoundHandler);
      socket.off("match_timeout", onMatchTimeout);
      socket.off("match_canceled", onMatchCanceled);
      socket.off("connect", emitFindMatch);
    };
  }, [router]);

  useEffect(() => {
    const socket = getSocket();
    const onBanned = ({
      reason,
      remainingMs,
    }: {
      reason: string;
      remainingMs: number;
    }) => {
      setBanRemaining(remainingMs);
      socket.emit("cancel_match");
    };
    socket.on("banned", onBanned);
    return () => {
      socket.off("banned", onBanned);
    };
  }, []);

  useEffect(() => {
    if (!banRemaining) return;
    const interval = setInterval(() => {
      setBanRemaining((prev) => {
        if (!prev || prev <= 1000) {
          clearInterval(interval);
          return null;
        }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [banRemaining]);

  const onCancel = () => {
    getSocket().emit("cancel_match");
  };

  const banMinutes = banRemaining ? Math.floor(banRemaining / 60000) : 0;
  const banSeconds = banRemaining
    ? Math.ceil((banRemaining % 60000) / 1000)
    : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center relative overflow-hidden">
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.6; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        .animate-fade-up { animation: fadeUp 0.6s ease both; }
        .ring-1-anim { animation: pulse-ring 2s ease-out infinite; }
        .ring-2-anim { animation: pulse-ring 2s ease-out 0.6s infinite; }
        .ring-3-anim { animation: pulse-ring 2s ease-out 1.2s infinite; }
      `}</style>

      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#c8a96e 1px, transparent 1px), linear-gradient(90deg, #c8a96e 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Top nav bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-5">
        <button
          onClick={() => router.push("/")}
          className="text-[#c8a96e] text-base tracking-widest uppercase font-light hover:opacity-70 transition-opacity"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Chessify
        </button>
      </nav>

      {/* ── BAN STATE ── */}
      {banRemaining ? (
        <div className="relative z-10 flex flex-col items-center text-center px-6 animate-fade-up">
          {/* Icon */}
          <div className="w-16 h-16 mb-8 flex items-center justify-center border border-red-900/40 bg-red-950/20">
            <svg
              className="w-7 h-7 text-red-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </div>

          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-5">
            <span className="block w-6 h-px bg-red-700" />
            <span className="text-red-500 text-xs tracking-[0.25em] uppercase">
              Access restricted
            </span>
            <span className="block w-6 h-px bg-red-700" />
          </div>

          <h1
            className="text-4xl md:text-5xl font-light text-[#f0ebe0] mb-3 leading-tight"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Temporarily <span className="italic text-red-400">banned</span>
          </h1>

          <p className="text-[#555] font-light text-sm mb-2 tracking-wide">
            You abandoned a game in progress.
          </p>
          <p className="text-[#444] font-light text-xs tracking-[0.15em] uppercase mb-10">
            Matchmaking suspended
          </p>

          {/* Countdown */}
          <div className="border border-[#1a1a1a] bg-[#0e0e0e] px-12 py-6 mb-10">
            <p className="text-[#444] text-xs tracking-[0.2em] uppercase mb-3">
              Remaining
            </p>
            <p
              className="text-5xl font-light text-[#f0ebe0] tabular-nums"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {String(banMinutes).padStart(2, "0")}
              <span className="text-[#c8a96e] mx-1">:</span>
              {String(banSeconds).padStart(2, "0")}
            </p>
          </div>

          <button
            onClick={() => router.push("/")}
            className="bg-transparent text-[#555] border border-[#2a2a2a] px-8 py-3 text-xs font-light tracking-[0.15em] uppercase hover:border-[#c8a96e] hover:text-[#c8a96e] transition-all duration-200"
          >
            Return home
          </button>
        </div>
      ) : (
        /* ── SEARCHING STATE ── */
        <div className="relative z-10 flex flex-col items-center text-center px-6 animate-fade-up">
          {/* Pulse rings */}
          <div className="relative w-24 h-24 mb-10 flex items-center justify-center">
            <div className="ring-1-anim absolute inset-0 rounded-full border border-[#c8a96e]/30" />
            <div className="ring-2-anim absolute inset-0 rounded-full border border-[#c8a96e]/20" />
            <div className="ring-3-anim absolute inset-0 rounded-full border border-[#c8a96e]/10" />
            {/* Center chess piece */}
            <div className="relative z-10 w-16 h-16 border border-[#2a2520] bg-[#0e0e0e] flex items-center justify-center">
              <span
                className="text-3xl select-none"
                style={{
                  filter: "drop-shadow(0 2px 8px rgba(200,169,110,0.4))",
                }}
              >
                ♛
              </span>
            </div>
          </div>

          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-5">
            <span className="block w-6 h-px bg-[#c8a96e]" />
            <span className="text-[#c8a96e] text-xs tracking-[0.25em] uppercase">
              Matchmaking
            </span>
            <span className="block w-6 h-px bg-[#c8a96e]" />
          </div>

          <h1
            className="text-4xl md:text-5xl font-light text-[#f0ebe0] mb-3 leading-tight"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Seeking your <span className="italic text-[#c8a96e]">opponent</span>
          </h1>

          <p className="text-[#555] font-light text-sm mb-10 tracking-wide">
            Matching by Elo rating{dots}
          </p>

          {/* Info row */}
          <div className="flex gap-0 border border-[#1a1a1a] mb-10 w-full max-w-xs">
            {[
              { label: "Format", value: "5 + 0" },
              { label: "Mode", value: "Ranked" },
            ].map((item, i) => (
              <div
                key={item.label}
                className={`flex-1 px-5 py-4 ${i === 0 ? "border-r border-[#1a1a1a]" : ""}`}
              >
                <p className="text-[#444] text-xs tracking-[0.15em] uppercase mb-1">
                  {item.label}
                </p>
                <p
                  className="text-[#e8e0d0] text-sm font-light"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={onCancel}
            className="bg-transparent text-[#555] border border-[#2a2a2a] px-10 py-3 text-xs font-light tracking-[0.15em] uppercase hover:border-red-800 hover:text-red-400 transition-all duration-200"
          >
            Cancel search
          </button>
        </div>
      )}
    </div>
  );
}
