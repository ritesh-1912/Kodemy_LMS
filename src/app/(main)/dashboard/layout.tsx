import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, BookOpen, User } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/signin?callbackUrl=/dashboard");

  const canInstruct =
    session.user?.role === "INSTRUCTOR" || session.user?.role === "BOTH";

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-56 flex-shrink-0 space-y-1">
          <h2 className="font-semibold text-sm text-muted-foreground mb-4">
            Dashboard
          </h2>
          <nav className="space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted text-sm"
            >
              <LayoutDashboard className="h-4 w-4" />
              My learning
            </Link>
            {canInstruct && (
              <>
                <Link
                  href="/dashboard/instructor/courses"
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted text-sm"
                >
                  <BookOpen className="h-4 w-4" />
                  My courses
                </Link>
                <Link
                  href="/dashboard/instructor/courses/new"
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted text-sm"
                >
                  <BookOpen className="h-4 w-4" />
                  Create course
                </Link>
              </>
            )}
            <Link
              href="/profile"
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted text-sm"
            >
              <User className="h-4 w-4" />
              Profile
            </Link>
          </nav>
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
