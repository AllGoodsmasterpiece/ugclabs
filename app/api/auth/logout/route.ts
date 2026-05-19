import { NextResponse } from "next/server";
import { sessionCookieName } from "@/lib/auth";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const response = NextResponse.redirect(new URL("/login", origin));
  response.cookies.delete(sessionCookieName);
  return response;
}

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(sessionCookieName);
  return response;
}
