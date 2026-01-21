"use client";

import { use, useEffect } from "react";
import { getSocket } from "@/lib/socket";
import { useGameStore } from "@/store/useGameStore";
import ChessBoard from "@/app/components/chess/ChessBoard";
import { StateUpdatePayload } from "@/types/socket";

export default function SpectatePage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = use(params);

  const applyRemote = useGameStore((s) => s.applyRemoteMove);

  useEffect(() => {
    const socket = getSocket();
    socket.connect();

    socket.emit("spectate", gameId);

    socket.on("state_update", (payload: StateUpdatePayload) => {
      const { board, turn, time, lastTimestamp, promotionPending } = payload;
      useGameStore.setState({
        board,
        turn,
        serverTime: {
          white: time.white,
          black: time.black,
        },
        lastTimestamp,
        promotionPending,
      });
    });

    socket.on("authoritative_move", (move) => {
      applyRemote(move);
    });

    return () => {
      socket.off("state_update");
      socket.disconnect();
    };
  }, [gameId]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-900">
      <ChessBoard spectator={true} />
    </main>
  );
}
