"use client";

import { useState } from "react";
import { useGoogleOAuth } from "@/hooks/useGoogleOAuth";

interface GoogleButtonProps {
  redirectTo?: string;
  label?: string;
}

const googleBtnStyles = `
  .google-btn {
    width: 100%;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    background: transparent;
    border: 1px solid #1e1e1e;
    color: #888;
    padding: 0.78rem 1rem;
    font-size: 0.7rem;
    font-weight: 300;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    cursor: pointer;
    font-family: inherit;
    transition: border-color 0.2s, color 0.2s, background 0.2s;
    border-radius: 0;
  }
  .google-btn:hover:not(:disabled) {
    border-color: #3a3a3a;
    color: #c8c0b0;
    background: #0d0d0d;
  }
  .google-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .google-btn-spinner {
    width: 14px; height: 14px;
    border: 1.5px solid #333;
    border-top-color: #c8a96e;
    border-radius: 50%;
    animation: googleSpin 0.7s linear infinite;
    flex-shrink: 0;
  }
  @keyframes googleSpin { to { transform: rotate(360deg); } }
`;

function GoogleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function GoogleButton({
  redirectTo = "/auth/set-username",
  label = "Continue with Google",
}: GoogleButtonProps) {
  const { login } = useGoogleOAuth({ redirectTo });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setLoading(true);
    try {
      await login();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.message !== "POPUP_CLOSED") {
        setError("Google sign-in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <style>{googleBtnStyles}</style>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="google-btn"
        aria-label="Sign in with Google"
      >
        {loading ? <span className="google-btn-spinner" /> : <GoogleIcon />}
        <span>{loading ? "Opening Google…" : label}</span>
      </button>

      {error && (
        <p
          style={{
            marginTop: "0.5rem",
            color: "#e08080",
            fontSize: "0.72rem",
            fontWeight: 300,
            textAlign: "center",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
