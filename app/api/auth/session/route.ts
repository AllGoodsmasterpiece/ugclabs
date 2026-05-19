import { NextResponse } from "next/server";
import { readSessionFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await readSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ authenticated: false, subscribed: false });
  }

  return NextResponse.json({
    authenticated: true,
    subscribed: session.subscribed,
    master: session.master,
    user: {
      email: session.email,
      name: session.name,
      picture: session.picture
    }
  });
}
