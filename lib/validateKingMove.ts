import { BoardState } from "@/types/chess";
import { isValidCastling } from "./validateCastling";

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

  // Normal king move
  if (rowDiff <= 1 && colDiff <= 1) {
    const target = board[toRow][toCol];
    return !target || target.color !== color;
  }

  // Castling
  if (fromRow === toRow && colDiff === 2) {
    return isValidCastling(
      board,
      fromRow,
      fromCol,
      toCol,
      color
    );
  }

  return false;
}
