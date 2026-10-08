import { Router } from "express";
import * as agentsController from "../controllers/agents.controller.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

router.get("/", asyncHandler(agentsController.getAll));
router.get("/:id", asyncHandler(agentsController.getById));

// Agent task endpoints
router.post("/:id/tasks", asyncHandler(agentsController.submitTask));
router.get("/:id/tasks", asyncHandler(agentsController.getTasks));
router.get("/:id/tasks/:taskId", asyncHandler(agentsController.getTask));

// Discovery-only endpoint (no task creation)
router.post("/:id/discover", asyncHandler(agentsController.discover));

export default router;
