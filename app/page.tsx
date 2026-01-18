"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, setAccessToken } from "@/lib/api";

export default function LandingPage() {
  const router = useRouter();
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Checking session...
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white px-4">
      <div className="max-w-2xl text-center space-y-6">
        
        <h1 className="text-4xl md:text-6xl font-bold">
          Play Chess Online
        </h1>

        <p className="text-lg md:text-xl text-gray-300">
          Challenge other players and enjoy a smooth chess experience.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">

          {authed && (
            <button
              onClick={() => router.push("/play")}
              className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded text-lg font-medium"
            >
              Play Now
            </button>
          )}

          {!authed && (
            <>
              <button
                onClick={() => router.push("/auth/login")}
                className="border border-gray-600 hover:border-gray-400 px-6 py-3 rounded text-lg font-medium"
              >
                Login
              </button>

              <button
                onClick={() => router.push("/auth/register")}
                className="border border-gray-600 hover:border-gray-400 px-6 py-3 rounded text-lg font-medium"
              >
                Register
              </button>
            </>
          )}

        </div>
      </div>

      <footer className="absolute bottom-4 text-gray-500 text-sm">
        © {new Date().getFullYear()} Chess Platform. All rights reserved.
      </footer>
    </main>
  );
}
