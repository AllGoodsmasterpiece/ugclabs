import { NextResponse } from "next/server";
import { readSessionFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await readSessionFromRequest(request);
  return NextResponse.json({
    unlocked: Boolean(session),
    authenticated: Boolean(session),
    subscribed: Boolean(session?.subscribed),
    master: Boolean(session?.master)
  });
}

export async function POST() {
  return NextResponse.json(
    { error: "Password access has been replaced by Google login." },
    { status: 410 }
  );
}
