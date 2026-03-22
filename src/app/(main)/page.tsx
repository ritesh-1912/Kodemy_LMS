"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { apiGet } from "@/lib/apiClient";
import { CardSkeleton } from "@/components/common/Skeleton";
import { BookOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type SubjectItem = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  thumbnail?: string | null;
  category: string;
  price: number;
  instructor_name: string | null;
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export default function SubjectListingPage() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await apiGet<{ subjects: SubjectItem[] }>(
          `/api/subjects?page=1&pageSize=12`
        );
        if (!cancelled) setSubjects(data.subjects);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="container py-10 space-y-10">
      <motion.section
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl"
      >
        <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight">
          Learn with{" "}
          <span className="text-primary">strict order</span>
        </h1>
        <p className="text-muted-foreground mt-3 text-lg leading-relaxed">
          Pick a subject. Videos unlock one at a time as you complete each lesson.
          No skipping. Resume from exactly where you left off.
        </p>
      </motion.section>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="font-heading text-xl font-semibold">No subjects yet</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Check back later or seed the database.
          </p>
        </div>
      ) : (
        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {subjects.map((s) => (
            <motion.div
              key={s.id}
              variants={cardVariants}
              whileHover={{ scale: 1.02, y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Link href={`/subjects/${s.id}`} className="group block">
                <div className="glass rounded-xl border border-border overflow-hidden transition-shadow duration-200 hover:border-primary/30 hover:shadow-[0_0_24px_rgba(108,99,255,0.12)]">
                  <div className="h-40 bg-muted relative overflow-hidden">
                    {s.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.thumbnail}
                        alt={s.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-surface/80 backdrop-blur border border-border text-foreground">
                        {s.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div>
                      <h2 className="font-heading font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                        {s.title}
                      </h2>
                      {s.instructor_name && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {s.instructor_name}
                        </p>
                      )}
                    </div>
                    {s.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {s.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-sm font-semibold text-secondary">
                        {s.price > 0 ? `$${s.price.toFixed(2)}` : "Free"}
                      </span>
                      <Button
                        size="sm"
                        className="bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border-0 gap-1"
                      >
                        Start <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
