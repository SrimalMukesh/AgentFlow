import type { Request, Response } from "express";
import { config } from "../config.js";
import type { ApiResponse, HealthStatus } from "../types/index.js";

export async function getHealth(_req: Request, res: Response): Promise<void> {
  const health: HealthStatus = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
  };

  const response: ApiResponse<HealthStatus> = {
    success: true,
    data: health,
  };

  res.json(response);
}
