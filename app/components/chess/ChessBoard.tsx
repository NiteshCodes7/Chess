"use client";

import { useGameStore } from "@/store/useGameStore";
import { PIECE_SYMBOLS } from "@/lib/pieceSymbols";
import Image from "next/image";
import ChessClock from "./ChessClock";

export default function ChessBoard() {
  const { 
    board, 
    selected, 
    turn, 
    status, 
    handleSquareClick 
    } = useGameStore();

  const playerColor = useGameStore((s) => s.playerColor);

  function getDisplayRow(row: number) {
    return playerColor === "black" ? 7 - row : row;
  }

  function getDisplayCol(col: number) {
    return playerColor === "black" ? 7 - col : col;
  }

  return (
    <div>
      <p className="text-white mb-2 text-center">
        Turn: <strong>{turn.toUpperCase()}</strong> | Status:{" "}
        <strong>{status.state}</strong>
      </p>

      <ChessClock />

      <div className="grid grid-cols-8 w-126 h-126 border-4 border-black">
        {board.map((_, r) =>
          board[r].map((_, c) => {
            const realRow = getDisplayRow(r);
            const realCol = getDisplayCol(c);
            const square = board[realRow][realCol];

            const isDark = (r + c) % 2 === 1;
            const isSelected =
              selected?.row === realRow && selected?.col === realCol;

            return (
              <div
                key={`${r}-${c}`}
                onClick={() =>
                  handleSquareClick(getDisplayRow(r), getDisplayCol(c))
                }
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
