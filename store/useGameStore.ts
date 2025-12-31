import { create } from "zustand";
import { BoardState } from "@/types/chess";
import { initialBoard } from "@/lib/initialBoard";
import { getGameStatus, GameStatus } from "@/lib/getGameStatus";
import { isValidPawnMove } from "@/lib/validatePawnMove";
import { isValidRookMove } from "@/lib/validateRookMove";
import { isValidBishopMove } from "@/lib/validateBishopMove";
import { isValidKnightMove } from "@/lib/validateKnightMove";
import { isValidQueenMove } from "@/lib/validateQueenMove";
import { isValidKingMove } from "@/lib/validateKingMove";
import { isMoveLegal } from "@/lib/isMoveLegal";
import { getSocket } from "@/lib/socket";

type Position = { row: number; col: number };

type Move = {
  from: Position;
  to: Position;
};

type GameStore = {
  board: BoardState;
  turn: "white" | "black";
  selected: Position | null;
  status: GameStatus;

  gameId: string | null;
  setGameId: (id: string) => void;

  handleSquareClick: (row: number, col: number) => void;
  applyRemoteMove: (move: Move) => void;
  resetGame: () => void;
};

export const useGameStore = create<GameStore>((set, get) => ({
  board: initialBoard,
  turn: "white",
  selected: null,
  status: { state: "playing" },
  gameId: null,
  setGameId(gameId){
    set({ gameId })
  },
  

  handleSquareClick(row, col) {
    const { board, selected, turn } = get();
    const clickedSquare = board[row][col];

    // 1️⃣ No piece selected
    if (!selected) {
      if (clickedSquare && clickedSquare.color === turn) {
        set({ selected: { row, col } });
      }
      return;
    }

    const selectedPiece = board[selected.row][selected.col];

    // 2️⃣ Same square → deselect
    if (selected.row === row && selected.col === col) {
      set({ selected: null });
      return;
    }

    // 3️⃣ Click another own piece → reselect
    if (clickedSquare && clickedSquare.color === turn) {
      set({ selected: { row, col } });
      return;
    }

    // 4️⃣ Attempt move
    if (!selectedPiece) return;

    let valid = false;

    switch (selectedPiece.type) {
      case "pawn":
        valid = isValidPawnMove(
          board,
          selected,
          { row, col },
          selectedPiece.color
        );
        break;
      case "rook":
        valid = isValidRookMove(
          board,
          selected.row,
          selected.col,
          row,
          col,
          selectedPiece.color
        );
        break;
      case "bishop":
        valid = isValidBishopMove(
          board,
          selected.row,
          selected.col,
          row,
          col,
          selectedPiece.color
        );
        break;
      case "knight":
        valid = isValidKnightMove(
          board,
          selected.row,
          selected.col,
          row,
          col,
          selectedPiece.color
        );
        break;
      case "queen":
        valid = isValidQueenMove(
          board,
          selected.row,
          selected.col,
          row,
          col,
          selectedPiece.color
        );
        break;
      case "king":
        valid = isValidKingMove(
          board,
          selected.row,
          selected.col,
          row,
          col,
          selectedPiece.color
        );
        break;
    }

    if (!valid) return;

    if (
      !isMoveLegal(
        board,
        selected.row,
        selected.col,
        row,
        col,
        selectedPiece.color
      )
    )
      return;

    const newBoard = board.map((r) => r.slice());

    // 🏰 Castling
    if (selectedPiece.type === "king" && Math.abs(selected.col - col) === 2) {
      const rookFromCol = col === 6 ? 7 : 0;
      const rookToCol = col === 6 ? 5 : 3;

      newBoard[row][rookToCol] = {
        ...newBoard[selected.row][rookFromCol]!,
        hasMoved: true,
      };
      newBoard[selected.row][rookFromCol] = null;
    }

    newBoard[row][col] = {
      ...selectedPiece,
      hasMoved: true,
    };
    newBoard[selected.row][selected.col] = null;

    const nextTurn = turn === "white" ? "black" : "white";
    const status = getGameStatus(newBoard, nextTurn);

    set({
      board: newBoard,
      turn: nextTurn,
      selected: null,
      status,
    });

    const { gameId } = get();

    // 🔜 socket.emit("move", ...)
    getSocket().emit("move", {
      gameId: gameId,
      from: selected,
      to: { row, col },
    });
  },

  // Remote move (NO validation, NO turn checks)
  applyRemoteMove({ from, to }) {
    const { board, turn } = get();
    const piece = board[from.row][from.col];
    if (!piece) return;

    const newBoard = board.map((r) => r.slice());

    // Castling
    if (piece.type === "king" && Math.abs(from.col - to.col) === 2) {
      const rookFromCol = to.col === 6 ? 7 : 0;
      const rookToCol = to.col === 6 ? 5 : 3;

      newBoard[from.row][rookToCol] = {
        ...newBoard[from.row][rookFromCol]!,
        hasMoved: true,
      };
      newBoard[from.row][rookFromCol] = null;
    }

    newBoard[to.row][to.col] = { ...piece, hasMoved: true };
    newBoard[from.row][from.col] = null;

    const nextTurn = turn === "white" ? "black" : "white";
    const status = getGameStatus(newBoard, nextTurn);

    set({
      board: newBoard,
      turn: nextTurn,
      selected: null,
      status,
    });
  },

  resetGame() {
    set({
      board: initialBoard,
      turn: "white",
      selected: null,
      status: { state: "playing" },
    });
  },
}));
