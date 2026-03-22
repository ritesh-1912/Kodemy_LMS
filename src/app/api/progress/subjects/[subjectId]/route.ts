import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAccessTokenFromRequest } from "@/lib/jwtAuth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  const tokenPayload = await requireAccessTokenFromRequest(req);
  if (!tokenPayload?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { subjectId } = await params;
  const subject = await prisma.subject.findUnique({
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

  if (!subject) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const flatVideos = subject.sections.flatMap((s) => s.videos);

  const progressRows = await prisma.videoProgress.findMany({
    where: {
      userId: tokenPayload.sub,
      video: { section: { subjectId: subject.id } },
    },
    select: { videoId: true, lastPositionSeconds: true, isCompleted: true, completedAt: true },
  });

  const completedVideoIds = new Set(
    progressRows
      .filter((p) => p.isCompleted || !!p.completedAt)
      .map((p) => p.videoId)
  );

  const total_videos = flatVideos.length;
  const completed_videos = completedVideoIds.size;
  const percent_complete =
    total_videos > 0 ? Math.round((completed_videos / total_videos) * 100) : 0;

  let lastVideoId: string | null = null;
  let lastPositionSeconds = 0;

  const completedInOrder = flatVideos
    .map((v) => v.id)
    .filter((id) => completedVideoIds.has(id));

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

  return NextResponse.json({
    total_videos,
    completed_videos,
    percent_complete,
    last_video_id: lastVideoId,
    last_position_seconds: lastPositionSeconds,
  });
}
