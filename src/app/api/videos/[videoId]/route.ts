import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAccessTokenFromRequest } from "@/lib/jwtAuth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const tokenPayload = await requireAccessTokenFromRequest(req);
  if (!tokenPayload?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { videoId } = await params;
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: {
      section: { include: { subject: true } },
    },
  });

  if (!video || !video.section.subject.isPublished) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  const subject = await prisma.subject.findUnique({
    where: { id: video.section.subject.id },
    include: {
      sections: {
        orderBy: { orderIndex: "asc" },
        include: {
          videos: {
            orderBy: { orderIndex: "asc" },
            select: { id: true, title: true, orderIndex: true },
          },
        },
      },
    },
  });

  if (!subject) {
    return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  }

  const progressRows = await prisma.videoProgress.findMany({
    where: {
      userId: tokenPayload.sub,
      video: { section: { subjectId: subject.id } },
    },
    select: { videoId: true, isCompleted: true, completedAt: true },
  });

  const completedVideoIds = new Set(
    progressRows
      .filter((p) => p.isCompleted || !!p.completedAt)
      .map((p) => p.videoId)
  );

  const flatVideos = subject.sections.flatMap((s) => s.videos);
  const idx = flatVideos.findIndex((v) => v.id === video.id);
  if (idx < 0) {
    return NextResponse.json({ error: "Video not in subject tree" }, { status: 404 });
  }

  const locked = idx > 0 ? !completedVideoIds.has(flatVideos[idx - 1].id) : false;
  const unlock_reason = locked
    ? `Complete "${flatVideos[idx - 1].title}" first.`
    : null;

  return NextResponse.json({
    id: video.id,
    title: video.title,
    description: null,
    youtube_url: video.youtubeUrl,
    order_index: video.orderIndex,
    duration_seconds: video.durationSeconds,
    section_id: video.sectionId,
    section_title: video.section.title,
    subject_id: video.section.subject.id,
    subject_title: video.section.subject.title,
    locked,
    unlock_reason,
    previous_video_id: idx > 0 ? flatVideos[idx - 1].id : null,
    next_video_id: idx >= 0 && idx < flatVideos.length - 1 ? flatVideos[idx + 1].id : null,
  });
}
