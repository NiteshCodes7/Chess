"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { api, setAccessToken } from "@/lib/api";
import { Loader } from "lucide-react";

type AuthContextType = {
  loading: boolean;
  authed: boolean;
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
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-screen w-full"><Loader className="animate-spin infinite"/></div>;
  }

  return (
    <AuthContext.Provider value={{ loading, authed }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
