import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({ subjectId: z.string().min(1) });

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const { subjectId } = parsed.data;

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId, isPublished: true },
    });
    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    const existing = await prisma.enrollment.findUnique({
      where: {
        userId_subjectId: { userId: session.user.id, subjectId },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Already enrolled" },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.enrollment.create({
        data: {
          userId: session.user.id,
          subjectId,
        },
      }),
      prisma.order.create({
        data: {
          userId: session.user.id,
          subjectId,
          amount: subject.price,
          status: "completed",
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Enroll error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
