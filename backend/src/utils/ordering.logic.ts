export type FlatVideo = {
  id: string;
  title: string;
  sectionId: string;
  orderIndex: number;
  durationSeconds: number | null;
};

export function getPrerequisiteVideoId(
  videoId: string,
  sequence: FlatVideo[]
): string | null {
  const idx = sequence.findIndex((v) => v.id === videoId);
  if (idx <= 0) return null;
  return sequence[idx - 1].id;
}

export function getPrevNextVideoIds(
  videoId: string,
  sequence: FlatVideo[]
): { previousVideoId: string | null; nextVideoId: string | null } {
  const idx = sequence.findIndex((v) => v.id === videoId);
  if (idx < 0) return { previousVideoId: null, nextVideoId: null };
  return {
    previousVideoId: idx > 0 ? sequence[idx - 1].id : null,
    nextVideoId: idx < sequence.length - 1 ? sequence[idx + 1].id : null,
  };
}

export function isVideoUnlocked(
  videoId: string,
  sequence: FlatVideo[],
  completedVideoIds: Set<string>
): boolean {
  const prereq = getPrerequisiteVideoId(videoId, sequence);
  if (!prereq) return true;
  return completedVideoIds.has(prereq);
}

export function getCompletedVideoIds(
  progressRows: Array<{
    videoId: string;
    isCompleted: boolean;
    completedAt: Date | null;
  }>
): Set<string> {
  return new Set(
    progressRows
      .filter((p) => p.isCompleted || !!p.completedAt)
      .map((p) => p.videoId)
  );
}
