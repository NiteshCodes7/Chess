"use client";

import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

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

export default function SetUsernamePage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!username || username.length < 3) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAvailable(null);
      setSuggestions([]);
      return;
    }

    const delay = setTimeout(async () => {
      try {
        const res = await api.get(`/auth/check-username`, {
          params: { username },
        });

        const data = res.data;

        setIsAvailable(data.available);

        if (!data.available) {
          setSuggestions(data.suggestions ?? []);
        } else {
          setSuggestions([]);
        }
      } catch {
        setIsAvailable(null);
        setSuggestions([]);
      }
    }, 400);

    return () => clearTimeout(delay);
  }, [username]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!username) {
      setError("Please enter a username.");
      return;
    }

    if (username.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
      setError("Only lowercase letters, numbers, and underscores allowed.");
      return;
    }

    try {
      setLoading(true);

      await api.post("/auth/set-username", { username });

      router.push("/");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const data = err.response?.data;

      if (data?.suggestions) {
        setSuggestions(data.suggestions);
        setError("Username taken");
      } else {
        setError(data?.message ?? "Failed to set username");
      }
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
      <div className="chess-fade-up relative z-10 mb-10 flex items-center gap-3">
        <span className="block h-px w-7 bg-[#c8a96e]" />
        <Image
          src={"/assets/logo_chessify.png"}
          alt="Chessify logo"
          width={100}
          height={100}
        />
        <span className="block h-px w-7 bg-[#c8a96e]" />
      </div>

      {/* Card */}
      <div className="chess-fade-up relative z-10 w-full max-w-95 border border-[#1e1e1e] bg-[#0e0e0e] px-8 py-10">
        {/* Corners */}
        <span
          className="absolute top-0 left-0 h-4.5 w-4.5"
          style={{
            borderTop: "2px solid #c8a96e",
            borderLeft: "2px solid #c8a96e",
          }}
        />
        <span
          className="absolute bottom-0 right-0 h-4.5 w-4.5"
          style={{
            borderBottom: "2px solid #c8a96e",
            borderRight: "2px solid #c8a96e",
          }}
        />

        {/* Chess piece */}
        <span className="chess-piece absolute top-4 right-5 text-[1.5rem] text-[#c8a96e]">
          ♞
        </span>

        {/* Eyebrow */}
        <div className="mb-[1.1rem] flex items-center gap-[0.6rem]">
          <span className="block h-px w-5 bg-[#c8a96e]" />
          <span className="text-[0.63rem] tracking-[0.22em] uppercase text-[#c8a96e]">
            Choose username
          </span>
        </div>

        {/* Heading */}
        <h1
          className="mb-2 text-[1.9rem] font-light leading-[1.15] text-[#f0ebe0]"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Pick your
          <br />
          <em className="italic text-[#c8a96e]">identity.</em>
        </h1>

        <p className="mb-8 text-[0.8rem] font-light leading-relaxed text-[#555]">
          This is how other players will see you on the board.
        </p>

        <form onSubmit={onSubmit} noValidate>
          {/* Username */}
          <div className="mb-4">
            <label className="mb-[0.45rem] block text-[0.63rem] tracking-[0.18em] uppercase text-[#555]">
              Username
            </label>

            <div className="relative">
              <span className="absolute left-[0.9rem] top-1/2 -translate-y-1/2 text-[#333] text-[0.85rem]">
                @
              </span>

              <input
                type="text"
                placeholder="your_handle"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value.toLowerCase());
                  setSuggestions([]);
                  setError(null);
                }}
                className="chess-input"
                style={{ paddingLeft: "1.75rem" }}
              />
            </div>

            <p className="mt-1.5 text-[0.62rem] text-[#4e4d4d] font-light">
              Lowercase, no spaces. This cannot be changed easily later.
            </p>
          </div>
          {isAvailable === true && (
            <p className="mt-1 text-[0.65rem] text-green-500">
              ✓ Username available
            </p>
          )}

          {isAvailable === false && (
            <p className="mt-1 text-[0.65rem] text-[#e08080]">
              ✗ Username already taken
            </p>
          )}

          {/* Error */}
          {error && (
            <div
              className="mt-3 border px-3 py-[0.6rem] text-[0.75rem]"
              style={{
                background: "rgba(200,60,60,0.08)",
                borderColor: "rgba(200,60,60,0.25)",
                color: "#e08080",
              }}
            >
              {error}
            </div>
          )}

          {suggestions.length > 0 && (
            <div
              className="mt-3 border px-3 py-2"
              style={{
                background: "rgba(200,169,110,0.06)",
                borderColor: "rgba(200,169,110,0.25)",
              }}
            >
              <p className="text-[0.65rem] text-[#c8a96e] mb-1 uppercase tracking-[0.15em]">
                Suggestions
              </p>

              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setUsername(s);
                      setSuggestions([]);
                      setError(null);
                    }}
                    className="px-2 py-1 text-[0.7rem] border"
                    style={{
                      borderColor: "#2a2a2a",
                      color: "#c8a96e",
                    }}
                  >
                    @{s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="chess-btn mt-5 w-full bg-[#c8a96e] py-[0.85rem] text-[0.7rem] tracking-[0.18em] uppercase text-[#0a0a0a]"
          >
            {loading ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
