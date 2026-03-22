"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Check, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { apiGet } from "@/lib/apiClient";
import { sendProgress, sendProgressAndWait, flushProgress } from "@/lib/progress";
import { useVideoStore } from "@/store/videoStore";
import { useSidebarStore } from "@/store/sidebarStore";
import { VideoPlayer } from "@/components/Video/VideoPlayer";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/common/Spinner";

type VideoMeta = {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  order_index: number;
  duration_seconds: number | null;
  section_id: string;
  section_title: string;
  subject_id: string;
  subject_title: string;
  locked: boolean;
  unlock_reason: string | null;
  previous_video_id: string | null;
  next_video_id: string | null;
};

type VideoProgress = {
  last_position_seconds: number;
  is_completed: boolean;
};

export default function VideoPage() {
  const router = useRouter();
  const params = useParams<{ subjectId: string; videoId: string }>();
  const subjectId = params.subjectId;
  const videoId = params.videoId;

  const [meta, setMeta] = useState<VideoMeta | null>(null);
  const [progress, setProgress] = useState<VideoProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const setVideo = useVideoStore((s) => s.setVideo);
  const markVideoCompleted = useSidebarStore((s) => s.markVideoCompleted);
  const latestTimeRef = useRef(0);
  const completingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    completingRef.current = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const m = await apiGet<VideoMeta>(`/api/videos/${videoId}`);
        if (cancelled) return;
        setMeta(m);
        setVideo({
          currentVideoId: m.id,
          subjectId: m.subject_id,
          nextVideoId: m.next_video_id,
          prevVideoId: m.previous_video_id,
          isCompleted: false,
          duration: m.duration_seconds ?? 0,
        });

        if (!m.locked) {
          const p = await apiGet<VideoProgress>(
            `/api/progress/videos/${videoId}`
          );
          if (cancelled) return;
          setProgress(p);
          latestTimeRef.current = p.last_position_seconds;
          setVideo({ isCompleted: p.is_completed, currentTime: p.last_position_seconds });
        } else {
          setProgress(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load video");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      flushProgress();
    };
  }, [videoId, setVideo]);

  const isLocked = meta?.locked ?? false;
  const isCompleted = progress?.is_completed ?? false;

  const handleProgress = useCallback(
    (seconds: number) => {
      if (!meta || isLocked || isCompleted) return;
      latestTimeRef.current = seconds;
      setVideo({ currentTime: seconds });
      sendProgress(meta.id, seconds, false);
    },
    [meta, isLocked, isCompleted, setVideo]
  );

  const handleCompleted = useCallback(async () => {
    if (!meta || isLocked || completingRef.current) return;
    completingRef.current = true;

    await sendProgressAndWait(meta.id, latestTimeRef.current, true);

    markVideoCompleted(meta.id);
    setVideo({ isCompleted: true });
    setProgress((p) => (p ? { ...p, is_completed: true } : p));

    if (meta.next_video_id) {
      router.push(`/subjects/${subjectId}/${meta.next_video_id}`);
    }
  }, [meta, isLocked, markVideoCompleted, setVideo, router, subjectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!meta) return null;

  const startAt = Math.max(0, (progress?.last_position_seconds ?? 0) - 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex-1 min-w-0 space-y-5"
    >
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">
          {meta.subject_title} / {meta.section_title}
        </p>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {meta.title}
        </h1>
      </div>

      {isLocked && !isCompleted ? (
        <div className="aspect-video rounded-xl border border-border bg-surface flex flex-col items-center justify-center text-center p-8">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="font-heading font-semibold text-lg">
            Video locked
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            {meta.unlock_reason ?? "Complete the previous video to unlock this one."}
          </p>
        </div>
      ) : (
        <VideoPlayer
          videoId={meta.id}
          youtubeUrl={meta.youtube_url}
          startPositionSeconds={startAt}
          onProgress={handleProgress}
          onCompleted={handleCompleted}
        />
      )}

      {meta.description && (
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {meta.description}
        </p>
      )}

      <div className="flex items-center justify-between border-t border-border pt-4">
        <div>
          {meta.previous_video_id ? (
            <Button asChild variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
              <Link href={`/subjects/${subjectId}/${meta.previous_video_id}`}>
                <ChevronLeft className="h-4 w-4" /> Previous
              </Link>
            </Button>
          ) : (
            <div />
          )}
        </div>

        <div className="flex items-center gap-3">
          {isCompleted && (
            <span className="flex items-center gap-1.5 text-secondary text-sm font-medium">
              <Check className="h-4 w-4" /> Completed
            </span>
          )}

          {meta.next_video_id && isCompleted ? (
            <Button asChild size="sm" className="bg-primary hover:bg-primary/90 gap-1">
              <Link href={`/subjects/${subjectId}/${meta.next_video_id}`}>
                Next <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : !meta.next_video_id && isCompleted ? (
            <Button asChild size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <Link href={`/subjects/${subjectId}`}>Subject complete</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
