import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  userId: z.string(),
  videoId: z.string(),
  // Resume/progress fields (seconds)
  last_position_seconds: z.number().int().nonnegative().optional(),
  // Completion fields
  is_completed: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const { userId, videoId, last_position_seconds, is_completed } = parsed.data;

    if (userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Enforce strict ordering:
    // - The first video is always unlocked.
    // - Every other video is unlocked only after the immediately previous video is completed.
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: { section: true },
    });
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const subject = await prisma.subject.findUnique({
      where: { id: video.section.subjectId },
      include: {
        sections: {
          orderBy: { orderIndex: "asc" },
          include: {
            videos: {
              orderBy: { orderIndex: "asc" },
            },
          },
        },
      },
    });
    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    const videosInOrder = subject.sections.flatMap((s) => s.videos);
    const videoIndex = videosInOrder.findIndex((v) => v.id === videoId);
    if (videoIndex < 0) {
      return NextResponse.json({ error: "Video not found in subject" }, { status: 404 });
    }

    const currentProgress = await prisma.videoProgress.findUnique({
      where: { userId_videoId: { userId, videoId } },
    });
    const currentIsCompleted =
      !!currentProgress?.isCompleted || !!currentProgress?.completedAt;

    let prereqCompleted = true;
    if (!currentIsCompleted && videoIndex > 0) {
      const prereqVideo = videosInOrder[videoIndex - 1];
      const prereqProgress = await prisma.videoProgress.findUnique({
        where: { userId_videoId: { userId, videoId: prereqVideo.id } },
      });
      prereqCompleted =
        !!prereqProgress?.isCompleted || !!prereqProgress?.completedAt;
    }

    const wantsToMarkComplete = is_completed === true;
    if (!prereqCompleted && wantsToMarkComplete) {
      return NextResponse.json(
        { error: "Video is locked" },
        { status: 403 }
      );
    }
    if (!prereqCompleted && !currentIsCompleted) {
      return NextResponse.json({ error: "Video is locked" }, { status: 403 });
    }

    await prisma.videoProgress.upsert({
      where: {
        userId_videoId: { userId, videoId },
      },
      create: {
        userId,
        videoId,
        lastPositionSeconds: last_position_seconds ?? 0,
        isCompleted: wantsToMarkComplete ?? false,
        completedAt: wantsToMarkComplete ? new Date() : null,
      },
      update: {
        lastPositionSeconds: last_position_seconds ?? undefined,
        isCompleted: wantsToMarkComplete ? true : undefined,
        completedAt: wantsToMarkComplete ? new Date() : undefined,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Progress error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
