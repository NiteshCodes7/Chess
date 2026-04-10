"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const facts = [
  "The longest chess game ever played lasted 269 moves.",
  "'Checkmate' derives from the Persian phrase Shah Mat — the king is dead.",
  "There are more possible chess games than atoms in the observable universe.",
  "The first chess computer program was written by Alan Turing in 1951.",
  "The knight is the only piece on the board that can jump over others.",
];

const pieces = ["♔", "♕", "♖", "♗", "♘", "♙"];

export default function ChessLoader() {
  const [factIndex, setFactIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [pieceIndex, setPieceIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setFactIndex((prev) => (prev + 1) % facts.length);
        setPieceIndex((prev) => (prev + 1) % pieces.length);
        setVisible(true);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeDown {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-10px); }
        }
        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(36px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(36px) rotate(-360deg); }
        }
        .fact-enter { animation: fadeUp 0.4s ease both; }
        .fact-exit { animation: fadeDown 0.4s ease both; }
        .orbit-piece { animation: orbit 3s linear infinite; }
        .orbit-piece-2 { animation: orbit 3s linear 1s infinite; }
        .orbit-piece-3 { animation: orbit 3s linear 2s infinite; }
      `}</style>

      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(#c8a96e 1px, transparent 1px), linear-gradient(90deg, #c8a96e 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Top logo */}
      <Image
        src={"/assets/logo_chessify.png"}
        alt="Chessify logo"
        width={100}
        height={100}
        className="absolute top-8 left-1/2 -translate-x-1/2"
      />

      {/* Loader visual */}
      <div className="relative w-28 h-28 flex items-center justify-center mb-12">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border border-[#1e1e1e]" />

        {/* Spinning arc */}
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ animation: "rotate-slow 2s linear infinite" }}
          viewBox="0 0 112 112"
        >
          <circle
            cx="56" cy="56" r="54"
            fill="none"
            stroke="#c8a96e"
            strokeWidth="1"
            strokeDasharray="60 280"
            strokeLinecap="square"
            opacity="0.7"
          />
        </svg>

        {/* Second arc opposite */}
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ animation: "rotate-slow 2s linear infinite reverse" }}
          viewBox="0 0 112 112"
        >
          <circle
            cx="56" cy="56" r="46"
            fill="none"
            stroke="#c8a96e"
            strokeWidth="0.5"
            strokeDasharray="30 260"
            strokeLinecap="square"
            opacity="0.3"
          />
        </svg>

        {/* Center piece */}
        <div className="relative z-10 w-16 h-16 border border-[#2a2520] bg-[#0e0e0e] flex items-center justify-center">
          <span
            className="text-4xl select-none transition-all duration-300"
            style={{
              filter: "drop-shadow(0 0 12px rgba(200,169,110,0.5))",
              opacity: visible ? 1 : 0,
              transform: visible ? "scale(1)" : "scale(0.8)",
              transition: "opacity 0.3s, transform 0.3s",
            }}
          >
            {pieces[pieceIndex]}
          </span>
        </div>
      </div>

      {/* Loading label */}
      <div className="flex items-center gap-3 mb-5">
        <span className="block w-6 h-px bg-[#c8a96e] opacity-40" />
        <span className="text-[#c8a96e] text-xs tracking-[0.25em] uppercase opacity-60">
          Loading
        </span>
        <span className="block w-6 h-px bg-[#c8a96e] opacity-40" />
      </div>

      {/* Fact */}
      <div className="max-w-xs text-center min-h-15 flex items-center justify-center">
        <p
          key={factIndex}
          className={`text-[#7b7b7b] text-sm font-light leading-relaxed ${visible ? "fact-enter" : "fact-exit"}`}
          style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}
        >
          &quot;{facts[factIndex]}&quot;
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 mt-8">
        {facts.map((_, i) => (
          <div
            key={i}
            className="w-1 h-1 transition-all duration-300"
            style={{
              background: i === factIndex ? "#c8a96e" : "#2a2a2a",
              transform: i === factIndex ? "scale(1.4)" : "scale(1)",
            }}
          />
        ))}
      </div>
    </div>
  );
}