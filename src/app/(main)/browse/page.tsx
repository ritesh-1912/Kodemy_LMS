import { prisma } from "@/lib/prisma";
import { CourseCard } from "@/components/course/CourseCard";
import { Suspense } from "react";

async function getSubjects(searchParams: {
  q?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
}) {
  const where: Record<string, unknown> = { isPublished: true };

  if (searchParams.q) {
    where.OR = [
      { title: { contains: searchParams.q } },
      { description: { contains: searchParams.q } },
    ];
  }
  if (searchParams.category) {
    where.category = searchParams.category;
  }
  if (
    (searchParams.minPrice !== undefined && searchParams.minPrice !== "") ||
    (searchParams.maxPrice !== undefined && searchParams.maxPrice !== "")
  ) {
    const priceFilter: { gte?: number; lte?: number } = {};
    if (searchParams.minPrice) priceFilter.gte = parseFloat(searchParams.minPrice);
    if (searchParams.maxPrice) priceFilter.lte = parseFloat(searchParams.maxPrice);
    where.price = priceFilter;
  }

  return prisma.subject.findMany({
    where,
    include: {
      instructor: { select: { name: true } },
      reviews: { select: { rating: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; minPrice?: string; maxPrice?: string }>;
}) {
  const params = await searchParams;
  const subjects = await getSubjects(params);

  const subjectsWithAvg = subjects.map((c) => ({
    ...c,
    avgRating:
      c.reviews.length > 0
        ? c.reviews.reduce((s, r) => s + r.rating, 0) / c.reviews.length
        : 0,
    totalReviews: c.reviews.length,
  }));

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">
        {params.q ? `Search: "${params.q}"` : "Browse courses"}
      </h1>
      <Suspense fallback={<div className="text-muted-foreground">Loading...</div>}>
        {subjectsWithAvg.length === 0 ? (
          <p className="text-muted-foreground">No courses found.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjectsWithAvg.map((subject) => (
              <CourseCard
                key={subject.id}
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
            ))}
          </div>
        )}
      </Suspense>
    </div>
  );
}
