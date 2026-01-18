import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io("http://localhost:3001", {
      transports: ["websocket"],
      autoConnect: false,
      auth: { wsToken: localStorage.getItem("wsToken") },
    });
  }
  return socket;
}
