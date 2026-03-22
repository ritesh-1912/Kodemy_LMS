import { prisma } from "../../config/db.js";

export async function findVideoProgress(userId: string, videoId: string) {
  return prisma.videoProgress.findUnique({
    where: { userId_videoId: { userId, videoId } },
    select: {
      lastPositionSeconds: true,
      isCompleted: true,
      completedAt: true,
    },
  });
}

export async function upsertVideoProgress(
  userId: string,
  videoId: string,
  data: {
    lastPositionSeconds: number;
    isCompleted: boolean;
  }
) {
  return prisma.videoProgress.upsert({
    where: { userId_videoId: { userId, videoId } },
    create: {
      userId,
      videoId,
      lastPositionSeconds: data.lastPositionSeconds,
      isCompleted: data.isCompleted,
      completedAt: data.isCompleted ? new Date() : null,
    },
    update: {
      lastPositionSeconds: data.lastPositionSeconds,
      isCompleted: data.isCompleted,
      completedAt: data.isCompleted ? new Date() : undefined,
    },
  });
}

export async function findSubjectProgressRows(
  userId: string,
  subjectId: string
) {
  return prisma.videoProgress.findMany({
    where: {
      userId,
      video: { section: { subjectId } },
    },
    select: {
      videoId: true,
      lastPositionSeconds: true,
      isCompleted: true,
      completedAt: true,
    },
  });
}
