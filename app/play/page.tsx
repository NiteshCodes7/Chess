"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";
import { useGameStore } from "@/store/useGameStore";

export default function PlayPage() {
  const router = useRouter();

  useEffect(() => {
        const socket = getSocket();
        socket.connect();

        socket.emit("find_match");

        socket.on("match_found", ({ gameId, color, timeMs, incrementMs, lastTimestamp }) => {
          useGameStore.setState(() => ({
            playerColor: color,
            serverTime: {
              white: timeMs,
              black: timeMs,
            },
            lastTimestamp,
            incrementMs,
          }));

          router.push(`/game/${gameId}`);
        });

    return () => {
      const socket = getSocket();
      socket.off("match_found");
      socket.disconnect();
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <p className="text-white text-xl">Finding an opponent...</p>
    </div>
  );
}
