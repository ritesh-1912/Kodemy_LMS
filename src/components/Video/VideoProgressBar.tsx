"use client";

interface VideoProgressBarProps {
  completed: number;
  total: number;
}

export function VideoProgressBar({ completed, total }: VideoProgressBarProps) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          {completed} of {total} videos completed
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-secondary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
