"use client";

import { FileText, ExternalLink } from "lucide-react";

interface Resource {
  id: string;
  title: string;
  url: string;
  type: string;
}

export function LessonResources({ resources }: { resources: Resource[] }) {
  if (resources.length === 0) return null;
  return (
    <div className="mt-6 p-4 rounded-lg border bg-muted/30">
      <h3 className="font-semibold mb-3">Resources</h3>
      <ul className="space-y-2">
        {resources.map((r) => (
          <li key={r.id}>
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              {r.type === "link" ? (
                <ExternalLink className="h-4 w-4" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {r.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
