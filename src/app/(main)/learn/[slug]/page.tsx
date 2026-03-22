import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { LearnView } from "@/components/learn/LearnView";

async function getSubject(slug: string) {
  return prisma.subject.findUnique({
    where: { slug, isPublished: true },
    include: {
      sections: {
        include: {
          videos: {
            orderBy: { orderIndex: "asc" },
            include: {
              resources: { orderBy: { order: "asc" } },
              quiz: { include: { questions: { orderBy: { order: "asc" } } } },
              assignment: true,
            },
          },
        },
        orderBy: { orderIndex: "asc" },
      },
    },
  });
}

async function getEnrollment(userId: string, subjectId: string) {
  return prisma.enrollment.findUnique({
    where: { userId_subjectId: { userId, subjectId } },
  });
}

async function getVideoProgress(userId: string) {
  return prisma.videoProgress.findMany({
    where: { userId },
    select: {
      videoId: true,
      lastPositionSeconds: true,
      isCompleted: true,
      completedAt: true,
    },
  });
}

export default async function LearnPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lesson?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/signin");

  const { slug } = await params;
  const { lesson: videoId } = await searchParams;

  const subject = await getSubject(slug);
  if (!subject) notFound();

  const enrollment = await getEnrollment(session.user.id, subject.id);
  if (!enrollment) redirect(`/course/${slug}`);

  const progress = await getVideoProgress(session.user.id);

  const allVideos = subject.sections.flatMap((s) => s.videos);
  const firstVideo = allVideos[0];
  const currentVideo = videoId
    ? allVideos.find((v) => v.id === videoId)
    : firstVideo;
  const resolvedVideo = currentVideo ?? firstVideo;
  if (!resolvedVideo) {
    return (
      <div className="container py-12">
        <p className="text-muted-foreground">This subject has no videos yet.</p>
      </div>
    );
  }

  const completedVideoIds = new Set(
    progress
      .filter((p) => p.isCompleted || !!p.completedAt)
      .map((p) => p.videoId)
  );

  const lockedVideoReasons: Record<string, string> = {};
  allVideos.forEach((v, idx) => {
    if (completedVideoIds.has(v.id)) return;
    if (idx === 0) return;
    const prereq = allVideos[idx - 1];
    if (!completedVideoIds.has(prereq.id)) {
      lockedVideoReasons[v.id] = "Complete the previous video to unlock this video.";
    }
  });

  const currentProgress = progress.find(
    (p) => p.videoId === resolvedVideo.id
  );
  const lastPositionSeconds = currentProgress?.lastPositionSeconds ?? 0;

  const currentVideoLocked = Boolean(lockedVideoReasons[resolvedVideo.id]);
  const currentUnlockReason = lockedVideoReasons[resolvedVideo.id];

  const progressPct =
    allVideos.length > 0
      ? Math.round((completedVideoIds.size / allVideos.length) * 100)
      : 0;

  let userNote = "";
  if (resolvedVideo) {
    const note = await prisma.videoNote.findUnique({
      where: { userId_videoId: { userId: session.user.id, videoId: resolvedVideo.id } },
    });
    userNote = note?.content ?? "";
  }

  let quizAttempts: { score: number; passed: boolean }[] = [];
  type LearnViewAssignment = NonNullable<Parameters<typeof LearnView>[0]["assignment"]>;
  let assignmentForView: LearnViewAssignment | null = null;
  if (resolvedVideo.quiz) {
    const attempts = await prisma.quizAttempt.findMany({
      where: { quizId: resolvedVideo.quiz.id, enrollmentId: enrollment.id },
      orderBy: { createdAt: "asc" },
    });
    quizAttempts = attempts.map((a) => ({ score: a.score, passed: a.passed }));
  }
  if (resolvedVideo.assignment) {
    const sub = await prisma.assignmentSubmission.findFirst({
      where: {
        assignmentId: resolvedVideo.assignment.id,
        userId: session.user.id,
      },
    });
    assignmentForView = {
      ...resolvedVideo.assignment,
      submissions: sub ? [sub] : [],
    };
  }

  type LearnViewCourse = Parameters<typeof LearnView>[0]["course"];
  type LearnViewLesson = Parameters<typeof LearnView>[0]["currentLesson"];

  return (
    <LearnView
      course={subject as LearnViewCourse}
      currentLesson={resolvedVideo as LearnViewLesson}
      completedLessonIds={Array.from(completedVideoIds)}
      lockedLessonReasons={lockedVideoReasons}
      currentLessonLocked={currentVideoLocked}
      currentUnlockReason={currentUnlockReason}
      lastPositionSeconds={lastPositionSeconds}
      progressPct={progressPct}
      enrollmentId={enrollment.id}
      userNote={userNote}
      quizAttempts={quizAttempts}
      assignment={assignmentForView}
      quiz={
        resolvedVideo.quiz
          ? {
              ...resolvedVideo.quiz,
              questions: resolvedVideo.quiz.questions.map((q) => ({
                ...q,
                options: JSON.parse(q.options) as string[],
              })),
            }
          : null
      }
    />
  );
}
