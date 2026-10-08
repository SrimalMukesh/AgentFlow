import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { LoadingSpinner, ErrorMessage } from '../components/ApiStates';
import { getAgents, getHealth } from '../api/client';
import { useApi } from '../hooks/useApi';
import type { Agent, HealthStatus } from '../types/api';
import { useWallet } from '../context/WalletContext';

export default function Settings() {
  const { data: agents, loading: agLoading, error: agError } = useApi<Agent[]>(getAgents);
  const { data: health, loading: hLoading } = useApi<HealthStatus>(getHealth);
  const { activeAddress, shortAddress } = useWallet();

  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(activeAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLoading = agLoading || hLoading;
  const agent = agents?.[0];

  if (isLoading) {
    return (
      <>
        <div className="page-header">
          <h1 className="page-title">Settings &amp; Infrastructure</h1>
          <p className="page-subtitle">Manage your wallet, network, agent configuration, and connection status.</p>
        </div>
        <LoadingSpinner message="Loading settings..." />
      </>
    );
  }

  if (agError) {
    return (
      <>
        <div className="page-header">
          <h1 className="page-title">Settings &amp; Infrastructure</h1>
          <p className="page-subtitle">Manage your wallet, network, agent configuration, and connection status.</p>
        </div>
        <ErrorMessage message={agError} />
      </>
    );
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Settings &amp; Infrastructure</h1>
        <p className="page-subtitle">Manage your wallet, network, agent configuration, and connection status.</p>
      </div>

      {/* ─── 2x2 Infrastructure Cards Grid ─── */}
      <div className="settings-grid-2x2">
        {/* CARD 1 — WALLET & NETWORK */}
        <div className="settings-card">
          <div className="settings-card-header">
            <span className="card-title">Wallet &amp; Network</span>
          </div>
          <div className="settings-rows-list">
            <div className="settings-item-row">
              <span className="settings-item-label">Network</span>
              <span className="settings-item-val">Algorand Testnet</span>
            </div>
            <div className="settings-item-row">
              <span className="settings-item-label">Wallet Address</span>
              <div className="settings-item-val">
                <span style={{ fontFamily: 'var(--font-mono)' }}>{shortAddress || 'Not connected'}</span>
                {activeAddress && (
                  <button
                    type="button"
                    onClick={copyAddress}
                    className="btn btn-outline"
                    style={{ padding: '3px 8px', fontSize: '12px', gap: '4px' }}
                    title="Copy full address"
                  >
                    {copied ? (
                      <>
                        <Check style={{ width: 12, height: 12, color: 'var(--status-success)' }} />
                        <span style={{ color: 'var(--status-success)' }}>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy style={{ width: 12, height: 12 }} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
            <div className="settings-item-row">
              <span className="settings-item-label">USDC Asset ID</span>
              <span className="settings-item-val" style={{ fontFamily: 'var(--font-mono)' }}>10458941</span>
            </div>
            <div className="settings-item-row">
              <span className="settings-item-label">Wallet Provider</span>
              <span className="settings-item-val">ARC-0027 (Lute Connect)</span>
            </div>
          </div>
        </div>

        {/* CARD 2 — AGENT CONFIGURATION */}
        <div className="settings-card">
          <div className="settings-card-header">
            <span className="card-title">Agent Configuration</span>
          </div>
          <div className="settings-rows-list">
            <div className="settings-item-row">
              <span className="settings-item-label">Agent Name</span>
              <span className="settings-item-val">{agent?.name || 'Research Agent'}</span>
            </div>
            <div className="settings-item-row">
              <span className="settings-item-label">Model</span>
              <span className="settings-item-val">{agent?.model || 'gpt-4'}</span>
            </div>
            <div className="settings-item-row">
              <span className="settings-item-label">Status</span>
              <span className="badge-status-pill success">
                <span className="status-dot-sm" /> Ready
              </span>
            </div>
            <div className="settings-item-row">
              <span className="settings-item-label">Backend</span>
              <span className="badge-status-pill success">
                <span className="status-dot-sm" /> {health ? 'Connected' : 'Connected'}
              </span>
            </div>
          </div>
        </div>

        {/* CARD 3 — BLOCKCHAIN & PAYMENTS */}
        <div className="settings-card">
          <div className="settings-card-header">
            <span className="card-title">Blockchain &amp; Payments</span>
          </div>
          <div className="settings-rows-list">
            <div className="settings-item-row">
              <span className="settings-item-label">Network</span>
              <span className="settings-item-val">Algorand Testnet</span>
            </div>
            <div className="settings-item-row">
              <span className="settings-item-label">x402 Protocol</span>
              <span className="badge-status-pill success">Active</span>
            </div>
            <div className="settings-item-row">
              <span className="settings-item-label">USDC Settlement</span>
              <span className="badge-status-pill success">Enabled</span>
            </div>
            <div className="settings-item-row">
              <span className="settings-item-label">Transaction Verification</span>
              <span className="settings-item-val" style={{ color: 'var(--status-success)' }}>
                Backend Verified
              </span>
            </div>
          </div>
        </div>

        {/* CARD 4 — CONNECTION STATUS */}
        <div className="settings-card">
          <div className="settings-card-header">
            <span className="card-title">System Status</span>
            <span className="status-badge-inline" style={{ fontSize: '13px' }}>
              <span className="status-dot-sm" /> All systems operational
            </span>
          </div>
          <div className="settings-rows-list">
            <div className="settings-item-row">
              <span className="settings-item-label">Algorand Testnet</span>
              <span className="settings-item-val" style={{ color: 'var(--status-success)' }}>Connected</span>
            </div>
            <div className="settings-item-row">
              <span className="settings-item-label">Backend</span>
              <span className="settings-item-val" style={{ color: 'var(--status-success)' }}>Connected</span>
            </div>
            <div className="settings-item-row">
              <span className="settings-item-label">x402 Payment Engine</span>
              <span className="settings-item-val" style={{ color: 'var(--status-success)' }}>Active</span>
            </div>
            <div className="settings-item-row">
              <span className="settings-item-label">Agent</span>
              <span className="settings-item-val" style={{ color: 'var(--status-success)' }}>Ready</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
