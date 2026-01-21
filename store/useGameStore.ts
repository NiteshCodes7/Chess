"use client";

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

type ReplayMove = Move & {
  turn: "white" | "black";
};

type Color = "white" | "black" | null;

type GameStore = {
  board: BoardState;
  setBoard: (board: BoardState) => void;

  turn: "white" | "black";
  selected: Position | null;
  status: GameStatus;
  setStatus: (status: GameStatus) => void;

  gameId: string | null;
  setGameId: (id: string) => void;

  playerColor: Color;
  setPlayerColor: (color: "white" | "black") => void;

  serverTime: { white: number; black: number };
  lastTimestamp: number;
  incrementMs: number;

  handleSquareClick: (row: number, col: number) => void;
  applyRemoteMove: (replayMove: ReplayMove) => void;
  resetGame: () => void;

  promotionPending: null | 
    {
    position: { row: number; col: number },
    color: "white" | "black"
    }

};

export const useGameStore = create<GameStore>((set, get) => ({
  board: initialBoard,
  setBoard(board) {
    set({ board })
  },
  turn: "white",
  selected: null,
  status: { state: "playing" },
  setStatus(status){
    set({ status })
  },
  gameId: null,
  setGameId(gameId){
    set({ gameId })
  },
  playerColor: null,
  setPlayerColor(color) {
    set({ playerColor: color })
  },
  serverTime: {
    white: 0,
    black: 0
  },
  incrementMs: 0,
  lastTimestamp: Date.now(),
  promotionPending: null,
  

  handleSquareClick(row, col) {
    const { board, selected, turn, playerColor } = get();
    if(playerColor !== turn) return;
    
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

    set({
      board: newBoard,
      turn: nextTurn,
      selected: null,
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
  applyRemoteMove({ from, to, turn }) {
    const { board } = get();
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
