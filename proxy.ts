import { NextResponse, type NextRequest } from "next/server";
import { readSessionFromToken, sessionCookieName } from "./lib/auth";

const publicPages = new Set(["/login", "/pricing", "/policy", "/affiliate"]);

function isPublicAsset(pathname: string) {
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/showcase/") ||
    pathname.match(/\.(png|jpe?g|webp|gif|svg|ico|css|js|woff2?|mp4|mov|webm)$/i)
  );
}

function loginRedirect(request: NextRequest) {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

function pricingRedirect(request: NextRequest) {
  const pricingUrl = request.nextUrl.clone();
  pricingUrl.pathname = "/pricing";
  pricingUrl.searchParams.set("subscription", "required");
  return NextResponse.redirect(pricingUrl);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    publicPages.has(pathname) ||
    pathname.startsWith("/api/auth/") ||
    pathname === "/api/access" ||
    isPublicAsset(pathname)
  ) {
    return NextResponse.next();
  }

  const session = await readSessionFromToken(request.cookies.get(sessionCookieName)?.value);

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Login required." }, { status: 401 });
    }

    return loginRedirect(request);
  }

  const requiresSubscription = pathname === "/" || pathname.startsWith("/api/product-focus/generate");

  if (requiresSubscription && !session.subscribed) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Active subscription required." }, { status: 402 });
    }

    return pricingRedirect(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"]
};
