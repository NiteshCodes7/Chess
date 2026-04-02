import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("wsToken")
        : null;

    socket = io("http://localhost:3001", {
      transports: ["websocket"],
      autoConnect: false,
      auth: { wsToken: token },
    });
  }
  return socket;
}
