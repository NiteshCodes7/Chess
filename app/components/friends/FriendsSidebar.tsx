'use client';

import { useEffect, useRef, useState } from 'react';
import { getSocket } from '@/lib/socket';
import FriendItem from './FriendItem';
import { api } from '@/lib/api';

type Friend = {
  id: string;
  name: string;
  avatar?: string;
  rating?: number;
  status?: 'online' | 'playing' | 'offline';
};

type FriendsSidebarProps = {
  onSelect: (friend: Friend) => void;
};

type PresenceUpdate = {
  userId: string;
  status: 'online' | 'playing' | 'offline';
};

type GroupedFriends = {
  online: Friend[];
  playing: Friend[];
  offline: Friend[];
};

export default function FriendsSidebar({ onSelect }: FriendsSidebarProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const livePresence = useRef<Map<string, 'online' | 'playing' | 'offline'>>(
    new Map(),
  );

  const socket = getSocket();

  function groupFriends(list: Friend[]): GroupedFriends {
    return {
      online: list.filter((f) => f.status === 'online'),
      playing: list.filter((f) => f.status === 'playing'),
      offline: list.filter((f) => f.status === 'offline' || !f.status),
    };
  }

  const groups = ['online', 'playing', 'offline'] as const;
  const grouped = groupFriends(friends);

  useEffect(() => {
    const handlePresence = ({ userId, status }: PresenceUpdate) => {
      livePresence.current.set(userId, status);
      setFriends((prev) =>
        prev.map((f) => (f.id === userId ? { ...f, status } : f)),
      );
    };

    const handleSnapshot = (data: PresenceUpdate[]) => {
      data.forEach(({ userId, status }) =>
        livePresence.current.set(userId, status),
      );
      setFriends((prev) =>
        prev.map((f) => {
          const found = data.find((d) => d.userId === f.id);
          return found ? { ...f, status: found.status } : f;
        }),
      );
    };

    socket.on('presence_update', handlePresence);
    socket.on('presence_snapshot', handleSnapshot);

    async function loadFriends() {
      try {
        const res = await api.get('/friends');
        setFriends(
          res.data.map((f: Friend) => ({
            ...f,
            status: livePresence.current.get(f.id) ?? f.status,
          })),
        );
        // Request fresh snapshot after list is loaded
        setTimeout(() => socket.emit('request_presence_snapshot'), 100);
      } catch (err) {
        console.error('Failed to load friends:', err);
      }
    }

    loadFriends();

    return () => {
      socket.off('presence_update', handlePresence);
      socket.off('presence_snapshot', handleSnapshot);
    };
  }, [socket]);

  return (
    <div className="w-64 bg-gray-900 text-white h-full p-3">
      <h2 className="text-lg font-bold mb-3">Friends</h2>

      {groups.map((group) => {
        const list = grouped[group];
        return (
          <div key={group}>
            <h3 className="text-xs text-gray-400 mt-3 uppercase">{group}</h3>
            {list.length === 0 ? (
              <p className="text-xs text-gray-500 px-2">No users</p>
            ) : (
              list.map((friend) => (
                <FriendItem
                  key={friend.id}
                  friend={friend}
                  onClick={() => onSelect(friend)}
                />
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}