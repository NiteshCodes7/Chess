"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";
import { useGameStore } from "@/store/useGameStore";

export default function PlayPage() {
  const router = useRouter();

  useEffect(() => {
    const socket = getSocket();

    socket.emit("find_match");

    const onMatchFound = ({ gameId, color, timeMs, incrementMs, lastTimestamp }: { gameId: string; color: 'white' | 'black'; timeMs: number; incrementMs: number; lastTimestamp: number }) => {
      useGameStore.setState({
        playerColor: color,
        serverTime: { white: timeMs, black: timeMs },
        lastTimestamp,
        incrementMs,
      });
      router.push(`/game/${gameId}`);
    };

    const onMatchTimeout = () => {
      alert("No opponent found. Try again later.");
    };

    const onMatchCanceled = () => {
      router.push("/");
    };

    socket.on("match_found", onMatchFound);
    socket.on("match_timeout", onMatchTimeout);
    socket.on("match_canceled", onMatchCanceled);

    return () => {
      socket.off("match_found", onMatchFound);
      socket.off("match_timeout", onMatchTimeout);
      socket.off("match_canceled", onMatchCanceled);
      // ✅ no disconnect — socket is shared
    };
  }, [router]);

  const onCancel = () => {
    const socket = getSocket();
    socket.emit("cancel_match");
    // ✅ listener is registered in useEffect, not here
  };

  return (
    <div className="min-h-screen flex flex-col gap-2 items-center justify-center bg-gray-900">
      <p className="text-white text-xl">Finding an opponent...</p>
      <button
        onClick={onCancel}
        className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors duration-200 shadow-md"
      >
        Cancel
      </button>
    </div>
  );
}