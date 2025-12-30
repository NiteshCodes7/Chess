import { BoardState } from "@/types/chess";

export function isValidKnightMove(
  board: BoardState,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
  color: "white" | "black"
): boolean {
  const rowDiff = Math.abs(fromRow - toRow);
  const colDiff = Math.abs(fromCol - toCol);

  if (
    !(
      (rowDiff === 2 && colDiff === 1) ||
      (rowDiff === 1 && colDiff === 2)
    )
  )
    return false;

  const target = board[toRow][toCol];
  return !target || target.color !== color;
}
