import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get("videoId");
  if (!videoId) {
    return NextResponse.json({ error: "videoId required" }, { status: 400 });
  }

  const note = await prisma.videoNote.findFirst({
    where: { videoId, userId: session.user.id },
  });
  return NextResponse.json(note || { content: "" });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { videoId, content } = body;
  if (!videoId) {
    return NextResponse.json({ error: "videoId required" }, { status: 400 });
  }

  const note = await prisma.videoNote.upsert({
    where: {
      userId_videoId: { userId: session.user.id, videoId },
    },
    create: {
      videoId,
      userId: session.user.id,
      content: content ?? "",
    },
    update: { content: content ?? "" },
  });
  return NextResponse.json(note);
}
