import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("pageSize") ?? "12", 10)));
  const q = url.searchParams.get("q")?.trim();

  let where: Prisma.SubjectWhereInput = { isPublished: true };
  if (q) {
    where = {
      isPublished: true,
      OR: [
        { title: { contains: q } },
        { description: { contains: q } },
      ],
    };
  }

  const [total, subjects] = await Promise.all([
    prisma.subject.count({ where }),
    prisma.subject.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { instructor: { select: { name: true } } },
    }),
  ]);

  return NextResponse.json({
    subjects: subjects.map((s) => ({
      id: s.id,
      title: s.title,
      slug: s.slug,
      description: s.description,
      thumbnail: s.thumbnail,
      category: s.category,
      price: s.price,
      instructor_name: s.instructor?.name ?? null,
    })),
    page,
    pageSize,
    total,
  });
}
