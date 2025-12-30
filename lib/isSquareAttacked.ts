import { BoardState } from "@/types/chess";
import { isValidPawnMove } from "./validatePawnMove";
import { isValidRookMove } from "./validateRookMove";
import { isValidBishopMove } from "./validateBishopMove";
import { isValidKnightMove } from "./validateKnightMove";
import { isValidQueenMove } from "./validateQueenMove";
import { isValidKingMove } from "./validateKingMove";

export function isSquareAttacked(
  board: BoardState,
  targetRow: number,
  targetCol: number,
  byColor: "white" | "black"
): boolean {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece || piece.color !== byColor) continue;

      const from = { row, col };
      const to = { row: targetRow, col: targetCol };

      let valid = false;

      switch (piece.type) {
        case "pawn":
          valid = isValidPawnMove(board, from, to, byColor);
          break;
        case "rook":
          valid = isValidRookMove(
            board,
            row,
            col,
            targetRow,
            targetCol,
            byColor
          );
          break;
        case "bishop":
          valid = isValidBishopMove(
            board,
            row,
            col,
            targetRow,
            targetCol,
            byColor
          );
          break;
        case "knight":
          valid = isValidKnightMove(
            board,
            row,
            col,
            targetRow,
            targetCol,
            byColor
          );
          break;
        case "queen":
          valid = isValidQueenMove(
            board,
            row,
            col,
            targetRow,
            targetCol,
            byColor
          );
          break;
        case "king":
          valid = isValidKingMove(
            board,
            row,
            col,
            targetRow,
            targetCol,
            byColor
          );
          break;
      }

      if (valid) return true;
    }
  }

  return false;
}
