"use client";

import { useState, useEffect } from "react";
import { getPresenceSocket } from "@/lib/presenceSocket";
import FriendItem from "./FriendItem";

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

export default function FriendsSidebar({ onSelect }: FriendsSidebarProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const socket = getPresenceSocket();

  function groupFriends(list: Friend[]): GroupedFriends {
    return {
      online: list.filter((f) => f.status === "online"),
      playing: list.filter((f) => f.status === "playing"),
      offline: list.filter((f) => !f.status || f.status === "offline"),
    };
  }

  useEffect(() => {
    // Buffer presence updates that arrive before friends list loads
    const pendingUpdates = new Map<string, Status>();

    const handleFriends = (data: Friend[]) => {
      console.log("[friends_with_presence] received:", data);
      // Apply any buffered presence updates on top
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
      console.log("[presence_update] received:", userId, status);
      // Buffer it in case friends list hasn't loaded yet
      pendingUpdates.set(userId, status);
      // Also apply immediately if friends already loaded
      setFriends((prev) => {
        if (prev.length === 0) return prev; // not loaded yet, buffered above
        return prev.map((f) => (f.id === userId ? { ...f, status } : f));
      });

      if (status === 'online') {
        setTimeout(() => socket.emit("get_friends_with_presence"), 300);
      }
    };

    const requestFriends = () => {
      setTimeout(() => socket.emit("get_friends_with_presence"), 1000);
    };

    socket.on("friends_with_presence", handleFriends);
    socket.on("presence_update", handlePresence);
    socket.on("connect", requestFriends);

    if (socket.connected) {
      requestFriends();
    }

    return () => {
      socket.off("friends_with_presence", handleFriends);
      socket.off("presence_update", handlePresence);
      socket.off("connect", requestFriends);
    };
  }, [socket]);

  const groups = ["online", "playing", "offline"] as const;
  const grouped = groupFriends(friends);

  return (
    <div className="w-64 bg-gray-900 text-white h-full p-3">
      <h2 className="text-lg font-bold mb-3">Friends</h2>
      {groups.map((group) => {
        const list = grouped[group];
        return (
          <div key={group}>
            <h3 className="text-xs text-gray-400 mt-3 uppercase">{group}</h3>
            {list.length === 0 ? (
              <p className="text-xs text-gray-500 px-2">No users</p>
            ) : (
              list.map((friend) => (
                <FriendItem
                  key={friend.id}
                  friend={friend}
                  onClick={() => onSelect(friend)}
                />
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}
