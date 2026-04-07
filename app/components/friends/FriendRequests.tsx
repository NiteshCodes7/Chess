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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/friends/requests")
      .then((res) => setRequests(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
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

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6">
        <div className="w-3 h-3 rounded-full border border-[#c8a96e]/30 border-t-[#c8a96e] animate-spin" />
        <span className="text-[#444] text-xs font-light tracking-wide">
          Loading requests…
        </span>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3">
        <div className="w-10 h-10 border border-[#141414] bg-[#0e0e0e] flex items-center justify-center">
          <span className="text-xl opacity-20 select-none" style={{ color: "#878383", opacity: 0.7}}>♟</span>
        </div>
        <div className="text-center">
          <div className="flex items-center gap-2 justify-center mb-1">
            <span className="block w-4 h-px bg-[#1e1e1e]" />
            <span className="text-[#878383] text-xs tracking-[0.2em] uppercase font-light">
              No pending requests
            </span>
            <span className="block w-4 h-px bg-[#1e1e1e]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {requests.map((req) => (
        <div
          key={req.id}
          className="flex items-center justify-between px-3 py-3 border border-[#141414] bg-[#0e0e0e] hover:bg-[#111] transition-colors duration-150 group"
        >
          {/* Avatar + info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 border border-[#1e1e1e] bg-[#0a0a0a] flex items-center justify-center shrink-0">
              <span className="text-xs text-[#666] font-light">
                {req.from.name[0]?.toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p
                className="text-[#d0c8b8] text-sm font-light truncate group-hover:text-[#f0ebe0] transition-colors duration-150"
                style={{ fontFamily: "Georgia, serif" }}
              >
                {req.from.name}
              </p>
              <p className="text-[#444] text-xs font-light truncate">
                {req.from.email}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-1.5 shrink-0 ml-3">
            <button
              onClick={() => accept(req.id)}
              className="px-3 py-1.5 text-xs font-light tracking-widest uppercase border border-[#2a4a2a] text-[#4a8a4a] hover:bg-[#4a8a4a] hover:text-[#0a0a0a] transition-all duration-150"
            >
              Accept
            </button>
            <button
              onClick={() => reject(req.id)}
              className="px-3 py-1.5 text-xs font-light tracking-widest uppercase border border-[#3a1a1a] text-[#6a3030] hover:bg-[#8a3030] hover:text-[#f0ebe0] transition-all duration-150"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
