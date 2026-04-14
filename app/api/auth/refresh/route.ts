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
  const refreshToken = req.cookies.get("refreshToken")?.value;

  if (!refreshToken) {
    return NextResponse.json({ message: "No refresh token" }, { status: 401 });
  }

  try {
    const { data } = await axios.post(
      `${BACKEND}/auth/refresh`,
      {},
      {
        headers: {
          Cookie: `refreshToken=${refreshToken}`,
          "X-Requested-With": "XMLHttpRequest",
        },
      }
    );

    const response = NextResponse.json({
      accessToken: data.accessToken,
      wsToken: data.wsToken,
    });

    // Rotate both cookies
    response.cookies.set("sessionToken", await data.sessionToken, {
      ...COOKIE_OPTS,
      maxAge: 60 * 60 * 24 * 7,
    });

    response.cookies.set("refreshToken", await data.refreshToken, {
      ...COOKIE_OPTS,
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    const response = NextResponse.json(
      { message: "Session expired" },
      { status: 401 }
    );
    response.cookies.delete("sessionToken");
    response.cookies.delete("refreshToken");
    return response;
  }
}