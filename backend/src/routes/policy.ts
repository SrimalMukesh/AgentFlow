import { Router } from "express";
import * as policyController from "../controllers/policy.controller.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

router.get("/", asyncHandler(policyController.getPolicy));
router.put("/", asyncHandler(policyController.updatePolicy));
router.patch("/", asyncHandler(policyController.updatePolicy));
router.post("/evaluate", asyncHandler(policyController.evaluate));

export default router;
