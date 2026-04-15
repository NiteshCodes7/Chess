"use client";

import { useEffect, useState } from "react";
import { useInviteStore } from "@/store/useInviteStore";
import { getSocket } from "@/lib/socket";

export default function InviteModal() {
  const { invite, clearInvite } = useInviteStore();
  const [fromName, setFromName] = useState<string | null>(null);
  const [timer, setTimer] = useState(30);

  function respond(accept: boolean) {
    const socket = getSocket();
    socket.emit("invite_response", { inviteId: invite!.inviteId, accept });
    clearInvite();
  }

  // Reset modal state whenever a new invite arrives
  useEffect(() => {
    if (!invite) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTimer(30);

    setFromName(invite.fromName);
  }, [invite]);

  // Countdown + auto decline
  useEffect(() => {
    if (!invite) return;
    if (timer <= 0) {
      respond(false);
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [invite, timer]);

  if (!invite) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-200 w-72 border border-[#1a1a1a] bg-[#0a0a0a] p-5"
      style={{
        backdropFilter: "blur(12px)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      }}
    >
      <style>{`@keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }`}</style>

      <div
        className="flex items-center gap-3 mb-4"
        style={{ animation: "slideIn 0.3s ease both" }}
      >
        <div className="w-8 h-8 border border-[#1e1e1e] bg-[#0e0e0e] flex items-center justify-center shrink-0">
          <span className="text-sm text-[#c8a96e] select-none">♟</span>
        </div>
        <div>
          <p
            className="text-[#d0c8b8] text-xs font-light"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {fromName ?? "Someone"} challenged you
          </p>
          <p className="text-[#555] text-[10px] font-light">to a chess match</p>
        </div>
      </div>

      {/* Timer bar */}
      <div className="h-px bg-[#1a1a1a] relative overflow-hidden mb-4">
        <div
          className="absolute left-0 top-0 h-full bg-[#c8a96e] transition-all duration-1000"
          style={{ width: `${(timer / 30) * 100}%`, opacity: 0.5 }}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => respond(true)}
          className="flex-1 py-2 text-xs font-light tracking-widest uppercase border border-[#2a4a2a] text-[#4a8a4a] hover:bg-[#4a8a4a] hover:text-[#0a0a0a] transition-all duration-150"
        >
          Accept
        </button>
        <button
          onClick={() => respond(false)}
          className="flex-1 py-2 text-xs font-light tracking-widest uppercase border border-[#3a1a1a] text-[#6a3030] hover:bg-[#8a3030] hover:text-[#f0ebe0] transition-all duration-150"
        >
          Decline
        </button>
      </div>

      <p className="text-[#555] text-[10px] text-right mt-2 tabular-nums">
        Auto-declines in {timer}s
      </p>
    </div>
  );
}
