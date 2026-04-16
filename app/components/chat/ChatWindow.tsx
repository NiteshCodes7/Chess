"use client";

import { useEffect, useState, useRef } from "react";
import MessageItem from "./MessageItem";
import ChatInput from "./ChatInput";
import { getUserId } from "@/lib/getUser";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";

type Friend = {
  id: string;
  name: string;
};

type Message = {
  id: string;
  from: string;
  to: string;
  content: string;
  createdAt?: string;
  isMe?: boolean;
};

type ApiMessage = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
};

type ChatWindowProps = {
  selectedFriend?: Friend | null;
  gameId?: string;
};

export default function ChatWindow({
  selectedFriend,
  gameId,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const isGameChat = !!gameId;
  const socket = getSocket();

  useEffect(() => {
    if (!selectedFriend || gameId) return;
    const currentUserId = getUserId();

    (async () => {
      try {
        const res = await api.get(`/chat/${selectedFriend.id}`);
        setMessages(
          res.data.map((msg: ApiMessage) => ({
            id: msg.id,
            from: msg.senderId,
            to: msg.receiverId,
            content: msg.content,
            createdAt: msg.createdAt,
            isMe: msg.senderId === currentUserId,
          })),
        );
      } catch (err) {
        console.error(err);
      }
    })();

    const handleDM = (msg: Message) => {
      const isThisChat =
        (msg.from === currentUserId && msg.to === selectedFriend.id) ||
        (msg.from === selectedFriend.id && msg.to === currentUserId);
      if (!isThisChat) return;
      setMessages((prev) => [
        ...prev,
        { ...msg, isMe: msg.from === currentUserId },
      ]);
    };

    const handleMessageDeleted = ({ messageId }: { messageId: string }) => {
       console.log("deleting:", messageId);
  console.log("messages:", messages.map(m => m.id));
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    };

    socket.on("message_deleted", handleMessageDeleted);
    socket.on("dm", handleDM);

    return () => {
      socket.off("dm", handleDM);
      socket.off("message_deleted", handleMessageDeleted);
    };
  }, [selectedFriend, gameId, socket]);

  useEffect(() => {
    if (!gameId) return;
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const handleGameChat = (msg: { from: string; content: string }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          from: msg.from,
          to: "",
          content: msg.content,
          isMe: msg.from === getUserId(),
        },
      ]);
    };

    socket.on("game_chat", handleGameChat);
    return () => {
      socket.off("game_chat", handleGameChat);
    };
  }, [gameId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!selectedFriend && !gameId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[#444] text-xs font-light tracking-[0.15em] uppercase">
          Select a friend to start chatting
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden bg-[#0a0a0a]">
      <style>{`
        .chat-scroll::-webkit-scrollbar { width: 3px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 2px; }
        .chat-scroll::-webkit-scrollbar-thumb:hover { background: #2a2a2a; }
      `}</style>

      {/* Header — only for game chat, DM header is in FriendsPage topbar */}
      {isGameChat && (
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#111] shrink-0">
          <div className="w-7 h-7 border border-[#1e1e1e] bg-[#0e0e0e] flex items-center justify-center">
            <span
              className="text-base select-none"
              style={{ color: "#c8a96e" }}
            >
              ♟
            </span>
          </div>
          <div>
            <p
              className="text-[#d0c8b8] text-xs font-light"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Game Chat
            </p>
            <p className="text-[#444] text-[10px] font-light">
              Live match messages
            </p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 chat-scroll">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 py-8">
            <span
              className="text-2xl select-none"
              style={{ color: "#878383", opacity: 0.3 }}
            >
              ♛
            </span>
            <p className="text-[#333] text-xs font-light tracking-wide">
              No messages yet
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageItem
            key={msg.id ?? i}
            message={msg}
            isGameChat={isGameChat}
            onDelete={(id) => setMessages((prev) => prev.filter((m) => m.id !== id))}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-[#111]">
        <ChatInput gameId={gameId} to={selectedFriend?.id} />
      </div>
    </div>
  );
}
