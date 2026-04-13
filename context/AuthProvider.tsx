"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { api, setAccessToken } from "@/lib/api";
import { connectAllSockets, disconnectAllSockets } from "@/lib/socketManager";
import ChessLoader from "@/components/loader";
import { getSocket } from "@/lib/socket";
import { useToast } from "@/store/useToast";

type AuthContextType = {
  loading: boolean;
  authed: boolean;
  setAuthed: (v: boolean) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const { data } = await api.post("/auth/refresh");
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
