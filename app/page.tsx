"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthProvider";
import { useEffect, useState, useRef } from "react";
import { getSocket } from "@/lib/socket";
import { useGameStore } from "@/store/useGameStore";
import { ReconnectionState } from "@/types/socket";
import Image from "next/image";
import { api, setAccessToken } from "@/lib/api";

export default function LandingPage() {
  const router = useRouter();
  const { loading, authed, setAuthed } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch {}
    localStorage.removeItem("wsToken");
    setAccessToken(null);
    setAuthed(false);
    router.push("/auth/login");
  }

  const [rejoinOffer, setRejoinOffer] = useState<ReconnectionState | null>(
    null,
  );
  const [rejoinTimer, setRejoinTimer] = useState(30);
  const forfeitCalledRef = useRef(false);

  // ── Listen for reconnected event on landing page ──
  useEffect(() => {
    const socket = getSocket();

    const onReconnected = (state: ReconnectionState) => {
      forfeitCalledRef.current = false;
      setRejoinTimer(30);
      setRejoinOffer(state);
    };

    socket.off("reconnected");
    socket.on("reconnected", onReconnected);

    // Trigger reconnect check when landing page mounts
    socket.emit("reconnect");

    return () => {
      socket.off("reconnected", onReconnected);
    };
  }, []);

  // ── Countdown + auto-forfeit ──
  useEffect(() => {
    if (!rejoinOffer) return;
    forfeitCalledRef.current = false;
    setRejoinTimer(30);

    const interval = setInterval(() => {
      setRejoinTimer((p) => {
        if (p <= 1) {
          clearInterval(interval);
          if (!forfeitCalledRef.current) {
            forfeitCalledRef.current = true;
            // eslint-disable-next-line react-hooks/immutability
            handleForfeit(rejoinOffer.gameId);
          }
          return 0;
        }
        return p - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [rejoinOffer]);

  function handleRejoin() {
    if (!rejoinOffer) return;
    useGameStore.setState({
      board: rejoinOffer.board,
      turn: rejoinOffer.turn,
      playerColor: rejoinOffer.color,
      serverTime: {
        white: rejoinOffer.time.white,
        black: rejoinOffer.time.black,
      },
      lastTimestamp: rejoinOffer.lastTimestamp,
      promotionPending: rejoinOffer.promotionPending,
      gameId: rejoinOffer.gameId,
      status: { state: "playing", winner: null },
    });
    setRejoinOffer(null);
    router.push(`/game/${rejoinOffer.gameId}`);
  }

  function handleForfeit(gameId?: string) {
    const id = gameId ?? rejoinOffer?.gameId;
    if (!id) return;
    getSocket().emit("forfeit", { gameId: id });
    setRejoinOffer(null);
    useGameStore.getState().resetGame();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="w-10 h-10 rounded-full border-2 border-[#222] border-t-[#c8a96e] animate-spin" />
      </div>
    );
  }

  const pieces: Record<string, string> = {
    "0,0": "♜",
    "0,1": "♞",
    "0,2": "♝",
    "0,3": "♛",
    "0,4": "♚",
    "0,5": "♝",
    "0,6": "♞",
    "0,7": "♜",
    "1,0": "♟",
    "1,1": "♟",
    "1,2": "♟",
    "1,3": "♟",
    "1,4": "♟",
    "1,5": "♟",
    "1,6": "♟",
    "1,7": "♟",
    "4,4": "♙",
    "3,3": "♟",
    "4,3": "♙",
    "3,4": "♟",
    "6,0": "♙",
    "6,1": "♙",
    "6,2": "♙",
    "6,3": "♙",
    "6,4": "♙",
    "6,5": "♙",
    "6,6": "♙",
    "6,7": "♙",
    "7,0": "♖",
    "7,1": "♘",
    "7,2": "♗",
    "7,3": "♕",
    "7,4": "♔",
    "7,5": "♗",
    "7,6": "♘",
    "7,7": "♖",
  };
  const highlighted = new Set(["4,4", "3,3"]);

  const features = [
    {
      title: "Real-time matchmaking",
      desc: "Instantly matched against players of equal skill using our Elo-based rating system.",
      icon: (
        <svg
          className="w-8 h-8 text-[#c8a96e]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      ),
    },
    {
      title: "Live presence",
      desc: "See when your friends are online, playing, or away. Challenge them instantly.",
      icon: (
        <svg
          className="w-8 h-8 text-[#c8a96e]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
        </svg>
      ),
    },
    {
      title: "In-game chat",
      desc: "Communicate with your opponent during play. Friendly banter, respect always.",
      icon: (
        <svg
          className="w-8 h-8 text-[#c8a96e]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      title: "Game replay",
      desc: "Review every move from past games. Study your patterns, improve your play.",
      icon: (
        <svg
          className="w-8 h-8 text-[#c8a96e]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
        </svg>
      ),
    },
    {
      title: "Friends system",
      desc: "Add friends, send challenges, and build your chess circle.",
      icon: (
        <svg
          className="w-8 h-8 text-[#c8a96e]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      title: "Rating & stats",
      desc: "Track your Elo, win rate, and progress over time with detailed statistics.",
      icon: (
        <svg
          className="w-8 h-8 text-[#c8a96e]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e8e0d0] overflow-x-hidden">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes boardReveal {
          from { opacity: 0; transform: translateY(-50%) perspective(900px) rotateX(35deg) rotateZ(-12deg); }
          to { opacity: 1; transform: translateY(-50%) perspective(900px) rotateX(30deg) rotateZ(-8deg); }
        }
        @keyframes pieceFade {
          from { opacity: 0; transform: scale(0.7); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-up { animation: fadeUp 0.8s ease both; }
        .animate-board-reveal { animation: boardReveal 1s ease 0.3s both; }
        .modal-bg { animation: fadeIn 0.2s ease both; }
        .modal-card { animation: slideUp 0.25s ease both; }
      `}</style>

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-5 bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent">
        <Image
          src={"/assets/logo_chessify.png"}
          alt="♔ Chessify"
          width={100}
          height={100}
        />

        <div className="pointer-events-auto flex items-center gap-4 relative">
          {/* Nav links */}
          <div className="hidden md:flex items-center gap-6">
            {[
              { label: "Play", href: "/play" },
              { label: "Friends", href: "/friends" },
              { label: "Replay", href: "/replay" },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-[#aca7a7] hover:text-[#c8a96e] text-xs tracking-[0.15em] uppercase font-light transition-colors duration-150 no-underline"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Profile + logout dropdown */}
          <div className="relative">
            {authed ? (
              <>
                {/* Profile Icon Button */}
                <button
                  onClick={() => setShowMenu((prev) => !prev)}
                  className="w-9 h-9 border border-[#2a2520] bg-[#0e0e0e] flex items-center justify-center
                   text-[#c8a96e] rounded-sm
                   hover:border-[#c8a96e] hover:text-[#f5ddb0]
                   hover:shadow-[0_0_10px_rgba(200,169,110,0.25)]
                   transition-all duration-200 cursor-pointer"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    className="w-4 h-4"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </button>

                {showMenu && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenu(false)}
                    />

                    {/* Dropdown */}
                    <div
                      className="absolute right-0 top-11 z-20 min-w-45 overflow-hidden rounded-sm
                       border border-[#2a2520] bg-[#111111]/95
                       shadow-[0_10px_30px_rgba(0,0,0,0.55)]
                       backdrop-blur-md"
                    >
                      <button
                        onClick={() => {
                          router.push("/auth/profile");
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#d0c8b8]
                         hover:bg-[#1a1a1a] hover:text-[#f5ddb0]
                         transition-all duration-150 border-b border-[#1c1c1c] cursor-pointer"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="w-4 h-4 text-[#c8a96e]"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        Profile
                      </button>

                      <button
                        onClick={() => {
                          router.push("/auth/edit-profile");
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#d0c8b8]
                         hover:bg-[#1a1a1a] hover:text-[#f5ddb0]
                         transition-all duration-150 border-b border-[#1c1c1c] cursor-pointer"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="w-4 h-4 text-[#c8a96e]"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Edit Profile
                      </button>

                      <button
                        onClick={() => {
                          setShowMenu(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#d26a6a]
                         hover:bg-[#1a1010] hover:text-[#ff8a8a]
                         transition-all duration-150 cursor-pointer"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="w-4 h-4 text-[#d26a6a]"
                        >
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <button
                onClick={() => router.push("/auth/login")}
                className="px-5 h-9 border border-[#2a2520] bg-[#0e0e0e]
             text-xs tracking-[0.14em] uppercase font-light
             text-[#c8a96e] flex items-center gap-2
             hover:border-[#c8a96e] hover:text-[#f5ddb0]
             hover:shadow-[0_0_10px_rgba(200,169,110,0.18)]
             transition-all duration-200"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="w-4 h-4"
                >
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center px-6 md:px-12 pt-28 pb-16 md:pb-0 overflow-hidden">
        <div className="relative z-10 max-w-lg animate-fade-up">
          <div className="flex items-center gap-3 mb-6">
            <span className="block w-8 h-px bg-[#c8a96e]" />
            <span className="text-[#c8a96e] text-xs tracking-[0.25em] uppercase">
              The art of chess
            </span>
          </div>

          <h1
            className="text-6xl md:text-7xl lg:text-[5.5rem] font-light leading-none tracking-tight text-[#f0ebe0] mb-7"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Play with
            <br />
            <span className="italic text-[#c8a96e]">precision.</span>
            <br />
            Win with grace.
          </h1>

          <p className="text-[#666] font-light leading-relaxed mb-10 max-w-sm text-base">
            A refined chess experience for those who take the game seriously.
            Compete, analyse, and master your craft.
          </p>

          <div className="flex gap-4 flex-wrap">
            {authed ? (
              <button
                onClick={() => router.push("/play")}
                className="bg-[#c8a96e] text-[#0a0a0a] px-10 py-3.5 text-xs font-medium tracking-[0.15em] uppercase hover:bg-[#d4ba80] transition-all duration-200 hover:-translate-y-px active:translate-y-0"
                style={{
                  clipPath:
                    "polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,12px 100%,0 calc(100% - 12px))",
                }}
              >
                Find a match
              </button>
            ) : (
              <>
                <button
                  onClick={() => router.push("/auth/register")}
                  className="bg-[#c8a96e] text-[#0a0a0a] px-10 py-3.5 text-xs font-medium tracking-[0.15em] uppercase hover:bg-[#d4ba80] transition-all duration-200 hover:-translate-y-px active:translate-y-0"
                  style={{
                    clipPath:
                      "polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,12px 100%,0 calc(100% - 12px))",
                  }}
                >
                  Start playing
                </button>
                <button
                  onClick={() => router.push("/auth/login")}
                  className="bg-transparent text-[#666] border border-[#2a2a2a] px-8 py-3.5 text-xs font-light tracking-[0.12em] uppercase hover:border-[#c8a96e] hover:text-[#c8a96e] transition-all duration-200"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>

        {/* Decorative chess board — desktop only */}
        <div
          className="hidden lg:block absolute right-[-5%] top-1/2 w-[50%] max-w-160 animate-board-reveal"
          style={{
            transform:
              "translateY(-50%) perspective(900px) rotateX(30deg) rotateZ(-8deg)",
          }}
        >
          <div
            className="grid w-full aspect-square border border-[#2a2520]"
            style={{
              gridTemplateColumns: "repeat(8, 1fr)",
              boxShadow:
                "0 0 0 1px #1a1610, 0 40px 80px rgba(0,0,0,0.8), 0 80px 160px rgba(0,0,0,0.4)",
            }}
          >
            {Array.from({ length: 64 }, (_, i) => {
              const r = Math.floor(i / 8);
              const c = i % 8;
              const key = `${r},${c}`;
              const isLight = (r + c) % 2 === 0;
              const isHighlighted = highlighted.has(key);
              const piece = pieces[key];

              return (
                <div
                  key={key}
                  className="aspect-square relative flex items-center justify-center"
                  style={{
                    background: isHighlighted
                      ? "rgba(200,169,110,0.25)"
                      : isLight
                        ? "#2d2820"
                        : "#1a1610",
                    outline: isHighlighted
                      ? "2px solid rgba(200,169,110,0.5)"
                      : "none",
                  }}
                >
                  {piece && (
                    <span
                      className="text-2xl md:text-3xl select-none leading-none"
                      style={{
                        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.8))",
                        animation: `pieceFade 0.4s ease ${(r * 8 + c) * 0.02}s both`,
                      }}
                    >
                      {piece}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="flex border-t border-b border-[#1a1a1a]">
        {[
          { num: "12K+", label: "Active players" },
          { num: "340K+", label: "Games played" },
          { num: "99.9%", label: "Uptime" },
        ].map((s, i) => (
          <div
            key={s.label}
            className={`flex-1 px-6 md:px-12 py-10 ${i < 2 ? "border-r border-[#1a1a1a]" : ""}`}
          >
            <div
              className="text-4xl md:text-5xl font-light text-[#c8a96e] mb-2 leading-none"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {s.num}
            </div>
            <div className="text-[#444] text-xs tracking-[0.2em] uppercase font-light">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── FEATURES ── */}
      <section className="px-6 md:px-12 py-20 md:py-28">
        <div className="mb-14">
          <p className="text-[#c8a96e] text-xs tracking-[0.25em] uppercase mb-3">
            Why Chessify
          </p>
          <h2
            className="text-4xl md:text-5xl font-light text-[#f0ebe0] leading-tight"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Built for serious players
          </h2>
        </div>

        <div
          className="grid border border-[#1a1a1a] bg-[#1a1a1a]"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1px",
          }}
        >
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-[#0e0e0e] hover:bg-[#111] transition-colors duration-200 p-8 md:p-10"
            >
              <div className="mb-6">{f.icon}</div>
              <h3
                className="text-xl font-light text-[#e8e0d0] mb-3"
                style={{ fontFamily: "Georgia, serif" }}
              >
                {f.title}
              </h3>
              <p className="text-[#555] text-sm font-light leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 md:px-12 py-20 md:py-28 text-center border-t border-[#1a1a1a]">
        <h2
          className="text-5xl md:text-6xl font-light text-[#f0ebe0] mb-5 leading-tight"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Your next move
          <br />
          <span className="italic text-[#c8a96e]">awaits.</span>
        </h2>
        <p className="text-[#555] font-light mb-10 text-base">
          Join thousands of players. No subscription required.
        </p>
        {authed ? (
          <button
            onClick={() => router.push("/play")}
            className="bg-[#c8a96e] text-[#0a0a0a] px-12 py-3.5 text-xs font-medium tracking-[0.15em] uppercase hover:bg-[#d4ba80] transition-all duration-200 hover:-translate-y-px"
            style={{
              clipPath:
                "polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,12px 100%,0 calc(100% - 12px))",
            }}
          >
            Find a match now
          </button>
        ) : (
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => router.push("/auth/register")}
              className="bg-[#c8a96e] text-[#0a0a0a] px-12 py-3.5 text-xs font-medium tracking-[0.15em] uppercase hover:bg-[#d4ba80] transition-all duration-200 hover:-translate-y-px"
              style={{
                clipPath:
                  "polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,12px 100%,0 calc(100% - 12px))",
              }}
            >
              Create free account
            </button>
            <button
              onClick={() => router.push("/auth/login")}
              className="bg-transparent text-[#666] border border-[#2a2a2a] px-8 py-3.5 text-xs font-light tracking-[0.12em] uppercase hover:border-[#c8a96e] hover:text-[#c8a96e] transition-all duration-200"
            >
              Sign in
            </button>
          </div>
        )}
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-6 md:px-12 py-6 border-t border-[#141414] flex items-center justify-between flex-wrap gap-3">
        <span
          className="text-[#333] text-sm tracking-widest uppercase"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Chessify
        </span>
        <span className="text-[#333] text-xs font-light">
          © {new Date().getFullYear()} Chessify. All rights reserved.
        </span>
      </footer>

      {/* ── REJOIN GAME POPUP ── */}
      {rejoinOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-bg">
          <div
            className="absolute inset-0 bg-black/75"
            style={{ backdropFilter: "blur(8px)" }}
          />
          <div
            className="relative z-10 flex flex-col items-center gap-6 px-10 py-10 border border-[#3a2a10] modal-card"
            style={{
              minWidth: "320px",
              maxWidth: "400px",
              width: "90vw",
              background: "rgba(8,8,8,0.97)",
              backdropFilter: "blur(16px)",
              boxShadow: "0 0 80px rgba(200,169,110,0.08)",
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-3">
              <span className="block w-6 h-px bg-[#c8a96e] opacity-40" />
              <span className="text-[#c8a96e] text-xs tracking-[0.25em] uppercase">
                Game in progress
              </span>
              <span className="block w-6 h-px bg-[#c8a96e] opacity-40" />
            </div>

            {/* Chess piece icon */}
            <div
              className="text-5xl select-none"
              style={{ filter: "drop-shadow(0 0 12px rgba(200,169,110,0.3))" }}
            >
              {rejoinOffer.color === "white" ? "♔" : "♚"}
            </div>

            {/* Message */}
            <div className="text-center">
              <p
                className="text-[#d0c8b8] text-base font-light mb-2"
                style={{ fontFamily: "Georgia, serif" }}
              >
                You have an unfinished game
              </p>
              <p className="text-[#555] text-xs font-light leading-relaxed">
                Playing as{" "}
                <span className="text-[#c8a96e]">{rejoinOffer.color}</span>.
                Return to continue or forfeit the match.
              </p>
            </div>

            {/* Countdown bar */}
            <div className="w-full">
              <div className="h-px bg-[#1a1a1a] relative overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-[#c8a96e] transition-all duration-1000"
                  style={{
                    width: `${(rejoinTimer / 30) * 100}%`,
                    opacity: 0.6,
                  }}
                />
              </div>
              <p className="text-[#333] text-[10px] font-light mt-1.5 flex justify-between tabular-nums">
                <span>Auto-forfeits on timeout</span>
                <span>{rejoinTimer}s</span>
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={handleRejoin}
                className="w-full py-3 text-xs font-light tracking-[0.15em] uppercase border border-[#c8a96e] text-[#c8a96e] transition-all duration-150"
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "#c8a96e";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "#0a0a0a";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "#c8a96e";
                }}
              >
                Rejoin game
              </button>
              <button
                onClick={() => handleForfeit()}
                className="w-full py-3 text-xs font-light tracking-[0.15em] uppercase border border-[#3a1a1a] text-[#6a3030] hover:border-[#8a3030] hover:bg-[#8a3030] hover:text-[#f0ebe0] transition-all duration-150"
              >
                Forfeit & leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
