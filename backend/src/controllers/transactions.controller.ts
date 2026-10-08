import type { Request, Response } from "express";
import * as transactionsService from "../services/transactions.service.js";
import type { ApiResponse } from "../types/index.js";

export async function getAll(_req: Request, res: Response): Promise<void> {
  const transactions = await transactionsService.getAllTransactions();
  const response: ApiResponse<typeof transactions> = {
    success: true,
    data: transactions,
  };
  res.json(response);
}
