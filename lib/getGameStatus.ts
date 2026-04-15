import { BoardState } from "@/types/chess";
import { isKingInCheck } from "./isKingInCheck";
import { hasAnyLegalMove } from "./hasAnyLegalMove";

export type GameStatus =
  | { state: "playing"; winner: null }
  | { state: "check"; color: "white" | "black"; winner: null }
  | { state: "checkmate"; winner: "white" | "black" }
  | { state: "stalemate"; winner: null }
  | { state: "promotion"; winner: null }
  | { state: "timeout"; winner: "white" | "black" }
  | { state: "abandoned"; winner: "white" | "black" }
  | { state: "resignation"; winner: "white" | "black" };

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
    return { state: "stalemate", winner: null};
  }

  if (inCheck) {
    return { state: "check", color: turn, winner: null };
  }

  return { state: "playing", winner: null };
}
