import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { issueAccessToken, issueRefreshToken, sha256Hex } from "@/lib/jwtAuth";
import { refreshCookieOptions } from "@/lib/authCookie";

const registerSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  const parsed = registerSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 400 }
    );
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      name: name ?? null,
      passwordHash: hashed,
      role: "STUDENT",
    },
  });

  const access_token = await issueAccessToken({ id: user.id, role: user.role });
  const { refreshTokenPlain, tokenHash, expiresAt } = await issueRefreshToken({
    id: user.id,
  });

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: tokenHash ?? sha256Hex(refreshTokenPlain),
      expiresAt,
    },
  });

  const cookieName = process.env.REFRESH_COOKIE_NAME ?? "refresh_token";
  const res = NextResponse.json({
    access_token,
    user: { id: user.id, name: user.name ?? "", email: user.email },
  });
  res.cookies.set(
    cookieName,
    refreshTokenPlain,
    refreshCookieOptions(expiresAt)
  );

  return res;
}
