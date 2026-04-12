import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE_NAME = "carometro_session";

const PUBLIC_PATHS = ["/auth/login"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  const hasSession = !!req.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!hasSession && !isPublicPath) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  if (hasSession && pathname === "/auth/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
