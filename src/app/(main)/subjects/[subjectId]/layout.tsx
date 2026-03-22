import { SubjectSidebar } from "@/components/Sidebar/SubjectSidebar";
import { AuthGuard } from "@/components/Auth/AuthGuard";

export default function SubjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { subjectId: string };
}) {
  return (
    <AuthGuard>
      <div className="container py-6 lg:py-8">
        <div className="flex flex-col-reverse lg:flex-row gap-6 items-start">
          <div className="flex-1 min-w-0">{children}</div>
          <SubjectSidebar subjectId={params.subjectId} />
        </div>
      </div>
    </AuthGuard>
  );
}
