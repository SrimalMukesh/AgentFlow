import { prisma } from "../db/client.js";
import { AppError } from "../middleware/errorHandler.js";
import type {
  CreateServiceInput,
  UpdateServiceInput,
  ServiceQueryParams,
} from "../types/index.js";
import type { Prisma } from "@prisma/client";

// Helper: serialize arrays to JSON strings for SQLite storage
function serializeArrayField(val: string[] | undefined): string | undefined {
  return val !== undefined ? JSON.stringify(val) : undefined;
}

export async function getAllServices(query: ServiceQueryParams = {}) {
  const { search, category, minPrice, maxPrice, sort, includeInactive } = query;

  // Build dynamic where clause
  const where: Prisma.ServiceWhereInput = {};

  // Only show active by default
  if (!includeInactive) {
    where.active = true;
  }

  // Category filter
  if (category) {
    where.category = category;
  }

  // Price range filters
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }

  // Text search across multiple fields
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
      { provider: { contains: search } },
      { category: { contains: search } },
      { tags: { contains: search } },
    ];
  }

  // Sort
  let orderBy: Prisma.ServiceOrderByWithRelationInput;
  switch (sort) {
    case "price_asc":
      orderBy = { price: "asc" };
      break;
    case "price_desc":
      orderBy = { price: "desc" };
      break;
    case "rating":
      orderBy = { rating: "desc" };
      break;
    case "name":
      orderBy = { name: "asc" };
      break;
    case "newest":
    default:
      orderBy = { createdAt: "desc" };
      break;
  }

  const services = await prisma.service.findMany({ where, orderBy });

  // Parse JSON string fields back to arrays for the response
  return services.map(parseServiceArrays);
}

export async function getServiceById(id: number) {
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) {
    throw new AppError(`Service with id ${id} not found`, 404);
  }
  return parseServiceArrays(service);
}

export async function createService(data: CreateServiceInput) {
  const service = await prisma.service.create({
    data: {
      name: data.name,
      description: data.description,
      provider: data.provider,
      category: data.category,
      price: data.price,
      rating: data.rating,
      endpoint: data.endpoint ?? "",
      active: data.active ?? true,
      capabilities: serializeArrayField(data.capabilities) ?? "[]",
      inputDescription: data.inputDescription ?? "",
      outputDescription: data.outputDescription ?? "",
      tags: serializeArrayField(data.tags) ?? "[]",
    },
  });
  return parseServiceArrays(service);
}

export async function updateService(id: number, data: UpdateServiceInput) {
  // Verify service exists
  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(`Service with id ${id} not found`, 404);
  }

  const updateData: Prisma.ServiceUpdateInput = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.provider !== undefined) updateData.provider = data.provider;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.rating !== undefined) updateData.rating = data.rating;
  if (data.endpoint !== undefined) updateData.endpoint = data.endpoint;
  if (data.active !== undefined) updateData.active = data.active;
  if (data.capabilities !== undefined)
    updateData.capabilities = JSON.stringify(data.capabilities);
  if (data.inputDescription !== undefined)
    updateData.inputDescription = data.inputDescription;
  if (data.outputDescription !== undefined)
    updateData.outputDescription = data.outputDescription;
  if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags);

  const service = await prisma.service.update({
    where: { id },
    data: updateData,
  });
  return parseServiceArrays(service);
}

export async function deleteService(id: number) {
  // Soft delete: set active = false
  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(`Service with id ${id} not found`, 404);
  }

  const service = await prisma.service.update({
    where: { id },
    data: { active: false },
  });
  return parseServiceArrays(service);
}

// Parse JSON-stored arrays from SQLite text columns
function parseServiceArrays<
  T extends { capabilities: string; tags: string },
>(service: T) {
  return {
    ...service,
    capabilities: safeParseJson(service.capabilities),
    tags: safeParseJson(service.tags),
  };
}

function safeParseJson(val: string): string[] {
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
