import { BoardState } from "@/types/chess";
import { isSquareAttacked } from "./isSquareAttacked";

export function isValidCastling(
  board: BoardState,
  row: number,
  fromCol: number,
  toCol: number,
  color: "white" | "black"
): boolean {
  const king = board[row][fromCol];
  if (!king || king.hasMoved) return false;

  const rookCol = toCol === 6 ? 7 : 0;
  const rook = board[row][rookCol];

  if (!rook || rook.type !== "rook" || rook.hasMoved)
    return false;

  const step = toCol > fromCol ? 1 : -1;

  // 1️⃣ Path must be empty
  for (
    let col = fromCol + step;
    col !== rookCol;
    col += step
  ) {
    if (board[row][col] !== null) return false;
  }

  // 2️⃣ King must not pass through check
  for (
    let col = fromCol;
    col !== toCol + step;
    col += step
  ) {
    if (
      isSquareAttacked(
        board,
        row,
        col,
        color === "white" ? "black" : "white"
      )
    ) {
      return false;
    }
  }

  return true;
}
