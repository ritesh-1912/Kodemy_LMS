import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const subjectSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  thumbnail: z.string().url().optional().nullable().or(z.literal("")),
  category: z.string().min(1),
  price: z.number().min(0),
  sections: z.array(
    z.object({
      title: z.string().min(1),
      orderIndex: z.number(),
      videos: z.array(
        z.object({
          title: z.string().min(1),
          youtubeUrl: z.string().url(),
          durationSeconds: z.number().optional().nullable(),
          orderIndex: z.number(),
        })
      ),
    })
  ),
});

function slugify(text: string) {
  const base = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .trim();
  return base || "subject-" + Date.now();
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = session.user.role as string;
    if (role !== "INSTRUCTOR" && role !== "BOTH") {
      return NextResponse.json({ error: "Instructor access required" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = subjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { title, description, thumbnail, category, price, sections } = parsed.data;

    let slug = slugify(title);
    const existing = await prisma.subject.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const subject = await prisma.subject.create({
      data: {
        title,
        slug,
        description: description || null,
        thumbnail: thumbnail || null,
        category,
        price,
        isPublished: false,
        instructorId: session.user.id,
        sections: {
          create: sections.map((sec) => ({
            title: sec.title,
            orderIndex: sec.orderIndex,
            videos: {
              create: sec.videos.map((v) => ({
                title: v.title,
                youtubeUrl: v.youtubeUrl,
                durationSeconds: v.durationSeconds,
                orderIndex: v.orderIndex,
              })),
            },
          })),
        },
      },
    });

    return NextResponse.json({ id: subject.id, slug: subject.slug });
  } catch (error) {
    console.error("Subject create error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
