import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL! || "http://localhost:3001";
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    const { data } = await axios.post(`${BACKEND}/auth/verify-otp`, body);

    const response = NextResponse.json({
      wsToken: data.wsToken,
      accessToken: data.accessToken,
    });

    response.cookies.set("sessionToken", await data.sessionToken, {
      ...COOKIE_OPTS,
      maxAge: 60 * 60 * 24 * 7,
    });

    response.cookies.set("refreshToken", data.refreshToken, {
      ...COOKIE_OPTS,
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    return NextResponse.json(
      { message: err.response?.data?.message || "OTP verification failed" },
      { status: err.response?.status || 500 }
    );
  }
}