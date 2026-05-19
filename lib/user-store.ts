import { Buffer } from "node:buffer";
import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";
import { authSecret } from "@/lib/auth";
import { hasR2Config, readPublicObject, uploadPublicObject } from "@/lib/r2";

export type StoredUser = {
  email: string;
  name?: string;
  salt: string;
  passwordHash: string;
  createdAt: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function userKey(email: string) {
  const secret = authSecret();
  if (!secret) throw new Error("Auth secret is not configured.");
  const digest = createHmac("sha256", secret).update(normalizeEmail(email)).digest("hex");
  return `auth/users/${digest}.json`;
}

function hashPassword(password: string, salt: string) {
  return pbkdf2Sync(password, salt, 180000, 32, "sha256").toString("base64url");
}

export function validateSignupInput(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return "Enter a valid email.";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  return "";
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  if (!hasR2Config()) throw new Error("User storage is not configured.");

  const buffer = await readPublicObject(userKey(email));
  if (!buffer) return null;

  try {
    return JSON.parse(buffer.toString("utf8")) as StoredUser;
  } catch {
    return null;
  }
}

export async function createUser(email: string, password: string, name?: string) {
  if (!hasR2Config()) throw new Error("User storage is not configured.");

  const normalizedEmail = normalizeEmail(email);
  const existing = await findUserByEmail(normalizedEmail);
  if (existing) return null;

  const salt = randomBytes(16).toString("base64url");
  const user: StoredUser = {
    email: normalizedEmail,
    name: name?.trim() || undefined,
    salt,
    passwordHash: hashPassword(password, salt),
    createdAt: new Date().toISOString()
  };

  await uploadPublicObject(userKey(normalizedEmail), Buffer.from(JSON.stringify(user)), "application/json");
  return user;
}

export function verifyUserPassword(user: StoredUser, password: string) {
  const actual = Buffer.from(user.passwordHash, "base64url");
  const expected = Buffer.from(hashPassword(password, user.salt), "base64url");

  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
