import { prisma } from "../../config/db.js";
import type { Prisma } from "@prisma/client";

export async function findPublishedSubjects(opts: {
  page: number;
  pageSize: number;
  q?: string;
}) {
  let where: Prisma.SubjectWhereInput = { isPublished: true };
  if (opts.q) {
    where = {
      isPublished: true,
      OR: [
        { title: { contains: opts.q } },
        { description: { contains: opts.q } },
      ],
    };
  }

  const [total, subjects] = await Promise.all([
    prisma.subject.count({ where }),
    prisma.subject.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (opts.page - 1) * opts.pageSize,
      take: opts.pageSize,
    }),
  ]);

  return { total, subjects };
}

export async function findSubjectById(id: string) {
  return prisma.subject.findUnique({
    where: { id },
    include: { sections: { include: { videos: true } } },
  });
}

export async function findPublishedSubjectWithTree(id: string) {
  return prisma.subject.findFirst({
    where: { id, isPublished: true },
    include: {
      sections: {
        orderBy: { orderIndex: "asc" },
        include: {
          videos: {
            orderBy: { orderIndex: "asc" },
            select: {
              id: true,
              title: true,
              orderIndex: true,
              durationSeconds: true,
              sectionId: true,
            },
          },
        },
      },
    },
  });
}
