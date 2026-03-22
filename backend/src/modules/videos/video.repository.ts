import { prisma } from "../../config/db.js";

export async function findVideoWithSubject(videoId: string) {
  return prisma.video.findUnique({
    where: { id: videoId },
    include: {
      section: { include: { subject: true } },
    },
  });
}
