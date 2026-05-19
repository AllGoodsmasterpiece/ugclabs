import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { hasR2Config, uploadPublicObject } from "@/lib/r2";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function POST(request: Request) {
  const form = await request.formData();
  const email = normalizeEmail(String(form.get("email") || ""));

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }

  if (!hasR2Config()) {
    return NextResponse.json({ error: "Password reset storage is not configured." }, { status: 500 });
  }

  const id = randomUUID();
  const payload = {
    id,
    email,
    createdAt: new Date().toISOString(),
    status: "requested"
  };

  await uploadPublicObject(
    `auth/password-reset-requests/${id}.json`,
    Buffer.from(JSON.stringify(payload)),
    "application/json"
  );

  return NextResponse.json({
    ok: true,
    message: "Password reset request received. We will send reset instructions when email delivery is connected."
  });
}
