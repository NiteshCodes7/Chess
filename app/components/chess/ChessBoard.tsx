"use client";

import { useState } from "react";
import { initialBoard } from "@/lib/initialBoard";
import { PIECE_SYMBOLS } from "@/lib/pieceSymbols";
import { BoardState, Square } from "@/types/chess";
import { isValidPawnMove } from "@/lib/validatePawnMove";
import { isValidRookMove } from "@/lib/validateRookMove";
import { isValidBishopMove } from "@/lib/validateBishopMove";
import { isValidKnightMove } from "@/lib/validateKnightMove";
import { isValidQueenMove } from "@/lib/validateQueenMove";
import { isValidKingMove } from "@/lib/validateKingMove";
import { isMoveLegal } from "@/lib/isMoveLegal";
import { getGameStatus } from "@/lib/getGameStatus";

export default function ChessBoard() {
  const [board, setBoard] = useState<BoardState>(initialBoard);
  const [selected, setSelected] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [turn, setTurn] = useState<"white" | "black">("white");
  const nextTurn = turn === "white" ? "black" : "white";

  function handleSquareClick(row: number, col: number) {
    const clickedSquare = board[row][col];

    // 1️⃣ No piece selected yet
    if (!selected) {
      if (clickedSquare && clickedSquare.color === turn) {
        setSelected({ row, col });
      }
      return;
    }

    const selectedPiece = board[selected.row][selected.col];

    // 2️⃣ Clicking same square → deselect
    if (selected.row === row && selected.col === col) {
      setSelected(null);
      return;
    }

    // 3️⃣ Clicking another piece and selcting it while another was already selected
    if (selected) {
      setSelected(null);
      if (clickedSquare?.type !== null && clickedSquare?.color === turn) {
        setSelected({ row, col });
      }
    }

    // 4️⃣ Capture or move
    if (selectedPiece) {
      let valid = false;

      switch (selectedPiece.type) {
        case "pawn":
          valid = isValidPawnMove(
            board,
            { row: selected.row, col: selected.col },
            { row, col },
            selectedPiece.color
          );
          break;

        case "rook":
          valid = isValidRookMove(
            board,
            selected.row,
            selected.col,
            row,
            col,
            selectedPiece.color
          );
          break;

        case "bishop":
          valid = isValidBishopMove(
            board,
            selected.row,
            selected.col,
            row,
            col,
            selectedPiece.color
          );
          break;

        case "knight":
          valid = isValidKnightMove(
            board,
            selected.row,
            selected.col,
            row,
            col,
            selectedPiece.color
          );
          break;

        case "queen":
          valid = isValidQueenMove(
            board,
            selected.row,
            selected.col,
            row,
            col,
            selectedPiece.color
          );
          break;

        case "king":
          valid = isValidKingMove(
            board,
            selected.row,
            selected.col,
            row,
            col,
            selectedPiece.color
          );
          break;
      }

      if (!valid) return;

      const legal = isMoveLegal(
        board,
        selected.row,
        selected.col,
        row,
        col,
        selectedPiece.color
      );

      if (!legal) return;

      movePiece(selected.row, selected.col, row, col);
    }
  }

  function movePiece(
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number
  ) {
    setBoard((prev) => {
      const newBoard = prev.map((row) => row.slice());

      newBoard[toRow][toCol] = prev[fromRow][fromCol];
      newBoard[fromRow][fromCol] = null;

      const status = getGameStatus(newBoard, nextTurn);

      if (status.state === "checkmate") {
        alert(`Checkmate! ${status.winner} wins`);
      }

      if (status.state === "stalemate") {
        alert("Stalemate! Draw");
      }

      if (status.state === "check") {
        console.log("Check!");
      }

      return newBoard;
    });

    setSelected(null);
    setTurn((t) => (t === "white" ? "black" : "white"));
  }

  return (
    <div>
      <p className="text-center mb-2 text-white">
        Turn: <strong>{turn.toUpperCase()}</strong>
      </p>

      <div className="grid grid-cols-8 w-126 h-126 border-4 border-black">
        {board.map((row, rowIndex) =>
          row.map((square, colIndex) => {
            const isDark = (rowIndex + colIndex) % 2 === 1;
            const isSelected =
              selected?.row === rowIndex && selected?.col === colIndex;

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                onClick={() => handleSquareClick(rowIndex, colIndex)}
                className={`
                  flex items-center justify-center
                  cursor-pointer w-15.75 h-15.75
                  ${isDark ? "bg-[#759555]" : "bg-[#000000]"}
                  ${isSelected ? "ring-4 ring-yellow-400" : ""}
                  text-4xl select-none
                `}
              >
                {square && PIECE_SYMBOLS[square.color][square.type]}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
