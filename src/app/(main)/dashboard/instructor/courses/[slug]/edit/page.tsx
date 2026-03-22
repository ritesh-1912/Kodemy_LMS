import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { LessonLmsForm } from "@/components/lms/LessonLmsForm";

export default async function CourseEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/signin");

  const canInstruct =
    session.user?.role === "INSTRUCTOR" || session.user?.role === "BOTH";
  if (!canInstruct) redirect("/dashboard");

  const { slug } = await params;
  const subject = await prisma.subject.findUnique({
    where: { slug, instructorId: session.user.id },
    include: {
      sections: {
        include: {
          videos: {
            include: {
              resources: { orderBy: { order: "asc" } },
              quiz: { include: { questions: { orderBy: { order: "asc" } } } },
              assignment: true,
            },
            orderBy: { orderIndex: "asc" },
          },
        },
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  if (!subject) notFound();

  return (
    <div className="container max-w-4xl py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/dashboard/instructor/courses"
            className="text-sm text-muted-foreground hover:underline mb-2 block"
          >
            Back to My Courses
          </Link>
          <h1 className="text-2xl font-bold">Edit: {subject.title}</h1>
          <p className="text-sm text-muted-foreground">
            Add resources, quizzes, and assignments to your videos
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {subject.sections.map((section) => (
          <div key={section.id} className="border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">{section.title}</h2>
            <div className="space-y-6">
              {section.videos.map((video) => (
                <LessonLmsForm
                  key={video.id}
                  lesson={video}
                  courseSlug={subject.slug}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
