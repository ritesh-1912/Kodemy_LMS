import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  const { subjectId } = await params;
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: { sections: { include: { videos: true } } },
  });
  if (!subject) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const total_videos = subject.sections.reduce((sum, s) => sum + s.videos.length, 0);
  return NextResponse.json({
    id: subject.id,
    title: subject.title,
    slug: subject.slug,
    description: subject.description,
    thumbnail: subject.thumbnail,
    category: subject.category,
    is_published: subject.isPublished,
    total_videos,
  });
}
