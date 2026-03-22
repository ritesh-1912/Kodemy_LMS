import { create } from "zustand";

interface VideoState {
  currentVideoId: string | null;
  subjectId: string | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isCompleted: boolean;
  nextVideoId: string | null;
  prevVideoId: string | null;
  setVideo: (data: Partial<VideoState>) => void;
  reset: () => void;
}

export const useVideoStore = create<VideoState>((set) => ({
  currentVideoId: null,
  subjectId: null,
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  isCompleted: false,
  nextVideoId: null,
  prevVideoId: null,
  setVideo: (data) => set((s) => ({ ...s, ...data })),
  reset: () =>
    set({
      currentVideoId: null,
      subjectId: null,
      currentTime: 0,
      duration: 0,
      isPlaying: false,
      isCompleted: false,
      nextVideoId: null,
      prevVideoId: null,
    }),
}));
