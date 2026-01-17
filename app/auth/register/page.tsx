/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form as any).email.value;
    const password = (form as any).password.value;

    try {
      await api.post("/auth/register", { email, password });
      router.push("/auth/login");
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Registration failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <form onSubmit={onSubmit} className="p-6 bg-gray-800 rounded text-white space-y-3 w-80">
        <h2 className="text-xl font-semibold">Register</h2>
        
        <input name="email" type="email" placeholder="Email" className="p-2 w-full bg-gray-700 rounded" />
        
        <input name="password" type="password" placeholder="Password" className="p-2 w-full bg-gray-700 rounded" />
        
        {error && <p className="text-red-400 text-sm">{error}</p>}
        
        <button type="submit" className="bg-blue-600 w-full py-2 rounded hover:bg-blue-500">
          Register
        </button>

        <p className="text-sm text-gray-300 cursor-pointer underline" onClick={() => router.push("/auth/login")}>
          Already have an account?
        </p>
      </form>
    </div>
  );
}
