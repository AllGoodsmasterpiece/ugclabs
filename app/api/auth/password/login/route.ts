import { NextResponse } from "next/server";
import { createSessionToken, sessionCookieName, sessionCookieOptions } from "@/lib/auth";
import { findUserByEmail, validateSignupInput, verifyUserPassword } from "@/lib/user-store";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") || "");
  const password = String(form.get("password") || "");
  const inputError = validateSignupInput(email, password);

  if (inputError) {
    return NextResponse.json({ error: inputError }, { status: 400 });
  }

  try {
    const user = await findUserByEmail(email);

    if (!user || !verifyUserPassword(user, password)) {
      return NextResponse.json({ error: "Wrong email or password." }, { status: 401 });
    }

    const token = await createSessionToken({ email: user.email, name: user.name });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(sessionCookieName, token, sessionCookieOptions());
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Login failed." },
      { status: 500 }
    );
  }
}
