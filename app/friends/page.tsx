"use client";

import { useState } from "react";
import FriendsSidebar from "../components/friends/FriendsSidebar";
import ChatWindow from "../components/chat/ChatWindow";
import FriendRequests from "../components/friends/FriendRequests";
import AddFriend from "../components/friends/AddFriend";
import { Friend } from "../../types/friends";

export default function FriendsPage() {
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [tab, setTab] = useState<"friends" | "requests" | "add">("friends");

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      
      {/* Sidebar */}
      <FriendsSidebar onSelect={setSelectedFriend} />

      {/* Main Panel */}
      <div className="flex-1 flex flex-col">

        {/* Tabs */}
        <div className="flex gap-4 p-3 border-b border-gray-700">
          <button onClick={() => setTab("friends")}>Friends</button>
          <button onClick={() => setTab("requests")}>Requests</button>
          <button onClick={() => setTab("add")}>Add Friend</button>
        </div>

        {/* Content */}
        <div className="flex-1">
          {tab === "friends" && (
            <ChatWindow selectedFriend={selectedFriend} />
          )}

          {tab === "requests" && <FriendRequests />}

          {tab === "add" && <AddFriend />}
        </div>
      </div>
    </div>
  );
}