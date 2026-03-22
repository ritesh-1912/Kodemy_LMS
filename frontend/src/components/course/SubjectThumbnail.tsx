import Image from "next/image";
import { resolveMaterialThumbnail } from "@/lib/subjectThumbnails";

type Props = {
  title: string;
  slug: string;
  thumbnailUrl?: string | null;
  className?: string;
};

export function SubjectThumbnail({
  title,
  slug,
  thumbnailUrl,
  className = "h-40",
}: Props) {
  const trimmed = thumbnailUrl?.trim();
  const src =
    trimmed && trimmed.length > 0
      ? trimmed
      : resolveMaterialThumbnail(slug, title);

  return (
    <div
      className={`relative w-full overflow-hidden bg-muted ${className}`}
    >
      <Image
        src={src}
        alt={title}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        priority={false}
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent pointer-events-none"
        aria-hidden
      />
    </div>
  );
}
