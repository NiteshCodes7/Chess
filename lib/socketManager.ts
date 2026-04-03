import { getSocket } from './socket';
import { getChatSocket } from './chatSocket';
import { getGameSocket } from './gameSocket';

export function connectAllSockets() {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('wsToken') : null;

  [getSocket(), getChatSocket(), getGameSocket()].forEach((s) => {
    s.auth = { wsToken: token };
    if (!s.connected) s.connect();
  });
}

export function disconnectAllSockets() {
  [getSocket(), getChatSocket(), getGameSocket()].forEach((s) =>
    s.disconnect(),
  );
}

export function updateAllSocketAuth(wsToken: string) {
  [getSocket(), getChatSocket(), getGameSocket()].forEach((s) => {
    s.auth = { wsToken };
    if (!s.connected) s.connect();
  });
}