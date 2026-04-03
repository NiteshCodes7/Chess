import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getGameSocket(): Socket {
  if (!socket) {
    socket = io('http://localhost:3001/game', {
      transports: ['websocket'],
      autoConnect: false,
    });
  }
  return socket;
}