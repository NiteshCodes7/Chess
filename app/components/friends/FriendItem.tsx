"use client";

import Image from "next/image";

type Friend = {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  rating?: number;
  status?: "online" | "playing" | "offline";
};

type FriendItemProps = {
  friend: Friend;
  onClick?: () => void;
};


export default function FriendItem({
  friend,
  onClick,
}: FriendItemProps) {
  const statusColor =
    friend.status === "online"
      ? "bg-green-500"
      : friend.status === "playing"
      ? "bg-yellow-400"
      : "bg-gray-500";

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-800 transition"
    >
      {/* Avatar */}
      <div className="relative w-8 h-8">
        <Image
          src={friend.avatar || "/avatar.png"}
          alt={`${friend.name}'s avatar`}
          fill
          sizes="32px"
          className="rounded-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{friend.email}</p>
        <p className="text-sm truncate">{friend.name}</p>
        {friend.rating !== undefined && (
          <p className="text-xs text-gray-400">
            {friend.rating}
          </p>
        )}
      </div>

      {/* Presence Dot */}
      <span
        className={`w-3 h-3 rounded-full ${statusColor}`}
      />
    </div>
  );
}