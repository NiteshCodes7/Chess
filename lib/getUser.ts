import { jwtDecode } from "jwt-decode";

type WsPayload = {
  sub: string;
};

export function getUserId() {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("wsToken");
  if (!token) return null;

  try {
    const decoded = jwtDecode<WsPayload>(token);
    return decoded.sub;
  } catch {
    return null;
  }
}