-- CreateTable
CREATE TABLE "AgentTask" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "agentId" INTEGER NOT NULL,
    "task" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "selectedServiceId" INTEGER,
    "reasoning" TEXT NOT NULL DEFAULT '',
    "alternativesJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AgentTask_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AgentTask_selectedServiceId_fkey" FOREIGN KEY ("selectedServiceId") REFERENCES "Service" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
