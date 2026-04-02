"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthProvider";

export default function LandingPage() {
  const router = useRouter();
  const { loading, authed } = useAuth();

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

          {authed ? (
            <button
              onClick={() => router.push("/play")}
              className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded text-lg font-medium"
            >
              Play Now
            </button>
          ) : (
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