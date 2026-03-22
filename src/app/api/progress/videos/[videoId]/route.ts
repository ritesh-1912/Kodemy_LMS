import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAccessTokenFromRequest } from "@/lib/jwtAuth";

const schema = z.object({
  last_position_seconds: z.number().nonnegative(),
  is_completed: z.boolean(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const tokenPayload = await requireAccessTokenFromRequest(req);
  if (!tokenPayload?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { videoId } = await params;
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

  const progress = await prisma.videoProgress.findUnique({
    where: { userId_videoId: { userId: tokenPayload.sub, videoId } },
    select: { lastPositionSeconds: true, isCompleted: true, completedAt: true },
  });

  return NextResponse.json({
    last_position_seconds: progress?.lastPositionSeconds ?? 0,
    is_completed: Boolean(progress?.isCompleted || progress?.completedAt),
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const tokenPayload = await requireAccessTokenFromRequest(req);
  if (!tokenPayload?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { videoId } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { last_position_seconds, is_completed } = parsed.data;

  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: { section: { include: { subject: true } } },
  });
  if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

  const subject = await prisma.subject.findUnique({
    where: { id: video.section.subjectId },
    include: {
      sections: {
        orderBy: { orderIndex: "asc" },
        include: {
          videos: {
            orderBy: { orderIndex: "asc" },
            select: { id: true, title: true, durationSeconds: true },
          },
        },
      },
    },
  });
  if (!subject) return NextResponse.json({ error: "Subject not found" }, { status: 404 });

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
  if (idx < 0) return NextResponse.json({ error: "Video not in subject tree" }, { status: 404 });

  const locked = idx > 0 ? !completedVideoIds.has(flatVideos[idx - 1].id) : false;
  if (locked) {
    return NextResponse.json(
      { error: "Video is locked", unlock_reason: `Complete "${flatVideos[idx - 1].title}" first.` },
      { status: 403 }
    );
  }

  const cappedSeconds =
    video.durationSeconds == null
      ? last_position_seconds
      : Math.min(last_position_seconds, video.durationSeconds);

  await prisma.videoProgress.upsert({
    where: { userId_videoId: { userId: tokenPayload.sub, videoId } },
    create: {
      userId: tokenPayload.sub,
      videoId,
      lastPositionSeconds: Math.floor(cappedSeconds),
      isCompleted: is_completed,
      completedAt: is_completed ? new Date() : null,
    },
    update: {
      lastPositionSeconds: Math.floor(cappedSeconds),
      isCompleted: is_completed,
      completedAt: is_completed ? new Date() : undefined,
    },
  });

  return NextResponse.json({ success: true });
}
