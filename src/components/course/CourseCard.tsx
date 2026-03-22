import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

interface CourseCardProps {
  title: string;
  slug: string;
  description?: string | null;
  thumbnail?: string | null;
  category: string;
  price: number;
  instructorName?: string | null;
  rating?: number;
  totalReviews?: number;
}

export function CourseCard({
  title,
  slug,
  description,
  thumbnail,
  category,
  price,
  instructorName,
  rating = 0,
  totalReviews = 0,
}: CourseCardProps) {
  return (
    <Link href={`/course/${slug}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
        <div className="relative aspect-video w-full bg-muted overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnail || "https://picsum.photos/seed/course/400/300"}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
        <CardContent className="p-4 flex-1">
          <Badge variant="secondary" className="mb-2">
            {category}
          </Badge>
          <h3 className="font-semibold text-lg line-clamp-2 mb-1">{title}</h3>
          {instructorName && (
            <p className="text-sm text-muted-foreground mb-2">
              {instructorName}
            </p>
          )}
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
          {(rating > 0 || totalReviews > 0) && (
            <div className="flex items-center gap-1 mt-2">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-medium">{rating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">
                ({totalReviews} reviews)
              </span>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <span className="font-bold text-lg">
            {price === 0 ? "Free" : `$${price.toFixed(2)}`}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
