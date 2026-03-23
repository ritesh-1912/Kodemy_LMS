import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { issueAccessToken, issueRefreshToken } from "@/lib/jwtAuth";
import { refreshCookieOptions } from "@/lib/authCookie";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const parsed = loginSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const access_token = await issueAccessToken({ id: user.id, role: user.role });
  const { refreshTokenPlain, tokenHash, expiresAt } = await issueRefreshToken({
    id: user.id,
  });

  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
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
