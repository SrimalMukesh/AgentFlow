import type { Request, Response } from "express";
import * as paymentService from "../services/payment.service.js";
import { AppError } from "../middleware/errorHandler.js";

export async function prepare(req: Request, res: Response): Promise<void> {
  const { taskId, agentId, serviceId } = req.body;

  if (!taskId && !serviceId) {
    throw new AppError("taskId or serviceId is required for payment preparation", 400);
  }

  const result = await paymentService.preparePayment(
    taskId ? parseInt(String(taskId), 10) : 0,
    agentId ? parseInt(String(agentId), 10) : undefined,
    serviceId ? parseInt(String(serviceId), 10) : undefined
  );

  // Return HTTP 402 status code per x402 specification
  res.status(402).json({
    success: false,
    code: 402,
    message: "Payment Required",
    data: result,
  });
}

export async function verify(req: Request, res: Response): Promise<void> {
  const { taskId, txHash } = req.body;

  if (!taskId) {
    throw new AppError("taskId is required for payment verification", 400);
  }

  if (!txHash) {
    throw new AppError("txHash is required for payment verification", 400);
  }

  const result = await paymentService.verifyPayment(
    parseInt(String(taskId), 10),
    String(txHash)
  );

  res.json({
    success: true,
    data: result,
  });
}
