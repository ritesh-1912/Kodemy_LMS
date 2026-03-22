import * as videoRepo from "./video.repository.js";
import { prisma } from "../../config/db.js";
import { ensureEnrollment } from "../../utils/enrollment.js";
import {
  getGlobalVideoSequence,
  getPrevNextVideoIds,
  isVideoUnlocked,
  getCompletedVideoIds,
} from "../../utils/ordering.js";

export async function getVideoMeta(videoId: string, userId: string) {
  const video = await videoRepo.findVideoWithSubject(videoId);
  if (!video || !video.section.subject.isPublished) return null;

  const subjectId = video.section.subject.id;
  await ensureEnrollment(userId, subjectId);
  const sequence = await getGlobalVideoSequence(subjectId);
  const idx = sequence.findIndex((v) => v.id === video.id);
  if (idx < 0) return null;

  const progressRows = await prisma.videoProgress.findMany({
    where: { userId, video: { section: { subjectId } } },
    select: { videoId: true, isCompleted: true, completedAt: true },
  });

  const completedIds = getCompletedVideoIds(progressRows);
  const locked = !isVideoUnlocked(video.id, sequence, completedIds);
  const { previousVideoId, nextVideoId } = getPrevNextVideoIds(
    video.id,
    sequence
  );

  const unlockReason = locked && idx > 0
    ? `Complete "${sequence[idx - 1].title}" first.`
    : null;

  return {
    id: video.id,
    title: video.title,
    description: video.description,
    youtube_url: video.youtubeUrl,
    order_index: video.orderIndex,
    duration_seconds: video.durationSeconds,
    section_id: video.sectionId,
    section_title: video.section.title,
    subject_id: subjectId,
    subject_title: video.section.subject.title,
    locked,
    unlock_reason: unlockReason,
    previous_video_id: previousVideoId,
    next_video_id: nextVideoId,
  };
}
