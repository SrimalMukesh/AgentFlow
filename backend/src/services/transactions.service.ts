import { prisma } from "../db/client.js";

export async function getAllTransactions() {
  return prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      service: {
        select: {
          id: true,
          name: true,
          category: true,
          provider: true,
        },
      },
    },
  });
}
