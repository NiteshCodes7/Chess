import { BoardState } from "@/types/chess";

export function isValidKingMove(
  board: BoardState,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
  color: "white" | "black"
): boolean {
  const rowDiff = Math.abs(fromRow - toRow);
  const colDiff = Math.abs(fromCol - toCol);

  // King moves only 1 square
  if (rowDiff > 1 || colDiff > 1) return false;

  const target = board[toRow][toCol];
  return !target || target.color !== color;
}
