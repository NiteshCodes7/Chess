import { BoardState } from "@/types/chess";
import { isPathClear } from "./isPathClear";

export function isValidQueenMove(
  board: BoardState,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
  color: "white" | "black"
): boolean {
  const rowDiff = Math.abs(fromRow - toRow);
  const colDiff = Math.abs(fromCol - toCol);

  const isStraight =
    fromRow === toRow || fromCol === toCol;
  const isDiagonal = rowDiff === colDiff;

  if (!isStraight && !isDiagonal) return false;

  if (!isPathClear(board, fromRow, fromCol, toRow, toCol))
    return false;

  const target = board[toRow][toCol];
  return !target || target.color !== color;
}
