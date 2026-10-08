/**
 * Task Planner & Intent Classification Service for AgentFlow.
 *
 * Inspects natural language tasks before selecting services and executors to determine:
 *  1. Goal / Intent (research, report, presentation, document, data analysis)
 *  2. Desired Output Format (PDF, PPTX, DOCX, Data/JSON, Charts)
 *  3. Required Services (Web Research, Report Generator, Financial Analyzer, etc.)
 *  4. Target Executor & Capability Availability Check
 */

export interface TaskPlan {
  intent: "research_and_report" | "presentation" | "document" | "research_only" | "data_analysis" | "general_task";
  outputFormat: "pdf" | "pptx" | "docx" | "data" | "charts" | "none";
  outputFormatLabel: string;
  requiredServices: string[];
  executorKey: "pdf_report" | "pptx_presentation" | "docx_document" | "research_only" | "data_analysis" | "unsupported";
  supported: boolean;
  unavailableReason?: string;
  topic: string;
  reasoning: string;
}

/**
 * Classify task intent, detect output format, and verify executor availability.
 */
export function planTask(taskDescription: string): TaskPlan {
  const normalized = taskDescription.trim();
  const lower = normalized.toLowerCase();

  // 1. Detect requested output format
  const isPptx =
    /\b(ppt|pptx|powerpoint|presentation|presentations|slide|slides|slide deck|slidedeck|pitch deck)\b/i.test(lower);
  const isDocx =
    /\b(word|word doc|word document|doc|docx|editable document|ms word)\b/i.test(lower);
  const isPdf =
    /\b(pdf|pdf report|report as pdf|downloadable report|create a pdf|generate a pdf|in pdf format|as a pdf)\b/i.test(lower) ||
    (/\breport\b/i.test(lower) && !isPptx && !isDocx);

  const isDataAnalysis =
    /\b(csv|dataset|financial data|financial analysis|stock|valuation model|earnings|chart|charts|graph|metrics analysis|analyze (the|this)? (csv|data|dataset|numbers))\b/i.test(lower);

  const isResearch =
    /\b(research|investigate|find out|look up|lookup|overview|benchmark|compare|competitor|industry|market analysis|market intelligence)\b/i.test(lower);

  // Extract clean topic by stripping output format commands
  const cleanTopic = extractCleanTopic(normalized);

  // CASE 1: PowerPoint / Presentation requested
  if (isPptx) {
    return {
      intent: "presentation",
      outputFormat: "pptx",
      outputFormatLabel: "PowerPoint Presentation (PPTX)",
      requiredServices: ["Web Research", "Presentation Generator"],
      executorKey: "pptx_presentation",
      supported: false,
      unavailableReason:
        "I understand that you want a PowerPoint presentation. Presentation (PPTX) generation is not available yet in Phase 1.",
      topic: cleanTopic,
      reasoning:
        `I identified that you want research on "${cleanTopic}" formatted as a PowerPoint presentation. However, Presentation Generator (PPTX) is currently planned for a future release. No payment will be requested and no invalid PDF will be generated.`,
    };
  }

  // CASE 2: Word / DOCX requested
  if (isDocx) {
    return {
      intent: "document",
      outputFormat: "docx",
      outputFormatLabel: "Word Document (DOCX)",
      requiredServices: ["Web Research", "Document Generator"],
      executorKey: "docx_document",
      supported: false,
      unavailableReason:
        "I understand that you want a Word document. Word (DOCX) document generation is not available yet in Phase 1.",
      topic: cleanTopic,
      reasoning:
        `I identified that you want an editable Word document for "${cleanTopic}". However, Document Generator (DOCX) is currently planned for a future release. No payment will be requested and no invalid PDF will be generated.`,
    };
  }

  // CASE 3: Explicit PDF / Report requested
  if (isPdf) {
    return {
      intent: "research_and_report",
      outputFormat: "pdf",
      outputFormatLabel: "Publication-Ready PDF Report",
      requiredServices: ["Web Research", "Report Generator"],
      executorKey: "pdf_report",
      supported: true,
      topic: cleanTopic,
      reasoning:
        `I identified that you want comprehensive research on "${cleanTopic}" compiled into a downloadable PDF report. I will use Web Research ($4.50 USDC) to gather market intelligence and Report Generator ($8.25 USDC) to compile the publication-ready PDF.`,
    };
  }

  // CASE 4: Data / Financial Analysis requested (without file export)
  if (isDataAnalysis) {
    return {
      intent: "data_analysis",
      outputFormat: "charts",
      outputFormatLabel: "Structured Analytics & Charts",
      requiredServices: ["Financial Analyzer"],
      executorKey: "data_analysis",
      supported: true,
      topic: cleanTopic,
      reasoning:
        `I identified that you want data and financial analysis for "${cleanTopic}". I will use Financial Analyzer ($12.00 USDC) to evaluate trend models, risk metrics, and anomaly detection without generating an unnecessary PDF document.`,
    };
  }

  // CASE 5: Research Only requested (no file format specified)
  if (isResearch) {
    return {
      intent: "research_only",
      outputFormat: "data",
      outputFormatLabel: "Structured Research Intelligence",
      requiredServices: ["Web Research"],
      executorKey: "research_only",
      supported: true,
      topic: cleanTopic,
      reasoning:
        `I identified that you want research intelligence on "${cleanTopic}". I will use Web Research ($4.50 USDC) to gather structured insights, competitor profiles, and source citations without compiling an unnecessary PDF.`,
    };
  }

  // DEFAULT / GENERAL TASK
  return {
    intent: "general_task",
    outputFormat: "none",
    outputFormatLabel: "Autonomous Service Execution",
    requiredServices: ["Web Research"],
    executorKey: "research_only",
    supported: true,
    topic: cleanTopic,
    reasoning:
      `I will analyze the task "${cleanTopic}" and execute the most relevant service in the registry.`,
  };
}

/**
 * Remove command verbs and format requests to leave the core subject topic.
 */
function extractCleanTopic(task: string): string {
  return task
    .replace(/^(\s*please\s+)?(research|analyze|generate|create|produce|build|compile|write|make|find)\s+(the\s+|a\s+|an\s+)?/i, "")
    .replace(/\s+(and\s+)?(create|generate|produce|build|make|compile|format\s+as|in|as)\s+(a\s+|an\s+)?(pdf(\s+report)?|powerpoint(\s+presentation)?|ppt|pptx|slides?|presentation|word(\s+doc(ument)?)?|docx?|document|chart|charts)(\s+report)?\.?$/i, "")
    .replace(/[.]+$/, "")
    .trim() || task;
}
