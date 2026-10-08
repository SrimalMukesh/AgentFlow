// ===== Mock Data for AgentFlow =====

export interface StatItem {
  label: string;
  value: string;
  change?: string;
  icon: 'wallet' | 'activity' | 'trending' | 'layers';
  variant: 'accent' | 'success' | 'warning';
}

export interface Transaction {
  id: string;
  service: string;
  amount: string;
  status: 'confirmed' | 'pending' | 'failed';
  timestamp: string;
  network: string;
  txHash: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: string;
  rating: number;
  reviews: number;
  provider: string;
  iconVariant: 'accent' | 'success' | 'warning';
}

export interface ActivityItem {
  id: string;
  title: string;
  time: string;
  amount?: string;
  variant: 'accent' | 'success' | 'warning';
}

export interface TimelineEvent {
  id: string;
  title: string;
  time: string;
  variant: 'accent' | 'success' | 'warning';
}

export interface PlannedAction {
  id: string;
  action: string;
  service: string;
  estimatedCost: string;
  status: 'queued' | 'ready' | 'blocked';
}

// ===== Dashboard Stats =====
export const dashboardStats: StatItem[] = [
  {
    label: 'Wallet Balance',
    value: '2,847.50',
    change: 'USDC on Algorand Testnet',
    icon: 'wallet',
    variant: 'accent',
  },
  {
    label: 'Daily Spending',
    value: '142.30',
    change: 'of $500.00 limit used',
    icon: 'trending',
    variant: 'warning',
  },
  {
    label: 'Services Used',
    value: '12',
    change: 'across 3 categories',
    icon: 'layers',
    variant: 'success',
  },
  {
    label: 'Agent Status',
    value: 'Active',
    change: 'Research Agent online',
    icon: 'activity',
    variant: 'success',
  },
];

// ===== Recent Activity =====
export const recentActivity: ActivityItem[] = [
  {
    id: '1',
    title: 'Web Research completed — market analysis',
    time: '2 min ago',
    amount: '-4.50',
    variant: 'accent',
  },
  {
    id: '2',
    title: 'Financial Analyzer — Q3 earnings review',
    time: '18 min ago',
    amount: '-12.00',
    variant: 'success',
  },
  {
    id: '3',
    title: 'Report Generator — compiled findings',
    time: '45 min ago',
    amount: '-8.25',
    variant: 'accent',
  },
  {
    id: '4',
    title: 'Web Research — competitor pricing data',
    time: '1 hr ago',
    amount: '-4.50',
    variant: 'warning',
  },
  {
    id: '5',
    title: 'Agent policy updated — new daily limit',
    time: '3 hr ago',
    variant: 'accent',
  },
];

// ===== Recent Transactions =====
export const recentTransactions: Transaction[] = [
  {
    id: '1',
    service: 'Web Research',
    amount: '4.50',
    status: 'confirmed',
    timestamp: '2026-08-07 10:42:18',
    network: 'Algorand Testnet',
    txHash: '0xa3f7…c812',
  },
  {
    id: '2',
    service: 'Financial Analyzer',
    amount: '12.00',
    status: 'confirmed',
    timestamp: '2026-08-07 10:24:05',
    network: 'Algorand Testnet',
    txHash: '0x9b21…e4f3',
  },
  {
    id: '3',
    service: 'Report Generator',
    amount: '8.25',
    status: 'confirmed',
    timestamp: '2026-08-07 09:57:33',
    network: 'Algorand Testnet',
    txHash: '0x6d88…a1c7',
  },
  {
    id: '4',
    service: 'Web Research',
    amount: '4.50',
    status: 'pending',
    timestamp: '2026-08-07 09:15:41',
    network: 'Algorand Testnet',
    txHash: '0x1f44…7d92',
  },
  {
    id: '5',
    service: 'Financial Analyzer',
    amount: '12.00',
    status: 'confirmed',
    timestamp: '2026-08-06 16:30:12',
    network: 'Algorand Testnet',
    txHash: '0xc5e1…3b06',
  },
];

// ===== All Transactions (for the Transactions page) =====
export const allTransactions: Transaction[] = [
  ...recentTransactions,
  {
    id: '6',
    service: 'Web Research',
    amount: '4.50',
    status: 'confirmed',
    timestamp: '2026-08-06 14:12:55',
    network: 'Algorand Testnet',
    txHash: '0xe782…9f14',
  },
  {
    id: '7',
    service: 'Report Generator',
    amount: '8.25',
    status: 'failed',
    timestamp: '2026-08-06 11:45:22',
    network: 'Algorand Testnet',
    txHash: '0x3a19…d5c8',
  },
  {
    id: '8',
    service: 'Financial Analyzer',
    amount: '12.00',
    status: 'confirmed',
    timestamp: '2026-08-06 09:08:37',
    network: 'Algorand Testnet',
    txHash: '0xb6f4…1ea2',
  },
  {
    id: '9',
    service: 'Web Research',
    amount: '4.50',
    status: 'confirmed',
    timestamp: '2026-08-05 17:33:19',
    network: 'Algorand Testnet',
    txHash: '0x7c03…4b7e',
  },
  {
    id: '10',
    service: 'Report Generator',
    amount: '8.25',
    status: 'confirmed',
    timestamp: '2026-08-05 15:21:44',
    network: 'Algorand Testnet',
    txHash: '0xd190…8c53',
  },
];

// ===== Services =====
export const services: ServiceItem[] = [
  {
    id: '1',
    name: 'Web Research',
    description:
      'Autonomous web scraping, search aggregation, and summarization. Returns structured data with source citations.',
    category: 'Research',
    price: '4.50',
    rating: 4.8,
    reviews: 234,
    provider: 'DataMesh Labs',
    iconVariant: 'accent',
  },
  {
    id: '2',
    name: 'Financial Analyzer',
    description:
      'Real-time financial data analysis with trend detection, anomaly identification, and predictive modeling.',
    category: 'Analytics',
    price: '12.00',
    rating: 4.9,
    reviews: 187,
    provider: 'QuantEdge AI',
    iconVariant: 'success',
  },
  {
    id: '3',
    name: 'Report Generator',
    description:
      'Produces polished, publication-ready reports with charts, tables, and executive summaries from raw data.',
    category: 'Productivity',
    price: '8.25',
    rating: 4.7,
    reviews: 312,
    provider: 'DocForge',
    iconVariant: 'warning',
  },
];

// ===== Agent Data =====
export const agentTimeline: TimelineEvent[] = [
  { id: '1', title: 'Agent initialized and connected to Algorand wallet', time: '10:00 AM', variant: 'accent' },
  { id: '2', title: 'Discovered Web Research service via marketplace API', time: '10:02 AM', variant: 'accent' },
  { id: '3', title: 'Policy check passed — Web Research ($4.50 < $50 max)', time: '10:03 AM', variant: 'success' },
  { id: '4', title: 'x402 payment sent — 4.50 USDC via Algorand', time: '10:03 AM', variant: 'success' },
  { id: '5', title: 'Web Research results received — 12 sources analyzed', time: '10:05 AM', variant: 'accent' },
  { id: '6', title: 'Discovered Financial Analyzer for deeper insights', time: '10:06 AM', variant: 'accent' },
  { id: '7', title: 'Policy check passed — Financial Analyzer ($12.00 < $50 max)', time: '10:07 AM', variant: 'success' },
  { id: '8', title: 'x402 payment sent — 12.00 USDC via Algorand', time: '10:07 AM', variant: 'success' },
  { id: '9', title: 'Financial analysis complete — 3 key findings', time: '10:12 AM', variant: 'accent' },
  { id: '10', title: 'Compiling report with Report Generator', time: '10:14 AM', variant: 'warning' },
];

export const plannedActions: PlannedAction[] = [
  {
    id: '1',
    action: 'Generate final report',
    service: 'Report Generator',
    estimatedCost: '8.25 USDC',
    status: 'ready',
  },
  {
    id: '2',
    action: 'Follow-up research on finding #2',
    service: 'Web Research',
    estimatedCost: '4.50 USDC',
    status: 'queued',
  },
  {
    id: '3',
    action: 'Deep dive on competitor financials',
    service: 'Financial Analyzer',
    estimatedCost: '12.00 USDC',
    status: 'blocked',
  },
];

// ===== Spending Policy =====
export const spendingPolicy = {
  dailyLimit: 500,
  dailySpent: 142.3,
  maxTransaction: 50,
  allowedCategories: ['Research', 'Analytics', 'Productivity'],
  blockedCategories: ['Trading', 'Gambling'],
  autoApproveBelow: 15,
  requireApprovalAbove: 15,
};
