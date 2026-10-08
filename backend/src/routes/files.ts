import { Router, type Request, type Response } from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { AppError } from "../middleware/errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();
const GENERATED_DIR = path.resolve(__dirname, "../../generated-files");

/**
 * GET /api/files/:filename
 * Securely stream a generated report file to the client for download.
 */
router.get("/:filename", (req: Request, res: Response): void => {
  const rawFileName = req.params.filename;

  if (!rawFileName || typeof rawFileName !== "string") {
    throw new AppError("Filename parameter is required", 400);
  }

  // Security: Sanitize filename to prevent directory traversal
  const safeFileName = path.basename(rawFileName);
  const filePath = path.join(GENERATED_DIR, safeFileName);

  // Verify file exists
  if (!fs.existsSync(filePath)) {
    throw new AppError(`Requested file "${safeFileName}" not found`, 404);
  }

  const stat = fs.statSync(filePath);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Length", stat.size);
  res.setHeader("Content-Disposition", `attachment; filename="${safeFileName}"`);

  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
});

export default router;
