import { create } from "zustand";

export type VideoTreeItem = {
  id: string;
  title: string;
  order_index: number;
  is_completed: boolean;
  locked: boolean;
};

export type SectionTreeItem = {
  id: string;
  title: string;
  order_index: number;
  videos: VideoTreeItem[];
};

export type SubjectTree = {
  id: string;
  title: string;
  sections: SectionTreeItem[];
};

interface SidebarState {
  tree: SubjectTree | null;
  loading: boolean;
  error: string | null;
  collapsedSections: Set<string>;

  setTree: (tree: SubjectTree) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  markVideoCompleted: (videoId: string) => void;
  toggleSection: (sectionId: string) => void;
  reset: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  tree: null,
  loading: false,
  error: null,
  collapsedSections: new Set<string>(),

  setTree: (tree) => set({ tree, loading: false, error: null }),
  setLoading: (v) => set({ loading: v }),
  setError: (e) => set({ error: e, loading: false }),

  markVideoCompleted: (videoId) =>
    set((state) => {
      if (!state.tree) return state;
      const sections = state.tree.sections.map((s) => ({
        ...s,
        videos: s.videos.map((v) =>
          v.id === videoId ? { ...v, is_completed: true } : v
        ),
      }));

      const flat = sections.flatMap((s) => s.videos);
      const completedIds = new Set(flat.filter((v) => v.is_completed).map((v) => v.id));
      const unlocked = sections.map((s) => ({
        ...s,
        videos: s.videos.map((v) => {
          const idx = flat.findIndex((f) => f.id === v.id);
          const locked = idx > 0 ? !completedIds.has(flat[idx - 1].id) : false;
          return { ...v, locked };
        }),
      }));

      return { tree: { ...state.tree, sections: unlocked } };
    }),

  toggleSection: (sectionId) =>
    set((state) => {
      const next = new Set(state.collapsedSections);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return { collapsedSections: next };
    }),

  reset: () =>
    set({
      tree: null,
      loading: false,
      error: null,
      collapsedSections: new Set(),
    }),
}));
