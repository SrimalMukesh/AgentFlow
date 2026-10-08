// Shared TypeScript types for AgentFlow backend
// These mirror the Prisma models for use in controllers and services

export interface CreateServiceInput {
  name: string;
  description: string;
  provider: string;
  category: string;
  price: number;
  rating: number;
  endpoint?: string;
  active?: boolean;
  capabilities?: string[];
  inputDescription?: string;
  outputDescription?: string;
  tags?: string[];
}

export interface UpdateServiceInput {
  name?: string;
  description?: string;
  provider?: string;
  category?: string;
  price?: number;
  rating?: number;
  endpoint?: string;
  active?: boolean;
  capabilities?: string[];
  inputDescription?: string;
  outputDescription?: string;
  tags?: string[];
}

export interface ServiceQueryParams {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'price_asc' | 'price_desc' | 'rating' | 'name' | 'newest';
  includeInactive?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
}
