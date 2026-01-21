"use client";

import { use, useEffect } from "react";
import { getSocket } from "@/lib/socket";
import { useGameStore } from "@/store/useGameStore";
import ChessBoard from "@/app/components/chess/ChessBoard";
import {
  AuthoritativeMovePayload,
  ReconnectionState,
  StateUpdatePayload,
  TimeoutPayload,
} from "@/types/socket";
import { api, setAccessToken } from "@/lib/api";

export default function GamePage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = use(params);

  const setGameId = useGameStore((s) => s.setGameId);
  const setPlayerColor = useGameStore((s) => s.setPlayerColor);

  useEffect(() => {
    const socket = getSocket();
    setGameId(gameId);
    socket.connect();

    socket.emit("join_game", gameId);

    const onAuthoritativeMove = ({
      board,
      turn,
      status,
    }: AuthoritativeMovePayload) => {
      useGameStore.setState({
        board,
        turn,
        selected: null,
      });

      useGameStore.getState().setStatus(status);
    };

    // reconnect
    socket.emit("reconnect");

    const onReconnection = ({
      board,
      turn,
      color,
      time,
      lastTimestamp,
    }: ReconnectionState) => {
      useGameStore.setState({
        board,
        turn,
        playerColor: color,
        serverTime: time,
        lastTimestamp,
      });
    };

    const onTimeout = ({ winner }: TimeoutPayload) => {
      alert(`Time out! ${winner} wins`);
    };

    //auto refreshing wsToken
    socket.on("ws_unauthorized", async () => {
      console.log("WS token expired, refreshing...");
      const { data } = await api.post("/auth/refresh");
      setAccessToken(data.accessToken)
      localStorage.setItem("wsToken", data.wsToken);
      
      socket.auth = { wsToken: localStorage.getItem("wsToken") };
      socket.connect();
    });

    socket.on("authoritative_move", onAuthoritativeMove);
    socket.on("reconnected", onReconnection);
    socket.on("timeout", onTimeout);

    return () => {
      socket.off("authoritative_move", onAuthoritativeMove);
      socket.off("reconnected", onReconnection);
      socket.off("timeout", onTimeout);
      socket.off("ws_unauthorized");
      socket.disconnect();
    };
  }, [gameId]);

  useEffect(() => {
    const socket = getSocket();
    socket.connect();

    socket.emit("reconnect");

    socket.on("reconnected", (payload: StateUpdatePayload) => {
      const { color, board, turn, time, lastTimestamp } = payload;
      setPlayerColor(color!);
      useGameStore.setState({
        board,
        turn,
        serverTime: {
          white: time.white,
          black: time.black,
        },
        lastTimestamp,
      });
    });

    return () => {
      socket.off("reconnected");
    };
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-900">
      <ChessBoard />
    </main>
  );
}
