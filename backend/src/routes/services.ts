import { Router } from "express";
import * as servicesController from "../controllers/services.controller.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

router.get("/", asyncHandler(servicesController.getAll));
router.get("/:id", asyncHandler(servicesController.getById));
router.post("/", asyncHandler(servicesController.create));
router.patch("/:id", asyncHandler(servicesController.update));
router.delete("/:id", asyncHandler(servicesController.remove));

export default router;
