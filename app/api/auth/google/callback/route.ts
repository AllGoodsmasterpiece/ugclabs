import { NextResponse } from "next/server";
import {
  createSessionToken,
  googleClientId,
  googleClientSecret,
  oauthStateCookieName,
  sessionCookieName,
  sessionCookieOptions
} from "@/lib/auth";

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfo = {
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

function redirectWithError(origin: string, error: string) {
  return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, origin));
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const cookieState = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${oauthStateCookieName}=`))
    ?.slice(oauthStateCookieName.length + 1);

  if (!code || !state || !cookieState || decodeURIComponent(cookieState) !== state) {
    return redirectWithError(origin, "invalid_oauth_state");
  }

  const clientId = googleClientId();
  const clientSecret = googleClientSecret();

  if (!clientId || !clientSecret) {
    return redirectWithError(origin, "google_not_configured");
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${origin}/api/auth/google/callback`,
      grant_type: "authorization_code"
    })
  });
  const tokenPayload = await tokenResponse.json() as GoogleTokenResponse;

  if (!tokenResponse.ok || !tokenPayload.access_token) {
    return redirectWithError(origin, tokenPayload.error_description ?? tokenPayload.error ?? "google_token_failed");
  }

  const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenPayload.access_token}` }
  });
  const user = await userResponse.json() as GoogleUserInfo;

  if (!userResponse.ok || !user.email || user.email_verified === false) {
    return redirectWithError(origin, "google_email_unverified");
  }

  const sessionToken = await createSessionToken({
    email: user.email,
    name: user.name,
    picture: user.picture
  });
  const response = NextResponse.redirect(new URL("/", origin));

  response.cookies.set(sessionCookieName, sessionToken, sessionCookieOptions());
  response.cookies.delete(oauthStateCookieName);

  return response;
}
