import { BoardState } from "@/types/chess";

export function isPathClear(
  board: BoardState,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number
): boolean {
  const rowStep = Math.sign(toRow - fromRow);
  const colStep = Math.sign(toCol - fromCol);

  let r = fromRow + rowStep;
  let c = fromCol + colStep;

  while (r !== toRow || c !== toCol) {
    if (board[r][c] !== null) return false;
    r += rowStep;
    c += colStep;
  }

  return true;
}
