"use client";

import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Game = {
  id: string;
  white?: { id: string; username?: string | null };
  black?: { id: string; username?: string | null };
  result?: "WHITE_WIN" | "BLACK_WIN" | "DRAW" | "ONGOING";
  createdAt?: string;
  _count?: { moves: number };
};

type Filter = "all" | "win" | "loss" | "draw" | "ongoing";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "win", label: "Wins" },
  { key: "loss", label: "Losses" },
  { key: "draw", label: "Draws" },
  { key: "ongoing", label: "Ongoing" },
];

const AVATAR_PALETTES = [
  ["#1a1610", "#c8a96e"],
  ["#0e1620", "#6b8bb8"],
  ["#0e1a10", "#7aad6e"],
  ["#1a0e10", "#ad6e6e"],
  ["#131020", "#8a7ad6"],
] as const;

function getOutcome(game: Game, myId: string) {
  if (game.result === "ONGOING")
    return {
      label: "Ongoing",
      color: "text-[#6b8bb8]",
      dot: "#6b8bb8",
      type: "ongoing" as Filter,
    };

  if (game.result === "DRAW")
    return {
      label: "Draw",
      color: "text-[#6e8bad]",
      dot: "#6e8bad",
      type: "draw" as Filter,
    };

  const iWon =
    (game.white?.id === myId && game.result === "WHITE_WIN") ||
    (game.black?.id === myId && game.result === "BLACK_WIN");

  return iWon
    ? {
        label: "Victory",
        color: "text-[#7aad6e]",
        dot: "#4a8a3e",
        type: "win" as Filter,
      }
    : {
        label: "Defeat",
        color: "text-[#ad6e6e]",
        dot: "#8a3e3e",
        type: "loss" as Filter,
      };
}

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

function formatDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function GamesPage() {
  const router = useRouter();

  const [games, setGames] = useState<Game[]>([]);
  const [myId, setMyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const [gamesRes, meRes] = await Promise.all([
          api.get("/game"),
          api.get("/auth/me"),
        ]);

        setGames(gamesRes.data);
        setMyId(meRes.data.id);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  const stats = useMemo(() => {
    let wins = 0,
      losses = 0,
      draws = 0;

    for (const game of games) {
      const type = getOutcome(game, myId).type;
      if (type === "win") wins++;
      if (type === "loss") losses++;
      if (type === "draw") draws++;
    }

    return {
      total: games.length,
      wins,
      losses,
      draws,
    };
  }, [games, myId]);

  const filteredGames = useMemo(() => {
    if (filter === "all") return games;
    return games.filter((g) => getOutcome(g, myId).type === filter);
  }, [games, myId, filter]);

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

      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#c8a96e 1px, transparent 1px), linear-gradient(90deg, #c8a96e 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      {/* Header */}
      <div className="relative z-10 text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="w-8 h-px bg-[#c8a96e]/40" />
          <span className="text-[#c8a96e] text-xs tracking-[0.25em] uppercase">
            Game History
          </span>
          <span className="w-8 h-px bg-[#c8a96e]/40" />
        </div>

        <p className="text-[#6f6a60] text-[11px] tracking-[0.15em]">
          {loading
            ? "Loading..."
            : `${games.length} game${games.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      <div className="relative z-10 w-full max-w-190 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
        {/* Stats */}
        {!loading && !error && (
          <div className="grid grid-cols-4 gap-px bg-[#161616] border border-[#161616] mb-6">
            {[
              { label: "Played", value: stats.total, color: "text-[#c8a96e]" },
              { label: "Wins", value: stats.wins, color: "text-[#7aad6e]" },
              {
                label: "Losses",
                value: stats.losses,
                color: "text-[#ad6e6e]",
              },
              { label: "Draws", value: stats.draws, color: "text-[#6e8bad]" },
            ].map((item) => (
              <div key={item.label} className="bg-[#0c0c0c] px-4 py-3">
                <p className={`text-[22px] leading-none ${item.color}`}>
                  {item.value}
                </p>
                <p className="mt-1 text-[9px] uppercase tracking-[0.22em] text-[#555]">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        {!loading && !error && (
          <div className="flex gap-px bg-[#161616] border border-[#161616] mb-4">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex-1 px-1 py-2 text-[10px] uppercase tracking-[0.18em] transition-all duration-150 ${
                  filter === key
                    ? "bg-[#111] text-[#c8a96e]"
                    : "bg-[#0c0c0c] text-[#555] hover:bg-[#0f0f0f] hover:text-[#999]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-14 border border-[#141414] bg-[#0e0e0e] animate-pulse"
                style={{ opacity: 1 - i * 0.12 }}
              />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="border border-[#141414] py-16 text-center text-[#777] text-xs uppercase tracking-[0.2em]">
            Failed to load games
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filteredGames.length === 0 && (
          <div className="border border-[#141414] py-16 flex flex-col items-center gap-3">
            <span className="text-2xl text-[#444]">♟</span>
            <p className="text-[#666] text-xs uppercase tracking-[0.2em]">
              No games found
            </p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && filteredGames.length > 0 && (
          <>
            {/* Header Row */}
            <div className="grid grid-cols-[36px_1fr_1fr_130px_60px_32px] max-[560px]:grid-cols-[1fr_1fr_100px_32px] items-center px-4 min-h-9 bg-[#080808] border border-[#141414] text-[9px] uppercase tracking-[0.22em] text-[#555]">
              <span className="max-[560px]:hidden">#</span>
              <span>White</span>
              <span>Black</span>
              <span>Result</span>
              <span className="max-[560px]:hidden">Moves</span>
              <span />
            </div>

            {/* Rows */}
            <div className="border border-t-0 border-[#141414]">
              {filteredGames.map((game, i) => {
                const outcome = getOutcome(game, myId);
                const [wBg, wFg] = avatarColor(game.white?.username);
                const [bBg, bFg] = avatarColor(game.black?.username);

                const iAmWhite = game.white?.id === myId;
                const iAmBlack = game.black?.id === myId;

                return (
                  <button
                    key={game.id}
                    onClick={() => router.push(`/game/replay/${game.id}`)}
                    className="group w-full text-left grid grid-cols-[36px_1fr_1fr_130px_60px_32px] max-[560px]:grid-cols-[1fr_1fr_100px_32px] items-center px-4 min-h-14 border-b border-[#0d0d0d] last:border-b-0 hover:bg-[#0e0e0e] transition-colors duration-150"
                  >
                    {/* Number */}
                    <span className="text-[10px] text-[#6a6868] max-[560px]:hidden">
                      {i + 1}
                    </span>

                    {/* White */}
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] shrink-0"
                        style={{ background: wBg, color: wFg }}
                      >
                        {initials(game.white?.username)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-[12px] text-[#d0c8b8]">
                            {game.white?.username ?? "Unknown"}
                          </span>

                          {iAmWhite && (
                            <span className="px-1 text-[8px] uppercase tracking-widest border border-[#2a2218] bg-[#1a1610] text-[#6a5a38]">
                              you
                            </span>
                          )}
                        </div>

                        <p className="mt-0.5 text-[9px] text-[#666] tracking-widest">
                          {formatDate(game.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Black */}
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] shrink-0"
                        style={{ background: bBg, color: bFg }}
                      >
                        {initials(game.black?.username)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-[12px] text-[#d0c8b8]">
                            {game.black?.username ?? "Unknown"}
                          </span>

                          {iAmBlack && (
                            <span className="px-1 text-[8px] uppercase tracking-widest border border-[#2a2218] bg-[#1a1610] text-[#6a5a38]">
                              you
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Result */}
                    <div
                      className={`flex items-center gap-1.5 text-[10px] tracking-[0.14em] ${outcome.color}`}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: outcome.dot }}
                      />
                      {outcome.label}
                    </div>

                    {/* Moves */}
                    <span className="text-[12px] text-[#8b8578] max-[560px]:hidden">
                      {game._count?.moves ?? 0}
                    </span>

                    {/* Arrow */}
                    <span className="text-[#c8a96e] opacity-0 group-hover:opacity-100 transition-opacity text-sm">
                      ›
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
