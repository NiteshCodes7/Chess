"use client";

import { use, useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";
import { useGameStore } from "@/store/useGameStore";
import ChessBoard from "@/app/components/chess/ChessBoard";
import { AuthoritativeMovePayload, ReconnectionState } from "@/types/socket";
import { api, setAccessToken } from "@/lib/api";
import { PromotionDialog } from "@/app/components/chess/PromotionDialog";
import ChatWindow from "@/app/components/chat/ChatWindow";
import { useRouter } from "next/navigation";
import { GameStatus } from "@/lib/getGameStatus";
import { useToast } from "@/store/useToast";
import { Clock } from "lucide-react";

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
  const { addToast } = useToast();

  const [rematchOffer, setRematchOffer] = useState<{
    gameId: string;
    from: string;
  } | null>(null);

  const [waiting, setWaiting] = useState(false);
  const [timer, setTimer] = useState(10);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    useGameStore.getState().setGameId(gameId);

    // Join game room
    socket.emit("join_game", gameId);

    // reconnect
    if (!useGameStore.getState().playerColor) {
      socket.emit("reconnect");
    }

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

    const onGameOver = (status: GameStatus) => {
      useGameStore.getState().setStatus(status);
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
    socket.on("game_over", onGameOver);
    socket.on("ws_unauthorized", onUnauthorized);
    socket.on("no_active_game", () => {
      useGameStore.getState().resetGame();
      router.push("/");
    });

    return () => {
      socket.off("authoritative_move", onAuthoritativeMove);
      socket.off("reconnected", onReconnected);
      socket.off("promotion_needed", onPromotionNeeded);
      socket.off("game_over", onGameOver);
      socket.off("ws_unauthorized", onUnauthorized);
      socket.off("no_active_game");
    };
  }, [gameId]);

  useEffect(() => {
    const socket = getSocket();

    const onMatchFound = ({ gameId }: { gameId: string }) => {
      setWaiting(false);
      setRematchOffer(null);

      useGameStore.getState().resetGame();
      router.push(`/game/${gameId}`);
    };

    const onRematchOffer = ({
      gameId,
      from,
    }: {
      gameId: string;
      from: string;
    }) => {
      setRematchOffer({ gameId, from });
    };

    const onRematchWaiting = () => {
      setWaiting(true);
    };

    const onRematchRejected = () => {
      setWaiting(false);
      setRematchOffer(null);
      addToast("Sorry I can't play right now", "error", 50, 50);
      useGameStore.getState().resetGame();
      router.push("/");
    };

    const onRematchTimeout = () => {
      setWaiting(false);
      setRematchOffer(null);
      addToast("Rematch request timed out", "error", 50, 50);
      useGameStore.getState().resetGame();
      router.push("/");
    };

    socket.on("match_found", onMatchFound);
    socket.on("rematch_offer", onRematchOffer);
    socket.on("rematch_waiting", onRematchWaiting);
    socket.on("rematch_rejected", onRematchRejected);
    socket.on("rematch_timeout", onRematchTimeout);

    return () => {
      socket.off("match_found", onMatchFound);
      socket.off("rematch_offer", onRematchOffer);
      socket.off("rematch_waiting", onRematchWaiting);
      socket.off("rematch_rejected", onRematchRejected);
      socket.off("rematch_timeout", onRematchTimeout);
    };
  }, []);

  useEffect(() => {
    const socket = getSocket();

    const onOpponentDisconnected = () => {
      setOpponentDisconnected(true);
      setCountdown(30);
    };

    const onOpponentReconnected = () => {
      setOpponentDisconnected(false);
      setCountdown(30);
    };

    socket.on("opponent_disconnected", onOpponentDisconnected);
    socket.on("opponent_reconnected", onOpponentReconnected);

    return () => {
      socket.off("opponent_disconnected", onOpponentDisconnected);
      socket.off("opponent_reconnected", onOpponentReconnected);
    };
  }, []);

  // Countdown timer when opponent disconnects
  useEffect(() => {
    if (!opponentDisconnected) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [opponentDisconnected]);

  useEffect(() => {
    if (!waiting) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [waiting]);

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
    if (status.state === "checkmate")
      return status.winner === playerColor ? "🏆 You Win!" : "💀 You Lose!";
    if (status.state === "stalemate") return "🤝 Draw by Stalemate";
    if (status.state === "timeout")
      return status.winner === playerColor
        ? "🏆 You Win! (Timeout)"
        : "💀 You Lose! (Timeout)";
    if (status.state === "abandoned")
      return status.winner === playerColor
        ? "🏆 You Win! (Opponent left)"
        : "💀 You Lose! (Abandoned)";
    return null;
  }

  function getResultDescription() {
    if (status.state === "checkmate")
      return `${status.winner} wins by checkmate`;
    if (status.state === "timeout") return `${status.winner} wins on time`;
    if (status.state === "stalemate") return "The game is a draw (stalemate)";
    if (status.state === "abandoned")
      return `${status.winner} wins by abandonment`;
    return "";
  }

  const resultMessage = getResultMessage();

  return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center p-2 sm:p-4">
      <button
        onClick={() => setChatOpen((prev) => !prev)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition"
      >
        💬
      </button>
      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-3 sm:gap-4 lg:gap-6 bg-[#080808] p-3 sm:p-4 lg:p-6 rounded-2xl shadow-2xl">
        {/* CHESS BOARD */}
        <div className="flex-1 bg-[#080808] p-2 sm:p-3 lg:p-4 rounded-xl shadow-inner flex items-center justify-center">
          <div className="w-full max-w-125">
            <ChessBoard />
          </div>
        </div>

        {/* CHAT */}
        {/* CHAT DRAWER */}
        <div
          className={`
            fixed z-40 bg-[#080808] shadow-2xl transition-all duration-300
            ${chatOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}
            
            bottom-0 left-0 w-full h-[50vh]   /* mobile */
            
            lg:top-0 lg:right-0 lg:bottom-auto lg:left-auto
            lg:h-full lg:w-80
            ${chatOpen ? "lg:translate-x-0" : "lg:translate-x-full"}
          `}
        >
          <div className="h-full flex flex-col rounded-t-2xl lg:rounded-none overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-3 bg-gray-900">
              <span className="text-white font-semibold">Chat</span>
              <button
                onClick={() => setChatOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <ChatWindow gameId={gameId} />
          </div>
        </div>

        {/* Game Over Overlay */}
        {resultMessage && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 p-10 rounded-2xl shadow-2xl flex flex-col items-center gap-6">
              <h2 className="text-white text-4xl font-bold">{resultMessage}</h2>
              <p className="text-gray-400 text-lg capitalize">
                {getResultDescription()}
              </p>
              <button
                onClick={() => {
                  router.push("/");
                  useGameStore.getState().resetGame();
                }}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition"
              >
                Back to Home
              </button>
              <button
                disabled={waiting || opponentDisconnected}
                onClick={() => {
                  const socket = getSocket();
                  socket.emit("rematch_request", { gameId });
                }}
                className={`px-6 py-2 rounded-xl ${
                  waiting ? "bg-gray-500" : "bg-green-600 hover:bg-green-700"
                }`}
              >
                Rematch
              </button>

              {waiting && (
                <div className="flex flex-col p-2 text-yellow-400">
                  <p className="text-yellow-400">Waiting for opponent...</p>
                  <div className="flex items-center gap-2">
                    <Clock
                      className={`${
                        timer > 6
                          ? "text-green-500"
                          : timer > 3
                            ? "text-yellow-400"
                            : "text-red-500 animate-pulse"
                      }`}
                    />
                    <span className="text-white font-medium">
                      Auto-declines in {timer}s
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Opponent disconnected banner */}
        {opponentDisconnected && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-yellow-600 text-white px-6 py-3 rounded-xl shadow-lg text-center">
            <p className="font-bold">Opponent disconnected</p>
            <p className="text-sm">Auto-win in {countdown}s...</p>
          </div>
        )}

        {/* Rematch Offer Moodal */}
        {rematchOffer && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-100">
            <div className="bg-gray-800 p-6 rounded-xl flex flex-col gap-4 items-center">
              <p className="text-white text-lg font-semibold">
                Opponent wants a rematch
              </p>

              <div className="flex items-center gap-2">
                <Clock
                  className={`${
                    timer > 6
                      ? "text-green-500"
                      : timer > 3
                        ? "text-yellow-400"
                        : "text-red-500 animate-pulse"
                  }`}
                />
                <span className="text-white font-medium">
                  Auto-declines in {timer}s
                </span>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    const socket = getSocket();
                    socket.emit("rematch_response", {
                      gameId: rematchOffer.gameId,
                      accept: true,
                    });
                    setRematchOffer(null);
                    setWaiting(true);
                  }}
                  className="px-4 py-2 bg-green-600 rounded"
                >
                  Accept
                </button>

                <button
                  onClick={() => {
                    const socket = getSocket();
                    socket.emit("rematch_response", {
                      gameId: rematchOffer.gameId,
                      accept: false,
                    });
                    setRematchOffer(null);
                    useGameStore.getState().resetGame();
                    router.push("/");
                  }}
                  className="px-4 py-2 bg-red-600 rounded"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Promotion Modal */}
        {promotionPending && promotionPending.color === playerColor && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-xl shadow-xl">
              <PromotionDialog
                onSelect={handlePromotionSelect}
                color={playerColor === "white" ? "white" : "black"}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
