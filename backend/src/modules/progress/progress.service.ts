import * as progressRepo from "./progress.repository.js";
import { prisma } from "../../config/db.js";
import {
  getGlobalVideoSequence,
  isVideoUnlocked,
  getCompletedVideoIds,
} from "../../utils/ordering.js";

export async function getVideoProgress(userId: string, videoId: string) {
  const row = await progressRepo.findVideoProgress(userId, videoId);
  return {
    last_position_seconds: row?.lastPositionSeconds ?? 0,
    is_completed: Boolean(row?.isCompleted || row?.completedAt),
  };
}

export async function updateVideoProgress(
  userId: string,
  videoId: string,
  data: { last_position_seconds: number; is_completed: boolean }
) {
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: { section: true },
  });
  if (!video) {
    throw Object.assign(new Error("Video not found"), { status: 404 });
  }

  const subjectId = video.section.subjectId;
  const sequence = await getGlobalVideoSequence(subjectId);
  const progressRows = await progressRepo.findSubjectProgressRows(
    userId,
    subjectId
  );
  const completedIds = getCompletedVideoIds(progressRows);

  if (!isVideoUnlocked(videoId, sequence, completedIds)) {
    const idx = sequence.findIndex((v) => v.id === videoId);
    const prevTitle = idx > 0 ? sequence[idx - 1].title : "previous video";
    throw Object.assign(
      new Error(`Video is locked. Complete "${prevTitle}" first.`),
      { status: 403 }
    );
  }

  const cappedSeconds =
    video.durationSeconds == null
      ? data.last_position_seconds
      : Math.min(data.last_position_seconds, video.durationSeconds);

  await progressRepo.upsertVideoProgress(userId, videoId, {
    lastPositionSeconds: Math.floor(Math.max(0, cappedSeconds)),
    isCompleted: data.is_completed,
  });

  return { success: true };
}

export async function getSubjectProgress(userId: string, subjectId: string) {
  const subject = await prisma.subject.findFirst({
    where: { id: subjectId, isPublished: true },
    include: {
      sections: {
        orderBy: { orderIndex: "asc" },
        include: {
          videos: {
            orderBy: { orderIndex: "asc" },
            select: { id: true },
          },
        },
      },
    },
  });

  if (!subject) {
    throw Object.assign(new Error("Not found"), { status: 404 });
  }

  const flatVideos = subject.sections.flatMap((s) => s.videos);
  const progressRows = await progressRepo.findSubjectProgressRows(
    userId,
    subjectId
  );
  const completedIds = getCompletedVideoIds(progressRows);

  const totalVideos = flatVideos.length;
  const completedVideos = completedIds.size;
  const percentComplete =
    totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

  let lastVideoId: string | null = null;
  let lastPositionSeconds = 0;

  const completedInOrder = flatVideos
    .map((v) => v.id)
    .filter((id) => completedIds.has(id));

  if (completedInOrder.length > 0) {
    lastVideoId = completedInOrder[completedInOrder.length - 1];
  } else {
    const watched = [...progressRows].sort(
      (a, b) => b.lastPositionSeconds - a.lastPositionSeconds
    )[0];
    if (watched) {
      lastVideoId = watched.videoId;
      lastPositionSeconds = watched.lastPositionSeconds;
    }
  }

  if (lastVideoId) {
    const row = progressRows.find((p) => p.videoId === lastVideoId);
    lastPositionSeconds = row?.lastPositionSeconds ?? lastPositionSeconds;
  }

  return {
    total_videos: totalVideos,
    completed_videos: completedVideos,
    percent_complete: percentComplete,
    last_video_id: lastVideoId,
    last_position_seconds: lastPositionSeconds,
  };
}
