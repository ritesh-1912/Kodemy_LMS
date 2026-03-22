import { prisma } from "../../config/db.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";
import {
  issueAccessToken,
  issueRefreshToken,
  sha256Hex,
} from "../../utils/jwt.js";

export async function registerUser(data: {
  email: string;
  password: string;
  name?: string;
}) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) {
    throw Object.assign(new Error("An account with this email already exists"), { status: 400 });
  }

  const passwordHash = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name ?? null,
    },
  });

  const accessToken = await issueAccessToken({ id: user.id });
  const { refreshTokenPlain, tokenHash, expiresAt } = await issueRefreshToken({
    id: user.id,
  });

  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  return {
    user: { id: user.id, name: user.name ?? "", email: user.email },
    accessToken,
    refreshTokenPlain,
    expiresAt,
  };
}

export async function loginUser(data: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) {
    throw Object.assign(new Error("Invalid credentials"), { status: 401 });
  }

  const valid = await verifyPassword(data.password, user.passwordHash);
  if (!valid) {
    throw Object.assign(new Error("Invalid credentials"), { status: 401 });
  }

  const accessToken = await issueAccessToken({ id: user.id });
  const { refreshTokenPlain, tokenHash, expiresAt } = await issueRefreshToken({
    id: user.id,
  });

  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  return {
    user: { id: user.id, name: user.name ?? "", email: user.email },
    accessToken,
    refreshTokenPlain,
    expiresAt,
  };
}

export async function refreshAccessToken(refreshTokenPlain: string) {
  const tokenHash = sha256Hex(refreshTokenPlain);
  const row = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!row || row.revokedAt || row.expiresAt < new Date()) {
    throw Object.assign(new Error("Refresh token revoked or expired"), { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: row.userId } });
  if (!user) {
    throw Object.assign(new Error("User not found"), { status: 401 });
  }

  const accessToken = await issueAccessToken({ id: user.id });
  return { accessToken };
}

export async function revokeRefreshToken(refreshTokenPlain: string) {
  const tokenHash = sha256Hex(refreshTokenPlain);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
