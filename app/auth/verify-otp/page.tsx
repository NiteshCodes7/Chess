"use client";

import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthProvider";
import { setAccessToken } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import axios from "axios";

const keyframes = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes piecePulse {
    0%, 100% { opacity: 0.08; }
    50%       { opacity: 0.14; }
  }
  .chess-fade-up { animation: fadeUp 0.7s ease both; }
  .chess-piece   { animation: piecePulse 4s ease-in-out infinite; }

  .otp-input {
    width: 48px; height: 56px;
    background: #0a0a0a; border: 1px solid #1e1e1e;
    color: #e8e0d0; font-size: 1.4rem; font-weight: 300;
    text-align: center; outline: none; font-family: Georgia, serif;
    transition: border-color 0.2s, background 0.2s;
    border-radius: 0; -webkit-appearance: none; caret-color: #c8a96e;
  }
  .otp-input:focus   { border-color: #c8a96e; background: #0d0d0d; }
  .otp-input.filled  { border-color: #3a3020; color: #c8a96e; }
  .otp-input.error   { border-color: rgba(200,60,60,0.5); }

  .chess-btn {
    clip-path: polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px));
    transition: background 0.2s, transform 0.15s;
  }
  .chess-btn:hover:not(:disabled)  { background: #d4ba80 !important; transform: translateY(-1px); }
  .chess-btn:active:not(:disabled) { transform: translateY(0); }
  .chess-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  .resend-btn { transition: color 0.2s; }
  .resend-btn:hover:not(:disabled) { color: #c8a96e !important; }
  .resend-btn:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function VerifyOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const { setAuthed } = useAuth();

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function handleChange(index: number, value: string) {
    // Handle paste of full OTP
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, OTP_LENGTH);
      if (!pasted) return;
      const next = Array(OTP_LENGTH).fill("");
      pasted.split("").forEach((ch, i) => {
        next[i] = ch;
      });
      setDigits(next);
      setError(null);
      const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
      inputRefs.current[focusIdx]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, "");
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError(null);

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const next = [...digits];
        next[index] = "";
        setDigits(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
    if (e.key === "ArrowLeft" && index > 0)
      inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1)
      inputRefs.current[index + 1]?.focus();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const otp = digits.join("");
    if (otp.length < OTP_LENGTH) {
      setError("Please enter the full 6-digit code.");
      return;
    }

    try {
      setLoading(true);
      const { data } = await axios.post("/api/auth/verify-otp", { email, otp });
      setAccessToken(data.accessToken);
      if (data.wsToken) localStorage.setItem("wsToken", data.wsToken);
      setAuthed(true);
      router.push("/auth/set-username");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Invalid or expired code.");
      // Shake effect — clear inputs on wrong code
      setDigits(Array(OTP_LENGTH).fill(""));
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0 || resending) return;
    try {
      setResending(true);
      setError(null);
      await api.post("/auth/resend-otp", { email });
      setResendCooldown(RESEND_COOLDOWN);
      setSuccessMsg("A new code has been sent.");
      setTimeout(() => setSuccessMsg(null), 4000);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Failed to resend. Try again.");
    } finally {
      setResending(false);
    }
  }

  const isError = !!error;

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
        <Image 
          src={"/assets/logo_chessify.png"} 
          alt="Chessify logo" 
          width={100} 
          height={100} 
        />
        <span className="block h-px w-7 bg-[#c8a96e]" />
      </div>

      {/* Card */}
      <div
        className="chess-fade-up relative z-10 w-full max-w-100 border border-[#1e1e1e] bg-[#0e0e0e] px-8 py-10"
        style={{ animationDelay: "0.1s" }}
      >
        {/* Corner brackets */}
        <span
          aria-hidden="true"
          className="absolute top-0 left-0 h-4.5 w-4.5"
          style={{
            borderTop: "2px solid #c8a96e",
            borderLeft: "2px solid #c8a96e",
          }}
        />
        <span
          aria-hidden="true"
          className="absolute bottom-0 right-0 h-4.5 w-4.5"
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
          ♜
        </span>

        {/* Eyebrow */}
        <div className="mb-[1.1rem] flex items-center gap-[0.6rem]">
          <span className="block h-px w-5 bg-[#c8a96e]" />
          <span className="text-[0.63rem] tracking-[0.22em] uppercase text-[#c8a96e]">
            Verify email
          </span>
        </div>

        {/* Heading */}
        <h1
          className="mb-2 text-[1.9rem] font-light leading-[1.15] text-[#f0ebe0]"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Check your
          <br />
          <em className="italic text-[#c8a96e]">inbox.</em>
        </h1>

        <p className="mb-2 text-[0.8rem] font-light leading-relaxed text-[#555]">
          We sent a 6-digit code to
        </p>
        <p className="mb-8 text-[0.82rem] font-light text-[#c8a96e] tracking-wide truncate">
          {email || "your email address"}
        </p>

        <form onSubmit={onSubmit} noValidate>
          {/* OTP inputs */}
          <div className="mb-6 flex justify-between gap-2">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onFocus={(e) => e.target.select()}
                className={`otp-input ${digit ? "filled" : ""} ${isError ? "error" : ""}`}
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="mb-4 border px-3 py-[0.6rem] text-[0.75rem] font-light tracking-[0.02em]"
              style={{
                background: "rgba(200,60,60,0.08)",
                borderColor: "rgba(200,60,60,0.25)",
                color: "#e08080",
              }}
            >
              {error}
            </div>
          )}

          {/* Success */}
          {successMsg && (
            <div
              className="mb-4 border px-3 py-[0.6rem] text-[0.75rem] font-light tracking-[0.02em]"
              style={{
                background: "rgba(60,160,80,0.08)",
                borderColor: "rgba(60,160,80,0.25)",
                color: "#7ec896",
              }}
            >
              {successMsg}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="chess-btn w-full bg-[#c8a96e] py-[0.85rem] text-[0.7rem] font-medium tracking-[0.18em] uppercase text-[#0a0a0a]"
          >
            {loading ? "Verifying…" : "Verify & continue"}
          </button>
        </form>

        {/* Resend */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="text-[0.72rem] font-light text-[#444]">
            Didn&apos;t receive it?
          </span>
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0 || resending}
            className="resend-btn bg-transparent border-none text-[0.72rem] text-[#c8a96e] underline underline-offset-[3px] cursor-pointer"
          >
            {resending
              ? "Sending…"
              : resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : "Resend code"}
          </button>
        </div>
      </div>
    </div>
  );
}
