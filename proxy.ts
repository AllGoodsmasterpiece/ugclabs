import { NextResponse, type NextRequest } from "next/server";

const accessCookieName = "ugcday_access";
const publicPages = new Set(["/login", "/pricing", "/policy", "/affiliate"]);

export function proxy(request: NextRequest) {
  const password = process.env.UGCDAY_ACCESS_PASSWORD;

  if (!password) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (
    publicPages.has(pathname) ||
    pathname === "/api/access" ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(png|jpe?g|webp|gif|svg|ico|css|js|woff2?)$/i)
  ) {
    return NextResponse.next();
  }

  if (request.cookies.get(accessCookieName)?.value === password) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Access locked." }, { status: 401 });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/";
  loginUrl.searchParams.set("locked", "1");
  return NextResponse.rewrite(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"]
};
