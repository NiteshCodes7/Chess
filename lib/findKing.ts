import { BoardState } from "@/types/chess";

export function findKing(
  board: BoardState,
  color: "white" | "black"
) {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (
        piece &&
        piece.type === "king" &&
        piece.color === color
      ) {
        return { row, col };
      }
    }
  }
  return null;
}
