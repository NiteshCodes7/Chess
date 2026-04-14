import { NextRequest, NextResponse } from "next/server";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

export async function POST(req: NextRequest) {
  const { accessToken, refreshToken, sessionToken, wsToken } = await req.json();

  const response = NextResponse.json({ accessToken, wsToken });

  response.cookies.set("sessionToken", sessionToken, COOKIE_OPTS);
  response.cookies.set("refreshToken", refreshToken, COOKIE_OPTS);

  return response;
}