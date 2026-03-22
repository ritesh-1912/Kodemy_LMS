import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  issueAccessToken,
  sha256Hex,
  getRefreshTokenFromCookies,
} from "@/lib/jwtAuth";

const bodySchema = z.object({
  // Some clients send it in body; cookie-based flow still works.
  refresh_token: z.string().optional(),
});

export async function POST(req: Request) {
  const cookieToken = getRefreshTokenFromCookies();
  const maybeBody = await req
    .json()
    .catch(() => null);
  const parsed = bodySchema.safeParse(maybeBody);

  let refreshTokenPlain: string | undefined;
  if (parsed.success) {
    refreshTokenPlain = parsed.data.refresh_token;
  }

  const finalRefreshTokenPlain = refreshTokenPlain ?? cookieToken;

  if (!finalRefreshTokenPlain) {
    return NextResponse.json({ error: "Missing refresh token" }, { status: 401 });
  }

  const tokenHash = sha256Hex(finalRefreshTokenPlain);
  const refreshRow = await prisma.refreshToken.findUnique({
    where: { tokenHash },
  });

  if (!refreshRow || refreshRow.revokedAt || refreshRow.expiresAt < new Date()) {
    return NextResponse.json({ error: "Refresh token revoked/expired" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: refreshRow.userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  const access_token = await issueAccessToken({ id: user.id, role: user.role });
  return NextResponse.json({ access_token });
}

