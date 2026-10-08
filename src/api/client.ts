// ===== API Client for AgentFlow =====
// Centralizes all backend communication. Uses VITE_API_URL from .env.

import type {
  ApiResponse,
  Service,
  Agent,
  SpendingPolicy,
  Transaction,
  AgentActivity,
  HealthStatus,
  CreateServiceInput,
  AgentTaskResult,
  AgentTaskSummary,
  DiscoveryResult,
  PolicyEvaluationResult,
  X402PaymentRequest,
  PaymentVerificationResult,
} from '../types/api';

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function getFileUrl(fileUrl: string): string {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('http')) return fileUrl;
  const baseUrl = API_BASE.replace(/\/api\/?$/, '');
  const cleanPath = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
  return `${baseUrl}${cleanPath}`;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const json: ApiResponse<T> = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.error || `Request failed: ${res.status}`);
  }

  return json.data as T;
}

// ===== Service endpoints =====
export interface ServiceQueryParams {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
}

export async function getServices(params?: ServiceQueryParams): Promise<Service[]> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.category) query.set('category', params.category);
  if (params?.minPrice !== undefined) query.set('minPrice', String(params.minPrice));
  if (params?.maxPrice !== undefined) query.set('maxPrice', String(params.maxPrice));
  if (params?.sort) query.set('sort', params.sort);

  const qs = query.toString();
  return request<Service[]>(`/services${qs ? `?${qs}` : ''}`);
}

export async function getService(id: number): Promise<Service> {
  return request<Service>(`/services/${id}`);
}

export async function createService(data: CreateServiceInput): Promise<Service> {
  return request<Service>('/services', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateService(id: number, data: Partial<CreateServiceInput> & { active?: boolean }): Promise<Service> {
  return request<Service>(`/services/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteService(id: number): Promise<Service> {
  return request<Service>(`/services/${id}`, {
    method: 'DELETE',
  });
}

// ===== Agent endpoints =====
export async function getAgents(): Promise<Agent[]> {
  return request<Agent[]>('/agents');
}

export async function getAgent(id: number): Promise<Agent> {
  return request<Agent>(`/agents/${id}`);
}

// ===== Policy endpoint =====
export async function getPolicy(): Promise<SpendingPolicy> {
  return request<SpendingPolicy>('/policy');
}

export async function updatePolicy(data: Partial<SpendingPolicy>): Promise<SpendingPolicy> {
  return request<SpendingPolicy>('/policy', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function evaluatePolicy(serviceId?: number, agentId?: number, amount?: number): Promise<PolicyEvaluationResult> {
  return request<PolicyEvaluationResult>('/policy/evaluate', {
    method: 'POST',
    body: JSON.stringify({ serviceId, agentId, amount }),
  });
}

// ===== Transaction endpoint =====
export async function getTransactions(): Promise<Transaction[]> {
  return request<Transaction[]>('/transactions');
}

// ===== Activity endpoint =====
export async function getActivity(): Promise<AgentActivity[]> {
  return request<AgentActivity[]>('/activity');
}

// ===== Health endpoint =====
export async function getHealth(): Promise<HealthStatus> {
  return request<HealthStatus>('/health');
}

// ===== Agent Task endpoints =====
export async function submitAgentTask(agentId: number, task: string): Promise<AgentTaskResult> {
  return request<AgentTaskResult>(`/agents/${agentId}/tasks`, {
    method: 'POST',
    body: JSON.stringify({ task }),
  });
}

export async function getAgentTasks(agentId: number): Promise<AgentTaskSummary[]> {
  return request<AgentTaskSummary[]>(`/agents/${agentId}/tasks`);
}

export async function getAgentTask(agentId: number, taskId: number): Promise<AgentTaskResult> {
  return request<AgentTaskResult>(`/agents/${agentId}/tasks/${taskId}`);
}

export async function discoverServices(agentId: number, task: string): Promise<DiscoveryResult> {
  return request<DiscoveryResult>(`/agents/${agentId}/discover`, {
    method: 'POST',
    body: JSON.stringify({ task }),
  });
}

// ===== Payment endpoints =====
export async function preparePayment(taskId: number, agentId?: number, serviceId?: number): Promise<X402PaymentRequest> {
  return request<X402PaymentRequest>('/payments/prepare', {
    method: 'POST',
    body: JSON.stringify({ taskId, agentId, serviceId }),
  });
}

export async function verifyPayment(taskId: number, txHash: string): Promise<PaymentVerificationResult> {
  return request<PaymentVerificationResult>('/payments/verify', {
    method: 'POST',
    body: JSON.stringify({ taskId, txHash }),
  });
}

