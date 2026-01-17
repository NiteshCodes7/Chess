import { io, Socket } from "socket.io-client";
import { getAccessToken } from "./api";

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io("http://localhost:3001", {
      transports: ["websocket"],
      autoConnect: false,
      auth: { token : getAccessToken()},
    });
  }
  return socket;
}
