import { NextResponse } from "next/server";

const accessCookieName = "ugcday_access";

export async function GET(request: Request) {
  const configuredPassword = process.env.UGCDAY_ACCESS_PASSWORD;

  if (!configuredPassword) {
    return NextResponse.json({ unlocked: true });
  }

  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${accessCookieName}=`));
  const value = cookie ? decodeURIComponent(cookie.slice(accessCookieName.length + 1)) : "";

  return NextResponse.json({ unlocked: value === configuredPassword });
}

export async function POST(request: Request) {
  const configuredPassword = process.env.UGCDAY_ACCESS_PASSWORD;

  if (!configuredPassword) {
    return NextResponse.json({ ok: true });
  }

  const form = await request.formData();
  const password = String(form.get("password") || "");

  if (password !== configuredPassword) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(accessCookieName, configuredPassword, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });

  return response;
}
