import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { enrollmentId, quizId, answers } = await req.json();
    if (!enrollmentId || !quizId || !answers) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: { id: enrollmentId, userId: session.user.id },
    });
    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: { orderBy: { order: "asc" } } },
    });
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const attempts = await prisma.quizAttempt.findMany({
      where: { quizId, enrollmentId },
    });
    if (quiz.maxAttempts != null && attempts.length >= quiz.maxAttempts) {
      return NextResponse.json(
        { error: "Maximum attempts reached" },
        { status: 400 }
      );
    }

    let correct = 0;
    for (const q of quiz.questions) {
      const userAnswer = answers[q.id];
      if (typeof userAnswer === "number" && userAnswer === q.correct) {
        correct++;
      }
    }
    const score = Math.round((correct / quiz.questions.length) * 100);
    const passed = score >= quiz.passScore;

    await prisma.quizAttempt.create({
      data: {
        enrollmentId,
        quizId,
        score,
        passed,
        answers: JSON.stringify(answers),
      },
    });

    return NextResponse.json({ score, passed });
  } catch (error) {
    console.error("Quiz attempt error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
