export type PieceType =
  | "pawn"
  | "rook"
  | "knight"
  | "bishop"
  | "queen"
  | "king";

export type Color = "white" | "black";

export type Piece = {
  type: PieceType;
  color: Color;
  hasMoved?: boolean;
};

export type Square = Piece | null;

export type BoardState = Square[][];
