import { getSocket } from './socket';
import { getChatSocket } from './chatSocket';
import { getPresenceSocket } from './presenceSocket';

export function connectAllSockets() {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('wsToken') : null;

  [getSocket(), getChatSocket(), getPresenceSocket()].forEach((s) => {
    s.auth = { wsToken: token };
    if (!s.connected) s.connect();
  });
}

export function disconnectAllSockets() {
  [getSocket(), getChatSocket(), getPresenceSocket()].forEach((s) =>
    s.disconnect(),
  );
}

export function updateAllSocketAuth(wsToken: string) {
  [getSocket(), getChatSocket(), getPresenceSocket()].forEach((s) => {
    s.auth = { wsToken };
    if (!s.connected) s.connect();
  });
}