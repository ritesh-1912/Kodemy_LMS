"use client";

import ReactPlayer from "react-player";
import { useEffect, useRef } from "react";

interface VideoPlayerProps {
  url: string;
  onEnded?: () => void;
  startSeconds?: number;
  onProgress?: (playedSeconds: number) => void;
}

function withStartSeconds(src: string, startSeconds: number) {
  const safeStart = Math.max(0, Math.floor(startSeconds));
  if (!src || safeStart <= 0) return src;

  // YouTube supports `start` in query params for common URL formats.
  if (src.includes("youtube.com") || src.includes("youtu.be")) {
    try {
      const url = new URL(src);
      url.searchParams.set("start", String(safeStart));
      return url.toString();
    } catch {
      const joiner = src.includes("?") ? "&" : "?";
      return `${src}${joiner}start=${safeStart}`;
    }
  }

  // Vimeo often accepts `#t=` for start time.
  if (src.includes("vimeo.com")) {
    const base = src.split("#")[0];
    return `${base}#t=${safeStart}s`;
  }

  // For raw files (mp4/webm), ReactPlayer types don't expose seeking.
  // We rely on setting `currentTime` via the player ref in `onReady`.
  return src;
}

export function VideoPlayer({
  url,
  onEnded,
  startSeconds = 0,
  onProgress,
}: VideoPlayerProps) {
  const playerRef = useRef<HTMLVideoElement | null>(null);
  const seekedForSrcRef = useRef<string | null>(null);

  useEffect(() => {
    seekedForSrcRef.current = null;
  }, [url, startSeconds]);

  const playbackSrc = withStartSeconds(url, startSeconds);

  const handleReady = () => {
    if (!playerRef.current) return;
    if (seekedForSrcRef.current === playbackSrc) return;

    const safeStart = Math.max(0, startSeconds);
    if (safeStart > 0) {
      try {
        // Works for native <video> sources; for iframes (YouTube/Vimeo),
        // the start param is handled by `withStartSeconds`.
        playerRef.current.currentTime = safeStart;
      } catch {
        // Non-fatal.
      }
    }
    seekedForSrcRef.current = playbackSrc;
  };

  return (
    <div className="aspect-video bg-black rounded-lg overflow-hidden">
      <ReactPlayer
        ref={playerRef}
        src={playbackSrc}
        controls
        width="100%"
        height="100%"
        onReady={handleReady}
        onEnded={onEnded}
        onProgress={(state: unknown) => {
          const seconds = (state as { playedSeconds?: number })
            .playedSeconds;
          if (typeof seconds === "number") onProgress?.(seconds);
        }}
      />
    </div>
  );
}
