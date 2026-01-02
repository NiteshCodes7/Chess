"use client";

import { use, useEffect } from "react";
import { getSocket } from "@/lib/socket";
import { useGameStore } from "@/store/useGameStore";
import ChessBoard from "@/app/components/chess/ChessBoard";

export default function GamePage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = use(params);

  const applyRemoteMove = useGameStore((s) => s.applyRemoteMove);
  const setGameId = useGameStore((s) => s.setGameId);
  const setPlayerColor = useGameStore((s) => s.setPlayerColor);

  useEffect(() => {
    const socket = getSocket();
    setGameId(gameId);
    socket.connect();

    socket.emit("join_game", gameId);

    socket.on("match_found", ({ color }) => {
      setPlayerColor(color);
    });

    socket.on("opponent_move", (move) => {
      applyRemoteMove(move);
    });

    return () => {
      socket.off("opponent_move");
      socket.off("match_found");
      socket.disconnect();
    };
  }, [setPlayerColor, gameId, applyRemoteMove]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-900">
      <ChessBoard />
    </main>
  );
}
