import { BoardState } from "@/types/chess";

export function simulateMove(
  board: BoardState,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number
): BoardState {
  const newBoard = board.map((row) => row.slice());

  newBoard[toRow][toCol] = newBoard[fromRow][fromCol];
  newBoard[fromRow][fromCol] = null;

  return newBoard;
}
