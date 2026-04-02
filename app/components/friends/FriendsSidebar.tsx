"use client";

import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";
import FriendItem from "./FriendItem";
import { api } from "@/lib/api";

type Friend = {
  id: string;
  name: string;
  avatar?: string;
  rating?: number;
  status?: "online" | "playing" | "offline";
};

type FriendsSidebarProps = {
  onSelect: (friend: Friend) => void;
};

type PresenceUpdate = {
  userId: string;
  status: "online" | "playing" | "offline";
};

type GroupedFriends = {
  online: Friend[];
  playing: Friend[];
  offline: Friend[];
};

export default function FriendsSidebar({ onSelect }: FriendsSidebarProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const socket = getSocket();

  /* ✅ FIXED: Proper typing (no any) */
  function groupFriends(friends: Friend[]): GroupedFriends {
    return {
      online: friends.filter((f) => f.status === "online"),
      playing: friends.filter((f) => f.status === "playing"),
      offline: friends.filter((f) => f.status === "offline" || !f.status),
    };
  }

  const grouped = groupFriends(friends);

  useEffect(() => {
    async function loadFriends() {
      try {
        const res = await api.get("/friends");
        const data: Friend[] = res.data;
        setFriends(data);
      } catch (err) {
        console.error("Failed to load friends:", err);
      }
    }

    loadFriends();

    const handlePresence = ({ userId, status }: PresenceUpdate) => {
      setFriends((prev) =>
        prev.map((f) => (f.id === userId ? { ...f, status } : f)),
      );
    };

    socket.on("presence_update", handlePresence);

    return () => {
      socket.off("presence_update", handlePresence);
    };
  }, [socket]);

  return (
    <div className="w-64 bg-gray-900 text-white h-full p-3">
      <h2 className="text-lg font-bold mb-3">Friends</h2>

      {(["online", "playing", "offline"] as const).map((group) => (
        <div key={group}>
          <h3 className="text-xs text-gray-400 mt-3 uppercase">{group}</h3>

          {grouped[group].length === 0 ? (
            <p className="text-xs text-gray-500 px-2">No users</p>
          ) : (
            grouped[group].map((friend) => (
              <FriendItem
                key={friend.id}
                friend={friend}
                onClick={() => onSelect(friend)}
              />
            ))
          )}
        </div>
      ))}
    </div>
  );
}
