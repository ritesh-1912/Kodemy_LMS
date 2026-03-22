import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import crypto from "crypto";
import { jwtConfig } from "../config/security.js";

export type AccessTokenPayload = { sub: string; role?: string } & JWTPayload;

export function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function issueAccessToken(user: { id: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt(now)
    .setExpirationTime(now + jwtConfig.accessExpiresSeconds)
    .sign(jwtConfig.accessSecret);
}

export async function issueRefreshToken(user: { id: string }): Promise<{
  refreshTokenPlain: string;
  tokenHash: string;
  expiresAt: Date;
}> {
  const refreshTokenPlain = crypto.randomBytes(32).toString("hex");
  const tokenHash = sha256Hex(refreshTokenPlain);
  const expiresAt = new Date(
    Date.now() + jwtConfig.refreshExpiresDays * 24 * 60 * 60 * 1000
  );
  return { refreshTokenPlain, tokenHash, expiresAt };
}

export async function verifyAccessToken(
  token: string
): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, jwtConfig.accessSecret);
  return payload as AccessTokenPayload;
}
