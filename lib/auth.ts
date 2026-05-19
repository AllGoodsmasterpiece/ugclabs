export const sessionCookieName = "ugcday_session";
export const oauthStateCookieName = "ugcday_oauth_state";

export type AuthSession = {
  email: string;
  name?: string;
  picture?: string;
  master: boolean;
  subscribed: boolean;
  exp: number;
};

type CookieReader = {
  get(name: string): { value?: string } | undefined;
};

const sessionMaxAgeSeconds = 60 * 60 * 24 * 30;

function envValue(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return "";
}

export function googleClientId() {
  return envValue(
    "GOOGLE_CLIENT_ID",
    "GOOGLE_OAUTH_CLIENT_ID",
    "GOOGLE_AUTH_CLIENT_ID",
    "google Client id",
    "Google OAUTH client ID"
  );
}

export function googleClientSecret() {
  return envValue(
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_OAUTH_CLIENT_SECRET",
    "GOOGLE_AUTH_CLIENT_SECRET",
    "client secret",
    "Google OAUTH client password"
  );
}

export function authSecret() {
  return envValue("UGCDAY_AUTH_SECRET", "AUTH_SECRET", "NEXTAUTH_SECRET", "UGCDAY_ACCESS_PASSWORD");
}

function emailSet(...envNames: string[]) {
  return new Set(
    envNames
      .flatMap((name) => (process.env[name] ?? "").split(","))
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isMasterEmail(email: string) {
  return emailSet("UGCDAY_MASTER_EMAIL", "UGCDAY_MASTER_EMAILS", "MASTER_EMAIL", "OWNER_EMAIL").has(
    email.trim().toLowerCase()
  );
}

export function hasActiveSubscription(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (isMasterEmail(normalizedEmail)) return true;
  return emailSet("UGCDAY_SUBSCRIBED_EMAILS", "SUBSCRIBED_EMAILS").has(normalizedEmail);
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function signingKey() {
  const secret = authSecret();
  if (!secret) return null;
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function sign(value: string) {
  const key = await signingKey();
  if (!key) return "";
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

async function verify(value: string, signature: string) {
  const key = await signingKey();
  if (!key) return false;
  return crypto.subtle.verify("HMAC", key, base64UrlToBytes(signature), new TextEncoder().encode(value));
}

export async function createSessionToken(user: { email: string; name?: string; picture?: string }) {
  const email = user.email.trim().toLowerCase();
  const master = isMasterEmail(email);
  const payload: AuthSession = {
    email,
    name: user.name,
    picture: user.picture,
    master,
    subscribed: master || hasActiveSubscription(email),
    exp: Math.floor(Date.now() / 1000) + sessionMaxAgeSeconds
  };
  const encodedPayload = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await sign(encodedPayload);
  if (!signature) throw new Error("Auth secret is not configured.");
  return `${encodedPayload}.${signature}`;
}

export async function readSessionFromToken(token?: string): Promise<AuthSession | null> {
  if (!token) return null;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;
  if (!(await verify(encodedPayload, signature))) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(encodedPayload))) as AuthSession;
    if (!payload.email || payload.exp < Math.floor(Date.now() / 1000)) return null;

    const master = isMasterEmail(payload.email);
    return {
      ...payload,
      master,
      subscribed: master || hasActiveSubscription(payload.email)
    };
  } catch {
    return null;
  }
}

export async function readSessionFromCookieStore(cookieStore: CookieReader) {
  return readSessionFromToken(cookieStore.get(sessionCookieName)?.value);
}

export async function readSessionFromRequest(request: Request) {
  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${sessionCookieName}=`));
  const token = cookie ? decodeURIComponent(cookie.slice(sessionCookieName.length + 1)) : "";
  return readSessionFromToken(token);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: true,
    path: "/",
    maxAge: sessionMaxAgeSeconds
  };
}
