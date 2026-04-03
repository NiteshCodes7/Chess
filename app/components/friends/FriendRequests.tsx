"use client";

import { api } from "@/lib/api";
import { useEffect, useState } from "react";

type Request = {
  id: string;
  from: {
    id: string;
    name: string;
    email: string;
  };
};

export default function FriendRequests() {
  const [requests, setRequests] = useState<Request[]>([]);

  useEffect(() => {
    api
      .get("/friends/requests")
      .then((res) => {
        setRequests(res.data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  async function accept(id: string) {
    try {
      await api.post(`/friends/accept/${id}`);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  async function reject(id: string) {
    try {
      await api.post(`/friends/reject/${id}`);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-lg font-bold">Friend Requests</h2>

      {requests.map((req) => (
        <div
          key={req.id}
          className="flex justify-between items-center bg-gray-800 p-3 rounded"
        >
          <div>
            <p>{req.from.name}</p>
            <p className="text-sm text-gray-400">{req.from.email}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => accept(req.id)}
              className="bg-green-600 px-3 py-1 rounded"
            >
              Accept
            </button>

            <button
              onClick={() => reject(req.id)}
              className="bg-red-600 px-3 py-1 rounded"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}