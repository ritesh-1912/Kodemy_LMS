export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin ${className}`}
    />
  );
}
