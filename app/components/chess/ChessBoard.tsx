"use client";

import { useGameStore } from "@/store/useGameStore";
import { PIECE_SYMBOLS } from "@/lib/pieceSymbols";

export default function ChessBoard() {
  const {
    board,
    selected,
    turn,
    status,
    handleSquareClick,
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
            const isSelected =
              selected?.row === r && selected?.col === c;

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => handleSquareClick(r, c)}
                className={`
                  flex items-center justify-center
                  cursor-pointer w-15.75 h-15.75
                  ${isDark ? "bg-[#759555]" : "bg-[#000000]"}
                  ${isSelected ? "ring-4 ring-yellow-400" : ""}
                  text-4xl select-none
                `}
              >
                {square &&
                  PIECE_SYMBOLS[square.color][square.type]}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
