import type { Request, Response } from "express";
import * as activityService from "../services/activity.service.js";
import type { ApiResponse } from "../types/index.js";

export async function getAll(_req: Request, res: Response): Promise<void> {
  const activity = await activityService.getAllActivity();
  const response: ApiResponse<typeof activity> = {
    success: true,
    data: activity,
  };
  res.json(response);
}
