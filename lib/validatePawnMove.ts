import { BoardState } from "@/types/chess";

type Position = {
  row: number;
  col: number;
};

export function isValidPawnMove(
  board: BoardState,
  from: Position,
  to: Position,
  color: "white" | "black"
): boolean {
  const direction = color === "white" ? -1 : 1;
  const startRow = color === "white" ? 6 : 1;

  const rowDiff = to.row - from.row;
  const colDiff = to.col - from.col;

  const targetSquare = board[to.row][to.col];

  // 1️⃣ Forward move (1 square)
  if (colDiff === 0 && rowDiff === direction) {
    return targetSquare === null;
  }

  // 2️⃣ First move (2 squares)
  if (
    colDiff === 0 &&
    rowDiff === 2 * direction &&
    from.row === startRow
  ) {
    const middleSquare =
      board[from.row + direction][from.col];
    return middleSquare === null && targetSquare === null;
  }

  // 3️⃣ Diagonal capture
  if (
    Math.abs(colDiff) === 1 &&
    rowDiff === direction &&
    targetSquare !== null &&
    targetSquare.color !== color
  ) {
    return true;
  }

  return false;
}
