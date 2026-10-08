import type { Request, Response } from "express";
import * as servicesService from "../services/services.service.js";
import { AppError } from "../middleware/errorHandler.js";
import type {
  ApiResponse,
  CreateServiceInput,
  UpdateServiceInput,
  ServiceQueryParams,
} from "../types/index.js";

export async function getAll(req: Request, res: Response): Promise<void> {
  // Parse query parameters
  const query: ServiceQueryParams = {};

  if (typeof req.query.search === "string" && req.query.search.trim()) {
    query.search = req.query.search.trim();
  }
  if (typeof req.query.category === "string" && req.query.category.trim()) {
    query.category = req.query.category.trim();
  }
  if (typeof req.query.minPrice === "string") {
    const val = parseFloat(req.query.minPrice);
    if (!isNaN(val)) query.minPrice = val;
  }
  if (typeof req.query.maxPrice === "string") {
    const val = parseFloat(req.query.maxPrice);
    if (!isNaN(val)) query.maxPrice = val;
  }
  if (typeof req.query.sort === "string") {
    const valid = ["price_asc", "price_desc", "rating", "name", "newest"];
    if (valid.includes(req.query.sort)) {
      query.sort = req.query.sort as ServiceQueryParams["sort"];
    }
  }
  if (req.query.includeInactive === "true") {
    query.includeInactive = true;
  }

  const services = await servicesService.getAllServices(query);
  const response: ApiResponse<typeof services> = {
    success: true,
    data: services,
  };
  res.json(response);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) {
    throw new AppError("Invalid service ID", 400);
  }
  const service = await servicesService.getServiceById(id);
  const response: ApiResponse<typeof service> = {
    success: true,
    data: service,
  };
  res.json(response);
}

export async function create(req: Request, res: Response): Promise<void> {
  const body = req.body as CreateServiceInput;

  // Validation
  if (!body.name?.trim()) {
    throw new AppError("name is required", 400);
  }
  if (!body.description?.trim()) {
    throw new AppError("description is required", 400);
  }
  if (!body.provider?.trim()) {
    throw new AppError("provider is required", 400);
  }
  if (!body.category?.trim()) {
    throw new AppError("category is required", 400);
  }
  if (body.price == null || body.price < 0) {
    throw new AppError("price must be >= 0", 400);
  }
  if (body.rating == null || body.rating < 0 || body.rating > 5) {
    throw new AppError("rating must be between 0 and 5", 400);
  }

  const service = await servicesService.createService({
    name: body.name.trim(),
    description: body.description.trim(),
    provider: body.provider.trim(),
    category: body.category.trim(),
    price: body.price,
    rating: body.rating,
    endpoint: body.endpoint?.trim(),
    active: body.active,
    capabilities: body.capabilities,
    inputDescription: body.inputDescription?.trim(),
    outputDescription: body.outputDescription?.trim(),
    tags: body.tags,
  });

  const response: ApiResponse<typeof service> = {
    success: true,
    data: service,
    message: "Service registered successfully",
  };
  res.status(201).json(response);
}

export async function update(req: Request, res: Response): Promise<void> {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) {
    throw new AppError("Invalid service ID", 400);
  }

  const body = req.body as UpdateServiceInput;

  // Validate only provided fields
  if (body.name !== undefined && !body.name.trim()) {
    throw new AppError("name cannot be empty", 400);
  }
  if (body.description !== undefined && !body.description.trim()) {
    throw new AppError("description cannot be empty", 400);
  }
  if (body.provider !== undefined && !body.provider.trim()) {
    throw new AppError("provider cannot be empty", 400);
  }
  if (body.category !== undefined && !body.category.trim()) {
    throw new AppError("category cannot be empty", 400);
  }
  if (body.price !== undefined && body.price < 0) {
    throw new AppError("price cannot be negative", 400);
  }
  if (body.rating !== undefined && (body.rating < 0 || body.rating > 5)) {
    throw new AppError("rating must be between 0 and 5", 400);
  }

  const service = await servicesService.updateService(id, body);

  const response: ApiResponse<typeof service> = {
    success: true,
    data: service,
    message: "Service updated successfully",
  };
  res.json(response);
}

export async function remove(req: Request, res: Response): Promise<void> {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) {
    throw new AppError("Invalid service ID", 400);
  }

  const service = await servicesService.deleteService(id);

  const response: ApiResponse<typeof service> = {
    success: true,
    data: service,
    message: "Service deactivated successfully",
  };
  res.json(response);
}
