import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname, origin } = request.nextUrl;

  const sessionToken = request.cookies.get("sessionToken");
  const refreshToken = request.cookies.get("refreshToken");

  console.log("========== MIDDLEWARE ==========");
  console.log("URL:", request.url);
  console.log("Origin:", origin);
  console.log("Pathname:", pathname);
  console.log(
    "Method:",
    request.method,
  );

  console.log("Has sessionToken:", !!sessionToken);
  console.log("Has refreshToken:", !!refreshToken);

  console.log(
    "All cookies:",
    request.cookies.getAll().map((c) => ({
      name: c.name,
      valuePreview: c.value.slice(0, 15) + "...",
    }))
  );

  console.log(
    "Headers.cookie:",
    request.headers.get("cookie") || "NONE"
  );
  
  console.log("Deployment Test");
  console.log("===============================");
  
  return NextResponse.next();
}