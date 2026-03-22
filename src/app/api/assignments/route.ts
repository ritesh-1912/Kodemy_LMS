import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const submitSchema = z.object({
  assignmentId: z.string(),
  content: z.string().optional(),
  fileUrl: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { assignmentId, content, fileUrl } = parsed.data;
    if (!content && !fileUrl) {
      return NextResponse.json(
        { error: "Provide content or file URL" },
        { status: 400 }
      );
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { video: { include: { section: { include: { subject: true } } } } },
    });
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_subjectId: {
          userId: session.user.id,
          subjectId: assignment.video.section.subject.id,
        },
      },
    });
    if (!enrollment) {
      return NextResponse.json({ error: "Not enrolled" }, { status: 403 });
    }

    const existing = await prisma.assignmentSubmission.findFirst({
      where: { assignmentId, userId: session.user.id },
    });
    if (existing) {
      const updated = await prisma.assignmentSubmission.update({
        where: { id: existing.id },
        data: { content: content ?? undefined, fileUrl: fileUrl ?? undefined },
      });
      return NextResponse.json(updated);
    }

    const submission = await prisma.assignmentSubmission.create({
      data: {
        assignmentId,
        userId: session.user.id,
        content: content ?? null,
        fileUrl: fileUrl ?? null,
      },
    });
    return NextResponse.json(submission);
  } catch (error) {
    console.error("Assignment submit error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
