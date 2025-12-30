import { BoardState } from "@/types/chess";

export const initialBoard: BoardState = [
  // Row 0 - Black major pieces
  [
    { type: "rook", color: "black" },
    { type: "knight", color: "black" },
    { type: "bishop", color: "black" },
    { type: "queen", color: "black" },
    { type: "king", color: "black" },
    { type: "bishop", color: "black" },
    { type: "knight", color: "black" },
    { type: "rook", color: "black" },
  ],

  // Row 1 - Black pawns
  Array(8).fill({ type: "pawn", color: "black" }),

  // Rows 2–5 - Empty
  ...Array(4).fill(Array(8).fill(null)),

  // Row 6 - White pawns
  Array(8).fill({ type: "pawn", color: "white" }),

  // Row 7 - White major pieces
  [
    { type: "rook", color: "white" },
    { type: "knight", color: "white" },
    { type: "bishop", color: "white" },
    { type: "queen", color: "white" },
    { type: "king", color: "white" },
    { type: "bishop", color: "white" },
    { type: "knight", color: "white" },
    { type: "rook", color: "white" },
  ],
];
