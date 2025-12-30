import { BoardState } from "@/types/chess";
import { isPathClear } from "./isPathClear";

export function isValidRookMove(
  board: BoardState,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
  color: "white" | "black"
): boolean {
  if (fromRow !== toRow && fromCol !== toCol) return false;

  if (!isPathClear(board, fromRow, fromCol, toRow, toCol))
    return false;

  const target = board[toRow][toCol];
  return !target || target.color !== color;
}
