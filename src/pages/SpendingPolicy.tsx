import { useState, useEffect } from 'react';
import { Save, Check } from 'lucide-react';
import { LoadingSpinner, ErrorMessage } from '../components/ApiStates';
import { getPolicy, updatePolicy, evaluatePolicy } from '../api/client';
import { useApi } from '../hooks/useApi';
import type { SpendingPolicy as PolicyType, PolicyEvaluationResult } from '../types/api';

const allowedCategories = ['Research', 'Analytics', 'Productivity'];
const blockedCategories = ['Trading', 'Gambling'];

export default function SpendingPolicy() {
  const { data: initialPolicy, loading, error } = useApi<PolicyType>(getPolicy);

  const [dailyLimit, setDailyLimit] = useState<number>(500);
  const [maxTransaction, setMaxTransaction] = useState<number>(50);
  const [autoApproveLimit, setAutoApproveLimit] = useState<number>(15);
  const [policyEnabled, setPolicyEnabled] = useState<boolean>(true);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [simPrice, setSimPrice] = useState<number>(4.5);
  const [simResult, setSimResult] = useState<PolicyEvaluationResult | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  useEffect(() => {
    if (initialPolicy) {
      setDailyLimit(initialPolicy.dailyLimit ?? 500);
      setMaxTransaction(initialPolicy.maxTransaction ?? 50);
      setAutoApproveLimit(initialPolicy.autoApproveLimit ?? 15);
      setPolicyEnabled(initialPolicy.enabled ?? true);
    }
  }, [initialPolicy]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      await updatePolicy({
        dailyLimit,
        maxTransaction,
        autoApproveLimit,
        enabled: policyEnabled,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const runSimulation = async (price: number) => {
    setSimPrice(price);
    setSimLoading(true);
    try {
      const res = await evaluatePolicy(undefined, undefined, price);
      setSimResult(res);
    } catch {
      // silent
    } finally {
      setSimLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="page-header">
          <h1 className="page-title">Spending Policy</h1>
          <p className="page-subtitle">Autonomous financial constraints and approval rules</p>
        </div>
        <LoadingSpinner message="Loading policy..." />
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="page-header">
          <h1 className="page-title">Spending Policy</h1>
          <p className="page-subtitle">Autonomous financial constraints and approval rules</p>
        </div>
        <ErrorMessage message={error} />
      </>
    );
  }

  const spentToday = initialPolicy?.spentToday ?? 151.30;
  const dailyPercent = Math.min(Math.round((spentToday / (dailyLimit || 1)) * 100), 100);

  return (
    <>
      <div className="page-header" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Spending Policy</h1>
          <p className="page-subtitle">Autonomous financial constraints and approval rules</p>
        </div>
        <span className="status-badge-inline">
          <span className="status-dot-sm" /> ENFORCED
        </span>
      </div>

      <div className="dashboard-grid">
        {/* Policy Configuration Form */}
        <div className="section-panel">
          <div className="section-title" style={{ marginBottom: '16px' }}>Limit Parameters</div>

          <form onSubmit={handleSave}>
            <div className="form-field">
              <label className="form-label">Daily Limit (USDC)</label>
              <input
                type="number"
                className="form-input"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(parseFloat(e.target.value) || 0)}
                step="0.01"
                min="0"
              />
            </div>

            <div className="form-field">
              <label className="form-label">Maximum Transaction (USDC)</label>
              <input
                type="number"
                className="form-input"
                value={maxTransaction}
                onChange={(e) => setMaxTransaction(parseFloat(e.target.value) || 0)}
                step="0.01"
                min="0"
              />
            </div>

            <div className="form-field">
              <label className="form-label">Auto-Approve Below (USDC)</label>
              <input
                type="number"
                className="form-input"
                value={autoApproveLimit}
                onChange={(e) => setAutoApproveLimit(parseFloat(e.target.value) || 0)}
                step="0.01"
                min="0"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', marginBottom: '16px' }}>
              <input
                type="checkbox"
                id="policy-enabled-toggle"
                checked={policyEnabled}
                onChange={(e) => setPolicyEnabled(e.target.checked)}
                style={{ width: 14, height: 14, cursor: 'pointer' }}
              />
              <label htmlFor="policy-enabled-toggle" style={{ fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                Enforce policy on Algorand transactions
              </label>
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saveSuccess ? (
                <>
                  <Check style={{ width: 13, height: 13 }} /> Saved
                </>
              ) : (
                <>
                  <Save style={{ width: 13, height: 13 }} /> {saving ? 'Saving...' : 'Save Parameters'}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Status & Categorization */}
        <div>
          {/* Daily spending budget */}
          <div className="section-panel" style={{ marginBottom: '24px' }}>
            <div className="section-label">Today's Utilization</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: '6px 0 10px' }}>
              ${spentToday.toFixed(2)} / ${dailyLimit.toFixed(2)} USDC
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${dailyPercent}%` }} />
            </div>
            <div className="progress-caption">{dailyPercent}% used · ${Math.max(dailyLimit - spentToday, 0).toFixed(2)} remaining</div>
          </div>

          {/* Categorization list */}
          <div className="section-panel" style={{ marginBottom: '24px' }}>
            <div className="section-label" style={{ marginBottom: '6px' }}>Allowed Services</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--status-success)', marginBottom: '16px' }}>
              {allowedCategories.join(' · ')}
            </div>

            <div className="section-label" style={{ marginBottom: '6px' }}>Blocked Services</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--status-error)' }}>
              {blockedCategories.join(' · ')}
            </div>
          </div>

          {/* Fast Policy Evaluation Simulator */}
          <div className="section-panel">
            <div className="section-label" style={{ marginBottom: '8px' }}>Test Evaluation</div>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => runSimulation(4.5)}
                disabled={simLoading}
                style={{ fontSize: '12px', padding: '4px 8px' }}
              >
                Test $4.50
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => runSimulation(20.0)}
                disabled={simLoading}
                style={{ fontSize: '12px', padding: '4px 8px' }}
              >
                Test $20.00
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => runSimulation(60.0)}
                disabled={simLoading}
                style={{ fontSize: '12px', padding: '4px 8px' }}
              >
                Test $60.00
              </button>
            </div>

            {simResult && (
              <div
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-xs)',
                  background: simResult.decision === 'APPROVED' ? 'var(--status-success-light)' : 'var(--status-error-light)',
                  border: simResult.decision === 'APPROVED' ? '1px solid var(--status-success-border)' : '1px solid var(--status-error-border)',
                  fontSize: '12px',
                }}
              >
                <strong>${simPrice.toFixed(2)} → {simResult.decision}</strong>: {simResult.reason}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
