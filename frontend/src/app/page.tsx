import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";
import type { SubjectListItem } from "@/lib/types";
import { SubjectThumbnail } from "@/components/course/SubjectThumbnail";

export const dynamic = "force-dynamic";

function apiBase(): string {
  const raw =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002/api";
  return raw.replace(/\/$/, "");
}

async function fetchSubjects(): Promise<{
  subjects: SubjectListItem[];
  error: string | null;
}> {
  const url = `${apiBase()}/subjects?page=1&pageSize=12`;
  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      return {
        subjects: [],
        error: `API error ${res.status}. Is the backend running? (${url})`,
      };
    }
    const data = (await res.json()) as { subjects?: SubjectListItem[] };
    return { subjects: data.subjects ?? [], error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    return {
      subjects: [],
      error: `${msg} — Start backend: cd backend && npm run dev (port 5002). API URL: ${apiBase()}`,
    };
  }
}

export default async function HomePage() {
  const { subjects, error } = await fetchSubjects();

  return (
    <div className="container py-10 space-y-10">
      <section className="max-w-2xl animate-fade-in">
        <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight">
          Learn with <span className="text-primary">strict order</span>
        </h1>
        <p className="text-muted-foreground mt-3 text-lg leading-relaxed">
          Pick a subject. Videos unlock one at a time as you complete each
          lesson. No skipping. Resume from exactly where you left off.
        </p>
      </section>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive whitespace-pre-wrap">
          {error}
        </div>
      )}

      {subjects.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="font-heading text-xl font-semibold">No subjects yet</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Seed the database:{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              cd backend && npx prisma db push && npm run db:seed
            </code>
          </p>
        </div>
      ) : subjects.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((s) => (
            <div
              key={s.id}
              className="transition-transform hover:-translate-y-1"
            >
              <Link href={`/subjects/${s.id}`} className="group block">
                <div className="glass rounded-xl border border-border overflow-hidden transition-shadow duration-200 hover:border-primary/30 hover:shadow-[0_0_24px_rgba(108,99,255,0.12)]">
                  <SubjectThumbnail
                    title={s.title}
                    slug={s.slug}
                    thumbnailUrl={s.thumbnail}
                  />
                  <div className="p-5 space-y-3">
                    <h2 className="font-heading font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                      {s.title}
                    </h2>
                    {s.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {s.description}
                      </p>
                    )}
                    <div className="flex items-center justify-end pt-1">
                      <span className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[0.8rem] font-medium bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground border-0 transition-colors">
                        Start <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
