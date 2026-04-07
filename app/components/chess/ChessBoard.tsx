"use client";

import { useGameStore } from "@/store/useGameStore";
import { PIECE_SYMBOLS } from "@/lib/pieceSymbols";
import Image from "next/image";
import ChessClock from "./ChessClock";

export default function ChessBoard({ spectator = false }) {
  const { board, selected, turn, status, handleSquareClick } = useGameStore();

  const playerColor = useGameStore((s) => s.playerColor);
  const legalMoves = useGameStore((s) => s.legalMoves);

  function getDisplayRow(row: number) {
    return playerColor === "black" ? 7 - row : row;
  }

  function getDisplayCol(col: number) {
    return playerColor === "black" ? 7 - col : col;
  }

  return (
    <div className="bg-[#080808]">
      <p className="text-white mb-2 text-center">
        Turn: <strong>{turn.toUpperCase()}</strong> | Status:{" "}
        <strong>{status.state}</strong>
      </p>

      <ChessClock />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(8, 1fr)",
          gridTemplateRows: "repeat(8, 1fr)",
          width: "min(90vw, 90vh, 504px)",
          height: "min(90vw, 90vh, 504px)",
        }}
        className="border-4 border-black"
      >
        {board.map((_, r) =>
          board[r].map((_, c) => {
            const realRow = getDisplayRow(r);
            const realCol = getDisplayCol(c);
            const square = board[realRow][realCol];

            const isDark = (r + c) % 2 === 1;
            const isSelected =
              selected?.row === realRow && selected?.col === realCol;
            const legalMove = legalMoves.some(
              (m) => m.row === realRow && m.col === realCol,
            );

            let castlingMove = false;
            if (
              selected !== null &&
              board[selected.row][selected.col]?.type === "king"
            ) {
              if (selected.row === 0 || selected.row === 7) {
                castlingMove = legalMoves.some(
                  (m) =>
                    m.row === realRow &&
                    m.col === realCol &&
                    (m.col === 6 || m.col === 2),
                );
              }
            }

            let pawnPromotion = false;
            if (
              selected &&
              board[selected.row][selected.col]?.type === "pawn"
            ) {
              const color = board[selected.row][selected.col]?.color;
              pawnPromotion = legalMoves.some(
                (m) =>
                  m.row === realRow &&
                  m.col === realCol &&
                  ((color === "white" && m.row === 0) ||
                    (color === "black" && m.row === 7)),
              );
            }

            const captured =
              legalMove &&
              square !== null &&
              selected !== null &&
              board[selected.row][selected.col]?.color !== square.color;

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => {
                  if (!spectator)
                    handleSquareClick(getDisplayRow(r), getDisplayCol(c));
                }}
                className={`
                  relative flex items-center justify-center select-none
                  ${spectator ? "cursor-default" : "cursor-pointer"}
                  ${isDark ? "bg-[rgb(105,146,62)]" : "bg-[#ffffff]"}
                  ${isSelected ? "ring-4 ring-yellow-400" : ""}
                  ${pawnPromotion ? "bg-amber-600 border-2 border-black" : ""}
                  ${castlingMove ? "bg-purple-400/50 border-2 border-black" : ""}
                  ${legalMove && !captured ? "bg-blue-400/50 border-2 border-black" : ""}
                  ${captured ? "bg-red-500 border-2 border-black" : ""}
                `}
              >
                {square &&
                  (() => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const pieceSrc = (PIECE_SYMBOLS as any)[square.color][
                      square.type
                    ];
                    return (
                      <div className="relative w-[82%] h-[82%]">
                        <Image
                          src={pieceSrc}
                          alt={`${square.color} ${square.type}`}
                          draggable={false}
                          fill
                          className="pointer-events-none select-none object-contain"
                        />
                      </div>
                    );
                  })()}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
