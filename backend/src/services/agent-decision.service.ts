/**
 * AgentDecisionService — the intelligence and planning layer of AgentFlow.
 *
 * Responsible for:
 *  1. Natural language task intent & output format planning (TaskPlanner)
 *  2. Discovering and ranking matching services from the Service Registry
 *  3. Verifying executor capability & format availability
 *  4. Selecting the best service
 *  5. Generating human-readable reasoning
 */

import { prisma } from "../db/client.js";
import { planTask, type TaskPlan } from "./task-planner.service.js";

// ─── Types ───────────────────────────────────────────────────────────

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

export interface DiscoveryResult {
  task: string;
  keywords: string[];
  plan: TaskPlan;
  rankedServices: ScoredService[];
  recommended: ScoredService | null;
  reasoning: string;
}

// ─── Keyword Extraction ──────────────────────────────────────────────

const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "shall", "can", "need", "must",
  "i", "me", "my", "we", "our", "you", "your", "he", "she", "it",
  "they", "them", "their", "this", "that", "these", "those",
  "and", "but", "or", "nor", "not", "so", "yet", "both", "either",
  "for", "of", "to", "in", "on", "at", "by", "with", "from", "up",
  "about", "into", "through", "during", "before", "after",
  "all", "each", "every", "some", "any", "few", "more", "most",
  "if", "then", "than", "when", "what", "which", "who", "whom",
  "how", "very", "just", "also", "please", "want", "like",
]);

export function extractKeywords(task: string): string[] {
  return task
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

const WEIGHTS = {
  relevance: 0.50,
  rating:    0.30,
  price:     0.20,
};

function calculateRelevance(
  service: {
    name: string;
    description: string;
    category: string;
    capabilities: string;
    tags: string;
  },
  keywords: string[]
): number {
  if (keywords.length === 0) return 0;

  const caps = safeParseJson(service.capabilities);
  const tagList = safeParseJson(service.tags);
  const searchText = [
    service.name,
    service.description,
    service.category,
    ...caps,
    ...tagList,
  ]
    .join(" ")
    .toLowerCase();

  let matchCount = 0;
  for (const kw of keywords) {
    if (searchText.includes(kw)) {
      matchCount++;
    }
  }

  return matchCount / keywords.length;
}

function normalizeRating(rating: number): number {
  return Math.min(Math.max(rating / 5, 0), 1);
}

function normalizePrice(price: number, maxPriceInSet: number): number {
  const cap = Math.max(maxPriceInSet, 1);
  return 1 - Math.min(price / cap, 1);
}

// ─── Discovery Pipeline ─────────────────────────────────────────────

/**
 * Main discovery function: plans the task intent, detects requested format,
 * checks executor capability, and scores services from the registry.
 */
export async function discoverServices(task: string): Promise<DiscoveryResult> {
  const plan = planTask(task);
  const keywords = extractKeywords(task);

  // If the user requested an unsupported format (e.g. PPTX, DOCX)
  if (!plan.supported) {
    return {
      task,
      keywords,
      plan,
      rankedServices: [],
      recommended: null,
      reasoning: plan.unavailableReason || plan.reasoning,
    };
  }

  // Fetch all active services
  const services = await prisma.service.findMany({
    where: { active: true },
  });

  if (services.length === 0) {
    return {
      task,
      keywords,
      plan,
      rankedServices: [],
      recommended: null,
      reasoning: "No active services are currently available in the registry.",
    };
  }

  const maxPrice = Math.max(...services.map((s) => s.price));

  // Score services with plan-informed weighting
  const scored: ScoredService[] = services
    .map((s) => {
      let relevance = calculateRelevance(s, keywords);

      // Boost service if it matches the plan's required services
      if (plan.requiredServices.some((rs) => s.name.toLowerCase().includes(rs.toLowerCase()))) {
        relevance = Math.min(relevance + 0.5, 1.0);
      }

      // If user specifically requested PDF report, ensure Report Generator is highest priority
      if (plan.intent === "research_and_report" && s.name.includes("Report Generator")) {
        relevance = 1.0;
      }

      // If user requested research only, boost Web Research
      if (plan.intent === "research_only" && s.name.includes("Web Research")) {
        relevance = 1.0;
      }

      // If user requested data/financial analysis, boost Financial Analyzer
      if (plan.intent === "data_analysis" && s.name.includes("Financial Analyzer")) {
        relevance = 1.0;
      }

      const ratingScore = normalizeRating(s.rating);
      const priceScore = normalizePrice(s.price, maxPrice);

      const totalScore =
        WEIGHTS.relevance * relevance +
        WEIGHTS.rating * ratingScore +
        WEIGHTS.price * priceScore;

      return {
        id: s.id,
        name: s.name,
        provider: s.provider,
        category: s.category,
        price: s.price,
        rating: s.rating,
        capabilities: safeParseJson(s.capabilities),
        score: Math.round(totalScore * 100) / 100,
        scoreBreakdown: {
          relevance: Math.round(relevance * 100) / 100,
          rating: Math.round(ratingScore * 100) / 100,
          price: Math.round(priceScore * 100) / 100,
        },
      };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  const recommended = scored.length > 0 ? scored[0] : null;
  const reasoning = plan.reasoning;

  return {
    task,
    keywords,
    plan,
    rankedServices: scored,
    recommended,
    reasoning,
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
