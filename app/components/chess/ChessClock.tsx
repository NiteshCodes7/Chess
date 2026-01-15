"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/store/useGameStore";

export default function ChessClock() {
  const { turn, serverTime, lastTimestamp } =
    useGameStore();

  const [localTime, setLocalTime] = useState({
    white: serverTime.white,
    black: serverTime.black,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastTimestamp;

      setLocalTime({
        white:
          turn === "white"
            ? serverTime.white - elapsed
            : serverTime.white,
        black:
          turn === "black"
            ? serverTime.black - elapsed
            : serverTime.black,
      });
    }, 100);

    return () => clearInterval(interval);
  }, [turn, serverTime, lastTimestamp]);

  return (
    <div className="flex flex-col items-center text-white">
      <p>
        White: {Math.max(0, localTime.white / 1000).toFixed(1)}s
      </p>
      <p>
        Black: {Math.max(0, localTime.black / 1000).toFixed(1)}s
      </p>
    </div>
  );
}
