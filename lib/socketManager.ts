import { getSocket } from './socket';
import { getPresenceSocket } from './presenceSocket';

export function connectAllSockets() {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('wsToken') : null;

  [getSocket(), getPresenceSocket()].forEach((s) => {
    s.auth = { wsToken: token };
    if (!s.connected) s.connect();
  });
}

export function disconnectAllSockets() {
  [getSocket(), getPresenceSocket()].forEach((s) =>
    s.disconnect(),
  );
}

export function updateAllSocketAuth(wsToken: string) {
  [getSocket(), getPresenceSocket()].forEach((s) => {
    s.auth = { wsToken };
    if (!s.connected) s.connect();
  });
}