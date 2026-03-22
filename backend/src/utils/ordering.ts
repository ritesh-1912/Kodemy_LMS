import { prisma } from "../config/db.js";
import type { FlatVideo } from "./ordering.logic.js";

export type { FlatVideo } from "./ordering.logic.js";
export {
  getPrerequisiteVideoId,
  getPrevNextVideoIds,
  isVideoUnlocked,
  getCompletedVideoIds,
} from "./ordering.logic.js";

export async function getGlobalVideoSequence(
  subjectId: string
): Promise<FlatVideo[]> {
  const sections = await prisma.section.findMany({
    where: { subjectId },
    orderBy: { orderIndex: "asc" },
    include: {
      videos: {
        orderBy: { orderIndex: "asc" },
        select: {
          id: true,
          title: true,
          sectionId: true,
          orderIndex: true,
          durationSeconds: true,
        },
      },
    },
  });
  return sections.flatMap((s) => s.videos);
}
