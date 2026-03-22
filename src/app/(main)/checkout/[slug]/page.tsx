import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

async function getSubject(slug: string) {
  return prisma.subject.findUnique({
    where: { slug, isPublished: true },
    include: { instructor: { select: { name: true } } },
  });
}

async function getEnrollment(userId: string, subjectId: string) {
  return prisma.enrollment.findUnique({
    where: { userId_subjectId: { userId, subjectId } },
  });
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=${encodeURIComponent(`/checkout/${slug}`)}`);
  }

  const subject = await getSubject(slug);
  if (!subject) notFound();

  const enrollment = await getEnrollment(session.user.id, subject.id);
  if (enrollment) {
    redirect(`/learn/${slug}`);
  }

  return (
    <div className="container max-w-2xl py-12">
      <h1 className="text-2xl font-bold mb-6">Complete your purchase</h1>
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="font-semibold mb-2">{subject.title}</h2>
          <p className="text-sm text-muted-foreground mb-4">
            by {subject.instructor.name}
          </p>
          <p className="text-2xl font-bold">
            ${Number(subject.price).toFixed(2)}
          </p>
        </div>
        <CheckoutForm courseId={subject.id} courseSlug={subject.slug} />
      </div>
    </div>
  );
}
