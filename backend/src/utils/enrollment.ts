import { prisma } from "../config/db.js";

/** Ensures a row exists so profile / analytics can reflect active learners (open courses). */
export async function ensureEnrollment(
  userId: string,
  subjectId: string
): Promise<void> {
  await prisma.enrollment.upsert({
    where: { userId_subjectId: { userId, subjectId } },
    update: {},
    create: { userId, subjectId },
  });
}
