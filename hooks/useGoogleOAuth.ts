"use client";

import { setAccessToken } from "@/lib/api";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthProvider";
import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";
import axios from "axios";

interface UseGoogleOAuthOptions {
  redirectTo?: string;
}

export function useGoogleOAuth({
  redirectTo = "/auth/set-username",
}: UseGoogleOAuthOptions = {}) {
  const { setAuthed } = useAuth();
  const router = useRouter();
  const popupRef = useRef<Window | null>(null);
  const listenerRef = useRef<((e: MessageEvent) => void) | null>(null);

  const login = useCallback(async () => {
    // 1. Ask backend for the Google OAuth URL
    const { data } = await api.get<{ redirect: string }>("/auth/google");

    // 2. Open the popup
    const width = 500;
    const height = 620;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      data.redirect,
      "google-oauth",
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`,
    );

    popupRef.current = popup;

    return new Promise<void>((resolve, reject) => {
      // 3. Listen for the postMessage from the callback page
      const onMessage = async (e: MessageEvent) => {
        console.log("message origin:", e.origin);
        console.log("expected:", process.env.NEXT_PUBLIC_API_URL);
        // Only accept messages from our own origin
        if (e.origin !== process.env.NEXT_PUBLIC_API_URL!) return;

        const { accessToken, refreshToken, sessionToken, wsToken, error } = e.data ?? {};

        await axios.post("/api/auth/google/set-session", {
          accessToken,
          refreshToken,
          sessionToken,
          wsToken,
        });

        // Clean up
        window.removeEventListener("message", onMessage);
        listenerRef.current = null;
        popupRef.current?.close();

        if (error) {
          reject(new Error(error));
          return;
        }

        if (accessToken) {
          setAccessToken(accessToken);

          if (wsToken) {
            localStorage.setItem("wsToken", wsToken);
          }

          setAuthed(true);
          router.replace(redirectTo);
          resolve();
        }
      };

      listenerRef.current = onMessage;
      window.addEventListener("message", onMessage);

      // 4. Poll for popup closed without message (user dismissed)
      const poll = setInterval(() => {
        if (popup?.closed) {
          clearInterval(poll);
          if (listenerRef.current) {
            window.removeEventListener("message", listenerRef.current);
            listenerRef.current = null;
            reject(new Error("POPUP_CLOSED"));
          }
        }
      }, 500);
    });
  }, [redirectTo, router, setAuthed]);

  return { login };
}
