import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRefreshTokenFromCookies, sha256Hex } from "@/lib/jwtAuth";

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
  const domain = process.env.COOKIE_DOMAIN ?? undefined;
  const res = NextResponse.json({ success: true });
  res.cookies.set(cookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    domain,
    expires: new Date(0),
  });
  return res;
}

