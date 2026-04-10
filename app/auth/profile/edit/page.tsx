"use client";

import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function EditProfilePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");

  const [initialUsername, setInitialUsername] = useState("");

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  // Load user
  useEffect(() => {
    const load = async () => {
      const { data } = await api.get("/auth/me");
      setName(data.name ?? "");
      setUsername(data.username ?? "");
      setInitialUsername(data.username ?? "");
      setAvatar(data.avatar ?? "");
    };

    load();
  }, []);

  // LIVE username check + suggestions
  useEffect(() => {
    if (!username || username.length < 3) {
      setIsAvailable(null);
      setSuggestions([]);
      return;
    }

    if (username === initialUsername) {
      setIsAvailable(null);
      setSuggestions([]);
      return;
    }

    const delay = setTimeout(async () => {
      try {
        setChecking(true);

        const res = await api.get("/auth/check-username", {
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
      } finally {
        setChecking(false);
      }
    }, 400);

    return () => clearTimeout(delay);
  }, [username, initialUsername]);

  // Submit
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (username.length < 3) {
      return setError("Username must be at least 3 characters.");
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
      return setError("Only lowercase letters, numbers, underscores allowed.");
    }

    try {
      setLoading(true);

      const { data } = await api.patch("/users/me", {
        name,
        username,
        avatar,
      });

      if (data?.error) {
        setError(data.error);
        setSuggestions(data.suggestions ?? []);
        return;
      }

      router.push("/auth/profile");
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err?.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  }

  const avatarLetter =
    username?.[0]?.toUpperCase() || name?.[0]?.toUpperCase() || "?";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md border border-[#1e1e1e] bg-[#0e0e0e] px-8 py-10 relative"
      >
        {/* Corners */}
        <span className="absolute top-0 left-0 h-4 w-4 border-t-2 border-l-2 border-[#c8a96e]" />
        <span className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-[#c8a96e]" />

        {/* Heading */}
        <h1
          className="mb-6 text-2xl font-light text-[#f0ebe0]"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Edit Profile
        </h1>

        {/* Avatar */}
        <div className="mb-6 flex items-center gap-4">
          {avatar ? (
            <Image
              src={avatar}
              alt="avatar"
              width={60}
              height={60}
              className="rounded-full border border-[#2a2520]"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-[#13100a] border border-[#2a2520] flex items-center justify-center text-[#c8a96e] text-xl">
              {avatarLetter}
            </div>
          )}

          <input
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            placeholder="Avatar URL"
            className="chess-input"
          />
        </div>

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

        {/* Username */}
        <div className="mb-4">
          <label className="text-[0.63rem] uppercase text-[#555]">
            Username
          </label>

          <div className="relative mt-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#333]">
              @
            </span>

            <input
              value={username}
              onChange={(e) => {
                setUsername(e.target.value.toLowerCase());
                setError(null);
              }}
              className="chess-input"
              style={{ paddingLeft: "1.7rem" }}
            />
          </div>

          {/* Status */}
          {checking && <p className="text-xs text-[#666] mt-1">Checking...</p>}

          {isAvailable === true && (
            <p className="text-green-500 text-xs mt-1">✓ Username available</p>
          )}

          {isAvailable === false && (
            <p className="text-[#e08080] text-xs mt-1">✗ Username taken</p>
          )}
        </div>

        {/* Error */}
        {error && <p className="text-[#e08080] text-sm mb-2">{error}</p>}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setUsername(s);
                  setSuggestions([]);
                  setError(null);
                }}
                className="px-2 py-1 text-xs border border-[#2a2a2a] text-[#c8a96e]"
              >
                @{s}
              </button>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={() => router.push("/auth/profile")}
            className="flex-1 border border-[#1e1e1e] text-[#878383] py-2 text-xs uppercase"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="chess-btn flex-1 bg-[#c8a96e] py-2 text-xs uppercase text-[#0a0a0a]"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
