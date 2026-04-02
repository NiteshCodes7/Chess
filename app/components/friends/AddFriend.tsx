"use client";

import { api } from "@/lib/api";
import { useState } from "react";

export default function AddFriend() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  async function sendRequest() {
    try {
      const res = await api.post("/friends/request", { email });

      setStatus("Request sent!");
      setEmail("");
    } catch (err) {
      setStatus("Failed to send request");
      console.error(err);
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-2">Add Friend</h2>

      <div className="flex gap-2">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email"
          className="px-3 py-2 bg-gray-800 rounded flex-1"
        />

        <button onClick={sendRequest} className="bg-blue-600 px-4 rounded">
          Send
        </button>
      </div>

      {status && <p className="mt-2 text-sm">{status}</p>}
    </div>
  );
}
