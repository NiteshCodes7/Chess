/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";

const keyframes = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes piecePulse {
    0%, 100% { opacity: 0.08; }
    50%       { opacity: 0.14; }
  }
  .chess-fade-up  { animation: fadeUp 0.7s ease both; }
  .chess-piece    { animation: piecePulse 4s ease-in-out infinite; }
  .chess-input {
    width: 100%; background: #0a0a0a; border: 1px solid #1e1e1e;
    color: #e8e0d0; font-size: 0.85rem; padding: 0.75rem 0.9rem;
    outline: none; font-family: inherit; font-weight: 300;
    transition: border-color 0.2s; -webkit-appearance: none; border-radius: 0;
  }
  .chess-input::placeholder { color: #2e2e2e; }
  .chess-input:focus        { border-color: #c8a96e; }
  .chess-btn {
    clip-path: polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px));
    transition: background 0.2s, transform 0.15s;
  }
  .chess-btn:hover:not(:disabled)  { background: #d4ba80 !important; transform: translateY(-1px); }
  .chess-btn:active:not(:disabled) { transform: translateY(0); }
  .chess-btn:disabled { opacity: 0.6; cursor: not-allowed; }
`;

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function hasSpecialCharacter(str: string): boolean {
    const specialChars = "!@#$%^&*()_+-=[]{}|;:'\",.<>?/`~";

    for (const char of str) {
      if (specialChars.includes(char)) {
        return true;
      }
    }
    return false;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !name || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (name.length < 2) {
      setError("Username must be at least 2 characters.");
      return;
    }
    if (!/^[a-zA-Z ]+$/.test(name)) {
      setError("Username can only contain letters.");
      return;
    }
    const hasUppercase = [...password].some((c) => c >= "A" && c <= "Z");
    const hasNumber = [...password].some((c) => c >= "0" && c <= "9");
    const hasSpecialChar = hasSpecialCharacter(password);

    if (password.length < 8 || !hasUppercase || !hasNumber || !hasSpecialChar) {
      setError(
        "Password must include:\n• At least 8 characters\n• 1 uppercase letter\n• 1 number\n• 1 special character",
      );
      return;
    }

    try {
      setLoading(true);
      await api.post("/auth/register", { email, name, password });
      router.push("/auth/set-username");
    } catch (err: any) {
      setError(
        err.response?.data?.message ?? "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#0a0a0a] px-4 py-8">
      <style>{keyframes}</style>

      {/* Background grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 grid opacity-[0.025]"
        style={{
          gridTemplateColumns: "repeat(8,1fr)",
          gridTemplateRows: "repeat(8,1fr)",
        }}
      >
        {Array.from({ length: 64 }).map((_, i) => (
          <div key={i} style={{ border: "0.5px solid #c8a96e" }} />
        ))}
      </div>

      {/* Logo */}
      <div
        className="chess-fade-up relative z-10 mb-10 flex items-center gap-3"
        style={{ animationDelay: "0s" }}
      >
        <span className="block h-px w-7 bg-[#c8a96e]" />
        <span
          className="text-[#c8a96e] text-[1.05rem] tracking-[0.28em] uppercase font-light"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Chessify
        </span>
        <span className="block h-px w-7 bg-[#c8a96e]" />
      </div>

      {/* Card */}
      <div
        className="chess-fade-up relative z-10 w-full max-w-[380px] border border-[#1e1e1e] bg-[#0e0e0e] px-8 py-10"
        style={{ animationDelay: "0.1s" }}
      >
        {/* Corner brackets */}
        <span
          aria-hidden="true"
          className="absolute top-0 left-0 h-[18px] w-[18px]"
          style={{
            borderTop: "2px solid #c8a96e",
            borderLeft: "2px solid #c8a96e",
          }}
        />
        <span
          aria-hidden="true"
          className="absolute bottom-0 right-0 h-[18px] w-[18px]"
          style={{
            borderBottom: "2px solid #c8a96e",
            borderRight: "2px solid #c8a96e",
          }}
        />

        {/* Decorative piece */}
        <span
          aria-hidden="true"
          className="chess-piece absolute top-4 right-5 select-none text-[1.5rem] leading-none text-[#c8a96e]"
        >
          ♛
        </span>

        {/* Eyebrow */}
        <div className="mb-[1.1rem] flex items-center gap-[0.6rem]">
          <span className="block h-px w-5 bg-[#c8a96e]" />
          <span className="text-[0.63rem] tracking-[0.22em] uppercase text-[#c8a96e]">
            New account
          </span>
        </div>

        {/* Heading */}
        <h1
          className="mb-2 text-[1.9rem] font-light leading-[1.15] text-[#f0ebe0]"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Join the
          <br />
          <em className="italic text-[#c8a96e]">board.</em>
        </h1>

        <p className="mb-8 text-[0.8rem] font-light leading-relaxed text-[#555]">
          Create your free account and start playing.
        </p>

        <form onSubmit={onSubmit} noValidate>
          {/* Name */}
          <div className="mb-4">
            <label
              htmlFor="username"
              className="mb-[0.45rem] block text-[0.63rem] tracking-[0.18em] uppercase text-[#555]"
            >
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Your Name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="chess-input"
              style={{ paddingLeft: "0.9rem" }}
            />
          </div>

          {/* Email */}
          <div className="mb-4">
            <label
              htmlFor="email"
              className="mb-[0.45rem] block text-[0.63rem] tracking-[0.18em] uppercase text-[#555]"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="chess-input"
            />
          </div>

          {/* Password */}
          <div className="mb-1">
            <label
              htmlFor="password"
              className="mb-[0.45rem] block text-[0.63rem] tracking-[0.18em] uppercase text-[#555]"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="chess-input"
            />
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="mt-3 border px-3 py-[0.6rem] text-[0.75rem] font-light tracking-[0.02em]"
              style={{
                background: "rgba(200,60,60,0.08)",
                borderColor: "rgba(200,60,60,0.25)",
                color: "#e08080",
              }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="chess-btn mt-5 w-full bg-[#c8a96e] py-[0.85rem] text-[0.7rem] font-medium tracking-[0.18em] uppercase text-[#0a0a0a]"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-[#1a1a1a]" />
          <span className="text-[0.63rem] tracking-[0.12em] uppercase text-[#2e2e2e]">
            or
          </span>
          <span className="h-px flex-1 bg-[#1a1a1a]" />
        </div>

        {/* Login link */}
        <div className="text-center">
          <span className="text-[0.75rem] font-light text-[#444]">
            Already have an account?
          </span>
          <button
            onClick={() => router.push("/auth/login")}
            className="ml-1 cursor-pointer bg-transparent border-none text-[0.75rem] text-[#c8a96e] underline underline-offset-[3px] transition-colors duration-200 hover:text-[#d4ba80]"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
