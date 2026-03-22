"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiGet } from "@/lib/apiClient";
import { Spinner } from "@/components/common/Spinner";

export default function SubjectStartPage() {
  const router = useRouter();
  const params = useParams<{ subjectId: string }>();
  const subjectId = params.subjectId;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiGet<{ video_id: string | null }>(
          `/api/subjects/${subjectId}/first-video`
        );
        if (cancelled) return;
        if (!data.video_id) {
          setError("No available videos yet.");
          return;
        }
        router.replace(`/subjects/${subjectId}/${data.video_id}`);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to start");
        }
      }
    })();
    return () => { cancelled = true; };
  }, [router, subjectId]);

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-20">
      <Spinner className="h-8 w-8" />
    </div>
  );
}
