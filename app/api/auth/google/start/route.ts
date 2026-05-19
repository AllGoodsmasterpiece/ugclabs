import { NextResponse } from "next/server";
import { googleClientId, googleClientSecret, oauthStateCookieName } from "@/lib/auth";

export async function GET(request: Request) {
  const clientId = googleClientId();
  const clientSecret = googleClientSecret();
  const origin = new URL(request.url).origin;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/login?error=google_not_configured", origin));
  }

  const state = crypto.randomUUID();
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", `${origin}/api/auth/google/callback`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(url);
  response.cookies.set(oauthStateCookieName, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 10
  });

  return response;
}
