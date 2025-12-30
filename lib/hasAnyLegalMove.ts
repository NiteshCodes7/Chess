import { BoardState } from "@/types/chess";
import { isValidPawnMove } from "./validatePawnMove";
import { isValidRookMove } from "./validateRookMove";
import { isValidBishopMove } from "./validateBishopMove";
import { isValidKnightMove } from "./validateKnightMove";
import { isValidQueenMove } from "./validateQueenMove";
import { isValidKingMove } from "./validateKingMove";
import { isMoveLegal } from "./isMoveLegal";

export function hasAnyLegalMove(
  board: BoardState,
  color: "white" | "black"
): boolean {
  for (let fromRow = 0; fromRow < 8; fromRow++) {
    for (let fromCol = 0; fromCol < 8; fromCol++) {
      const piece = board[fromRow][fromCol];
      if (!piece || piece.color !== color) continue;

      for (let toRow = 0; toRow < 8; toRow++) {
        for (let toCol = 0; toCol < 8; toCol++) {
          let valid = false;

          switch (piece.type) {
            case "pawn":
              valid = isValidPawnMove(
                board,
                { row: fromRow, col: fromCol },
                { row: toRow, col: toCol },
                color
              );
              break;
            case "rook":
              valid = isValidRookMove(
                board,
                fromRow,
                fromCol,
                toRow,
                toCol,
                color
              );
              break;
            case "bishop":
              valid = isValidBishopMove(
                board,
                fromRow,
                fromCol,
                toRow,
                toCol,
                color
              );
              break;
            case "knight":
              valid = isValidKnightMove(
                board,
                fromRow,
                fromCol,
                toRow,
                toCol,
                color
              );
              break;
            case "queen":
              valid = isValidQueenMove(
                board,
                fromRow,
                fromCol,
                toRow,
                toCol,
                color
              );
              break;
            case "king":
              valid = isValidKingMove(
                board,
                fromRow,
                fromCol,
                toRow,
                toCol,
                color
              );
              break;
          }

          if (!valid) continue;

          const legal = isMoveLegal(
            board,
            fromRow,
            fromCol,
            toRow,
            toCol,
            color
          );

          if (legal) return true;
        }
      }
    }
  }

  return false;
}
