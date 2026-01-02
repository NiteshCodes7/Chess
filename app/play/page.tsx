"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";
import { useGameStore } from "@/store/useGameStore";

export default function PlayPage() {
  const router = useRouter();

  useEffect(() => {
    const socket = getSocket();
    socket.connect();

    socket.emit("find_match");

    socket.on("match_found", ({ gameId, color }) => {
      useGameStore.getState().setPlayerColor(color);
      router.push(`/game/${gameId}`);
    });

    socket.on("authoritative_move", ({ board, turn }) => {
      useGameStore.setState({
        board,
        turn,
        selected: null,
      });
    });

    return () => {
      socket.off("match_found");
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <p className="text-white text-xl">Finding an opponent...</p>
    </div>
  );
}
