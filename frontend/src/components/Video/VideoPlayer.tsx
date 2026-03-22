"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import YouTube from "react-youtube";
import { Spinner } from "@/components/common/Spinner";

type YTPlayer = {
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
};

interface VideoPlayerProps {
  videoId: string;
  youtubeUrl: string;
  startPositionSeconds?: number;
  onProgress?: (seconds: number) => void;
  onCompleted?: () => void;
}

function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export function VideoPlayer({
  youtubeUrl,
  startPositionSeconds = 0,
  onProgress,
  onCompleted,
}: VideoPlayerProps) {
  const playerRef = useRef<YTPlayer | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [ready, setReady] = useState(false);
  const ytId = extractYoutubeId(youtubeUrl);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    intervalRef.current = setInterval(() => {
      const player = playerRef.current;
      if (!player?.getCurrentTime) return;
      const t = player.getCurrentTime();
      if (typeof t === "number") onProgress?.(t);
    }, 5000);
  }, [clearTimer, onProgress]);

  useEffect(() => {
    return () => {
      clearTimer();
      const player = playerRef.current;
      if (player?.getCurrentTime) {
        const t = player.getCurrentTime();
        if (typeof t === "number") onProgress?.(t);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReady = (event: { target: YTPlayer }) => {
    playerRef.current = event.target;
    setReady(true);
  };

  const handleStateChange = (event: { data: number; target: YTPlayer }) => {
    const state = event.data;
    if (state === 1) startTimer();
    if (state === 2 || state === 0 || state === -1) {
      clearTimer();
      const player = playerRef.current;
      if (player?.getCurrentTime) {
        const t = player.getCurrentTime();
        if (typeof t === "number") onProgress?.(t);
      }
    }
    if (state === 0) onCompleted?.();
  };

  if (!ytId) {
    return (
      <div className="aspect-video bg-surface rounded-lg border border-border flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Video unavailable</p>
      </div>
    );
  }

  return (
    <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface z-10">
          <Spinner className="h-8 w-8" />
        </div>
      )}
      <YouTube
        videoId={ytId}
        opts={{
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: 1,
            start: Math.max(0, Math.floor(startPositionSeconds)),
            rel: 0,
            modestbranding: 1,
          },
        }}
        onReady={handleReady}
        onStateChange={handleStateChange}
        className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full"
      />
    </div>
  );
}
