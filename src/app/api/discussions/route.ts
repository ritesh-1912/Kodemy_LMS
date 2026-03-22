import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const postSchema = z.object({
  subjectId: z.string(),
  videoId: z.string().nullable(),
  content: z.string().min(1),
  parentId: z.string().nullable().optional(),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get("subjectId");
  if (!subjectId) {
    return NextResponse.json({ error: "subjectId required" }, { status: 400 });
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_subjectId: { userId: session.user.id, subjectId } },
  });
  if (!enrollment) {
    return NextResponse.json({ error: "Not enrolled" }, { status: 403 });
  }

  const discussions = await prisma.subjectDiscussion.findMany({
    where: { subjectId, parentId: null },
    orderBy: { createdAt: "desc" },
  });

  const replies = await prisma.subjectDiscussion.findMany({
    where: { subjectId, parentId: { not: null } },
    orderBy: { createdAt: "asc" },
  });

  const withReplies = discussions.map((d) => ({
    ...d,
    replies: replies.filter((r) => r.parentId === d.id),
  }));

  return NextResponse.json(withReplies);
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { subjectId, videoId, content, parentId } = parsed.data;

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_subjectId: { userId: session.user.id, subjectId } },
    });
    if (!enrollment) {
      return NextResponse.json({ error: "Not enrolled" }, { status: 403 });
    }

    const post = await prisma.subjectDiscussion.create({
      data: {
        subjectId,
        userId: session.user.id,
        videoId: videoId ?? undefined,
        content,
        parentId: parentId ?? undefined,
      },
    });
    return NextResponse.json(post);
  } catch (error) {
    console.error("Discussion post error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
