import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import crypto from "crypto";
import type { JWTPayload } from "jose";

const DEFAULT_ACCESS_MINUTES = 15;
const DEFAULT_REFRESH_DAYS = 30;

function getAccessSecret() {
  const secret = process.env.JWT_ACCESS_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("Missing JWT_ACCESS_SECRET");
  return new TextEncoder().encode(secret);
}

function getRefreshSecret() {
  const secret = process.env.JWT_REFRESH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("Missing JWT_REFRESH_SECRET");
  return new TextEncoder().encode(secret);
}

export type AccessTokenPayload = {
  sub: string; // userId
  role: string;
} & JWTPayload;

export function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function issueAccessToken(user: {
  id: string;
  role: string;
}) {
  const now = Math.floor(Date.now() / 1000);
  const expiresInSeconds = DEFAULT_ACCESS_MINUTES * 60;

  return await new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt(now)
    .setExpirationTime(now + expiresInSeconds)
    .sign(getAccessSecret());
}

export async function issueRefreshToken(user: { id: string }) {
  // Random opaque token. Store only its hash in DB.
  const refreshTokenPlain = crypto.randomBytes(32).toString("hex");
  const tokenHash = sha256Hex(refreshTokenPlain);

  const expiresAt = new Date(Date.now() + DEFAULT_REFRESH_DAYS * 24 * 60 * 60 * 1000);

  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt(Math.floor(Date.now() / 1000))
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(getRefreshSecret());

  // `jwt` isn't strictly necessary since we store `expiresAt` in DB, but
  // it allows future-proofing if we want to verify the token signature.
  return { refreshTokenPlain, tokenHash, expiresAt, jwt };
}

export async function verifyAccessToken(accessToken: string) {
  const { payload } = await jwtVerify(accessToken, getAccessSecret());
  return payload as AccessTokenPayload;
}

export async function requireAccessTokenFromRequest(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice("Bearer ".length);
  try {
    return await verifyAccessToken(token);
  } catch {
    return null;
  }
}

export function getRefreshTokenFromCookies() {
  const cookieName = process.env.REFRESH_COOKIE_NAME ?? "refresh_token";
  return cookies().get(cookieName)?.value ?? null;
}

export function clearRefreshCookie() {
  const cookieName = process.env.REFRESH_COOKIE_NAME ?? "refresh_token";
  const domain = process.env.COOKIE_DOMAIN ?? undefined;
  cookies().set(cookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    domain,
    expires: new Date(0),
  });
}

