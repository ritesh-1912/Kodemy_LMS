"use client";

import { useState } from "react";
import { ChevronDown, Play } from "lucide-react";

type Section = {
  id: string;
  title: string;
  orderIndex: number;
  videos: {
    id: string;
    title: string;
    orderIndex: number;
    durationSeconds: number | null;
  }[];
};

export function CurriculumPreview({
  sections,
}: {
  sections: Section[];
}) {
  const [openSections, setOpenSections] = useState<Set<string>>(
    () => new Set(sections.slice(0, 2).map((s) => s.id))
  );

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalVideos = sections.reduce((s, sec) => s + sec.videos.length, 0);

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground mb-4">
        {sections.length} sections · {totalVideos} videos
      </p>
      {sections.map((section) => (
        <div key={section.id} className="rounded-lg border overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection(section.id)}
            className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  openSections.has(section.id) ? "rotate-0" : "-rotate-90"
                }`}
              />
              <span className="font-medium">{section.title}</span>
              <span className="text-sm text-muted-foreground">
                ({section.videos.length} videos)
              </span>
            </div>
          </button>
          {openSections.has(section.id) && (
            <div className="border-t">
              {section.videos.map((video) => (
                <div
                  key={video.id}
                  className="flex items-center gap-2 px-4 py-2 border-b last:border-b-0 text-sm"
                >
                  <Play className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{video.title}</span>
                  {video.durationSeconds ? (
                    <span className="text-muted-foreground ml-auto">
                      {Math.round(video.durationSeconds / 60)} min
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
