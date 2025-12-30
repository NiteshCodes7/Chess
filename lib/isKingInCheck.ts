import { BoardState } from "@/types/chess";
import { findKing } from "./findKing";
import { isSquareAttacked } from "./isSquareAttacked";

export function isKingInCheck(
  board: BoardState,
  color: "white" | "black"
): boolean {
  const king = findKing(board, color);
  if (!king) return false;

  const opponent = color === "white" ? "black" : "white";

  return isSquareAttacked(
    board,
    king.row,
    king.col,
    opponent
  );
}
