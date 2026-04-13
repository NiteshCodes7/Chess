"use client";

import { useState, useEffect, useRef } from "react";
import { getPresenceSocket } from "@/lib/presenceSocket";
import FriendItem from "./FriendsItem";

type Status = "online" | "playing" | "offline";

type Friend = {
  id: string;
  name: string;
  avatar?: string;
  rating?: number;
  status?: Status;
  lastSeen?: number | null;
};

type FriendsSidebarProps = {
  onSelect: (friend: Friend) => void;
};

type GroupedFriends = {
  online: Friend[];
  playing: Friend[];
  offline: Friend[];
};

const STATUS_COLORS: Record<Status, string> = {
  online: "#4a8a4a",
  playing: "#c8a96e",
  offline: "#2a2a2a",
};

const STATUS_LABELS: Record<Status, string> = {
  online: "Online",
  playing: "Playing",
  offline: "Offline",
};

export default function FriendsSidebar({ onSelect }: FriendsSidebarProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const socket = getPresenceSocket();

  function handleUnfriend(friendId: string) {
    setFriends((prev) => prev.filter((f) => f.id !== friendId));
  }

  function groupFriends(list: Friend[]): GroupedFriends {
    return {
      online: list.filter((f) => f.status === "online"),
      playing: list.filter((f) => f.status === "playing"),
      offline: list.filter((f) => !f.status || f.status === "offline"),
    };
  }

  const query = search.trim().toLowerCase();
  const filteredFriends = friends.filter((f) =>
    f.name.toLowerCase().includes(query),
  );
  const grouped = groupFriends(filteredFriends);
  const totalOnline = friends.filter(
    (f) => f.status === "online" || f.status === "playing",
  ).length;

  // handle latest status of users
  useEffect(() => {
    // Buffer store
    const pendingUpdates = new Map<string, Status>();

    const handleFriends = (data: Friend[]) => {
      setFriends(
        data.map((f) => ({
          ...f,
          status: pendingUpdates.get(f.id) ?? f.status,
        })),
      );
      pendingUpdates.clear();
    };

    const handlePresence = ({
      userId,
      status,
    }: {
      userId: string;
      status: Status;
    }) => {
      // Add buffer for status
      pendingUpdates.set(userId, status);
      setFriends((prev) => {
        if (!prev.length) return prev;
        return prev.map((f) => (f.id === userId ? { ...f, status } : f));
      });
      if (status === "online") {
        setTimeout(() => socket.emit("get_friends_with_presence"), 300);
      }
    };

    const requestFriends = () => {
      setTimeout(() => socket.emit("get_friends_with_presence"), 1000);
    };

    socket.on("friends_with_presence", handleFriends);
    socket.on("presence_update", handlePresence);
    socket.on("connect", requestFriends);

    if (socket.connected) requestFriends();

    return () => {
      socket.off("friends_with_presence", handleFriends);
      socket.off("presence_update", handlePresence);
      socket.off("connect", requestFriends);
    };
  }, [socket]);

  return (
    <div className="flex flex-col h-full bg-[#080808]">
      <style>{`
        .fs-scroll::-webkit-scrollbar { width: 3px; }
        .fs-scroll::-webkit-scrollbar-track { background: transparent; }
        .fs-scroll::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 2px; }
        .fs-scroll::-webkit-scrollbar-thumb:hover { background: #2a2a2a; }
        .friend-row:hover .friend-row-bg { opacity: 1; }
      `}</style>

      {/* Header */}
      <div className="px-4 pt-4 pb-3 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[#c8a96e] text-xs tracking-[0.2em] uppercase font-light">
            All Friends
          </p>
          {totalOnline > 0 && (
            <span className="text-[10px] text-[#4a8a4a] tracking-widest font-light">
              {totalOnline} online
            </span>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[#878383] pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search friends"
            className="w-full h-8 pl-8 pr-7 bg-[#0e0e0e] border border-[#141414] text-[#aaa] placeholder-[#878383] text-xs font-light tracking-wide focus:outline-none focus:border-[#2a2a2a] transition-colors duration-150"
            style={{ fontFamily: "inherit" }}
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                inputRef.current?.focus();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#333] hover:text-[#555] text-xs transition-colors"
            >
              ×
            </button>
          )}
        </div>

        {/* No results */}
        {search && filteredFriends.length === 0 && (
          <p className="text-[#6a6969] text-xs font-light mt-2 px-1">
            No results for &quot;{search}&quot;
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-[#0f0f0f] shrink-0" />

      {/* Groups */}
      <div className="flex-1 overflow-y-auto fs-scroll px-2 pb-4">
        {(["online", "playing", "offline"] as const).map((group) => {
          const list = grouped[group];
          if (search && list.length === 0) return null;

          return (
            <div key={group} className="mt-4">
              {/* Group label */}
              <div className="flex items-center gap-2 px-2 mb-1.5">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: STATUS_COLORS[group] }}
                />
                <span className="text-[10px] text-[#878383] tracking-[0.18em] uppercase font-light">
                  {STATUS_LABELS[group]}
                </span>
                <span className="text-[10px] text-[#444] ml-auto">
                  {list.length}
                </span>
              </div>

              {list.length === 0 ? (
                <p className="text-[#444] text-xs px-4 py-1 font-light">—</p>
              ) : (
                <div className="space-y-px">
                  {list.map((friend) => (
                    <FriendItem
                      key={friend.id}
                      friend={friend}
                      onClick={() => onSelect(friend)}
                      onUnfriend={handleUnfriend}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Empty state */}
        {friends.length === 0 && !search && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <span
              className="text-2xl select-none"
              style={{ color: "#878383", opacity: 0.7 }}
            >
              ♟
            </span>
            <p className="text-[#878383] text-xs font-light tracking-wide">
              No friends yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
