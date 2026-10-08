import type { Request, Response } from "express";
import * as policyService from "../services/policy.service.js";
import { AppError } from "../middleware/errorHandler.js";
import type { ApiResponse } from "../types/index.js";

export async function getPolicy(_req: Request, res: Response): Promise<void> {
  const policy = await policyService.getPolicy();
  const response: ApiResponse<typeof policy> = {
    success: true,
    data: policy,
  };
  res.json(response);
}

export async function updatePolicy(req: Request, res: Response): Promise<void> {
  const { dailyLimit, maxTransaction, autoApproveLimit, enabled, spentToday } = req.body;

  const policy = await policyService.updatePolicy({
    dailyLimit: typeof dailyLimit === "number" ? dailyLimit : undefined,
    maxTransaction: typeof maxTransaction === "number" ? maxTransaction : undefined,
    autoApproveLimit: typeof autoApproveLimit === "number" ? autoApproveLimit : undefined,
    enabled: typeof enabled === "boolean" ? enabled : undefined,
    spentToday: typeof spentToday === "number" ? spentToday : undefined,
  });

  const response: ApiResponse<typeof policy> = {
    success: true,
    data: policy,
  };
  res.json(response);
}

export async function evaluate(req: Request, res: Response): Promise<void> {
  const { serviceId, agentId, amount } = req.body;

  if (!serviceId && typeof amount !== "number") {
    throw new AppError("Either serviceId or amount is required for policy evaluation", 400);
  }

  const result = await policyService.evaluatePolicy(
    serviceId ? parseInt(serviceId, 10) : undefined,
    agentId ? parseInt(agentId, 10) : undefined,
    typeof amount === "number" ? amount : undefined
  );

  const response: ApiResponse<typeof result> = {
    success: true,
    data: result,
  };
  res.json(response);
}
