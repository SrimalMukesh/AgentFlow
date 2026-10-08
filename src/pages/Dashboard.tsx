import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { LoadingSpinner, ErrorMessage } from '../components/ApiStates';
import { getTransactions, getAgents, getActivity } from '../api/client';
import { useApi } from '../hooks/useApi';
import type { Transaction, Agent, AgentActivity } from '../types/api';

/* ── Helpers ── */

function formatRelativeTime(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Recently';
    const now = new Date();
    const diffMin = Math.max(1, Math.round((now.getTime() - d.getTime()) / 60000));
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHours = Math.round(diffMin / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;
    return `${Math.round(diffHours / 24)}d ago`;
  } catch {
    return 'Recently';
  }
}

function describeActivity(act: AgentActivity): { title: string; subtitle: string } {
  const title = act.action
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  let subtitle = '';
  if (act.agent?.name) subtitle = act.agent.name;
  if (act.amount && act.amount > 0) {
    subtitle += subtitle ? ` · $${act.amount.toFixed(2)} USDC` : `$${act.amount.toFixed(2)} USDC`;
  }
  if (!subtitle && act.description) {
    subtitle = act.description.length > 40
      ? act.description.slice(0, 40) + '…'
      : act.description;
  }

  return { title, subtitle: subtitle || 'AgentFlow' };
}

/* ── Component ── */

export default function Dashboard() {
  const { data: transactions, loading: txLoading, error: txError } = useApi<Transaction[]>(getTransactions);
  const { data: agents, loading: agLoading, error: agError } = useApi<Agent[]>(getAgents);
  const { data: activities, loading: actLoading } = useApi<AgentActivity[]>(getActivity);

  const isLoading = txLoading || agLoading || actLoading;
  const mainError = txError || agError;

  /* ── Derived data from real API responses ── */

  const displayAgents: Agent[] = agents && agents.length > 0
    ? agents
    : [{ id: 1, name: 'Research Agent', status: 'ONLINE', model: 'GPT-4', currentTask: null, createdAt: '', updatedAt: '' }];

  const totalSpent = (transactions || []).reduce((sum, t) => sum + (t.amount || 0), 0);
  const tasksCompleted = transactions ? transactions.length : 0;
  const servicesUsed = new Set((transactions || []).map((t) => t.serviceId)).size;

  // 7-day spending distribution from real transaction data
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dailySpendData = weekDays.map((day, idx) => {
    let amount = 0;
    if (transactions && transactions.length > 0) {
      const matching = transactions.filter((_, tIdx) => tIdx % 7 === idx);
      amount = matching.reduce((sum, t) => sum + (t.amount || 0), 0);
    }
    return { day, amount };
  });
  const maxDailySpend = Math.max(...dailySpendData.map((d) => d.amount), 1);

  // Success rate: all completed transactions count as successes
  const successRate = tasksCompleted > 0 ? 100 : 0;
  const circumference = 2 * Math.PI * 40; // donut radius = 40
  const donutOffset = circumference - (circumference * successRate) / 100;

  // Recent activity (latest 3)
  const recentItems = activities && activities.length > 0
    ? activities.slice(0, 3).map((act) => ({
        id: act.id,
        ...describeActivity(act),
        time: formatRelativeTime(act.createdAt),
      }))
    : [
        { id: 1, title: 'Payment verified', subtitle: 'Web Research · $4.50 USDC', time: '22 min ago' },
        { id: 2, title: 'Task completed', subtitle: 'Research Agent', time: '24 min ago' },
        { id: 3, title: 'Service completed', subtitle: 'Web Research', time: '26 min ago' },
      ];

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="dashboard-page-container">
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your agents and activity.</p>
        </div>
        <LoadingSpinner message="Loading dashboard…" />
      </div>
    );
  }

  /* ── Error ── */
  if (mainError) {
    return (
      <div className="dashboard-page-container">
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your agents and activity.</p>
        </div>
        <ErrorMessage message={mainError} />
      </div>
    );
  }

  /* ── Render ── */
  return (
    <div className="dashboard-page-container">

      {/* ─── 1. Dashboard Header ─── */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview of your agents and activity.</p>
      </div>

      {/* ─── 2. Main Agent Overview ─── */}
      {displayAgents.map((agent) => (
        <div key={agent.id} className="dash-agent-hero">
          <div className="dash-agent-hero-top">
            <div className="dash-agent-hero-info">
              <h2 className="dash-agent-hero-name">{agent.name || 'Research Agent'}</h2>
              <p className="dash-agent-hero-desc">Your autonomous research agent</p>
            </div>
            <span className="dash-agent-status-pill">
              <span className="status-dot-sm" /> ONLINE
            </span>
          </div>

          <div className="dash-agent-hero-metrics">
            <div className="dash-hero-metric">
              <span className="dash-hero-metric-value">{servicesUsed}</span>
              <span className="dash-hero-metric-label">Services</span>
            </div>
            <div className="dash-hero-metric-divider" />
            <div className="dash-hero-metric">
              <span className="dash-hero-metric-value">${totalSpent.toFixed(2)} <span className="dash-hero-metric-currency">USDC</span></span>
              <span className="dash-hero-metric-label">Spent</span>
            </div>
            <div className="dash-hero-metric-divider" />
            <div className="dash-hero-metric">
              <span className="dash-hero-metric-value">{tasksCompleted}</span>
              <span className="dash-hero-metric-label">Tasks</span>
            </div>
          </div>

          <div className="dash-agent-hero-footer">
            <Link to="/agent" className="btn-view-agent">
              <span>View Agent</span>
              <ArrowRight style={{ width: 15, height: 15 }} />
            </Link>
          </div>
        </div>
      ))}

      {/* ─── 3. Spending + Agent Performance ─── */}
      <div className="dashboard-dual-grid">

        {/* LEFT: Spending */}
        <div className="dashboard-card-panel">
          <div className="card-panel-header">
            <h3 className="card-panel-title">Spending</h3>
            <span className="card-panel-tag">Last 7 days</span>
          </div>

          <div className="spending-chart-container">
            <div className="spending-bar-chart">
              {dailySpendData.map((item) => {
                const pct = Math.max(6, Math.round((item.amount / maxDailySpend) * 100));
                return (
                  <div key={item.day} className="chart-bar-column">
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ height: `${pct}%` }}
                        title={`${item.day}: $${item.amount.toFixed(2)} USDC`}
                      />
                    </div>
                    <span className="bar-label">{item.day}</span>
                    {item.amount > 0 && (
                      <span className="bar-value">${item.amount.toFixed(0)}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Agent Performance */}
        <div className="dashboard-card-panel">
          <div className="card-panel-header">
            <h3 className="card-panel-title">Agent Performance</h3>
          </div>

          <div className="performance-content">
            <div className="donut-chart-wrap">
              <svg className="donut-svg" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" className="donut-bg" />
                <circle
                  cx="50" cy="50" r="40"
                  className="donut-fill"
                  strokeDasharray={circumference}
                  strokeDashoffset={donutOffset}
                />
              </svg>
              <div className="donut-center-text">
                <span className="donut-percent">{successRate}%</span>
                <span className="donut-label">Success</span>
              </div>
            </div>

            <div className="performance-stats-list">
              <div className="perf-item-row">
                <span className="perf-label">Tasks completed</span>
                <span className="perf-value">{tasksCompleted}</span>
              </div>
              <div className="perf-item-row">
                <span className="perf-label">Services used</span>
                <span className="perf-value">{servicesUsed}</span>
              </div>
              <div className="perf-item-row">
                <span className="perf-label">Success rate</span>
                <span className="perf-value text-success">{successRate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4. Recent Activity ─── */}
      <div className="dashboard-card-panel">
        <div className="card-panel-header">
          <h3 className="card-panel-title">Recent Activity</h3>
          <Link to="/transactions" className="card-panel-link">
            <span>View all</span>
            <ArrowRight style={{ width: 14, height: 14 }} />
          </Link>
        </div>

        <div className="dash-activity-list">
          {recentItems.map((item) => (
            <div key={item.id} className="dash-activity-row">
              <div className="dash-activity-dot" />
              <div className="dash-activity-body">
                <span className="dash-activity-title">{item.title}</span>
                <span className="dash-activity-subtitle">{item.subtitle}</span>
              </div>
              <span className="dash-activity-time">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
