"use client";

import { useState } from "react";
import { getSocket } from "@/lib/socket";
import { useToast } from "@/store/useToast";
import { formatLastSeen } from "@/lib/lastSeen";
import Image from "next/image";
import { api } from "@/lib/api";

type Friend = {
  id: string;
  name: string;
  avatar?: string;
  rating?: number;
  status?: "online" | "playing" | "offline";
  lastSeen?: number | null;
  unreadCount?: number;
};

type Props = {
  friend: Friend;
  onClick: () => void;
  onUnfriend?: (friendId: string) => void;
};

export default function FriendItem({ friend, onClick, onUnfriend }: Props) {
  const [inviting, setInviting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [unfriending, setUnfriending] = useState(false);
  const { addToast } = useToast();

  const STATUS_COLORS = {
    online: "#4a8a4a",
    playing: "#c8a96e",
    offline: "#2a2a2a",
  };

  async function handleUnfriend(e: React.MouseEvent) {
    e.stopPropagation();

    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
      return;
    }

    setUnfriending(true);
    try {
      await api.delete(`/friends/${friend.id}`);
      addToast(`Unfriended ${friend.name}`, "info", 50, 50);
      onUnfriend?.(friend.id);
    } catch {
      addToast("Failed to unfriend", "error");
    } finally {
      setUnfriending(false);
      setConfirming(false);
    }
  }

  function sendInvite(e: React.MouseEvent) {
    e.stopPropagation();
    if (inviting) return;
    setInviting(true);

    const socket = getSocket();
    socket.emit("invite_friend", { friendId: friend.id });

    const onInviteSent = ({ friendId }: { friendId: string }) => {
      if (friendId !== friend.id) return;
      addToast(`Invite sent to ${friend.name}`, "info");
      cleanup();
    };

    const onInviteFailed = ({ reason }: { reason: string }) => {
      addToast(reason, "error");
      setInviting(false);
      cleanup();
    };

    const onInviteExpired = ({ friendId }: { friendId: string }) => {
      if (friendId !== friend.id) return;
      addToast(`${friend.name} didn't respond`, "error");
      setInviting(false);
      cleanup();
    };

    const onInviteDeclined = ({ friendId }: { friendId: string }) => {
      if (friendId !== friend.id) return;
      addToast(`${friend.name} declined your invite`, "error");
      setInviting(false);
      cleanup();
    };

    function cleanup() {
      socket.off("invite_sent", onInviteSent);
      socket.off("invite_failed", onInviteFailed);
      socket.off("invite_expired", onInviteExpired);
      socket.off("invite_declined", onInviteDeclined);
    }

    socket.once("invite_sent", onInviteSent);
    socket.once("invite_failed", onInviteFailed);
    socket.on("invite_expired", onInviteExpired);
    socket.on("invite_declined", onInviteDeclined);
  }

  return (
    <button
      onClick={onClick}
      className="friend-row w-full text-left px-2 py-2 relative group transition-colors duration-100"
    >
      <div className="friend-row-bg absolute inset-0 bg-[#0e0e0e] opacity-0 transition-opacity duration-100" />
      <div className="relative flex items-center gap-2.5">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-7 h-7 border border-[#1a1a1a] bg-[#111] flex items-center justify-center">
            {friend.avatar ? (
              <Image
                src={friend.avatar || "/assets/default-logo.png"}
                alt={friend.name}
                width={100}
                height={100}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[11px] text-[#666] font-light">
                {friend.name[0]?.toUpperCase()}
              </span>
            )}
          </div>
          <div
            className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#080808]"
            style={{ background: STATUS_COLORS[friend.status ?? "offline"] }}
          />
        </div>

        {/* Name + status */}
        <div className="min-w-0 flex-1">
          <p className="text-[#d0c8b8] group-hover:text-[#f0ebe0] text-xs font-light truncate transition-colors duration-100">
            {friend.name}
          </p>
          <p className="text-[#555] text-[10px] font-light truncate">
            {friend.status === "playing"
              ? "In a game"
              : friend.status === "online"
                ? "Online"
                : friend.lastSeen
                  ? `Last seen ${formatLastSeen(friend.lastSeen)}`
                  : "Offline"}
          </p>
        </div>

        {/* Rating */}
        {friend.rating && (
          <span
            className="text-[10px] text-[#555] group-hover:text-[#c8a96e] font-light transition-colors shrink-0"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {friend.rating}
          </span>
        )}

        {friend.unreadCount && friend.unreadCount > 0 && (
          <span className="shrink-0 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-medium">
            {friend.unreadCount > 9 ? "9+" : friend.unreadCount}
          </span>
        )}

        {/* Invite button — only for online friends */}
        {friend.status === "online" && (
          <button
            onClick={sendInvite}
            disabled={inviting}
            title="Invite to game"
            className="shrink-0 w-6 h-6 border flex items-center justify-center transition-all duration-150 disabled:opacity-40"
            style={{
              borderColor: inviting ? "#1a1a1a" : "#1e1e1e",
              color: inviting ? "#333" : "#555",
            }}
            onMouseEnter={(e) => {
              if (!inviting) {
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "#c8a96e";
                (e.currentTarget as HTMLButtonElement).style.color = "#c8a96e";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                inviting ? "#1a1a1a" : "#1e1e1e";
              (e.currentTarget as HTMLButtonElement).style.color = inviting
                ? "#333"
                : "#555";
            }}
          >
            {inviting ? (
              <div className="w-2.5 h-2.5 rounded-full border border-[#c8a96e]/30 border-t-[#c8a96e] animate-spin" />
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="w-3 h-3"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </button>
        )}

        <button
          onClick={handleUnfriend}
          disabled={unfriending}
          title={confirming ? "Click again to confirm" : "Unfriend"}
          className="shrink-0 w-6 h-6 border flex items-center justify-center transition-all duration-150 disabled:opacity-40"
          style={{
            borderColor: confirming ? "#8a3030" : "#1e1e1e",
            color: confirming ? "#c06060" : "#555",
          }}
          onMouseEnter={(e) => {
            if (!unfriending) {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "#8a3030";
              (e.currentTarget as HTMLButtonElement).style.color = "#c06060";
            }
          }}
          onMouseLeave={(e) => {
            if (!confirming) {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "#1e1e1e";
              (e.currentTarget as HTMLButtonElement).style.color = "#555";
            }
          }}
        >
          {unfriending ? (
            <div className="w-2.5 h-2.5 rounded-full border border-[#8a3030]/30 border-t-[#8a3030] animate-spin" />
          ) : confirming ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-3 h-3"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="w-3 h-3"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
          )}
        </button>
      </div>
    </button>
  );
}
