"use client";

import { useState } from "react";
import FriendsSidebar from "../components/friends/FriendsSidebar";
import ChatWindow from "../components/chat/ChatWindow";

type Friend = {
  id: string;
  name: string;
  avatar?: string;
  rating?: number;
  status?: "online" | "playing" | "offline";
};

export default function MessagesPage() {
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

  return (
    <div className="flex h-screen">
      <FriendsSidebar onSelect={setSelectedFriend} />
      <ChatWindow selectedFriend={selectedFriend} />
    </div>
  );
}