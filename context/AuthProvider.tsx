"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { api, setAccessToken } from "@/lib/api";
import { connectAllSockets, disconnectAllSockets } from "@/lib/socketManager";
import ChessLoader from "@/components/loader";
import { getSocket } from "@/lib/socket";
import { useToast } from "@/store/useToast";
import { useInviteStore } from "@/store/useInviteStore";
import { useGameStore } from "@/store/useGameStore";
import axios from "axios";

type AuthContextType = {
  loading: boolean;
  authed: boolean;
  setAuthed: (v: boolean) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  // pIng to backend
  useEffect(() => {
    const interval = setInterval(
      async () => {
        try {
          await api.get("/health");
        } catch {}
      },
      10 * 60 * 1000,
    ); // 10 minutes

    return () => clearInterval(interval);
  }, [authed]);

  useEffect(() => {
    async function init() {
      try {
        const { data } = await axios.post("/api/auth/refresh");
        setAccessToken(data.accessToken);
        localStorage.setItem("wsToken", data.wsToken);
        setAuthed(true);
      } catch {
        setAuthed(false);
        if (typeof window !== "undefined") {
          const isPublic = [
            "/",
            "/auth/login",
            "/auth/register",
            "/auth/verify-otp",
            "/auth/forgot-password",
          ].some((r) => window.location.pathname.startsWith(r));
          if (!isPublic) {
            window.location.href = "/auth/login";
          }
        }
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!authed) {
      disconnectAllSockets();
      return;
    }

    connectAllSockets();

    const socket = getSocket();

    const onBanned = ({
      reason,
      remainingMs,
    }: {
      reason: string;
      remainingMs: number;
    }) => {
      const minutes = Math.ceil(remainingMs / 60000);
      const seconds = Math.ceil((remainingMs % 60000) / 1000);
      const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
      useToast
        .getState()
        .addToast(
          `⛔ ${reason}. You are banned from matchmaking for ${timeStr}.`,
          "error",
          50,
          50,
        );
    };

    socket.on("banned", onBanned);

    return () => {
      socket.off("banned", onBanned);
    };
  }, [authed]);

  useEffect(() => {
    const socket = getSocket();

    const onGameInvite = ({
      inviteId,
      from,
      fromName
    }: {
      inviteId: string;
      from: string;
      fromName: string;
    }) => {
      useInviteStore.getState().setInvite({ inviteId, from, fromName });
    };

    const onMatchFound = ({
      gameId,
      color,
      timeMs,
      incrementMs,
      lastTimestamp,
    }: {
      gameId: string;
      color: "white" | "black";
      timeMs: number;
      incrementMs: number;
      lastTimestamp: number;
    }) => {
      useGameStore.setState({
        playerColor: color,
        serverTime: { white: timeMs, black: timeMs },
        lastTimestamp,
        incrementMs,
      });
      window.location.href = `/game/${gameId}`;
    };

    socket.on("game_invite", onGameInvite);
    socket.on("match_found", onMatchFound);

    return () => {
      socket.off("game_invite", onGameInvite);
      socket.off("match_found", onMatchFound);
    };
  });

  if (loading) {
    return <ChessLoader />;
  }

  return (
    <AuthContext.Provider value={{ loading, authed, setAuthed }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
