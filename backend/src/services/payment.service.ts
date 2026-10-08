import algosdk from "algosdk";
import { prisma } from "../db/client.js";
import { config } from "../config.js";
import { AppError } from "../middleware/errorHandler.js";
import { executeTask, type ExecutionResult } from "./executor.service.js";

// Initialize Algod Client for Algorand Testnet
const algodClient = new algosdk.Algodv2(
  config.algorand.algodToken,
  config.algorand.algodServer,
  config.algorand.algodPort
);

export interface X402PaymentRequest {
  status: 402;
  error: string;
  x402Header: {
    version: string;
    scheme: string;
    network: string;
    recipient: string;
    amount: number;
    currency: string;
    assetId: number;
    txNote: string;
    expiresAt: string;
  };
  taskId: number;
  serviceId: number;
  serviceName: string;
  amount: number;
}

export interface PaymentVerificationResult {
  success: boolean;
  verified: boolean;
  taskId: number;
  txHash: string;
  network: string;
  amount: number;
  message: string;
  transactionId?: number;
  executionResult?: ExecutionResult;
}

/**
 * Prepare x402 payment authorization details for a given AgentTask.
 */
export async function preparePayment(
  taskId: number,
  _agentId?: number,
  serviceIdOverride?: number
): Promise<X402PaymentRequest> {
  const task = await prisma.agentTask.findUnique({
    where: { id: taskId },
    include: { selectedService: true },
  });

  if (!task) {
    throw new AppError(`Task with id ${taskId} not found`, 404);
  }

  const serviceId = serviceIdOverride || task.selectedServiceId;
  if (!serviceId) {
    throw new AppError(`No service associated with task ${taskId}`, 400);
  }

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) {
    throw new AppError(`Service with id ${serviceId} not found`, 404);
  }

  const receiver = config.algorand.receiverAddress;
  if (!receiver || typeof receiver !== "string" || !algosdk.isValidAddress(receiver)) {
    throw new AppError(
      `CONFIGURATION ERROR: Invalid Algorand receiver address configured (${receiver || "empty"})`,
      500
    );
  }

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  return {
    status: 402,
    error: "Payment Required",
    x402Header: {
      version: "1.0",
      scheme: "x402-algorand",
      network: config.algorand.network,
      recipient: receiver,
      amount: service.price,
      currency: "USDC",
      assetId: config.algorand.usdcAssetId,
      txNote: `x402:AgentFlow:Task:${taskId}`,
      expiresAt,
    },
    taskId: task.id,
    serviceId: service.id,
    serviceName: service.name,
    amount: service.price,
  };
}

/**
 * Verify an Algorand Testnet payment for an AgentTask.
 */
export async function verifyPayment(
  taskId: number,
  txHash?: string
): Promise<any> {

  if (!txHash || typeof txHash !== "string" || txHash.trim().length < 10) {
    throw new AppError(
      "Payment verification failed: Valid txHash is required",
      400
    );
  }

  const cleanTxHash = txHash.trim();

  const task = await prisma.agentTask.findUnique({
    where: { id: taskId },
    include: { selectedService: true },
  });

  if (!task) {
    throw new AppError(`Task with id ${taskId} not found`, 404);
  }

  if (!task.selectedService) {
    throw new AppError(
      `Task ${taskId} does not have a selected service`,
      400
    );
  }

  const service = task.selectedService;

  let onChainVerified = false;

  // Verify transaction directly through Algorand Testnet Algod
  try {
    const txInfo = await algodClient
      .pendingTransactionInformation(cleanTxHash)
      .do();

    onChainVerified = Number(txInfo.confirmedRound) > 0;

  } catch (err: unknown) {

    // Transaction not found or Algod error
    onChainVerified = false;
  }


  if (!onChainVerified) {
    throw new AppError(
      `Payment verification failed: Transaction ${cleanTxHash} could not be verified on ${config.algorand.network}`,
      400
    );
  }


  // Prevent duplicate transaction records
  const existingTransaction = await prisma.transaction.findUnique({
    where: {
      txHash: cleanTxHash,
    },
  });

  if (existingTransaction) {
    throw new AppError(
      "Transaction already verified",
      400
    );
  }


  // Record Transaction in DB
  const transaction = await prisma.transaction.create({
    data: {
      serviceId: service.id,
      amount: service.price,
      status: "confirmed",
      network: config.algorand.network,
      txHash: cleanTxHash,
    },
  });


  // Update AgentTask status to PAID
  await prisma.agentTask.update({
    where: { id: taskId },
    data: {
      status: "PAID",
      reasoning:
        `${task.reasoning || ""} Payment verified on ${config.algorand.network} (Tx: ${cleanTxHash}).`,
    },
  });

  // Log AgentActivity for payment
  await prisma.agentActivity.create({
    data: {
      agentId: task.agentId,
      action: "payment",
      description:
        `x402 payment verified for ${service.name} on ${config.algorand.network} (Tx: ${cleanTxHash})`,
      amount: service.price,
    },
  });

  // Update SpendingPolicy spentToday
  const policy = await prisma.spendingPolicy.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (policy) {
    await prisma.spendingPolicy.update({
      where: { id: policy.id },
      data: {
        spentToday: policy.spentToday + service.price,
      },
    });
  }

  // Execute Service & Generate Real Output (PDF)
  const executionResult = await executeTask(taskId, cleanTxHash);

  return {
    success: true,
    verified: true,
    taskId: task.id,
    txHash: cleanTxHash,
    network: config.algorand.network,
    amount: service.price,
    message:
      `Payment of $${service.price.toFixed(2)} USDC successfully verified on ${config.algorand.network}. Service executed successfully.`,
    transactionId: transaction.id,
    executionResult,
  };
}