import { io, Socket } from "socket.io-client";

let chatSocket: Socket | null = null;

export function getChatSocket() {
  if (!chatSocket) {
    chatSocket = io("http://localhost:3001", {
      transports: ["websocket"],
      autoConnect: false,
    });

    chatSocket.on("connect", () => {
      console.log("✅ CHAT SOCKET CONNECTED:", chatSocket?.id);
    });

    chatSocket.on("disconnect", () => {
      console.log("❌ CHAT SOCKET DISCONNECTED");
    });
  }

  return chatSocket;
}

export function connectChatSocket() {
  const socket = getChatSocket();

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("wsToken")
      : null;

  socket.auth = { wsToken: token };

  if (!socket.connected) {
    console.log("🔌 Connecting chat socket...");
    socket.connect();
  }
}