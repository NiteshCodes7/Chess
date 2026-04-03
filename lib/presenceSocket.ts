import { io, Socket } from "socket.io-client";

let presenceSocket: Socket | null = null;

export function getPresenceSocket() {
  if (!presenceSocket) {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("wsToken")
        : null;

    presenceSocket = io("http://localhost:3001/presence", {
      transports: ["websocket"],
      autoConnect: false,
    });
  }
  return presenceSocket;
}
