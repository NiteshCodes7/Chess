"use client";

import { use, useEffect } from "react";
import { getSocket } from "@/lib/socket";
import { useGameStore } from "@/store/useGameStore";
import ChessBoard from "@/app/components/chess/ChessBoard";
import {
  AuthoritativeMovePayload,
  ReconnectionState,
  TimeoutPayload,
} from "@/types/socket";
import { api, setAccessToken } from "@/lib/api";
import { PromotionDialog } from "@/app/components/chess/PromotionDialog";
import ChatWindow from "@/app/components/chat/ChatWindow";
import { useRouter } from "next/navigation";

export default function GamePage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = use(params);
  const router = useRouter();
  const board = useGameStore((s) => s.board);
  const playerColor = useGameStore((s) => s.playerColor);
  const promotionPending = useGameStore((s) => s.promotionPending);
  const status = useGameStore((s) => s.status);

  useEffect(() => {
    const socket = getSocket();

    useGameStore.getState().setGameId(gameId);

    // Join game room
    socket.emit("join_game", gameId);

    // Try to reconnect to existing game state
    socket.emit("reconnect");

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
        serverTime: { white: time.white, black: time.black },
      });
      useGameStore.getState().setStatus(status);
    };

    const onReconnected = ({
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
        serverTime: { white: time.white, black: time.black },
        lastTimestamp,
        promotionPending,
      });
    };

    const onPromotionNeeded = ({
      position,
      color,
    }: {
      position: { row: number; col: number };
      color: "white" | "black";
    }) => {
      useGameStore.setState({ promotionPending: { position, color } });
    };

    const onTimeout = ({ winner }: TimeoutPayload) => {
      alert(`Time out! ${winner} wins`);
    };

    const onUnauthorized = async () => {
      console.log("WS token expired, refreshing...");
      const { data } = await api.post("/auth/refresh");
      setAccessToken(data.accessToken);
      localStorage.setItem("wsToken", data.wsToken);
      socket.auth = { wsToken: data.wsToken };
      socket.connect();
    };

    socket.on("authoritative_move", onAuthoritativeMove);
    socket.on("reconnected", onReconnected);
    socket.on("promotion_needed", onPromotionNeeded);
    socket.on("timeout", onTimeout);
    socket.on("ws_unauthorized", onUnauthorized);

    return () => {
      socket.off("authoritative_move", onAuthoritativeMove);
      socket.off("reconnected", onReconnected);
      socket.off("promotion_needed", onPromotionNeeded);
      socket.off("timeout", onTimeout);
      socket.off("ws_unauthorized", onUnauthorized);
    };
  }, [gameId]);

  function handlePromotionSelect(
    pieceType: "queen" | "rook" | "bishop" | "knight",
  ) {
    const socket = getSocket();
    const promotion = useGameStore.getState().promotionPending;
    if (!promotion) return;

    socket.emit("promote", {
      gameId,
      newBoard: board,
      position: promotion.position,
      pieceType,
    });
    useGameStore.setState({ promotionPending: null });
  }

  function getResultMessage() {
    if (status.state === "checkmate") {
      return status.winner === playerColor ? "🏆 You Win!" : "💀 You Lose!";
    }
    if (status.state === "stalemate") return "🤝 Draw by Stalemate";
    return null;
  }

  const resultMessage = getResultMessage();

  return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="flex flex-col lg:flex-row gap-6 bg-gray-800 p-6 rounded-2xl shadow-2xl">
        <div className="bg-gray-700 p-4 rounded-xl shadow-inner">
          <ChessBoard />
        </div>
        <div className="w-full lg:w-80 bg-gray-700 rounded-xl shadow-inner flex flex-col">
          <ChatWindow gameId={gameId} />
        </div>
      </div>

      {/* Game Over Overlay */}
      {resultMessage && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 p-10 rounded-2xl shadow-2xl flex flex-col items-center gap-6">
            <h2 className="text-white text-4xl font-bold">{resultMessage}</h2>
            <p className="text-gray-400 text-lg capitalize">
              {status.state === "checkmate"
                ? `${status.winner} wins by checkmate`
                : "The game is a draw"}
            </p>
            <button
              onClick={() => router.push("/")}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition"
            >
              Back to Home
            </button>
          </div>
        </div>
      )}

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
