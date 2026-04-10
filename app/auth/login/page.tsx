"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuth } from "@/context/AuthProvider";
import { api, setAccessToken } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

/* ─── Keyframes injected once ─── */
const styles = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes piecePulse {
    0%, 100% { opacity: 0.08; }
    50%       { opacity: 0.14; }
  }
  .chess-fade-up { animation: fadeUp 0.7s ease both; }
  .chess-piece-deco { animation: piecePulse 4s ease-in-out infinite; }
  .chess-input {
    width: 100%;
    background: #0a0a0a;
    border: 1px solid #1e1e1e;
    color: #e8e0d0;
    font-size: 0.85rem;
    padding: 0.75rem 0.9rem;
    outline: none;
    font-family: inherit;
    font-weight: 300;
    transition: border-color 0.2s;
    -webkit-appearance: none;
    border-radius: 0;
  }
  .chess-input::placeholder { color: #2e2e2e; }
  .chess-input:focus        { border-color: #c8a96e; }
  .chess-btn-primary {
    width: 100%;
    background: #c8a96e;
    color: #0a0a0a;
    border: none;
    padding: 0.85rem 1rem;
    font-size: 0.7rem;
    font-weight: 500;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    cursor: pointer;
    font-family: inherit;
    clip-path: polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px));
    transition: background 0.2s, transform 0.15s;
  }
  .chess-btn-primary:hover:not(:disabled)  { background: #d4ba80; transform: translateY(-1px); }
  .chess-btn-primary:active:not(:disabled) { transform: translateY(0); }
  .chess-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
  .chess-link-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    color: #c8a96e;
    font-size: 0.75rem;
    text-decoration: underline;
    text-underline-offset: 3px;
    padding: 0;
    transition: color 0.2s;
  }
  .chess-link-btn:hover { color: #d4ba80; }
`;

/* ─── Sub-components ─── */
function BgGrid() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        gridTemplateColumns: "repeat(8, 1fr)",
        gridTemplateRows: "repeat(8, 1fr)",
        opacity: 0.025,
        pointerEvents: "none",
      }}
    >
      {Array.from({ length: 64 }).map((_, i) => (
        <div key={i} style={{ border: "0.5px solid #c8a96e" }} />
      ))}
    </div>
  );
}

function Eyebrow({ text }: { text: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.6rem",
        marginBottom: "1.1rem",
      }}
    >
      <span
        style={{
          display: "block",
          width: 20,
          height: 1,
          background: "#c8a96e",
        }}
      />
      <span
        style={{
          color: "#c8a96e",
          fontSize: "0.63rem",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
        }}
      >
        {text}
      </span>
    </div>
  );
}

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      style={{
        display: "block",
        color: "#555",
        fontSize: "0.63rem",
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        marginBottom: "0.45rem",
      }}
    >
      {children}
    </label>
  );
}

/* ─── Main page ─── */
export default function LoginPage() {
  const router = useRouter();
  const { setAuthed } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.post("/auth/login", { email, password });
      setAccessToken(data.accessToken);
      if (data.wsToken) localStorage.setItem("wsToken", data.wsToken);
      setAuthed(true);
      router.push("/");
    } catch (err: any) {
      setError(
        err.response?.data?.message ?? "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: "2rem 1rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{styles}</style>

      <BgGrid />

      {/* Logo */}
      <div
        className="chess-fade-up"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "2.5rem",
          animationDelay: "0s",
        }}
      >
        <span
          style={{
            display: "block",
            width: 28,
            height: 1,
            background: "#c8a96e",
          }}
        />
        <Image 
          src={"/assets/logo_chessify.png"} 
          alt="Chessify logo" 
          width={100} 
          height={100} 
        />
        <span
          style={{
            display: "block",
            width: 28,
            height: 1,
            background: "#c8a96e",
          }}
        />
      </div>

      {/* Card */}
      <div
        className="chess-fade-up"
        style={{
          width: "100%",
          maxWidth: 380,
          border: "1px solid #1e1e1e",
          background: "#0e0e0e",
          padding: "2.5rem 2rem",
          position: "relative",
          animationDelay: "0.1s",
        }}
      >
        {/* Corner brackets */}
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            borderTop: "2px solid #c8a96e",
            borderLeft: "2px solid #c8a96e",
            width: 18,
            height: 18,
          }}
        />
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            borderBottom: "2px solid #c8a96e",
            borderRight: "2px solid #c8a96e",
            width: 18,
            height: 18,
          }}
        />

        {/* Decorative piece */}
        <span
          className="chess-piece-deco"
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "1rem",
            right: "1.25rem",
            fontSize: "1.5rem",
            color: "#c8a96e",
            userSelect: "none",
            lineHeight: 1,
          }}
        >
          ♚
        </span>

        <Eyebrow text="Welcome back" />

        <h1
          style={{
            fontFamily: "Georgia, serif",
            color: "#f0ebe0",
            fontSize: "1.9rem",
            fontWeight: 400,
            lineHeight: 1.15,
            marginBottom: "0.5rem",
          }}
        >
          Sign in to
          <br />
          <em style={{ fontStyle: "italic", color: "#c8a96e" }}>your game.</em>
        </h1>

        <p
          style={{
            color: "#555",
            fontSize: "0.8rem",
            fontWeight: 300,
            lineHeight: 1.6,
            marginBottom: "2rem",
          }}
        >
          Continue where you left off.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div style={{ marginBottom: "1rem" }}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
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
          <div style={{ marginBottom: "0.25rem" }}>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="chess-input"
            />
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              style={{
                background: "rgba(200,60,60,0.08)",
                border: "1px solid rgba(200,60,60,0.25)",
                color: "#e08080",
                fontSize: "0.75rem",
                padding: "0.6rem 0.75rem",
                marginTop: "0.85rem",
                fontWeight: 300,
                letterSpacing: "0.02em",
              }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="chess-btn-primary"
            style={{ marginTop: "1.25rem" }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            margin: "1.25rem 0",
          }}
        >
          <span style={{ flex: 1, height: 1, background: "#1a1a1a" }} />
          <span
            style={{
              color: "#2e2e2e",
              fontSize: "0.63rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            or
          </span>
          <span style={{ flex: 1, height: 1, background: "#1a1a1a" }} />
        </div>

        {/* Register link */}
        <div style={{ textAlign: "center" }}>
          <span style={{ color: "#444", fontSize: "0.75rem", fontWeight: 300 }}>
            Don&apos;t have an account?
          </span>
          <button
            className="chess-link-btn"
            onClick={() => router.push("/auth/register")}
            style={{ marginLeft: "0.3rem" }}
          >
            Create one
          </button>
        </div>
      </div>
    </div>
  );
}
