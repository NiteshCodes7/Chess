import { BoardState } from "@/types/chess";
import { isPathClear } from "./isPathClear";

export function isValidBishopMove(
  board: BoardState,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
  color: "white" | "black"
): boolean {
  if (Math.abs(fromRow - toRow) !== Math.abs(fromCol - toCol))
    return false;

  if (!isPathClear(board, fromRow, fromCol, toRow, toCol))
    return false;

  const target = board[toRow][toCol];
  return !target || target.color !== color;
}
