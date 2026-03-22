import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CourseCard } from "@/components/course/CourseCard";
import { Button } from "@/components/ui/button";

export default async function InstructorCoursesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/signin");

  const canInstruct =
    session.user?.role === "INSTRUCTOR" || session.user?.role === "BOTH";
  if (!canInstruct) redirect("/dashboard");

  const subjects = await prisma.subject.findMany({
    where: { instructorId: session.user.id },
    include: {
      instructor: { select: { name: true } },
      enrollments: { select: { id: true } },
      reviews: { select: { rating: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const subjectsWithStats = subjects.map((c) => ({
    ...c,
    enrollmentsCount: c.enrollments.length,
    avgRating:
      c.reviews.length > 0
        ? c.reviews.reduce((s, r) => s + r.rating, 0) / c.reviews.length
        : 0,
    totalReviews: c.reviews.length,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My courses</h1>
        <Button asChild>
          <Link href="/dashboard/instructor/courses/new">Create course</Link>
        </Button>
      </div>
      {subjectsWithStats.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground mb-4">
            You haven&apos;t created any courses yet.
          </p>
          <Button asChild>
            <Link href="/dashboard/instructor/courses/new">
              Create your first course
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjectsWithStats.map((subject) => (
            <div key={subject.id} className="relative">
              <CourseCard
                title={subject.title}
                slug={subject.slug}
                description={subject.description}
                thumbnail={subject.thumbnail}
                category={subject.category}
                price={subject.price}
                instructorName={subject.instructor.name}
                rating={subject.avgRating}
                totalReviews={subject.totalReviews}
              />
              <div className="mt-2 flex gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/dashboard/instructor/courses/${subject.slug}/edit`}>
                    Edit
                  </Link>
                </Button>
                <span className="text-sm text-muted-foreground self-center">
                  {subject.enrollmentsCount} students
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
