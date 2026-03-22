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
            select: { id: true, title: true, orderIndex: true, durationSeconds: true },
          },
        },
      },
    },
  });

  if (!subject) return NextResponse.json({ error: "Not found" }, { status: 404 });

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

  const prereqCompleted = (idx: number) => {
    if (idx <= 0) return true;
    return completedVideoIds.has(flatVideos[idx - 1].id);
  };

  const sections = subject.sections.map((s) => ({
    id: s.id,
    title: s.title,
    order_index: s.orderIndex,
    videos: s.videos.map((v) => {
      const idx = flatVideos.findIndex((x) => x.id === v.id);
      const locked = idx < 0 ? true : !prereqCompleted(idx);
      return {
        id: v.id,
        title: v.title,
        order_index: v.orderIndex,
        is_completed: completedVideoIds.has(v.id),
        locked,
      };
    }),
  }));

  return NextResponse.json({
    id: subject.id,
    title: subject.title,
    sections,
  });
}
