/**
 * Agent Tasks Service — orchestrates the full agent workflow.
 *
 * Flow:
 *  1. Receive task → create AgentTask (PENDING)
 *  2. Update agent status → ANALYZING
 *  3. Log activity: TASK_RECEIVED
 *  4. Run discovery pipeline
 *  5. Log activity: SERVICE_SEARCH
 *  6. Log activity: SERVICE_EVALUATED
 *  7. Select best service → update AgentTask (SERVICE_SELECTED)
 *  8. Log activity: SERVICE_SELECTED
 *  9. Mark COMPLETED
 *  10. Log activity: TASK_COMPLETED
 */

import { prisma } from "../db/client.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  discoverServices,
  type DiscoveryResult,
} from "./agent-decision.service.js";
import {
  evaluatePolicy,
  type PolicyEvaluationResult,
} from "./policy.service.js";
import {
  preparePayment,
  type X402PaymentRequest,
} from "./payment.service.js";

// ─── Types ───────────────────────────────────────────────────────────

export interface AgentTaskResult {
  id: number;
  agentId: number;
  task: string;
  status: string;
  selectedService: {
    id: number;
    name: string;
    provider: string;
    category: string;
    price: number;
    rating: number;
    capabilities: string[];
  } | null;
  alternatives: Array<{
    id: number;
    name: string;
    provider: string;
    price: number;
    rating: number;
    score: number;
  }>;
  reasoning: string;
  discovery: DiscoveryResult;
  policyEvaluation?: PolicyEvaluationResult | null;
  x402Request?: X402PaymentRequest | null;
  resultFileName?: string | null;
  resultFileUrl?: string | null;
  createdAt: string;
}

// ─── Submit Task ─────────────────────────────────────────────────────

export async function submitTask(
  agentId: number,
  taskDescription: string
): Promise<AgentTaskResult> {
  // Validate agent exists
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) {
    throw new AppError(`Agent with id ${agentId} not found`, 404);
  }

  // 1. Create AgentTask
  const agentTask = await prisma.agentTask.create({
    data: {
      agentId,
      task: taskDescription,
      status: "PENDING",
    },
  });

  // 2. Update agent status
  await prisma.agent.update({
    where: { id: agentId },
    data: { status: "analyzing", currentTask: taskDescription },
  });

  // 3. Log: TASK_RECEIVED
  await logActivity(agentId, "task_received", `Task received: "${taskDescription}"`);

  // 4. Update status → ANALYZING
  await prisma.agentTask.update({
    where: { id: agentTask.id },
    data: { status: "ANALYZING" },
  });

  // 5. Run discovery pipeline with intent & format planning
  await logActivity(agentId, "service_search", "Analyzing task intent, output format, and required capabilities…");

  const discovery = await discoverServices(taskDescription);

  // If user requested an unsupported format (e.g. PPTX, DOCX)
  if (!discovery.plan.supported) {
    await logActivity(
      agentId,
      "format_unsupported",
      `${discovery.plan.outputFormatLabel} requested — capability is not yet available.`
    );

    await prisma.agentTask.update({
      where: { id: agentTask.id },
      data: {
        status: "UNSUPPORTED_FORMAT",
        reasoning: discovery.plan.unavailableReason || discovery.plan.reasoning,
      },
    });

    await prisma.agent.update({
      where: { id: agentId },
      data: { status: "idle", currentTask: null },
    });

    return {
      id: agentTask.id,
      agentId,
      task: taskDescription,
      status: "UNSUPPORTED_FORMAT",
      selectedService: null,
      alternatives: [],
      reasoning: discovery.plan.unavailableReason || discovery.plan.reasoning,
      discovery,
      policyEvaluation: null,
      x402Request: null,
      createdAt: agentTask.createdAt.toISOString(),
    };
  }

  // 6. Log: SERVICE_EVALUATED
  if (discovery.rankedServices.length > 0) {
    await logActivity(
      agentId,
      "service_evaluated",
      `Evaluated ${discovery.rankedServices.length} matching service${discovery.rankedServices.length !== 1 ? "s" : ""} for ${discovery.plan.outputFormatLabel}.`
    );
  }

  // 7. Select best service
  let selectedService: AgentTaskResult["selectedService"] = null;
  const alternatives: AgentTaskResult["alternatives"] = [];
  let policyEval: PolicyEvaluationResult | null = null;
  let x402Req: X402PaymentRequest | null = null;

  if (discovery.recommended) {
    selectedService = {
      id: discovery.recommended.id,
      name: discovery.recommended.name,
      provider: discovery.recommended.provider,
      category: discovery.recommended.category,
      price: discovery.recommended.price,
      rating: discovery.recommended.rating,
      capabilities: discovery.recommended.capabilities,
    };

    // Build alternatives (all scored services except the recommended)
    for (const s of discovery.rankedServices.slice(1)) {
      alternatives.push({
        id: s.id,
        name: s.name,
        provider: s.provider,
        price: s.price,
        rating: s.rating,
        score: s.score,
      });
    }

    // 8. Log: SERVICE_SELECTED
    await logActivity(
      agentId,
      "service_selected",
      `Selected ${discovery.recommended.name} ($${discovery.recommended.price.toFixed(2)} USDC, ★ ${discovery.recommended.rating}) for ${discovery.plan.outputFormatLabel}`,
      discovery.recommended.price
    );

    // 8b. POLICY EVALUATION
    policyEval = await evaluatePolicy(discovery.recommended.id, agentId);
    await logActivity(
      agentId,
      "policy_check",
      `Policy Evaluation: ${policyEval.decision} — ${policyEval.reason}`
    );

    // 8c. IF APPROVED → CONTINUE TO x402 PAYMENT AUTHORIZATION
    if (policyEval.decision === "APPROVED") {
      x402Req = await preparePayment(agentTask.id, agentId, discovery.recommended.id);
      await logActivity(
        agentId,
        "payment",
        `x402 Payment Request generated ($${discovery.recommended.price.toFixed(2)} USDC on Algorand Testnet)`
      );
    }

    // Update task
    await prisma.agentTask.update({
      where: { id: agentTask.id },
      data: {
        status: policyEval.decision === "APPROVED" ? "PAYMENT_REQUIRED" : policyEval.decision === "DENIED" ? "POLICY_DENIED" : "SERVICE_SELECTED",
        selectedServiceId: discovery.recommended.id,
        reasoning: `${discovery.reasoning} Spending policy decision: ${policyEval.decision} (${policyEval.reason})${x402Req ? " Prepared x402 payment authorization." : ""}`,
        alternativesJson: JSON.stringify(alternatives),
      },
    });
  } else {
    // No match found
    await prisma.agentTask.update({
      where: { id: agentTask.id },
      data: {
        status: "COMPLETED",
        reasoning: discovery.reasoning,
      },
    });
  }

  // 9. Mark agent status
  await prisma.agent.update({
    where: { id: agentId },
    data: {
      status: discovery.recommended ? (policyEval?.decision === "DENIED" ? "idle" : "ready") : "idle",
      currentTask: discovery.recommended ? taskDescription : null,
    },
  });

  // 10. Log: TASK_COMPLETED
  await logActivity(
    agentId,
    "task_completed",
    discovery.recommended
      ? `Task planned — ${discovery.recommended.name} evaluated against policy (${policyEval?.decision}).`
      : `Task planned — no suitable service found.`
  );

  return {
    id: agentTask.id,
    agentId,
    task: taskDescription,
    status: policyEval?.decision === "APPROVED" ? "PAYMENT_REQUIRED" : (policyEval ? `POLICY_${policyEval.decision}` : (discovery.recommended ? "SERVICE_SELECTED" : "COMPLETED")),
    selectedService,
    alternatives,
    reasoning: discovery.reasoning,
    discovery,
    policyEvaluation: policyEval,
    x402Request: x402Req,
    createdAt: agentTask.createdAt.toISOString(),
  };
}

// ─── Get Tasks ───────────────────────────────────────────────────────

export async function getAgentTasks(agentId: number) {
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) {
    throw new AppError(`Agent with id ${agentId} not found`, 404);
  }

  const tasks = await prisma.agentTask.findMany({
    where: { agentId },
    orderBy: { createdAt: "desc" },
    include: {
      selectedService: true,
    },
  });

  return tasks.map((t) => ({
    id: t.id,
    agentId: t.agentId,
    task: t.task,
    status: t.status,
    selectedService: t.selectedService
      ? {
          id: t.selectedService.id,
          name: t.selectedService.name,
          provider: t.selectedService.provider,
          category: t.selectedService.category,
          price: t.selectedService.price,
          rating: t.selectedService.rating,
        }
      : null,
    reasoning: t.reasoning,
    alternatives: safeParseJson(t.alternativesJson),
    resultFileName: (t as any).resultFileName || null,
    resultFileUrl: (t as any).resultFileUrl || null,
    createdAt: t.createdAt.toISOString(),
  }));
}

export async function getAgentTask(agentId: number, taskId: number) {
  const task = await prisma.agentTask.findFirst({
    where: { id: taskId, agentId },
    include: {
      selectedService: true,
    },
  });
  if (!task) {
    throw new AppError(`Task with id ${taskId} not found for agent ${agentId}`, 404);
  }

  return {
    id: task.id,
    agentId: task.agentId,
    task: task.task,
    status: task.status,
    selectedService: task.selectedService
      ? {
          id: task.selectedService.id,
          name: task.selectedService.name,
          provider: task.selectedService.provider,
          category: task.selectedService.category,
          price: task.selectedService.price,
          rating: task.selectedService.rating,
        }
      : null,
    reasoning: task.reasoning,
    alternatives: safeParseJson(task.alternativesJson),
    resultFileName: (task as any).resultFileName || null,
    resultFileUrl: (task as any).resultFileUrl || null,
    createdAt: task.createdAt.toISOString(),
  };
}

// ─── Discover Only (no task creation) ────────────────────────────────

export async function discoverOnly(agentId: number, taskDescription: string) {
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) {
    throw new AppError(`Agent with id ${agentId} not found`, 404);
  }
  return discoverServices(taskDescription);
}

// ─── Helpers ─────────────────────────────────────────────────────────

async function logActivity(
  agentId: number,
  action: string,
  description: string,
  amount?: number
) {
  await prisma.agentActivity.create({
    data: { agentId, action, description, amount },
  });
}

function safeParseJson(val: string): unknown[] {
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
