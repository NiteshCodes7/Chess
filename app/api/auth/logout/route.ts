import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL! || "http://localhost:3001";

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get("refreshToken")?.value;

  if (refreshToken) {
    await axios
      .post(
        `${BACKEND}/auth/logout`,
        {},
        { headers: { Cookie: `refreshToken=${refreshToken}` } }
      )
      .catch(() => {});
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete("sessionToken");
  response.cookies.delete("refreshToken");
  return response;
}