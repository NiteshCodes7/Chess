"use client";

import { useGameStore } from "@/store/useGameStore";
import { PIECE_SYMBOLS } from "@/lib/pieceSymbols";
import Image from "next/image";

export default function ChessBoard() {
  const { 
    board, 
    selected, 
    turn, 
    status, 
    handleSquareClick 
  } = useGameStore();

  return (
    <div>
      <p className="text-white mb-2 text-center">
        Turn: <strong>{turn.toUpperCase()}</strong> | Status:{" "}
        <strong>{status.state}</strong>
      </p>

      <div className="grid grid-cols-8 w-126 h-126 border-4 border-black">
        {board.map((row, r) =>
          row.map((square, c) => {
            const isDark = (r + c) % 2 === 1;
            const isSelected = selected?.row === r && selected?.col === c;

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => handleSquareClick(r, c)}
                className={`
                  flex items-center justify-center
                  cursor-pointer w-15.75 h-15.75
                  ${isDark ? "bg-[rgb(105,146,62)]" : "bg-[#ffffff]"}
                  ${isSelected ? "ring-4 ring-yellow-400" : ""}
                  text-4xl select-none
                `}
              >
                {square
                  ? (() => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const pieceSrc = (PIECE_SYMBOLS as any)[square.color][square.type];

                      return (
                        <Image
                          src={pieceSrc}
                          alt={`${square.color} ${square.type}`}
                          className="w-10 h-10 pointer-events-none select-none"
                          draggable={false}
                        />
                      );
                    })()
                  : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
