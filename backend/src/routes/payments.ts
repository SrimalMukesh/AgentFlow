import { Router } from "express";
import * as paymentsController from "../controllers/payments.controller.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

router.post("/prepare", asyncHandler(paymentsController.prepare));
router.post("/verify", asyncHandler(paymentsController.verify));

export default router;
