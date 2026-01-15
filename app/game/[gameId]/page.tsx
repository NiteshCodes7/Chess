"use client";

import { use, useEffect } from "react";
import { getSocket } from "@/lib/socket";
import { useGameStore } from "@/store/useGameStore";
import ChessBoard from "@/app/components/chess/ChessBoard";
import { AuthoritativeMovePayload, StateUpdatePayload, TimeoutPayload } from "@/types/socket";

export default function GamePage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = use(params);

  const setGameId = useGameStore((s) => s.setGameId);

  useEffect(() => {
    const socket = getSocket();
    setGameId(gameId);
    socket.connect();

    socket.emit("join_game", gameId);

    const onAuthoritativeMove = (({ board, turn, status }: AuthoritativeMovePayload) => {
      useGameStore.setState({
        board,
        turn,
        selected: null,
      });

      useGameStore.getState().setStatus(status);
    });

    const onStateUpdate = ((payload: StateUpdatePayload) => {
      const { board, turn, time, lastTimestamp } = payload;
      useGameStore.setState({
        board,
        turn,
        serverTime: time,
        lastTimestamp,
      });
    });

    const onTimeout = (({ winner }: TimeoutPayload) => {
      alert(`Time out! ${winner} wins`);
    });

    socket.on("authoritative_move", onAuthoritativeMove);
    socket.on("state_update", onStateUpdate);
    socket.on("timeout", onTimeout);

    return () => {
      socket.off("authoritative_move", onAuthoritativeMove);
      socket.off("state_update", onStateUpdate);
      socket.off("timeout", onTimeout);
      socket.disconnect();
    };
  }, [gameId]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-900">
      <ChessBoard />
    </main>
  );
}
