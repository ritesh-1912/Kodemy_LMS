import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const postSchema = z.object({
  subjectId: z.string(),
  title: z.string().min(1),
  content: z.string().min(1),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get("subjectId");
  if (!subjectId) {
    return NextResponse.json({ error: "subjectId required" }, { status: 400 });
  }

  const announcements = await prisma.subjectAnnouncement.findMany({
    where: { subjectId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(announcements);
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

    const { subjectId, title, content } = parsed.data;

    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, instructorId: session.user.id },
    });
    if (!subject) {
      return NextResponse.json({ error: "Not instructor" }, { status: 403 });
    }

    const announcement = await prisma.subjectAnnouncement.create({
      data: { subjectId, title, content },
    });
    return NextResponse.json(announcement);
  } catch (error) {
    console.error("Announcement error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
