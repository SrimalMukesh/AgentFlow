import { Router } from "express";
import * as activityController from "../controllers/activity.controller.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

router.get("/", asyncHandler(activityController.getAll));

export default router;
