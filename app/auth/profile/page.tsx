"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Image from "next/image";

interface User {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  avatar: string | null;
  rating: number;
  isVerified: boolean;
  createdAt: string;
}

interface Game {
  id: string;
  result: "win" | "loss" | "draw";
  opponentUsername: string;
  opponentRating: number;
  myColor: "white" | "black";
  ratingChange: number;
  duration: number;
  moves: number;
  endReason:
    | "checkmate"
    | "resignation"
    | "timeout"
    | "agreement"
    | "stalemate";
  playedAt: string;
}

interface Stats {
  wins: number;
  losses: number;
  draws: number;
  winStreak: number;
  bestRating: number;
  totalGames: number;
  avgMoves: number;
  avgDuration: number;
}

const reasons: Game["endReason"][] = [
  "checkmate",
  "resignation",
  "timeout",
  "agreement",
  "stalemate",
];

// Derive Stats from Games

function deriveStats(games: Game[], currentRating: number): Stats {
  const wins = games.filter((g) => g.result === "win").length;
  const losses = games.filter((g) => g.result === "loss").length;
  const draws = games.filter((g) => g.result === "draw").length;
  const totalGames = games.length;

  // Win streak: count consecutive wins from most recent
  let winStreak = 0;
  for (const g of games) {
    if (g.result === "win") winStreak++;
    else break;
  }

  // Best rating: simulate rating over time from oldest → newest
  // We reverse to go chronological, accumulate rating, track peak
  let simRating = currentRating;
  let bestRating = currentRating;
  const chronological = [...games].reverse();
  for (const g of chronological) {
    simRating -= g.ratingChange; // undo changes going forward
  }
  simRating = Math.max(simRating, 0);
  let peak = simRating;
  for (const g of chronological) {
    simRating += g.ratingChange;
    if (simRating > peak) peak = simRating;
  }
  bestRating = Math.max(peak, currentRating);

  const avgMoves =
    totalGames > 0
      ? Math.round(games.reduce((s, g) => s + g.moves, 0) / totalGames)
      : 0;

  const avgDuration =
    totalGames > 0
      ? Math.round(games.reduce((s, g) => s + g.duration, 0) / totalGames)
      : 0;

  return {
    wins,
    losses,
    draws,
    winStreak,
    bestRating,
    totalGames,
    avgMoves,
    avgDuration,
  };
}

const styles = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position: -600px 0; }
    100% { background-position: 600px 0; }
  }
  @keyframes barGrow {
    from { width: 0%; }
    to   { width: var(--w); }
  }
  @keyframes piecePulse {
    0%, 100% { opacity: 0.06; }
    50%       { opacity: 0.1; }
  }

  .p-fade-1 { animation: fadeUp 0.6s ease 0.05s both; }
  .p-fade-2 { animation: fadeUp 0.6s ease 0.15s both; }
  .p-fade-3 { animation: fadeUp 0.6s ease 0.25s both; }
  .p-fade-4 { animation: fadeUp 0.6s ease 0.35s both; }
  .p-fade-5 { animation: fadeUp 0.6s ease 0.45s both; }

  .chess-piece-bg { animation: piecePulse 5s ease-in-out infinite; }

  .skeleton {
    background: linear-gradient(90deg, #111 0%, #1e1e1e 50%, #111 100%);
    background-size: 600px 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 2px;
  }

  .tab-btn {
    background: none; border: none; cursor: pointer;
    font-family: inherit; color: #555;
    font-size: 0.7rem; letter-spacing: 0.18em; text-transform: uppercase;
    padding: 0.6rem 0; border-bottom: 1px solid transparent;
    transition: color 0.2s, border-color 0.2s;
    white-space: nowrap;
  }
  .tab-btn:hover  { color: #888; }
  .tab-btn.active { color: #c8a96e; border-bottom-color: #c8a96e; }

  .game-row {
    border-bottom: 1px solid #141414;
    transition: background 0.15s;
  }
  .game-row:hover { background: #0d0d0d; }
  .game-row:last-child { border-bottom: none; }

  .chess-btn {
    clip-path: polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px));
    transition: background 0.2s, transform 0.15s;
  }
  .chess-btn:hover { background: #d4ba80 !important; transform: translateY(-1px); }
  .chess-btn:active { transform: translateY(0); }

  .rating-bar-fill {
    height: 100%;
    background: #c8a96e;
    animation: barGrow 1s ease 0.5s both;
    width: var(--w);
  }

  .avatar-ring {
    box-shadow: 0 0 0 1px #1e1e1e, 0 0 0 3px #c8a96e22;
  }
  .stat-card {
    background: #0e0e0e; border: 1px solid #1a1a1a;
    transition: border-color 0.2s;
  }
  .stat-card:hover { border-color: #2a2520; }

  .result-win  { color: #7ec896; }
  .result-loss { color: #e08080; }
  .result-draw { color: #888; }

  .badge-win  { background: rgba(60,160,80,0.1);  color: #7ec896; border: 1px solid rgba(60,160,80,0.2); }
  .badge-loss { background: rgba(200,60,60,0.1);  color: #e08080; border: 1px solid rgba(200,60,60,0.2); }
  .badge-draw { background: rgba(120,120,120,0.1);color: #888;    border: 1px solid rgba(120,120,120,0.2); }
`;

// Helpers

function fmtDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return fmtDate(iso);
}

function memberSince(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

// Sub-components

function Skeleton({ w, h }: { w: string; h: string }) {
  return (
    <span className="skeleton inline-block" style={{ width: w, height: h }} />
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="stat-card p-5 flex flex-col gap-1">
      <span className="text-[0.6rem] tracking-[0.2em] uppercase text-[#878383]">
        {label}
      </span>
      <span
        className="text-3xl font-light text-[#f0ebe0] leading-none"
        style={{ fontFamily: "Georgia, serif" }}
      >
        {value}
      </span>
      {sub && (
        <span className="text-[0.68rem] text-[#3a3a3a] font-light mt-0.5">
          {sub}
        </span>
      )}
    </div>
  );
}

function WinRateBar({
  wins,
  losses,
  draws,
}: {
  wins: number;
  losses: number;
  draws: number;
}) {
  const total = wins + losses + draws || 1;
  const wp = Math.round((wins / total) * 100);
  const lp = Math.round((losses / total) * 100);
  const dp = 100 - wp - lp;

  return (
    <div>
      <div className="flex text-[0.6rem] tracking-[0.15em] uppercase justify-between mb-2">
        <span className="result-win">{wp}% W</span>
        <span className="text-[#616060]">{dp}% D</span>
        <span className="result-loss">{lp}% L</span>
      </div>
      <div className="flex h-1.5 w-full overflow-hidden bg-[#0a0a0a] border border-[#1a1a1a]">
        <div style={{ width: `${wp}%`, background: "#7ec896" }} />
        <div style={{ width: `${dp}%`, background: "#696565" }} />
        <div style={{ width: `${lp}%`, background: "#e08080" }} />
      </div>
    </div>
  );
}

function GameRow({ game }: { game: Game }) {
  const badgeClass =
    game.result === "win"
      ? "badge-win"
      : game.result === "loss"
        ? "badge-loss"
        : "badge-draw";
  const resultLabel =
    game.result === "win" ? "Win" : game.result === "loss" ? "Loss" : "Draw";
  const ratingSign = game.ratingChange > 0 ? "+" : "";

  return (
    <div
      className="game-row grid items-center gap-3 px-5 py-3.5"
      style={{ gridTemplateColumns: "60px 1fr 80px 60px 60px 80px" }}
    >
      <span
        className={`${badgeClass} text-[0.62rem] tracking-widest uppercase font-light px-2 py-0.5 text-center`}
      >
        {resultLabel}
      </span>

      <div className="min-w-0">
        <p className="text-[0.82rem] font-light text-[#c8c0b0] truncate">
          vs @{game.opponentUsername}
        </p>
        <p className="text-[0.65rem] text-[#3a3a3a] font-light capitalize">
          {game.endReason} · {game.myColor}
        </p>
      </div>

      <div className="text-center">
        <p className="text-[0.8rem] font-light text-[#888]">{game.moves}</p>
        <p className="text-[0.6rem] text-[#333] uppercase tracking-wide">
          moves
        </p>
      </div>

      <div className="text-center">
        <p className="text-[0.75rem] font-light text-[#888]">
          {game.duration > 0 ? fmtDuration(game.duration) : "—"}
        </p>
      </div>

      <div className="text-center">
        <span
          className={`text-[0.8rem] font-light ${
            game.ratingChange > 0
              ? "result-win"
              : game.ratingChange < 0
                ? "result-loss"
                : "text-[#555]"
          }`}
        >
          {game.ratingChange !== 0 ? `${ratingSign}${game.ratingChange}` : "—"}
        </span>
      </div>

      <div className="text-right">
        <p className="text-[0.65rem] text-[#3a3a3a] font-light">
          {fmtRelative(game.playedAt)}
        </p>
      </div>
    </div>
  );
}

// Page

type Tab = "overview" | "games" | "stats";

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  const [games, setGames] = useState<Game[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);

  const [tab, setTab] = useState<Tab>("overview");
  const [gameFilter, setGameFilter] = useState<"all" | "win" | "loss" | "draw">(
    "all",
  );

  // ── Fetch user ──
  const fetchUser = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch {
      router.push("/auth/login");
    } finally {
      setUserLoading(false);
    }
  }, [router]);

  // ── Fetch games ──
  const fetchGames = useCallback(async () => {
    try {
      const { data } = await api.get("/users/me/games");
      setGames(data);
    } catch (err) {
      console.error("Failed to fetch games", err);
    } finally {
      setGamesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
    fetchGames();
  }, [fetchUser, fetchGames]);

  // ── Derive stats from real games ──
  const stats = useMemo<Stats>(
    () => deriveStats(games, user?.rating ?? 1200),
    [games, user?.rating],
  );

  const loading = userLoading || gamesLoading;

  const filteredGames =
    gameFilter === "all" ? games : games.filter((g) => g.result === gameFilter);

  const avatarLetter =
    user?.username?.[0]?.toUpperCase() ?? user?.name?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e8e0d0] overflow-x-hidden">
      <style>{styles}</style>

      {/* Background chessboard */}
      <div
        aria-hidden="true"
        className="chess-piece-bg pointer-events-none fixed inset-0 grid"
        style={{
          gridTemplateColumns: "repeat(8,1fr)",
          gridTemplateRows: "repeat(8,1fr)",
          zIndex: 0,
        }}
      >
        {Array.from({ length: 64 }, (_, i) => (
          <div
            key={i}
            style={{
              background:
                (Math.floor(i / 8) + (i % 8)) % 2 === 0
                  ? "rgba(200,169,110,0.015)"
                  : "transparent",
            }}
          />
        ))}
      </div>

      {/* Nav */}
      <nav className="relative z-20 top-0 left-0 right-0 flex items-center justify-between px-6 md:px-12 py-4 border-b border-[#111] bg-[#0a0a0a]/90 backdrop-blur-sm">
        <Image
          onClick={() => router.push("/")}
          className="cursor-pointer"
          src={"/assets/logo_chessify.png"}
          alt="Chessify logo"
          width={100}
          height={100}
        />
        <div className="flex items-center gap-6">
          <button
            onClick={() => router.push("/play")}
            className="text-[#878383] hover:text-[#c8a96e] text-[0.65rem] tracking-[0.2em] uppercase transition-colors bg-transparent border-none cursor-pointer"
          >
            Play
          </button>
          <div className="w-7 h-7 rounded-full bg-[#1a1510] border border-[#c8a96e33] flex items-center justify-center text-[0.7rem] text-[#c8a96e]">
            {avatarLetter}
          </div>
        </div>
      </nav>

      <div className="relative z-10 pt-20 pb-16 px-4 md:px-8 max-w-5xl mx-auto">
        {/* ── Hero header ── */}
        <div className="p-fade-1 relative border border-[#1a1a1a] bg-[#0e0e0e] mb-6 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-[#c8a96e] to-transparent opacity-40" />

          <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center">
            {/* Avatar */}
            <div className="relative shrink-0">
              {userLoading ? (
                <div className="skeleton w-20 h-20 rounded-full" />
              ) : user?.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.username ?? ""}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-full avatar-ring object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full avatar-ring bg-[#13100a] border border-[#2a2520] flex items-center justify-center">
                  <span
                    className="text-3xl font-light text-[#c8a96e]"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    {avatarLetter}
                  </span>
                </div>
              )}
              {user?.isVerified && (
                <span
                  className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#0e0e0e] border border-[#2a2520] rounded-full flex items-center justify-center text-[0.6rem]"
                  title="Verified"
                >
                  ✓
                </span>
              )}
            </div>

            {/* Identity */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h1
                  className="text-2xl md:text-3xl font-light text-[#f0ebe0] leading-none"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  {userLoading ? (
                    <Skeleton w="160px" h="30px" />
                  ) : (
                    (user?.name ?? user?.username ?? "—")
                  )}
                </h1>
                {!userLoading && user?.name && user?.username && (
                  <span className="text-[#878383] text-sm font-light">
                    @{user.username}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <span className="text-[#878383] text-[0.7rem] font-light">
                  {userLoading ? (
                    <Skeleton w="120px" h="12px" />
                  ) : (
                    `Member since ${memberSince(user!.createdAt)}`
                  )}
                </span>
                <span className="text-[#1e1e1e]">·</span>
                <span className="text-[#878383] text-[0.7rem] font-light">
                  {gamesLoading ? (
                    <Skeleton w="80px" h="12px" />
                  ) : (
                    `${stats.totalGames} games played`
                  )}
                </span>
              </div>
            </div>

            {/* Rating badge */}
            <div className="shrink-0 text-right">
              <div className="text-[0.6rem] tracking-[0.2em] uppercase text-[#878383] mb-1">
                Rating
              </div>
              <div
                className="text-5xl font-light text-[#c8a96e] leading-none"
                style={{ fontFamily: "Georgia, serif" }}
              >
                {userLoading ? (
                  <Skeleton w="90px" h="48px" />
                ) : (
                  (user?.rating ?? 1200)
                )}
              </div>
              {!userLoading && !gamesLoading && (
                <div className="text-[0.65rem] text-[#676666] mt-3">
                  Best: {stats.bestRating}
                </div>
              )}
            </div>
          </div>

          {/* Win rate bar */}
          {!loading && (
            <div className="px-6 md:px-8 pb-6">
              <WinRateBar
                wins={stats.wins}
                losses={stats.losses}
                draws={stats.draws}
              />
            </div>
          )}
        </div>

        {/* ── Quick stats row ── */}
        <div className="p-fade-2 grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard
            label="Wins"
            value={gamesLoading ? <Skeleton w="40px" h="30px" /> : stats.wins}
            sub={
              stats.winStreak > 1 ? `${stats.winStreak} win streak` : undefined
            }
          />
          <StatCard
            label="Losses"
            value={gamesLoading ? <Skeleton w="40px" h="30px" /> : stats.losses}
          />
          <StatCard
            label="Draws"
            value={gamesLoading ? <Skeleton w="40px" h="30px" /> : stats.draws}
          />
          <StatCard
            label="Avg moves"
            value={
              gamesLoading ? <Skeleton w="40px" h="30px" /> : stats.avgMoves
            }
            sub={
              gamesLoading
                ? undefined
                : `~${fmtDuration(stats.avgDuration)} avg`
            }
          />
        </div>

        {/* ── Tab navigation ── */}
        <div className="p-fade-3 flex gap-8 border-b border-[#141414] mb-6 overflow-x-auto">
          {(["overview", "games", "stats"] as Tab[]).map((t) => (
            <button
              key={t}
              className={`tab-btn ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── TAB: Overview ── */}
        {tab === "overview" && (
          <div className="p-fade-4 grid md:grid-cols-2 gap-6">
            {/* Recent games */}
            <div className="border border-[#1a1a1a] bg-[#0e0e0e]">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#141414]">
                <div className="flex items-center gap-2">
                  <span className="block w-4 h-px bg-[#c8a96e]" />
                  <span className="text-[0.65rem] tracking-[0.2em] uppercase text-[#c8a96e]">
                    Recent games
                  </span>
                </div>
                <button
                  onClick={() => setTab("games")}
                  className="text-[#878383] hover:text-[#888] text-[0.62rem] tracking-wide uppercase bg-transparent border-none cursor-pointer transition-colors"
                >
                  View all →
                </button>
              </div>

              {gamesLoading ? (
                <div className="px-5 py-8 space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton w="32px" h="16px" />
                      <Skeleton w="120px" h="14px" />
                      <div className="flex-1" />
                      <Skeleton w="30px" h="14px" />
                      <Skeleton w="40px" h="12px" />
                    </div>
                  ))}
                </div>
              ) : games.length === 0 ? (
                <div className="px-5 py-12 text-center text-[#333] text-sm font-light">
                  No games played yet.
                </div>
              ) : (
                games.slice(0, 5).map((g) => (
                  <div
                    key={g.id}
                    className="game-row flex items-center gap-3 px-5 py-3"
                  >
                    <span
                      className={`text-[0.6rem] tracking-wide uppercase w-8 shrink-0 ${
                        g.result === "win"
                          ? "result-win"
                          : g.result === "loss"
                            ? "result-loss"
                            : "text-[#555]"
                      }`}
                    >
                      {g.result === "win"
                        ? "W"
                        : g.result === "loss"
                          ? "L"
                          : "D"}
                    </span>
                    <span className="text-[0.8rem] font-light text-[#888] flex-1 truncate">
                      vs @{g.opponentUsername}
                    </span>
                    <span
                      className={`text-[0.75rem] font-light shrink-0 ${
                        g.ratingChange > 0
                          ? "result-win"
                          : g.ratingChange < 0
                            ? "result-loss"
                            : "text-[#555]"
                      }`}
                    >
                      {g.ratingChange !== 0
                        ? `${g.ratingChange > 0 ? "+" : ""}${g.ratingChange}`
                        : "—"}
                    </span>
                    <span className="text-[0.62rem] text-[#5f5e5e] shrink-0 w-14 text-right">
                      {fmtRelative(g.playedAt)}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Account info + CTAs */}
            <div className="flex flex-col gap-3">
              <div className="border border-[#1a1a1a] bg-[#0e0e0e]">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-[#141414]">
                  <span className="block w-4 h-px bg-[#c8a96e]" />
                  <span className="text-[0.65rem] tracking-[0.2em] uppercase text-[#c8a96e]">
                    Account
                  </span>
                </div>
                <div className="divide-y divide-[#0e0e0e]">
                  {[
                    { label: "Email", value: userLoading ? null : user?.email },
                    {
                      label: "Username",
                      value: userLoading ? null : `@${user?.username}`,
                    },
                    {
                      label: "Status",
                      value: userLoading
                        ? null
                        : user?.isVerified
                          ? "Verified ✓"
                          : "Unverified",
                    },
                    {
                      label: "Joined",
                      value: userLoading
                        ? null
                        : fmtDate(user?.createdAt ?? ""),
                    },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between px-5 py-3 border-b border-[#111] last:border-0"
                    >
                      <span className="text-[0.65rem] tracking-[0.15em] uppercase text-[#878383]">
                        {label}
                      </span>
                      <span className="text-[0.8rem] font-light text-[#888]">
                        {value ?? <Skeleton w="100px" h="12px" />}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => router.push("/play")}
                className="chess-btn w-full bg-[#c8a96e] text-[#0a0a0a] py-3.5 text-[0.7rem] font-medium tracking-[0.18em] uppercase"
              >
                Find a match
              </button>
              <button
                onClick={() => router.push("/auth/profile/edit")}
                className="w-full bg-transparent border border-[#1e1e1e] text-[#878383] py-3 text-[0.7rem] font-light tracking-[0.15em] uppercase hover:border-[#c8a96e] hover:text-[#c8a96e] transition-all"
              >
                Edit profile
              </button>
            </div>
          </div>
        )}

        {/* ── TAB: Games ── */}
        {tab === "games" && (
          <div className="p-fade-4">
            {/* Filter bar */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {(["all", "win", "loss", "draw"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setGameFilter(f)}
                  className={`px-4 py-1.5 text-[0.62rem] tracking-[0.15em] uppercase font-light border transition-all cursor-pointer bg-transparent ${
                    gameFilter === f
                      ? "border-[#c8a96e] text-[#c8a96e]"
                      : "border-[#1a1a1a] text-[#878383] hover:border-[#333]"
                  }`}
                >
                  {f === "all"
                    ? `All (${games.length})`
                    : f === "win"
                      ? `Wins (${stats.wins})`
                      : f === "loss"
                        ? `Losses (${stats.losses})`
                        : `Draws (${stats.draws})`}
                </button>
              ))}
            </div>

            {/* Column headers */}
            <div
              className="grid px-5 py-2 border-b border-[#141414] mb-0"
              style={{ gridTemplateColumns: "60px 1fr 80px 60px 60px 80px" }}
            >
              {["Result", "Opponent", "Moves", "Time", "±ELO", "Date"].map(
                (h) => (
                  <span
                    key={h}
                    className="text-[0.58rem] tracking-[0.15em] uppercase text-[#2e2e2e] last:text-right"
                  >
                    {h}
                  </span>
                ),
              )}
            </div>

            <div className="border border-[#1a1a1a] bg-[#0e0e0e]">
              {gamesLoading ? (
                <div className="px-5 py-12 text-center text-[#333] text-sm font-light">
                  Loading games…
                </div>
              ) : filteredGames.length === 0 ? (
                <div className="px-5 py-12 text-center text-[#333] text-sm font-light">
                  No {gameFilter === "all" ? "" : gameFilter} games found.
                </div>
              ) : (
                filteredGames.map((g) => <GameRow key={g.id} game={g} />)
              )}
            </div>
          </div>
        )}

        {/* ── TAB: Stats ── */}
        {tab === "stats" && (
          <div className="p-fade-4 space-y-6">
            {/* End reason breakdown */}
            <div className="border border-[#1a1a1a] bg-[#0e0e0e]">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-[#141414]">
                <span className="block w-4 h-px bg-[#c8a96e]" />
                <span className="text-[0.65rem] tracking-[0.2em] uppercase text-[#c8a96e]">
                  How games end
                </span>
              </div>
              <div className="p-5 space-y-4">
                {reasons.map((reason) => {
                  const count = games.filter(
                    (g) => g.endReason === reason,
                  ).length;
                  const pct = games.length
                    ? Math.round((count / games.length) * 100)
                    : 0;

                  return (
                    <div key={reason}>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-[0.68rem] tracking-widest capitalize text-[#878383]">
                          {reason}
                        </span>

                        <span className="text-[0.68rem] text-[#5e5d5d]">
                          {count} ({pct}%)
                        </span>
                      </div>

                      <div className="h-1 bg-[#504f4f] border border-[#1a1a1a] overflow-hidden">
                        <div
                          className="rating-bar-fill"
                          style={{ "--w": `${pct}%` } as React.CSSProperties}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Color stats */}
            <div className="grid grid-cols-2 gap-3">
              {(["white", "black"] as const).map((color) => {
                const colorGames = games.filter((g) => g.myColor === color);
                const colorWins = colorGames.filter(
                  (g) => g.result === "win",
                ).length;
                const colorWr = colorGames.length
                  ? Math.round((colorWins / colorGames.length) * 100)
                  : 0;
                return (
                  <div key={color} className="stat-card p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`w-4 h-4 rounded-sm border ${
                          color === "white"
                            ? "bg-[#f0ebe0] border-[#888]"
                            : "bg-[#1a1a1a] border-[#333]"
                        }`}
                      />
                      <span className="text-[0.62rem] tracking-[0.15em] capitalize text-[#878383]">
                        {color}
                      </span>
                    </div>
                    <div
                      className="text-2xl font-light text-[#c8a96e]"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      {colorWr}%
                    </div>
                    <div className="text-[0.65rem] text-[#333] mt-1">
                      win rate · {colorGames.length} games
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Performance grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <StatCard label="Best rating" value={stats.bestRating} />
              <StatCard
                label="Avg game length"
                value={
                  stats.avgDuration > 0 ? fmtDuration(stats.avgDuration) : "—"
                }
              />
              <StatCard
                label="Avg moves"
                value={stats.avgMoves || "—"}
                sub="per game"
              />
              <StatCard
                label="Win streak"
                value={stats.winStreak}
                sub="current"
              />
              <StatCard label="Total games" value={stats.totalGames} />
              <StatCard
                label="Win rate"
                value={`${Math.round((stats.wins / (stats.totalGames || 1)) * 100)}%`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
