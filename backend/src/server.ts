import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

// Route imports
import healthRoutes from "./routes/health.js";
import servicesRoutes from "./routes/services.js";
import agentsRoutes from "./routes/agents.js";
import policyRoutes from "./routes/policy.js";
import transactionsRoutes from "./routes/transactions.js";
import activityRoutes from "./routes/activity.js";
import paymentsRoutes from "./routes/payments.js";
import filesRoutes from "./routes/files.js";

const app = express();

// ===== Middleware =====
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);
app.use(express.json());

// ===== Routes =====
app.use("/api/health", healthRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/agents", agentsRoutes);
app.use("/api/policy", policyRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/files", filesRoutes);

// ===== Error Handling =====
app.use(notFoundHandler);
app.use(errorHandler);

// ===== Start Server =====
app.listen(config.port, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║        AgentFlow Backend Server          ║
  ╠══════════════════════════════════════════╣
  ║  Port:        ${String(config.port).padEnd(26)}║
  ║  Environment: ${config.nodeEnv.padEnd(26)}║
  ║  CORS Origin: ${config.corsOrigin.padEnd(26)}║
  ╚══════════════════════════════════════════╝
  `);
});

export default app;
