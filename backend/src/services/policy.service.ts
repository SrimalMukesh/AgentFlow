import { prisma } from "../db/client.js";
import { AppError } from "../middleware/errorHandler.js";

export interface PolicyEvaluationResult {
  decision: "APPROVED" | "REQUIRES_APPROVAL" | "DENIED";
  amount: number;
  dailySpent: number;
  dailyLimit: number;
  maxTransaction: number;
  autoApproveLimit: number;
  enabled: boolean;
  reason: string;
}

/**
 * Get or create default spending policy.
 */
export async function getPolicy() {
  let policy = await prisma.spendingPolicy.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!policy) {
    policy = await prisma.spendingPolicy.create({
      data: {
        dailyLimit: 50,
        maxTransaction: 15,
        autoApproveLimit: 10,
        spentToday: 0,
        enabled: true,
      },
    });
  }

  return policy;
}

/**
 * Update spending policy settings.
 */
export async function updatePolicy(data: {
  dailyLimit?: number;
  maxTransaction?: number;
  autoApproveLimit?: number;
  enabled?: boolean;
  spentToday?: number;
}) {
  const currentPolicy = await getPolicy();

  const updated = await prisma.spendingPolicy.update({
    where: { id: currentPolicy.id },
    data: {
      ...(data.dailyLimit !== undefined && { dailyLimit: data.dailyLimit }),
      ...(data.maxTransaction !== undefined && { maxTransaction: data.maxTransaction }),
      ...(data.autoApproveLimit !== undefined && { autoApproveLimit: data.autoApproveLimit }),
      ...(data.enabled !== undefined && { enabled: data.enabled }),
      ...(data.spentToday !== undefined && { spentToday: data.spentToday }),
    },
  });

  return updated;
}

/**
 * Evaluate spending policy against a service or custom amount.
 * Rules:
 *  1. If policy disabled → DENIED
 *  2. If amount > maxTransaction → DENIED
 *  3. If dailySpent + amount > dailyLimit → DENIED
 *  4. If amount <= autoApproveLimit → APPROVED
 *  5. Otherwise → REQUIRES_APPROVAL
 */
export async function evaluatePolicy(
  serviceId?: number,
  _agentId?: number,
  amountOverride?: number
): Promise<PolicyEvaluationResult> {
  const policy = await getPolicy();

  let amount = amountOverride ?? 0;

  if (serviceId && amountOverride === undefined) {
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      throw new AppError(`Service with id ${serviceId} not found`, 404);
    }
    amount = service.price;
  }

  let decision: PolicyEvaluationResult["decision"];
  let reason: string;

  if (!policy.enabled) {
    decision = "DENIED";
    reason = "Spending policy is currently disabled.";
  } else if (amount > policy.maxTransaction) {
    decision = "DENIED";
    reason = `Amount ($${amount.toFixed(2)}) exceeds maximum transaction limit ($${policy.maxTransaction.toFixed(2)}).`;
  } else if (policy.spentToday + amount > policy.dailyLimit) {
    decision = "DENIED";
    reason = `Amount ($${amount.toFixed(2)}) exceeds remaining daily limit ($${(policy.dailyLimit - policy.spentToday).toFixed(2)}).`;
  } else if (amount <= policy.autoApproveLimit) {
    decision = "APPROVED";
    reason = `Transaction of $${amount.toFixed(2)} is auto-approved within limit ($${policy.autoApproveLimit.toFixed(2)}).`;
  } else {
    decision = "REQUIRES_APPROVAL";
    reason = `Transaction of $${amount.toFixed(2)} exceeds auto-approval limit ($${policy.autoApproveLimit.toFixed(2)}) and requires approval.`;
  }

  return {
    decision,
    amount,
    dailySpent: policy.spentToday,
    dailyLimit: policy.dailyLimit,
    maxTransaction: policy.maxTransaction,
    autoApproveLimit: policy.autoApproveLimit,
    enabled: policy.enabled,
    reason,
  };
}
