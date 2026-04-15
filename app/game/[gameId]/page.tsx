"use client";

import { use, useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";
import { useGameStore } from "@/store/useGameStore";
import ChessBoard from "@/app/components/chess/ChessBoard";
import { AuthoritativeMovePayload, ReconnectionState } from "@/types/socket";
import { api, setAccessToken } from "@/lib/api";
import { PromotionDialog } from "@/app/components/chess/PromotionDialog";
import { useRouter } from "next/navigation";
import { GameStatus } from "@/lib/getGameStatus";
import { useToast } from "@/store/useToast";
import { getUserId } from "@/lib/getUser";
import GameChatPanel from "@/app/components/chat/GameChatPanel";
import { initialBoard } from "@/lib/initialBoard";

type GameMessages = {
  from: string;
  content: string;
  isMe: boolean;
};

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
  const [rematchTimer, setRematchTimer] = useState(10);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [gameMessages, setGameMessages] = useState<GameMessages[]>([]);

  // ── Socket: game events ──
  useEffect(() => {
    const socket = getSocket();
    useGameStore.getState().setGameId(gameId);
    socket.emit("join_game", gameId);

    socket.emit("reconnect");

    const onAuthoritativeMove = ({
      board,
      turn,
      status,
      promotionPending,
      time,
      lastTimestamp,
      san,
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

      if (san) {
        const playedBy = turn === "white" ? "black" : "white";

        useGameStore.getState().addMove({
          san,
          turn: playedBy,
        });
      }
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

    const onGameOver = (s: GameStatus) => useGameStore.getState().setStatus(s);

    const onUnauthorized = async () => {
      const { data } = await api.post("/auth/refresh");
      setAccessToken(data.accessToken);
      localStorage.setItem("wsToken", data.wsToken);
      socket.auth = { wsToken: data.wsToken };
      socket.connect();
    };

    const onNoActiveGame = () => {
      useGameStore.getState().resetGame();
      router.push("/");
    };

    // Remove all existing listeners before registering new ones
    socket.off("authoritative_move");
    socket.off("reconnected");
    socket.off("promotion_needed");
    socket.off("game_over");
    socket.off("ws_unauthorized");
    socket.off("no_active_game");

    socket.on("authoritative_move", onAuthoritativeMove);
    socket.on("reconnected", onReconnected);
    socket.on("promotion_needed", onPromotionNeeded);
    socket.on("game_over", onGameOver);
    socket.on("ws_unauthorized", onUnauthorized);
    socket.on("no_active_game", onNoActiveGame);

    return () => {
      socket.off("authoritative_move", onAuthoritativeMove);
      socket.off("reconnected", onReconnected);
      socket.off("promotion_needed", onPromotionNeeded);
      socket.off("game_over", onGameOver);
      socket.off("ws_unauthorized", onUnauthorized);
      socket.off("no_active_game", onNoActiveGame);
    };
  }, []);

  // ── Socket: rematch ──
  useEffect(() => {
    const socket = getSocket();

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
      setWaiting(false);
      setRematchOffer(null);

      useGameStore.setState({
        playerColor: color,
        serverTime: { white: timeMs, black: timeMs },
        lastTimestamp,
        incrementMs,
        board: initialBoard,
        selected: null,
        legalMoves: [],
        status: { state: "playing", winner: null },
        promotionPending: null,
        gameId,
      });

      router.push(`/game/${gameId}`);
    };

    const onRematchOffer = ({
      gameId,
      from,
    }: {
      gameId: string;
      from: string;
    }) => setRematchOffer({ gameId, from });

    const onRematchWaiting = () => {
      setWaiting(true);
      setRematchTimer(10);
    };

    const onRematchRejected = () => {
      setWaiting(false);
      setRematchOffer(null);
      addToast("Opponent declined the rematch", "error");
      useGameStore.getState().resetGame();
      router.push("/");
    };

    const onRematchTimeout = () => {
      setWaiting(false);
      setRematchOffer(null);
      addToast("Rematch request timed out", "error");
      useGameStore.getState().resetGame();
      router.push("/");
    };

    socket.off("match_found");
    socket.off("rematch_offer");
    socket.off("rematch_waiting");
    socket.off("rematch_rejected");
    socket.off("rematch_timeout");

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
  }, [gameId]);

  // ── Socket: disconnect + chat ──
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

    const onGameChat = (msg: { from: string; content: string }) => {
      const currentUserId = getUserId();
      const message = {
        from: msg.from,
        content: msg.content,
        isMe: msg.from === currentUserId,
      };
      setGameMessages((prev) => [...prev, message]);
      if (!chatOpen) setUnreadCount((prev) => prev + 1);
    };

    socket.off("opponent_disconnected");
    socket.off("opponent_reconnected");
    socket.off("game_chat");

    socket.on("opponent_disconnected", onOpponentDisconnected);
    socket.on("opponent_reconnected", onOpponentReconnected);
    socket.on("game_chat", onGameChat);

    return () => {
      socket.off("opponent_disconnected", onOpponentDisconnected);
      socket.off("opponent_reconnected", onOpponentReconnected);
      socket.off("game_chat", onGameChat);
    };
  }, [chatOpen]);

  // ── Timers ──
  useEffect(() => {
    if (!opponentDisconnected) return;
    const interval = setInterval(() => {
      setCountdown((p) => {
        if (p <= 1) {
          clearInterval(interval);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [opponentDisconnected]);

  useEffect(() => {
    if (!waiting && !rematchOffer) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRematchTimer(10);
    const interval = setInterval(() => {
      setRematchTimer((p) => {
        if (p <= 1) {
          clearInterval(interval);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [waiting, rematchOffer]);

  function handlePromotionSelect(
    pieceType: "queen" | "rook" | "bishop" | "knight",
  ) {
    const promotion = useGameStore.getState().promotionPending;
    if (!promotion) return;
    getSocket().emit("promote", {
      gameId,
      newBoard: board,
      position: promotion.position,
      pieceType,
    });
    useGameStore.setState({ promotionPending: null });
  }

  function getResultMessage() {
    if (status.state === "checkmate")
      return status.winner === playerColor ? "You Win" : "You Lose";
    if (status.state === "stalemate") return "Draw";
    if (status.state === "timeout")
      return status.winner === playerColor ? "You Win" : "You Lose";
    if (status.state === "abandoned")
      return status.winner === playerColor ? "You Win" : "You Lose";
    return null;
  }

  function getResultDescription() {
    if (status.state === "checkmate")
      return `${status.winner} wins by checkmate`;
    if (status.state === "timeout") return `${status.winner} wins on time`;
    if (status.state === "stalemate") return "The game is a draw";
    if (status.state === "abandoned")
      return `${status.winner} wins — opponent abandoned`;
    return "";
  }

  const resultMessage = getResultMessage();
  const isWin = resultMessage === "You Win";
  const isLose = resultMessage === "You Lose";

  return (
    <main className="min-h-screen flex items-center justify-center p-3 md:p-6 overflow-hidden relative">
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUpChat { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes badgePop { 0% { transform: scale(0); } 70% { transform: scale(1.2); } 100% { transform: scale(1); } }
        .modal-bg { animation: fadeIn 0.2s ease both; }
        .modal-card { animation: slideUp 0.25s ease both; }
        .chat-drawer { animation: slideUpChat 0.25s ease both; }
        .badge-pop { animation: badgePop 0.3s ease both; }
      `}</style>

      {/* ── BACKGROUND LAYERS ── */}
      <div className="fixed inset-0 bg-[#060608]" />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 50% 50%, rgba(180,140,55,0.09) 0%, rgba(140,100,35,0.05) 35%, transparent 65%)",
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 45% 38% at 12% 18%, rgba(55,75,115,0.07) 0%, transparent 55%)",
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 38% 32% at 88% 82%, rgba(110,65,35,0.06) 0%, transparent 55%)",
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 35%, rgba(0,0,0,0.65) 100%)",
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          opacity: 0.016,
          backgroundImage:
            "linear-gradient(rgba(200,169,110,1) 1px, transparent 1px), linear-gradient(90deg, rgba(200,169,110,1) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* ── MAIN LAYOUT ── */}
      <div className="relative z-10 w-full max-w-6xl flex flex-col lg:flex-row gap-4 lg:gap-8 items-center lg:items-start justify-center">
        <div className="flex-1 flex flex-col items-center gap-3 min-w-0">
          <ChessBoard />
        </div>

        <div
          className="hidden lg:flex flex-col w-72 xl:w-80 border border-[#141414]"
          style={{
            height: "min(80vw, 504px)",
            background: "rgba(8,8,8,0.85)",
            backdropFilter: "blur(8px)",
          }}
        >
          <GameChatPanel gameId={gameId} messages={gameMessages} />
        </div>
      </div>

      {/* CHAT FAB — mobile */}
      <button
        onClick={() => {
          setChatOpen(true);
          setUnreadCount(0);
        }}
        className="lg:hidden fixed bottom-5 right-5 z-50 w-12 h-12 border border-[#c8a96e] flex items-center justify-center transition-all duration-200 group"
        style={{
          background: "rgba(14,14,14,0.9)",
          backdropFilter: "blur(8px)",
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="#c8a96e"
          strokeWidth="1.5"
          className="w-5 h-5 group-hover:stroke-[#d4ba80] transition-colors"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {unreadCount > 0 && (
          <div className="badge-pop absolute -top-1.5 -right-1.5 min-w-4.5 h-4.5 rounded-full bg-red-500 flex items-center justify-center px-1">
            <span className="text-[9px] text-white font-medium leading-none tabular-nums">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </div>
        )}
      </button>

      {/* CHAT DRAWER — mobile */}
      {chatOpen && (
        <div
          className={`lg:hidden fixed inset-0 z-50 flex flex-col justify-end transition-all duration-250 ${
            chatOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
        >
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setChatOpen(false)}
            style={{ display: chatOpen ? "block" : "none" }}
          />
          <div
            className="relative z-10 flex flex-col border-t border-[#141414]"
            style={{
              height: "55vh",
              background: "rgba(8,8,8,0.97)",
              backdropFilter: "blur(12px)",
              transform: chatOpen ? "translateY(0)" : "translateY(100%)",
              transition: "transform 0.25s ease",
            }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#141414] shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[#c8a96e] text-base select-none">♟</span>
                <span
                  className="text-[#d0c8b8] text-xs font-light tracking-wide"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  Game Chat
                </span>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="text-[#444] hover:text-[#878383] text-xl leading-none transition-colors"
              >
                ×
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <GameChatPanel gameId={gameId} messages={gameMessages} />
            </div>
          </div>
        </div>
      )}

      {/* ── OPPONENT DISCONNECTED BANNER ── */}
      {opponentDisconnected && !resultMessage && (
        <div
          className="fixed top-5 left-1/2 -translate-x-1/2 z-40 border border-[#3a2a10] px-6 py-3 flex items-center gap-4"
          style={{
            background: "rgba(14,10,2,0.95)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-[#c8a96e] animate-pulse" />
          <div>
            <p className="text-[#c8a96e] text-xs font-light tracking-wide">
              Opponent disconnected
            </p>
            <p className="text-[#555] text-[10px] font-light">
              Auto-win in {countdown}s
            </p>
          </div>
          <div
            className="text-[#c8a96e] text-xl font-light tabular-nums"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {countdown}
          </div>
        </div>
      )}

      {/* ── GAME OVER OVERLAY ── */}
      {resultMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-bg">
          <div
            className="absolute inset-0 bg-black/75"
            style={{ backdropFilter: "blur(8px)" }}
          />
          <div
            className="relative z-10 flex flex-col items-center gap-6 px-10 py-10 border modal-card"
            style={{
              borderColor: isWin ? "#2a4a2a" : isLose ? "#3a1a1a" : "#2a2010",
              minWidth: "300px",
              background: "rgba(8,8,8,0.97)",
              backdropFilter: "blur(16px)",
              boxShadow: isWin
                ? "0 0 80px rgba(74,138,74,0.1)"
                : isLose
                  ? "0 0 80px rgba(138,48,48,0.1)"
                  : "0 0 80px rgba(200,169,110,0.1)",
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className="block w-6 h-px opacity-40"
                style={{
                  background: isWin
                    ? "#4a8a4a"
                    : isLose
                      ? "#8a3030"
                      : "#c8a96e",
                }}
              />
              <span
                className="text-xs tracking-[0.25em] uppercase font-light"
                style={{
                  color: isWin ? "#4a8a4a" : isLose ? "#8a3030" : "#c8a96e",
                }}
              >
                {status.state === "stalemate" ? "Draw" : "Game over"}
              </span>
              <span
                className="block w-6 h-px opacity-40"
                style={{
                  background: isWin
                    ? "#4a8a4a"
                    : isLose
                      ? "#8a3030"
                      : "#c8a96e",
                }}
              />
            </div>

            <h2
              className="text-5xl font-light leading-none"
              style={{
                fontFamily: "Georgia, serif",
                color: isWin ? "#4a8a4a" : isLose ? "#8a4a4a" : "#c8a96e",
                fontStyle: "italic",
              }}
            >
              {resultMessage}
            </h2>

            <p className="text-[#555] text-sm font-light">
              {getResultDescription()}
            </p>

            {waiting && (
              <div className="flex items-center gap-2 border border-[#1a1a1a] px-4 py-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#c8a96e] animate-pulse" />
                <span className="text-[#878383] text-xs font-light">
                  Waiting for opponent… {rematchTimer}s
                </span>
              </div>
            )}

            <div className="flex flex-col gap-2 w-full">
              <button
                disabled={waiting || opponentDisconnected}
                onClick={() => getSocket().emit("rematch_request", { gameId })}
                className="w-full py-2.5 text-xs font-light tracking-[0.15em] uppercase border transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  borderColor: waiting ? "#1a1a1a" : "#c8a96e",
                  color: waiting ? "#444" : "#c8a96e",
                  background: "transparent",
                }}
                onMouseEnter={(e) => {
                  if (!waiting && !opponentDisconnected) {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "#c8a96e";
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "#0a0a0a";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = waiting
                    ? "#444"
                    : "#c8a96e";
                }}
              >
                {waiting ? `Waiting… (${rematchTimer}s)` : "Request rematch"}
              </button>
              <button
                onClick={() => {
                  router.push("/");
                  useGameStore.getState().resetGame();
                }}
                className="w-full py-2.5 text-xs font-light tracking-[0.15em] uppercase border border-[#1a1a1a] text-[#444] hover:border-[#333] hover:text-[#878383] transition-all duration-150"
              >
                Back to home
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REMATCH OFFER MODAL ── */}
      {rematchOffer && (
        <div className="fixed inset-0 z-60 flex items-center justify-center modal-bg">
          <div
            className="absolute inset-0 bg-black/75"
            style={{ backdropFilter: "blur(8px)" }}
          />
          <div
            className="relative z-10 flex flex-col items-center gap-5 px-8 py-8 border border-[#1a1a1a] modal-card"
            style={{
              minWidth: "280px",
              background: "rgba(8,8,8,0.97)",
              backdropFilter: "blur(16px)",
            }}
          >
            <div className="flex items-center gap-3">
              <span className="block w-5 h-px bg-[#c8a96e] opacity-40" />
              <span className="text-[#c8a96e] text-xs tracking-[0.25em] uppercase">
                Rematch offer
              </span>
              <span className="block w-5 h-px bg-[#c8a96e] opacity-40" />
            </div>
            <p
              className="text-[#d0c8b8] text-sm font-light text-center"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Opponent wants a rematch
            </p>
            <div className="w-full">
              <div className="h-px bg-[#1a1a1a] relative overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-[#c8a96e] transition-all duration-1000"
                  style={{
                    width: `${(rematchTimer / 10) * 100}%`,
                    opacity: 0.6,
                  }}
                />
              </div>
              <p className="text-[#333] text-[10px] font-light mt-1 text-right tabular-nums">
                Auto-declines in {rematchTimer}s
              </p>
            </div>
            <div className="flex gap-2 w-full">
              <button
                onClick={() => {
                  getSocket().emit("rematch_response", {
                    gameId: rematchOffer.gameId,
                    accept: true,
                  });
                  setRematchOffer(null);
                  setWaiting(true);
                }}
                className="flex-1 py-2.5 text-xs font-light tracking-[0.12em] uppercase border border-[#2a4a2a] text-[#4a8a4a] hover:bg-[#4a8a4a] hover:text-[#0a0a0a] transition-all duration-150"
              >
                Accept
              </button>
              <button
                onClick={() => {
                  getSocket().emit("rematch_response", {
                    gameId: rematchOffer.gameId,
                    accept: false,
                  });
                  setRematchOffer(null);
                  useGameStore.getState().resetGame();
                  router.push("/");
                }}
                className="flex-1 py-2.5 text-xs font-light tracking-[0.12em] uppercase border border-[#3a1a1a] text-[#6a3030] hover:bg-[#8a3030] hover:text-[#f0ebe0] transition-all duration-150"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PROMOTION MODAL ── */}
      {promotionPending && promotionPending.color === playerColor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-bg">
          <div
            className="absolute inset-0 bg-black/60"
            style={{ backdropFilter: "blur(4px)" }}
          />
          <div className="relative z-10 modal-card">
            <PromotionDialog
              onSelect={handlePromotionSelect}
              color={playerColor ?? "white"}
            />
          </div>
        </div>
      )}
    </main>
  );
}
