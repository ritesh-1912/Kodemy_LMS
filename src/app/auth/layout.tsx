export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-surface p-10 border-r border-border">
        <div>
          <span className="font-heading text-2xl font-bold tracking-tight text-primary">
            Kodemy
          </span>
        </div>
        <blockquote className="max-w-lg">
          <p className="text-xl font-heading font-semibold leading-relaxed text-foreground/90">
            &ldquo;The beautiful thing about learning is that no one can take it
            away from you.&rdquo;
          </p>
          <footer className="mt-4 text-sm text-muted-foreground">
            — B.B. King
          </footer>
        </blockquote>
        <p className="text-xs text-muted-foreground">
          Strict video ordering. Resume anywhere. Track everything.
        </p>
      </div>
      <div className="flex items-center justify-center p-6 lg:p-10">
        {children}
      </div>
    </div>
  );
}
