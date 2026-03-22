import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BookOpen, Star } from "lucide-react";
import { CurriculumPreview } from "@/components/course/CurriculumPreview";

async function getSubject(slug: string) {
  const subject = await prisma.subject.findUnique({
    where: { slug, isPublished: true },
    include: {
      instructor: { select: { id: true, name: true, email: true } },
      sections: {
        include: {
          videos: { orderBy: { orderIndex: "asc" } },
        },
        orderBy: { orderIndex: "asc" },
      },
      reviews: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });
  return subject;
}

async function getEnrollment(userId: string | undefined, subjectId: string) {
  if (!userId) return null;
  return prisma.enrollment.findUnique({
    where: { userId_subjectId: { userId, subjectId } },
  });
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  const subject = await getSubject(slug);
  if (!subject) notFound();

  const enrollment = await getEnrollment(session?.user?.id, subject.id);
  const isEnrolled = !!enrollment;

  const totalVideos = subject.sections.reduce((s, sec) => s + sec.videos.length, 0);
  const avgRating =
    subject.reviews.length > 0
      ? subject.reviews.reduce((s, r) => s + r.rating, 0) / subject.reviews.length
      : 0;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-muted/30 border-b">
        <div className="container py-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-shrink-0">
              <div className="aspect-video w-full md:w-96 rounded-lg overflow-hidden bg-muted">
                {subject.thumbnail ? (
                  <img
                    src={subject.thumbnail}
                    alt={subject.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1">
              <Badge variant="secondary" className="mb-2">
                {subject.category}
              </Badge>
              <h1 className="text-3xl font-bold mb-2">{subject.title}</h1>
              <p className="text-muted-foreground mb-4 line-clamp-2">
                {subject.description}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {avgRating.toFixed(1)} ({subject.reviews.length} reviews)
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {totalVideos} videos
                </span>
                <span className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>
                      {subject.instructor.name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  {subject.instructor.name}
                </span>
              </div>

              {isEnrolled ? (
                <Button asChild size="lg">
                  <Link href={`/learn/${subject.slug}`}>Go to course</Link>
                </Button>
              ) : (
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold">
                    ${Number(subject.price).toFixed(2)}
                  </span>
                  <Button asChild size="lg">
                    <Link href={`/checkout/${subject.slug}`}>Enroll now</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container py-8">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">About this course</h2>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {subject.description}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="curriculum">
            <CurriculumPreview sections={subject.sections} />
          </TabsContent>
          <TabsContent value="reviews">
            <div className="space-y-4">
              {subject.reviews.length === 0 ? (
                <p className="text-muted-foreground">No reviews yet.</p>
              ) : (
                subject.reviews.map((r) => (
                  <Card key={r.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-medium">{r.rating}/5</span>
                        <span className="text-muted-foreground">
                          {r.user.name}
                        </span>
                      </div>
                      {r.content && <p className="text-sm">{r.content}</p>}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
