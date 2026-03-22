"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { AuthGuard } from "@/components/Auth/AuthGuard";
import { apiGet } from "@/lib/apiClient";
import { VideoProgressBar } from "@/components/Video/VideoProgressBar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Spinner } from "@/components/common/Spinner";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { SubjectListItem, SubjectProgress } from "@/lib/types";

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}

function ProfileContent() {
  const user = useAuthStore((s) => s.user);
  const [subjects, setSubjects] = useState<
    (SubjectListItem & SubjectProgress)[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const listing = await apiGet<{ subjects: SubjectListItem[] }>(
          "/subjects?page=1&pageSize=50"
        );
        const withProgress = await Promise.all(
          listing.subjects.map(async (s) => {
            try {
              const prog = await apiGet<SubjectProgress>(
                `/progress/subjects/${s.id}`
              );
              return { ...s, ...prog };
            } catch {
              return {
                ...s,
                total_videos: 0,
                completed_videos: 0,
                percent_complete: 0,
                last_video_id: null,
                last_position_seconds: 0,
              };
            }
          })
        );
        if (!cancelled)
          setSubjects(withProgress.filter((s) => s.total_videos > 0));
      } catch {
        /* swallow */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const initial =
    user?.name?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "?";

  return (
    <div className="container max-w-2xl py-10 space-y-8">
      <div className="flex items-center gap-5">
        <Avatar className="h-16 w-16 border border-border">
          <AvatarFallback className="bg-primary/20 text-primary text-xl font-heading font-bold">
            {initial}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="font-heading text-2xl font-bold">
            {user?.name || "Student"}
          </h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <div>
        <h2 className="font-heading text-lg font-semibold mb-4">
          Your progress
        </h2>
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner className="h-6 w-6" />
          </div>
        ) : subjects.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              No enrolled subjects yet. Start learning!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {subjects.map((s) => (
              <div
                key={s.id}
                className="rounded-xl border border-border bg-surface p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-heading font-semibold">{s.title}</h3>
                    {s.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {s.description}
                      </p>
                    )}
                  </div>
                  {s.last_video_id && (
                    <Button
                      asChild
                      size="sm"
                      variant="ghost"
                      className="shrink-0 text-primary hover:text-primary"
                    >
                      <Link
                        href={`/subjects/${s.id}/video/${s.last_video_id}`}
                      >
                        Continue
                      </Link>
                    </Button>
                  )}
                </div>
                <VideoProgressBar
                  completed={s.completed_videos}
                  total={s.total_videos}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
