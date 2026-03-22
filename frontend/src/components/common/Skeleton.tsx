export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-md bg-muted animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted via-surface-hover to-muted ${className}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>
    </div>
  );
}
