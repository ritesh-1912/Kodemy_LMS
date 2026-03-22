"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Check, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useSidebarStore } from "@/store/sidebarStore";
import { apiGet } from "@/lib/apiClient";
import type { SubjectTree } from "@/lib/types";
import { Spinner } from "@/components/common/Spinner";

export function SubjectSidebar({ subjectId }: { subjectId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    tree,
    loading,
    error,
    collapsedSections,
    setTree,
    setLoading,
    setError,
    toggleSection,
  } = useSidebarStore();

  const activeVideoId = useMemo(() => {
    if (!pathname) return undefined;
    const match = pathname.match(/\/video\/([^/]+)/);
    return match?.[1];
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiGet<SubjectTree>(`/subjects/${subjectId}/tree`)
      .then((data) => {
        if (!cancelled) setTree(data);
      })
      .catch((e) => {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Failed to load";
        if (msg.includes("401")) {
          router.push(
            `/auth/login?callbackUrl=${encodeURIComponent(pathname ?? "/")}`
          );
          return;
        }
        setError(msg);
      });
    return () => {
      cancelled = true;
    };
  }, [subjectId, pathname, router, setTree, setLoading, setError]);

  const sections = tree?.sections ?? [];
  const total = sections.reduce((n, s) => n + s.videos.length, 0);
  const completed = sections.reduce(
    (n, s) => n + s.videos.filter((v) => v.is_completed).length,
    0
  );
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <aside className="w-full lg:w-80 lg:sticky lg:top-[4rem] h-fit max-h-[calc(100vh-5rem)] overflow-y-auto rounded-xl border border-border bg-surface p-4">
      <div className="mb-4">
        <h3 className="font-heading font-semibold text-sm">Course content</h3>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-secondary transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {completed}/{total}
          </span>
        </div>
      </div>

      {loading && !tree ? (
        <div className="flex items-center justify-center py-8">
          <Spinner />
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <div className="space-y-1">
          {sections.map((section) => {
            const isCollapsed = collapsedSections.has(section.id);
            return (
              <div key={section.id}>
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center gap-2 py-2 px-2 rounded-md hover:bg-surface-hover transition-colors text-left"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
                    {section.title}
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.ul
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      {section.videos.map((video) => {
                        const isActive = activeVideoId === video.id;
                        const isDone = video.is_completed;
                        const isLocked = video.locked && !isDone;

                        if (isLocked) {
                          return (
                            <li key={video.id}>
                              <button
                                onClick={() =>
                                  toast.error(
                                    "Complete the previous video first"
                                  )
                                }
                                className={`w-full flex items-center gap-2 py-1.5 px-3 pl-7 rounded-md text-sm text-left ${
                                  isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground/60 hover:text-muted-foreground"
                                } transition-colors`}
                              >
                                <Lock className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{video.title}</span>
                              </button>
                            </li>
                          );
                        }

                        return (
                          <li key={video.id}>
                            <Link
                              href={`/subjects/${subjectId}/video/${video.id}`}
                              className={`flex items-center gap-2 py-1.5 px-3 pl-7 rounded-md text-sm transition-colors ${
                                isActive
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "hover:bg-surface-hover"
                              }`}
                            >
                              {isDone ? (
                                <Check className="h-3.5 w-3.5 text-secondary shrink-0" />
                              ) : (
                                <span className="w-3.5 h-3.5 rounded-full border border-muted-foreground/40 shrink-0" />
                              )}
                              <span className="truncate">{video.title}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}
