import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.agentActivity.deleteMany();
  await prisma.agentTask.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.spendingPolicy.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.service.deleteMany();

  // ===== Services =====
  const webResearch = await prisma.service.create({
    data: {
      name: "Web Research",
      description:
        "Autonomous web scraping, search aggregation, and summarization. Returns structured data with source citations.",
      provider: "DataMesh Labs",
      category: "Research",
      price: 4.5,
      rating: 4.8,
      endpoint: "https://api.datameshlabs.io/research",
      active: true,
      capabilities: JSON.stringify([
        "web research",
        "information gathering",
        "competitor research",
        "data extraction",
        "source citation",
      ]),
      inputDescription:
        "A research query or topic string. Optionally specify depth (shallow/deep) and max sources.",
      outputDescription:
        "Structured JSON with findings, source URLs, confidence scores, and a summary paragraph.",
      tags: JSON.stringify(["research", "web", "scraping", "data", "analysis"]),
    },
  });

  const financialAnalyzer = await prisma.service.create({
    data: {
      name: "Financial Analyzer",
      description:
        "Real-time financial data analysis with trend detection, anomaly identification, and predictive modeling.",
      provider: "QuantEdge AI",
      category: "Analytics",
      price: 12.0,
      rating: 4.9,
      endpoint: "https://api.quantedge.ai/analyze",
      active: true,
      capabilities: JSON.stringify([
        "financial analysis",
        "data analysis",
        "market analysis",
        "trend detection",
        "anomaly detection",
      ]),
      inputDescription:
        "Financial dataset or ticker symbols. Specify analysis type (trend, anomaly, forecast) and time range.",
      outputDescription:
        "Analysis report with charts data, key findings, risk metrics, and confidence intervals.",
      tags: JSON.stringify([
        "finance",
        "analytics",
        "market",
        "prediction",
        "data",
      ]),
    },
  });

  const reportGenerator = await prisma.service.create({
    data: {
      name: "Report Generator",
      description:
        "Produces polished, publication-ready reports with charts, tables, and executive summaries from raw data.",
      provider: "DocForge",
      category: "Productivity",
      price: 8.25,
      rating: 4.7,
      endpoint: "https://api.docforge.dev/generate",
      active: true,
      capabilities: JSON.stringify([
        "report generation",
        "document creation",
        "summarization",
        "chart generation",
        "data visualization",
      ]),
      inputDescription:
        "Raw data (JSON/CSV) and optional template name. Specify output format (PDF, DOCX, HTML).",
      outputDescription:
        "Publication-ready document with executive summary, data tables, charts, and appendices.",
      tags: JSON.stringify([
        "reports",
        "documents",
        "productivity",
        "visualization",
        "summary",
      ]),
    },
  });

  console.log(
    `  ✅ Created 3 services: ${webResearch.name}, ${financialAnalyzer.name}, ${reportGenerator.name}`
  );

  // ===== Agent =====
  const researchAgent = await prisma.agent.create({
    data: {
      name: "Research Agent",
      model: "gpt-4",
      status: "active",
      currentTask: "Market analysis research",
    },
  });

  console.log(`  ✅ Created agent: ${researchAgent.name}`);

  // ===== Spending Policy =====
  const policy = await prisma.spendingPolicy.create({
    data: {
      dailyLimit: 500,
      maxTransaction: 50,
      autoApproveLimit: 15,
      spentToday: 142.3,
    },
  });

  console.log(
    `  ✅ Created spending policy (daily limit: $${policy.dailyLimit})`
  );

  // ===== Transactions =====
  const transactions = await Promise.all([
    prisma.transaction.create({
      data: {
        serviceId: webResearch.id,
        amount: 4.5,
        status: "confirmed",
        network: "Algorand Testnet",
        txHash: "0xa3f7…c812",
        createdAt: new Date("2026-08-07T10:42:18Z"),
      },
    }),
    prisma.transaction.create({
      data: {
        serviceId: financialAnalyzer.id,
        amount: 12.0,
        status: "confirmed",
        network: "Algorand Testnet",
        txHash: "0x9b21…e4f3",
        createdAt: new Date("2026-08-07T10:24:05Z"),
      },
    }),
    prisma.transaction.create({
      data: {
        serviceId: reportGenerator.id,
        amount: 8.25,
        status: "confirmed",
        network: "Algorand Testnet",
        txHash: "0x6d88…a1c7",
        createdAt: new Date("2026-08-07T09:57:33Z"),
      },
    }),
    prisma.transaction.create({
      data: {
        serviceId: webResearch.id,
        amount: 4.5,
        status: "pending",
        network: "Algorand Testnet",
        txHash: "0x1f44…7d92",
        createdAt: new Date("2026-08-07T09:15:41Z"),
      },
    }),
    prisma.transaction.create({
      data: {
        serviceId: financialAnalyzer.id,
        amount: 12.0,
        status: "confirmed",
        network: "Algorand Testnet",
        txHash: "0xc5e1…3b06",
        createdAt: new Date("2026-08-06T16:30:12Z"),
      },
    }),
  ]);

  console.log(`  ✅ Created ${transactions.length} transactions`);

  // ===== Agent Activity =====
  const activities = await Promise.all([
    prisma.agentActivity.create({
      data: {
        agentId: researchAgent.id,
        action: "service_call",
        description: "Web Research completed — market analysis",
        amount: 4.5,
        createdAt: new Date("2026-08-07T10:42:18Z"),
      },
    }),
    prisma.agentActivity.create({
      data: {
        agentId: researchAgent.id,
        action: "service_call",
        description: "Financial Analyzer — Q3 earnings review",
        amount: 12.0,
        createdAt: new Date("2026-08-07T10:24:05Z"),
      },
    }),
    prisma.agentActivity.create({
      data: {
        agentId: researchAgent.id,
        action: "service_call",
        description: "Report Generator — compiled findings",
        amount: 8.25,
        createdAt: new Date("2026-08-07T09:57:33Z"),
      },
    }),
    prisma.agentActivity.create({
      data: {
        agentId: researchAgent.id,
        action: "service_call",
        description: "Web Research — competitor pricing data",
        amount: 4.5,
        createdAt: new Date("2026-08-07T09:15:41Z"),
      },
    }),
    prisma.agentActivity.create({
      data: {
        agentId: researchAgent.id,
        action: "policy_update",
        description: "Agent policy updated — new daily limit",
        createdAt: new Date("2026-08-07T08:00:00Z"),
      },
    }),
  ]);

  console.log(`  ✅ Created ${activities.length} activity entries`);

  console.log("\n🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
