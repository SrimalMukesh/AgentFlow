import { prisma } from "../db/client.js";

export async function getAllActivity() {
  return prisma.agentActivity.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      agent: {
        select: {
          id: true,
          name: true,
          model: true,
        },
      },
    },
  });
}
