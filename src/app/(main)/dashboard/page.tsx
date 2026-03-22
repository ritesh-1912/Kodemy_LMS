import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: session.user.id },
    include: {
      subject: {
        include: {
          instructor: { select: { name: true } },
          sections: {
            include: { videos: { select: { id: true } } },
          },
          reviews: { select: { rating: true } },
        },
      },
    },
  });

  const videoProgressRows = await prisma.videoProgress.findMany({
    where: { userId: session.user.id },
    select: { videoId: true, isCompleted: true, completedAt: true },
  });
  const progressByVideoId = new Map(
    videoProgressRows.map((p) => [p.videoId, p])
  );

  const coursesWithProgress = enrollments.map((e) => {
    const subject = e.subject;
    const videoIds = subject.sections.flatMap((sec) =>
      sec.videos.map((v) => v.id)
    );
    const totalLessons = videoIds.length;
    const completed = videoIds.filter((id) => {
      const p = progressByVideoId.get(id);
      return p && (p.isCompleted || !!p.completedAt);
    }).length;
    const percent =
      totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;
    const avgRating =
      subject.reviews.length > 0
        ? subject.reviews.reduce((s, r) => s + r.rating, 0) /
          subject.reviews.length
        : 0;
    return {
      ...subject,
      progressPercent: percent,
      totalLessons,
      completedLessons: completed,
      avgRating,
      totalReviews: subject.reviews.length,
    };
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My learning</h1>
      {coursesWithProgress.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground mb-4">
            You haven&apos;t enrolled in any courses yet.
          </p>
          <Button asChild>
            <Link href="/browse">Browse courses</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {coursesWithProgress.map((course) => (
            <div
              key={course.id}
              className="flex flex-col md:flex-row gap-4 p-4 rounded-lg border"
            >
              <div className="flex-1">
                <Link
                  href={`/learn/${course.slug}`}
                  className="font-semibold text-lg hover:underline"
                >
                  {course.title}
                </Link>
                <p className="text-sm text-muted-foreground mb-2">
                  {course.instructor.name}
                </p>
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-sm">
                    {course.completedLessons} / {course.totalLessons} lessons
                  </span>
                  <Progress value={course.progressPercent} className="w-48" />
                  <span className="text-sm font-medium">
                    {course.progressPercent}%
                  </span>
                </div>
              </div>
              <Button asChild variant="outline">
                <Link href={`/learn/${course.slug}`}>Continue</Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
