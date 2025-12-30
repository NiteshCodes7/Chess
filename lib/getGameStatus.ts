import { BoardState } from "@/types/chess";
import { isKingInCheck } from "./isKingInCheck";
import { hasAnyLegalMove } from "./hasAnyLegalMove";

export type GameStatus =
  | { state: "playing" }
  | { state: "check"; color: "white" | "black" }
  | { state: "checkmate"; winner: "white" | "black" }
  | { state: "stalemate" };

export function getGameStatus(
  board: BoardState,
  turn: "white" | "black"
): GameStatus {
  const inCheck = isKingInCheck(board, turn);
  const hasMove = hasAnyLegalMove(board, turn);

  if (inCheck && !hasMove) {
    return {
      state: "checkmate",
      winner: turn === "white" ? "black" : "white",
    };
  }

  if (!inCheck && !hasMove) {
    return { state: "stalemate" };
  }

  if (inCheck) {
    return { state: "check", color: turn };
  }

  return { state: "playing" };
}
