import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_ONLY_ROUTES = [
  "/auth/login",
  "/auth/register",
  "/auth/verify-otp",
  "/auth/forgot-password",
];

const PUBLIC_ROUTES = ["/", ...PUBLIC_ONLY_ROUTES];

const PROTECTED_AUTH_ROUTES = [
  "/auth/profile",
  "/auth/edit-profile",
  "/auth/set-username",
];

const SECRET = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionToken = request.cookies.get("sessionToken");
  const refreshToken = request.cookies.get("refreshToken");

  console.log({
    pathname,
    hasSession: !!sessionToken,
    hasRefresh: !!refreshToken,
    allCookies: request.cookies.getAll().map(c => c.name),
  });
  

  const isPublicOnly = PUBLIC_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );

  const isProtectedAuthRoute = PROTECTED_AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );

  const isPublic =
    PUBLIC_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(route + "/"),
    ) && !isProtectedAuthRoute;

  // Logged-in user trying to access login/register pages
  if (isPublicOnly && refreshToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Guest trying to access protected routes
  if (!isPublic && !sessionToken) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify access token for protected routes
  if (!isPublic && sessionToken) {
    try {
      await jwtVerify(sessionToken.value, SECRET);
      return NextResponse.next();
    } catch {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);

      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("sessionToken");
      response.cookies.delete("refreshToken");

      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg|.*\\.jpg).*)",
  ],
};
