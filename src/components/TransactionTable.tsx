import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import type { Transaction } from '../data/mockData';

interface TransactionTableProps {
  transactions: Transaction[];
  compact?: boolean;
}

function shortenHash(hash: string): string {
  if (!hash) return '—';
  if (hash.length <= 14) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

function formatTime(timestamp: string): string {
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return timestamp;
    return d.toTimeString().split(' ')[0]; // returns HH:MM:SS
  } catch {
    return timestamp;
  }
}

export default function TransactionTable({
  transactions,
  compact = false,
}: TransactionTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyHash = (hash: string, id: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="table-wrap-dense">
      <table className="dense-table">
        <thead>
          <tr>
            <th>Service</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Time</th>
            {!compact && <th>Network</th>}
            <th>TX Hash</th>
            <th style={{ textAlign: 'right' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id}>
              <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                {tx.service}
              </td>
              <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                ${parseFloat(tx.amount || '0').toFixed(2)} USDC
              </td>
              <td>
                <span className={`status-indicator ${tx.status}`}>
                  <span className="status-dot-sm" />
                  <span style={{ textTransform: 'capitalize' }}>{tx.status}</span>
                </span>
              </td>
              <td style={{ color: 'var(--text-secondary)' }}>
                {formatTime(tx.timestamp)}
              </td>
              {!compact && (
                <td style={{ color: 'var(--text-secondary)' }}>
                  {tx.network || 'Algorand Testnet'}
                </td>
              )}
              <td>
                <span className="hash-pill" style={{ fontFamily: 'var(--font-mono)' }}>
                  {shortenHash(tx.txHash)}
                </span>
              </td>
              <td style={{ textAlign: 'right' }}>
                {tx.txHash && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => copyHash(tx.txHash, tx.id)}
                    style={{ padding: '4px 8px', fontSize: '12px', gap: '4px' }}
                    title={`Copy ${tx.txHash}`}
                  >
                    {copiedId === tx.id ? (
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
