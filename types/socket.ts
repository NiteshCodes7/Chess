import { BoardState } from "./chess";

export type SocketMove = {
  gameId: string;
  from: { row: number; col: number };
  to: { row: number; col: number };
};

export type MatchFoundPayload = {
  gameId: string;
  color: "white" | "black";
};

export type AuthoritativeMovePayload = {
  board: BoardState;
  turn: "white" | "black";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  status: any;
};

export type StateUpdatePayload = {
  board: BoardState;
  turn: "white" | "black";
  time: { white: number; black: number };
  lastTimestamp: number;
  color?: "white" | "black";
};

export type ReconnectionState = {
  board: BoardState;
  turn: "white" | "black";
  color: "white" | "black";
  time: { white: number; black: number };
  lastTimestamp: number;
};

export type TimeoutPayload = {
  winner: "white" | "black";
};
