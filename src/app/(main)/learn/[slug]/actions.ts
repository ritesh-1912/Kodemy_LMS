"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function markVideoComplete(
  enrollmentId: string,
  videoId: string,
  lastPositionSeconds?: number
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const enrollment = await prisma.enrollment.findFirst({
    where: { id: enrollmentId, userId: session.user.id },
  });
  if (!enrollment) throw new Error("Enrollment not found");

  const subject = await prisma.subject.findUnique({
    where: { id: enrollment.subjectId },
    include: {
      sections: {
        orderBy: { orderIndex: "asc" },
        include: { videos: { orderBy: { orderIndex: "asc" } } },
      },
    },
  });

  if (!subject) throw new Error("Subject not found");

  const videosInOrder = subject.sections.flatMap((s) => s.videos);
  const videoIndex = videosInOrder.findIndex((v) => v.id === videoId);
  if (videoIndex < 0) throw new Error("Video not found in subject");

  if (videoIndex > 0) {
    const prereqVideo = videosInOrder[videoIndex - 1];
    const prereqProgress = await prisma.videoProgress.findUnique({
      where: {
        userId_videoId: {
          userId: session.user.id,
          videoId: prereqVideo.id,
        },
      },
    });
    const prereqCompleted =
      !!prereqProgress?.isCompleted || !!prereqProgress?.completedAt;
    if (!prereqCompleted) {
      throw new Error("Video is locked");
    }
  }

  await prisma.videoProgress.upsert({
    where: {
      userId_videoId: { userId: session.user.id, videoId },
    },
    create: {
      userId: session.user.id,
      videoId,
      lastPositionSeconds: lastPositionSeconds ?? 0,
      isCompleted: true,
      completedAt: new Date(),
    },
    update: {
      lastPositionSeconds: lastPositionSeconds ?? undefined,
      isCompleted: true,
      completedAt: new Date(),
    },
  });

  const subjectMeta = await prisma.subject.findUnique({
    where: { id: enrollment.subjectId },
  });
  if (subjectMeta) {
    revalidatePath(`/learn/${subjectMeta.slug}`);
    revalidatePath("/dashboard");
  }
}
