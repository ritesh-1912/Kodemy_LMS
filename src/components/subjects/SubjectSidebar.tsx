"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Lock, Check } from "lucide-react";
import { apiGet } from "@/lib/apiClient";

type VideoTreeItem = {
  id: string;
  title: string;
  order_index: number;
  is_completed: boolean;
  locked: boolean;
};

type SubjectTree = {
  id: string;
  title: string;
  sections: Array<{
    id: string;
    title: string;
    order_index: number;
    videos: VideoTreeItem[];
  }>;
};

export function SubjectSidebar({
  subjectId,
  activeVideoId,
  onNavigateLocked,
}: {
  subjectId: string;
  activeVideoId?: string;
  onNavigateLocked?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const activeFromPath = useMemo(() => {
    if (!pathname) return undefined;
    const match = pathname.match(/\/subjects\/[^/]+\/video\/([^/]+)/);
    return match?.[1];
  }, [pathname]);

  const [tree, setTree] = useState<SubjectTree | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        const data = await apiGet<SubjectTree>(`/api/subjects/${subjectId}/tree`);
        if (!cancelled) setTree(data);
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : "Failed to load subject tree";
          if (msg.includes(": 401")) router.push("/signin");
          setError(msg);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [subjectId, pathname, router]);

  const sections = useMemo(() => tree?.sections ?? [], [tree]);
  const resolvedActiveVideoId = activeVideoId ?? activeFromPath;

  return (
    <aside className="w-full lg:w-80 lg:sticky lg:top-20 h-fit border rounded-xl bg-muted/20 p-4">
      <h3 className="font-semibold mb-1">Course content</h3>
      <p className="text-xs text-muted-foreground mb-4">
        Strict order enabled. Complete each video to unlock the next.
      </p>

      {error ? (
        <div className="text-sm text-destructive">{error}</div>
      ) : null}

      {!tree ? (
        <div className="text-muted-foreground text-sm">Loading content...</div>
      ) : (
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.id}>
              <p className="font-medium text-sm mb-2">{section.title}</p>
              <ul className="space-y-1">
                {section.videos.map((video) => {
                  const done = video.is_completed;
                  const active = resolvedActiveVideoId === video.id;

                  if (video.locked && !done) {
                    return (
                      <li key={video.id}>
                        <span
                          className={`flex items-center gap-2 py-1.5 px-2 rounded text-sm ${
                            active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
                          }`}
                          aria-disabled="true"
                          title="Locked"
                        >
                          <Lock className="h-4 w-4 shrink-0" />
                          <span className="truncate">{video.title}</span>
                        </span>
                      </li>
                    );
                  }

                  return (
                    <li key={video.id}>
                      <Link
                        href={`/subjects/${subjectId}/video/${video.id}`}
                        className={`flex items-center gap-2 py-1.5 px-2 rounded text-sm hover:bg-muted/50 ${
                          active ? "bg-primary/10 text-primary font-medium" : ""
                        }`}
                        onClick={() => {
                          if (video.locked && !done) onNavigateLocked?.();
                        }}
                      >
                        {done ? (
                          <Check className="h-4 w-4 text-green-600 shrink-0" />
                        ) : (
                          <span className="w-4 h-4 rounded-full border shrink-0" />
                        )}
                        <span className="truncate">{video.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}

