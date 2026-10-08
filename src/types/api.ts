// ===== API Response Types for AgentFlow =====
// These match the Prisma models returned by the backend.

export interface Service {
  id: number;
  name: string;
  description: string;
  provider: string;
  category: string;
  price: number;
  rating: number;
  endpoint: string;
  active: boolean;
  capabilities: string[];
  inputDescription: string;
  outputDescription: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceInput {
  name: string;
  description: string;
  provider: string;
  category: string;
  price: number;
  rating: number;
  endpoint?: string;
  capabilities?: string[];
  inputDescription?: string;
  outputDescription?: string;
  tags?: string[];
}

export interface Agent {
  id: number;
  name: string;
  model: string;
  status: string;
  currentTask: string | null;
  createdAt: string;
  updatedAt: string;
  activities?: AgentActivity[];
}

export interface SpendingPolicy {
  id: number;
  dailyLimit: number;
  maxTransaction: number;
  autoApproveLimit: number;
  spentToday: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyEvaluationResult {
  decision: 'APPROVED' | 'REQUIRES_APPROVAL' | 'DENIED';
  amount: number;
  dailySpent: number;
  dailyLimit: number;
  maxTransaction: number;
  autoApproveLimit: number;
  enabled: boolean;
  reason: string;
}

export interface Transaction {
  id: number;
  serviceId: number;
  amount: number;
  status: string;
  network: string;
  txHash: string;
  createdAt: string;
  service?: {
    id: number;
    name: string;
    category: string;
    provider: string;
  };
}

export interface AgentActivity {
  id: number;
  agentId: number;
  action: string;
  description: string;
  amount: number | null;
  createdAt: string;
  agent?: {
    id: number;
    name: string;
    model: string;
  };
}

export interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ===== Agent Task Types =====
export interface ScoredService {
  id: number;
  name: string;
  provider: string;
  category: string;
  price: number;
  rating: number;
  capabilities: string[];
  score: number;
  scoreBreakdown: {
    relevance: number;
    rating: number;
    price: number;
  };
}

export interface TaskPlan {
  intent: 'research_and_report' | 'presentation' | 'document' | 'research_only' | 'data_analysis' | 'general_task';
  outputFormat: 'pdf' | 'pptx' | 'docx' | 'data' | 'charts' | 'none';
  outputFormatLabel: string;
  requiredServices: string[];
  executorKey: string;
  supported: boolean;
  unavailableReason?: string;
  topic: string;
  reasoning: string;
}

export interface DiscoveryResult {
  task: string;
  keywords: string[];
  plan?: TaskPlan;
  rankedServices: ScoredService[];
  recommended: ScoredService | null;
  reasoning: string;
}

export interface ExecutionResult {
  status: 'completed' | 'failed' | 'unsupported';
  serviceName: string;
  outputFormat?: 'pdf' | 'pptx' | 'docx' | 'data' | 'charts' | 'none';
  fileName?: string | null;
  fileUrl?: string | null;
  fileSizeBytes?: number | null;
  summary: string;
  data?: any;
}

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
    capabilities?: string[];
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

export interface AgentTaskSummary {
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
  } | null;
  reasoning: string;
  alternatives: unknown[];
  resultFileName?: string | null;
  resultFileUrl?: string | null;
  createdAt: string;
}
