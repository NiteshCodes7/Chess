"use client";

import { api } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, KeyboardEvent } from "react";

type Step = "email" | "otp" | "password";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // send OTP 
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return setError("Enter your email address.");
    setError(null);
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setStep("otp");
      startResendCooldown();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  }

  // verify OTP 
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) return setError("Enter the full 6-digit code.");
    setError(null);
    setLoading(true);
    try {
      setStep("password");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err?.response?.data?.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  }

  // reset password 
  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8)
      return setError("Password must be at least 8 characters.");
    if (newPassword !== confirmPassword)
      return setError("Passwords do not match.");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        email,
        otp: otp.join(""),
        newPassword,
      });
      router.push("/auth/login?reset=success");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err?.response?.data?.message || "Reset failed. Try again.");
      if (err?.response?.data?.message?.toLowerCase().includes("otp")) {
        setStep("otp");
        setOtp(["", "", "", "", "", ""]);
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Resend OTP ──
  async function handleResend() {
    if (resendCooldown > 0) return;
    setError(null);
    try {
      await api.post("/auth/forgot-password", { email });
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
      startResendCooldown();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError("Failed to resend OTP.");
    }
  }

  function startResendCooldown() {
    setResendCooldown(30);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  // ── OTP input handling ──
  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    setError(null);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5)
      otpRefs.current[index + 1]?.focus();
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    pasted.split("").forEach((char, i) => {
      next[i] = char;
    });
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  const stepNumber = step === "email" ? 1 : step === "otp" ? 2 : 3;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.4s ease both; }
        .field-input {
          width: 100%;
          height: 40px;
          background: #0a0a0a;
          border: 1px solid #1a1a1a;
          color: #d0c8b8;
          font-size: 13px;
          font-weight: 300;
          padding: 0 12px;
          outline: none;
          transition: border-color 0.15s;
          font-family: inherit;
        }
        .field-input::placeholder { color: #2a2a2a; }
        .field-input:focus { border-color: #2a2520; }
      `}</style>

      {/* Background */}
      <div className="fixed inset-0 bg-[#060608]" />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(180,140,55,0.07) 0%, transparent 65%)",
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.6) 100%)",
        }}
      />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-5">
        <Image
          src={"/assets/logo_chessify.png"}
          alt="logo"
          width={100}
          height={100}
          className="cursor-pointer"
          onClick={() => router.push("/")}
        />
        <Link
          href="/auth/login"
          className="text-[#a6a0a0] hover:text-[#d7d3d3] text-xs tracking-[0.15em] uppercase font-light transition-colors no-underline"
        >
          Back to login
        </Link>
      </nav>

      <div className="relative z-10 w-full max-w-md fade-up">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <div
                className="w-5 h-5 flex items-center justify-center text-[9px] font-light transition-all duration-300"
                style={{
                  border: `1px solid ${n <= stepNumber ? "#c8a96e" : "#1a1a1a"}`,
                  color:
                    n < stepNumber
                      ? "#0a0a0a"
                      : n === stepNumber
                        ? "#c8a96e"
                        : "#333",
                  background: n < stepNumber ? "#c8a96e" : "transparent",
                }}
              >
                {n < stepNumber ? (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="w-2.5 h-2.5"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  n
                )}
              </div>
              {n < 3 && (
                <div
                  className="w-8 h-px transition-all duration-300"
                  style={{
                    background: n < stepNumber ? "#c8a96e" : "#1a1a1a",
                    opacity: 0.6,
                  }}
                />
              )}
            </div>
          ))}
          <span className="ml-2 text-[#444] text-[10px] tracking-[0.15em] uppercase font-light">
            {step === "email"
              ? "Email"
              : step === "otp"
                ? "Verify"
                : "New password"}
          </span>
        </div>

        {/* ── STEP 1: EMAIL ── */}
        {step === "email" && (
          <form onSubmit={handleSendOtp} className="fade-up">
            <div className="flex items-center gap-3 mb-6">
              <span className="block w-6 h-px bg-[#c8a96e] opacity-40" />
              <span className="text-[#c8a96e] text-xs tracking-[0.25em] uppercase">
                Reset password
              </span>
            </div>

            <h1
              className="text-4xl font-light text-[#f0ebe0] mb-2 leading-none"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Forgot your
            </h1>
            <h1
              className="text-4xl font-light text-[#f0ebe0] mb-8 leading-none"
              style={{ fontFamily: "Georgia, serif" }}
            >
              <span className="italic text-[#c8a96e]">password?</span>
            </h1>

            <p className="text-[#878383] text-sm font-light mb-8 leading-relaxed">
              Enter your email address and we&apos;ll send you a 6-digit code to
              reset your password.
            </p>

            <div className="mb-6">
              <label className="block text-[10px] tracking-[0.2em] uppercase text-[#727171] mb-2">
                Email address
              </label>
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#333] pointer-events-none"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="your@email.com"
                  autoComplete="email"
                  className="field-input"
                  style={{ paddingLeft: "2.2rem" }}
                />
              </div>
            </div>

            {error && <ErrorBox message={error} />}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full h-10 text-xs font-light tracking-[0.15em] uppercase border transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed mt-2 cursor-pointer"
              style={{
                borderColor: "#c8a96e",
                color: "#0a0a0a",
                background: "#c8a96e",
              }}
              onMouseEnter={(e) => {
                if (!loading)
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "#d4ba80";
              }}
              onMouseLeave={(e) => {
                if (!loading)
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "#c8a96e";
              }}
            >
              {loading ? "Sending…" : "Send reset code"}
            </button>
          </form>
        )}

        {/* ── STEP 2: OTP ── */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="fade-up">
            <div className="flex items-center gap-3 mb-6">
              <span className="block w-6 h-px bg-[#c8a96e] opacity-40" />
              <span className="text-[#c8a96e] text-xs tracking-[0.25em] uppercase">
                Verify code
              </span>
            </div>

            <h1
              className="text-4xl font-light text-[#f0ebe0] mb-2 leading-none"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Check your
            </h1>
            <h1
              className="text-4xl font-light text-[#f0ebe0] mb-4 leading-none"
              style={{ fontFamily: "Georgia, serif" }}
            >
              <span className="italic text-[#c8a96e]">inbox</span>
            </h1>

            <p className="text-[#444] text-sm font-light mb-8 leading-relaxed">
              We sent a 6-digit code to{" "}
              <span className="text-[#878383]">{email}</span>
            </p>

            {/* OTP boxes */}
            <div className="flex gap-2 mb-6" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    otpRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-12 h-12 text-center text-lg font-light border transition-all duration-150 bg-[#0a0a0a] outline-none"
                  style={{
                    borderColor: digit ? "#c8a96e" : "#1a1a1a",
                    color: "#d0c8b8",
                    fontFamily: "Georgia, serif",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#c8a96e")}
                  onBlur={(e) =>
                    (e.target.style.borderColor = digit ? "#c8a96e" : "#1a1a1a")
                  }
                />
              ))}
            </div>

            {error && <ErrorBox message={error} />}

            <button
              type="submit"
              disabled={loading || otp.join("").length < 6}
              className="w-full h-10 text-xs font-light tracking-[0.15em] uppercase border transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed mb-3"
              style={{
                borderColor: "#c8a96e",
                color: "#0a0a0a",
                background: "#c8a96e",
              }}
              onMouseEnter={(e) => {
                if (!loading)
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "#d4ba80";
              }}
              onMouseLeave={(e) => {
                if (!loading)
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "#c8a96e";
              }}
            >
              {loading ? "Verifying…" : "Continue"}
            </button>

            {/* Resend + back */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setOtp(["", "", "", "", "", ""]);
                  setError(null);
                }}
                className="text-[#444] hover:text-[#878383] text-xs font-light transition-colors"
              >
                ← Change email
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="text-xs font-light transition-colors disabled:cursor-not-allowed"
                style={{ color: resendCooldown > 0 ? "#333" : "#c8a96e" }}
              >
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : "Resend code"}
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 3: NEW PASSWORD ── */}
        {step === "password" && (
          <form onSubmit={handleReset} className="fade-up">
            <div className="flex items-center gap-3 mb-6">
              <span className="block w-6 h-px bg-[#c8a96e] opacity-40" />
              <span className="text-[#c8a96e] text-xs tracking-[0.25em] uppercase">
                New password
              </span>
            </div>

            <h1
              className="text-4xl font-light text-[#f0ebe0] mb-2 leading-none"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Choose a new
            </h1>
            <h1
              className="text-4xl font-light text-[#f0ebe0] mb-8 leading-none"
              style={{ fontFamily: "Georgia, serif" }}
            >
              <span className="italic text-[#c8a96e]">password</span>
            </h1>

            <div className="mb-4">
              <label className="block text-[10px] tracking-[0.2em] uppercase text-[#444] mb-2">
                New password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="Min. 8 characters"
                  className="field-input"
                  style={{ paddingRight: "2.5rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#333] hover:text-[#555] transition-colors"
                >
                  {showPassword ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="w-4 h-4"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="w-4 h-4"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {/* Password strength */}
              {newPassword && (
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className="flex-1 h-0.5 transition-all duration-300"
                      style={{
                        background: getStrengthColor(newPassword, n),
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-[10px] tracking-[0.2em] uppercase text-[#444] mb-2">
                Confirm password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="Repeat password"
                  className="field-input"
                />
                {/* Match indicator */}
                {confirmPassword && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {newPassword === confirmPassword ? (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#4a8a4a"
                        strokeWidth="2"
                        className="w-3.5 h-3.5"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#8a4a4a"
                        strokeWidth="2"
                        className="w-3.5 h-3.5"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    )}
                  </div>
                )}
              </div>
            </div>

            {error && <ErrorBox message={error} />}

            <button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
              className="w-full h-10 text-xs font-light tracking-[0.15em] uppercase border transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                borderColor: "#c8a96e",
                color: "#0a0a0a",
                background: "#c8a96e",
              }}
              onMouseEnter={(e) => {
                if (!loading)
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "#d4ba80";
              }}
              onMouseLeave={(e) => {
                if (!loading)
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "#c8a96e";
              }}
            >
              {loading ? "Resetting…" : "Reset password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 border border-[#3a1a1a] bg-[#1a0808] px-3 py-2 mb-4">
      <svg
        className="w-3 h-3 text-[#8a4a4a] shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p className="text-[#8a4a4a] text-xs font-light">{message}</p>
    </div>
  );
}

function getStrengthColor(password: string, segment: number): string {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  if (segment > strength) return "#1a1a1a";
  if (strength === 1) return "#8a4a4a";
  if (strength === 2) return "#8a6a2a";
  if (strength === 3) return "#6a8a2a";
  return "#4a8a4a";
}
