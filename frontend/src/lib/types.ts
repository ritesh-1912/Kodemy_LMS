export type SubjectListItem = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  /** Cover image URL for cards */
  thumbnail?: string | null;
  is_published: boolean;
};

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

export type VideoMeta = {
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

export type VideoProgressData = {
  last_position_seconds: number;
  is_completed: boolean;
};

export type SubjectProgress = {
  total_videos: number;
  completed_videos: number;
  percent_complete: number;
  last_video_id: string | null;
  last_position_seconds: number;
};

export type AuthResponse = {
  access_token: string;
  user: { id: string; name: string; email: string };
};
