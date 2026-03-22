import * as subjectRepo from "./subject.repository.js";
import { prisma } from "../../config/db.js";
import { ensureEnrollment } from "../../utils/enrollment.js";
import {
  getGlobalVideoSequence,
  isVideoUnlocked,
  getCompletedVideoIds,
} from "../../utils/ordering.js";

export async function listSubjects(opts: {
  page: number;
  pageSize: number;
  q?: string;
}) {
  const { total, subjects } = await subjectRepo.findPublishedSubjects(opts);
  return {
    subjects: subjects.map((s) => ({
      id: s.id,
      title: s.title,
      slug: s.slug,
      description: s.description,
      thumbnail: s.thumbnail,
      is_published: s.isPublished,
    })),
    page: opts.page,
    pageSize: opts.pageSize,
    total,
  };
}

export async function getSubject(id: string) {
  const subject = await subjectRepo.findSubjectById(id);
  if (!subject) return null;

  const totalVideos = subject.sections.reduce(
    (sum, s) => sum + s.videos.length,
    0
  );
  return {
    id: subject.id,
    title: subject.title,
    slug: subject.slug,
    description: subject.description,
    thumbnail: subject.thumbnail,
    is_published: subject.isPublished,
    total_videos: totalVideos,
  };
}

export async function getSubjectTree(subjectId: string, userId: string) {
  const subject = await subjectRepo.findPublishedSubjectWithTree(subjectId);
  if (!subject) return null;

  await ensureEnrollment(userId, subject.id);

  const sequence = subject.sections.flatMap((s) => s.videos);

  const progressRows = await prisma.videoProgress.findMany({
    where: {
      userId,
      video: { section: { subjectId: subject.id } },
    },
    select: { videoId: true, isCompleted: true, completedAt: true },
  });

  const completedIds = getCompletedVideoIds(progressRows);

  const sections = subject.sections.map((s) => ({
    id: s.id,
    title: s.title,
    order_index: s.orderIndex,
    videos: s.videos.map((v) => ({
      id: v.id,
      title: v.title,
      order_index: v.orderIndex,
      is_completed: completedIds.has(v.id),
      locked: !isVideoUnlocked(v.id, sequence, completedIds),
    })),
  }));

  return { id: subject.id, title: subject.title, sections };
}

export async function getFirstUnlockedVideo(
  subjectId: string,
  userId: string
) {
  await ensureEnrollment(userId, subjectId);

  const sequence = await getGlobalVideoSequence(subjectId);
  if (sequence.length === 0) return null;

  const progressRows = await prisma.videoProgress.findMany({
    where: {
      userId,
      video: { section: { subjectId } },
    },
    select: { videoId: true, isCompleted: true, completedAt: true },
  });

  const completedIds = getCompletedVideoIds(progressRows);

  const first = sequence.find((v) =>
    isVideoUnlocked(v.id, sequence, completedIds)
  );
  return first?.id ?? null;
}
