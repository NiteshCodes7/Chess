"use client";

import { useEffect, useState, useRef } from "react";
import { getChatSocket, connectChatSocket } from "@/lib/chatSocket";
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
  id?: string;
  from: string;
  to?: string;
  content: string;
  createdAt?: string;
  isMe?: boolean;
};

type ApiMessage = {
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
  const socket = getChatSocket();

  useEffect(() => {
    connectChatSocket();
  }, []);

  /* ---------------- DM CHAT ---------------- */

  useEffect(() => {
    if (!selectedFriend || gameId) return;

    const currentUserId = getUserId();

    // fetch history
    (async () => {
      try {
        const res = await api.get(`/chat/${selectedFriend.id}`);

        setMessages(
          res.data.map((msg: ApiMessage) => ({
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

    // ✅ receive messages
    const handleDM = (msg: Message) => {
      const isThisChat =
        (msg.from === currentUserId && msg.to === selectedFriend.id) ||
        (msg.from === selectedFriend.id && msg.to === currentUserId);

      if (!isThisChat) return;

      setMessages((prev) => [
        ...prev,
        {
          ...msg,
          isMe: msg.from === currentUserId,
        },
      ]);
    };

    socket.on("dm", handleDM);

    return () => {
      socket.off("dm", handleDM);
    };
  }, [selectedFriend, gameId, socket]);

  /* ---------------- GAME CHAT ---------------- */

  useEffect(() => {
    if (!gameId) return;

    const socket = getSocket();

    const handleGameChat = (msg: { from: string; content: string }) => {
      setMessages((prev) => [
        ...prev,
        {
          from: msg.from,
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
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Select a friend to start chatting
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full flex-1 bg-gray-800 text-white">
      {/* Header */}
      <div className="p-3 border-b border-gray-700">
        <h3>{selectedFriend?.name}</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((msg, i) => (
          <MessageItem key={msg.id ?? i} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput gameId={gameId} to={selectedFriend?.id} />
    </div>
  );
}
