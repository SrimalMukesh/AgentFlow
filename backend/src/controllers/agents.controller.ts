import type { Request, Response } from "express";
import * as agentsService from "../services/agents.service.js";
import * as agentTasksService from "../services/agent-tasks.service.js";
import { AppError } from "../middleware/errorHandler.js";
import type { ApiResponse } from "../types/index.js";

// ─── Agent CRUD ──────────────────────────────────────────────────────

export async function getAll(_req: Request, res: Response): Promise<void> {
  const agents = await agentsService.getAllAgents();
  const response: ApiResponse<typeof agents> = {
    success: true,
    data: agents,
  };
  res.json(response);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) {
    throw new AppError("Invalid agent ID", 400);
  }
  const agent = await agentsService.getAgentById(id);
  const response: ApiResponse<typeof agent> = {
    success: true,
    data: agent,
  };
  res.json(response);
}

// ─── Agent Tasks ─────────────────────────────────────────────────────

/**
 * POST /api/agents/:id/tasks
 * Submit a new task to the agent for analysis and service selection.
 */
export async function submitTask(req: Request, res: Response): Promise<void> {
  const agentId = parseInt(String(req.params.id), 10);
  if (isNaN(agentId)) {
    throw new AppError("Invalid agent ID", 400);
  }

  const { task } = req.body;

  // Validate task input
  if (!task || typeof task !== "string") {
    throw new AppError("Task description is required and must be a string", 400);
  }

  const trimmed = task.trim();
  if (trimmed.length === 0) {
    throw new AppError("Task description cannot be empty", 400);
  }
  if (trimmed.length > 500) {
    throw new AppError("Task description must be 500 characters or fewer", 400);
  }

  const result = await agentTasksService.submitTask(agentId, trimmed);

  const response: ApiResponse<typeof result> = {
    success: true,
    data: result,
  };
  res.status(201).json(response);
}

/**
 * GET /api/agents/:id/tasks
 * List all tasks for an agent.
 */
export async function getTasks(req: Request, res: Response): Promise<void> {
  const agentId = parseInt(String(req.params.id), 10);
  if (isNaN(agentId)) {
    throw new AppError("Invalid agent ID", 400);
  }

  const tasks = await agentTasksService.getAgentTasks(agentId);

  const response: ApiResponse<typeof tasks> = {
    success: true,
    data: tasks,
  };
  res.json(response);
}

/**
 * GET /api/agents/:id/tasks/:taskId
 * Get a specific task by ID.
 */
export async function getTask(req: Request, res: Response): Promise<void> {
  const agentId = parseInt(String(req.params.id), 10);
  const taskId = parseInt(String(req.params.taskId), 10);

  if (isNaN(agentId)) {
    throw new AppError("Invalid agent ID", 400);
  }
  if (isNaN(taskId)) {
    throw new AppError("Invalid task ID", 400);
  }

  const task = await agentTasksService.getAgentTask(agentId, taskId);

  const response: ApiResponse<typeof task> = {
    success: true,
    data: task,
  };
  res.json(response);
}

/**
 * POST /api/agents/:id/discover
 * Discover and rank services for a task WITHOUT creating a task record.
 */
export async function discover(req: Request, res: Response): Promise<void> {
  const agentId = parseInt(String(req.params.id), 10);
  if (isNaN(agentId)) {
    throw new AppError("Invalid agent ID", 400);
  }

  const { task } = req.body;

  if (!task || typeof task !== "string") {
    throw new AppError("Task description is required and must be a string", 400);
  }

  const trimmed = task.trim();
  if (trimmed.length === 0) {
    throw new AppError("Task description cannot be empty", 400);
  }

  const result = await agentTasksService.discoverOnly(agentId, trimmed);

  const response: ApiResponse<typeof result> = {
    success: true,
    data: result,
  };
  res.json(response);
}
