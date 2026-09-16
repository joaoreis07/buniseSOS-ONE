import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";

const authPages = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/invite",
]);

function sessionCookieNames(secureCookie: boolean): string[] {
  if (secureCookie) {
    return ["__Secure-authjs.session-token", "__Secure-next-auth.session-token"];
  }
  return ["authjs.session-token", "next-auth.session-token"];
}

async function readAuthToken(request: NextRequest) {
  const secret = process.env.AUTH_SECRET;
  const secureCookie = request.nextUrl.protocol === "https:";

  for (const cookieName of sessionCookieNames(secureCookie)) {
    const token = await getToken({
      req: request,
      secret,
      secureCookie,
      cookieName,
      salt: cookieName,
    });
    if (token) {
      return token;
    }
  }

  return null;
}

function isActiveToken(token: JWT | null): boolean {
  return Boolean(
    token?.sub &&
      typeof token.companyId === "string" &&
      typeof token.role === "string" &&
      !token.invalidated,
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const rawToken = await readAuthToken(request);
  const token = rawToken && typeof rawToken === "object" ? (rawToken as JWT) : null;
  const isLoggedIn = isActiveToken(token);
  const isAppRoute = pathname.startsWith("/app");
  const isAuthPage = authPages.has(pathname);

  if (isAppRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  if (isAppRoute) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/app/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/invite",
  ],
};
