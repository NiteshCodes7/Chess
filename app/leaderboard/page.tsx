"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { getUserId } from "@/lib/getUser";

type Player = {
  id: string;
  username: string;
  rating: number;
  avatar?: string | null;
  wins: number;
  losses: number;
  draws: number;
};

const AVATAR_PALETTES = [
  ["#1a1610", "#c8a96e"],
  ["#0e1620", "#6b8bb8"],
  ["#0e1a10", "#7aad6e"],
  ["#1a0e10", "#ad6e6e"],
  ["#131020", "#8a7ad6"],
] as const;

function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function avatarColor(name?: string | null) {
  if (!name) return AVATAR_PALETTES[0];

  let hash = 0;
  for (const c of name)
    hash = (hash * 31 + c.charCodeAt(0)) % AVATAR_PALETTES.length;

  return AVATAR_PALETTES[hash];
}

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const currentUserId = getUserId();

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const res = await api.get("/leaderboard");
        setPlayers(res.data);
      } catch {
        setPlayers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBoard();
  }, []);

  const topPlayer = useMemo(() => players[0], [players]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e8e0d0] px-4 py-10 flex flex-col items-center gap-8 font-serif">
      <button
        onClick={() => router.back()}
        className="
                absolute top-4 left-4 z-20
                px-3 h-9
                border border-[#2a2218]
                bg-[#111]
                text-[#c8a96e]
                text-xs uppercase tracking-[0.2em]
                hover:bg-[#161616]
                transition-colors
                cursor-pointer
            "
      >
        ← Back
      </button>

      {/* Grid Background */}
      <div
        className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#c8a96e 1px, transparent 1px), linear-gradient(90deg, #c8a96e 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      {/* Header */}
      <div className="relative z-10 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="w-8 h-px bg-[#c8a96e]/40" />
          <span className="text-[#c8a96e] text-xs tracking-[0.25em] uppercase">
            Leaderboard
          </span>
          <span className="w-8 h-px bg-[#c8a96e]/40" />
        </div>

        <p className="text-[#6f6a60] text-[11px] tracking-[0.15em]">
          Top Ranked Players
        </p>
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        {/* Top Player Card */}
        {!loading && topPlayer && (
          <div className="mb-6 border border-[#2a2218] bg-[#111] p-6 text-center">
            <div className="text-3xl mb-2 text-[#c8a96e]">♔</div>

            <div
              className="
                w-16 h-16 mx-auto mb-3 rounded-full
                flex items-center justify-center
                text-lg font-semibold
                bg-[#c8a96e] text-[#111]
                border border-[#e6c98f]
                shadow-[0_0_18px_rgba(200,169,110,0.18)]
            "
            >
              {initials(topPlayer.username)}
            </div>

            <h2 className="text-xl text-[#c8a96e] tracking-wide">
              {topPlayer.username}
            </h2>

            <p className="text-sm text-[#888] mt-1">
              Rating {topPlayer.rating}
            </p>
          </div>
        )}

        {/* Table Header */}
        <div className="grid grid-cols-[50px_1fr_100px_100px_100px] items-center px-4 min-h-10 bg-[#080808] border border-[#141414] text-[9px] uppercase tracking-[0.22em] text-[#555]">
          <span>#</span>
          <span>Player</span>
          <span>Rating</span>
          <span>Games</span>
          <span>Win Rate</span>
        </div>

        {/* Rows */}
        <div className="border border-t-0 border-[#141414]">
          {loading &&
            Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-14 border-b border-[#111] bg-[#0e0e0e] animate-pulse"
              />
            ))}

          {!loading &&
            players.map((player, i) => {
              const games = player.wins + player.losses + player.draws;

              const isMe = player.id === currentUserId;

              const winRate =
                games > 0 ? Math.round((player.wins / games) * 100) : 0;

              const [bg, fg] = avatarColor(player.username);

              const rankColor =
                i === 0
                  ? "text-[#c8a96e]"
                  : i === 1
                    ? "text-[#9c9c9c]"
                    : i === 2
                      ? "text-[#ad7a43]"
                      : "text-[#666]";

              return (
                <div
                  key={player.id}
                  className={`
                    grid grid-cols-[50px_1fr_100px_100px_100px]
                    items-center px-4 min-h-14 border-b transition-colors
                    ${
                        isMe
                        ? "bg-[#15120b] border-[#3a2c14] shadow-[inset_0_0_0_1px_rgba(200,169,110,0.18)]"
                        : "border-[#0d0d0d] hover:bg-[#0e0e0e]"
                    }
                    `}
                >
                  {/* Rank */}
                  <span className={`text-sm ${rankColor}`}>{i + 1}</span>

                  {/* Player */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[10px]"
                      style={{ background: bg, color: fg }}
                    >
                      {initials(player.username)}
                    </div>

                    <span className="truncate text-sm text-[#d0c8b8]">
                      {player.username}
                    </span>
                  </div>

                  {/* Rating */}
                  <span className="text-[#c8a96e] text-sm">
                    {player.rating}
                  </span>

                  {/* Games */}
                  <span className="text-[#999] text-sm">{games}</span>

                  {/* Win Rate */}
                  <span className="text-[#7aad6e] text-sm">{winRate}%</span>
                </div>
              );
            })}

          {!loading && players.length === 0 && (
            <div className="py-16 text-center text-[#666] text-xs uppercase tracking-[0.2em]">
              No players found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
