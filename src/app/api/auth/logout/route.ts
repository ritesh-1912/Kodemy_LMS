import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRefreshTokenFromCookies, sha256Hex } from "@/lib/jwtAuth";
import { refreshCookieOptions } from "@/lib/authCookie";

export async function POST() {
  const refreshTokenPlain = getRefreshTokenFromCookies();
  if (refreshTokenPlain) {
    const tokenHash = sha256Hex(refreshTokenPlain);
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  const cookieName = process.env.REFRESH_COOKIE_NAME ?? "refresh_token";
  const res = NextResponse.json({ success: true });
  res.cookies.set(cookieName, "", refreshCookieOptions(new Date(0)));
  return res;
}
