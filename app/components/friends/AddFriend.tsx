"use client";

import { api } from "@/lib/api";
import { useState } from "react";

export default function AddFriend() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{ msg: string; ok: boolean } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  async function sendRequest() {
    if (!email.trim()) return;
    setLoading(true);
    setStatus(null);
    try {
      await api.post("/friends/request", { email });
      setStatus({ msg: "Request sent successfully.", ok: true });
      setEmail("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const message = err?.response?.data?.message || "Failed to send request.";
      setStatus({ msg: message, ok: false });
    } finally {
      setLoading(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendRequest();
  };

  return (
    <div className="space-y-4">
      {/* Description */}
      <p className="text-[#878383] text-xs font-light leading-relaxed">
        Enter a player&apos;s email address to send them a friend request.
      </p>

      {/* Input row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          {/* Mail icon */}
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6c6a6a] pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>

          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setStatus(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="player@email.com"
            className="w-full h-9 pl-9 pr-3 bg-[#0e0e0e] border border-[#1a1a1a] text-[#d0c8b8] placeholder-[#6c6a6a] text-xs font-light tracking-wide focus:outline-none focus:border-[#2a2a2a] transition-colors duration-150"
            style={{ fontFamily: "inherit" }}
          />
        </div>

        <button
          onClick={sendRequest}
          disabled={loading || !email.trim()}
          className="px-4 h-9 text-xs font-light tracking-[0.12em] uppercase border transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            borderColor: loading ? "#1a1a1a" : "#c8a96e",
            color: loading ? "#444" : "#c8a96e",
            background: "transparent",
          }}
          onMouseEnter={(e) => {
            if (!loading && email.trim()) {
              (e.currentTarget as HTMLButtonElement).style.background =
                "#c8a96e";
              (e.currentTarget as HTMLButtonElement).style.color = "#0a0a0a";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = loading
              ? "#444"
              : "#c8a96e";
          }}
        >
          {loading ? (
            <div className="w-3 h-3 rounded-full border border-[#c8a96e]/30 border-t-[#c8a96e] animate-spin" />
          ) : (
            "Send"
          )}
        </button>
      </div>

      {/* Status message */}
      {status && (
        <div
          className="flex items-center gap-2 px-3 py-2 border"
          style={{
            borderColor: status.ok ? "#2a4a2a" : "#3a1a1a",
            background: status.ok
              ? "rgba(74,138,74,0.05)"
              : "rgba(138,48,48,0.05)",
          }}
        >
          {/* Icon */}
          {status.ok ? (
            <svg
              className="w-3 h-3 text-[#4a8a4a] shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg
              className="w-3 h-3 text-[#8a4a4a] shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
          <p
            className="text-xs font-light"
            style={{ color: status.ok ? "#4a8a4a" : "#8a4a4a" }}
          >
            {status.msg}
          </p>
        </div>
      )}
    </div>
  );
}
