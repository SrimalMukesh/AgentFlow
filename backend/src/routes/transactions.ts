import { Router } from "express";
import * as transactionsController from "../controllers/transactions.controller.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

router.get("/", asyncHandler(transactionsController.getAll));

export default router;
