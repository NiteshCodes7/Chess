"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";
import { useGameStore } from "@/store/useGameStore";

export default function PlayPage() {
  const router = useRouter();
  const socket = getSocket();

  useEffect(() => {
    socket.connect();

    socket.emit("find_match");

    socket.on(
      "match_found",
      ({ gameId, color, timeMs, incrementMs, lastTimestamp }) => {
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
      },
    );

    socket.on("match_timeout", () => {
      alert("No opponent found. Try again later.");
    });

    return () => {
      const socket = getSocket();
      socket.off("match_found");
      socket.disconnect();
    };
  }, [router]);

  const onCancel = () => {
    socket.emit("cancel_match");
    socket.on("match_canceled", () => {
      router.push("/");
    });
  };

  return (
    <div className="min-h-screen flex flex-col gap-2 items-center justify-center bg-gray-900">
      <p className="text-white text-xl">Finding an opponent...</p>
      <button
        onClick={onCancel}
        className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors duration-200 shadow-md"
      >
        Cancel
      </button>
    </div>
  );
}
