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
import { PromotionDialog } from "@/app/components/chess/PromotionDialog";
import ChatWindow from "@/app/components/chat/ChatWindow";

export default function GamePage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = use(params);

  const board = useGameStore((s) => s.board);
  const setGameId = useGameStore((s) => s.setGameId);
  const playerColor = useGameStore((s) => s.playerColor);
  const setPlayerColor = useGameStore((s) => s.setPlayerColor);
  const promotionPending = useGameStore((s) => s.promotionPending);

  useEffect(() => {
    const socket = getSocket();
    setGameId(gameId);
    socket.connect();

    socket.emit("join_game", gameId);

    const onAuthoritativeMove = ({
      board,
      turn,
      status,
      promotionPending,
      time,
      lastTimestamp,
    }: AuthoritativeMovePayload) => {
      useGameStore.setState({
        board,
        turn,
        selected: null,
        promotionPending,
        lastTimestamp,
        serverTime: {
          white: time.white,
          black: time.black,
        },
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
      promotionPending,
    }: ReconnectionState) => {
      useGameStore.setState({
        board,
        turn,
        playerColor: color,
        serverTime: time,
        lastTimestamp,
        promotionPending,
      });
    };

    // Promotion needed
    const onPromotionNeeded = ({
      position,
      color,
    }: {
      position: { row: number; col: number };
      color: "white" | "black";
    }) => {
      useGameStore.setState({
        promotionPending: { position, color },
      });
    };

    // Timeout
    const onTimeout = ({ winner }: TimeoutPayload) => {
      alert(`Time out! ${winner} wins`);
    };

    // Auto refreshing wsToken
    socket.on("ws_unauthorized", async () => {
      console.log("WS token expired, refreshing...");
      const { data } = await api.post("/auth/refresh");
      setAccessToken(data.accessToken);
      localStorage.setItem("wsToken", data.wsToken);

      socket.auth = { wsToken: localStorage.getItem("wsToken") };
      socket.connect();
    });

    socket.on("authoritative_move", onAuthoritativeMove);
    socket.on("promotion_needed", onPromotionNeeded);
    socket.on("reconnected", onReconnection);
    socket.on("timeout", onTimeout);

    return () => {
      socket.off("authoritative_move", onAuthoritativeMove);
      socket.off("promotion_needed", onPromotionNeeded);
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
      const { color, board, turn, time, lastTimestamp, promotionPending } =
        payload;
      setPlayerColor(color!);
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

    return () => {
      socket.off("reconnected");
    };
  }, []);

  function handlePromotionSelect(
    pieceType: "queen" | "rook" | "bishop" | "knight",
  ) {
    const socket = getSocket();
    const promotion = useGameStore.getState().promotionPending;
    if (!promotion) return;

    const { position } = promotion;

    socket.emit("promote", {
      gameId,
      newBoard: board,
      position,
      pieceType,
    });
    useGameStore.setState({ promotionPending: null });
  }

  return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="flex flex-col lg:flex-row gap-6 bg-gray-800 p-6 rounded-2xl shadow-2xl">
        {/* Chess Board Section */}
        <div className="bg-gray-700 p-4 rounded-xl shadow-inner">
          <ChessBoard />
        </div>

        {/* Chat Window Section */}
        <div className="w-full lg:w-80 bg-gray-700 rounded-xl shadow-inner flex flex-col">
          <ChatWindow gameId={gameId} />
        </div>
      </div>

      {/* Promotion Modal */}
      {promotionPending && promotionPending.color === playerColor && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-xl shadow-xl">
            <PromotionDialog onSelect={handlePromotionSelect} />
          </div>
        </div>
      )}
    </main>
  );
}
