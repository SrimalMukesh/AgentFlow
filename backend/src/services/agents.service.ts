import { prisma } from "../db/client.js";
import { AppError } from "../middleware/errorHandler.js";

export async function getAllAgents() {
  return prisma.agent.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      activities: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });
}

export async function getAgentById(id: number) {
  const agent = await prisma.agent.findUnique({
    where: { id },
    include: {
      activities: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
  if (!agent) {
    throw new AppError(`Agent with id ${id} not found`, 404);
  }
  return agent;
}
