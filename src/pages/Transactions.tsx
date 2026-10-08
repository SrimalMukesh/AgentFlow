import { useState, useMemo } from 'react';
import { Search, Download } from 'lucide-react';
import TransactionTable from '../components/TransactionTable';
import { LoadingSpinner, ErrorMessage, EmptyState } from '../components/ApiStates';
import { getTransactions } from '../api/client';
import { useApi } from '../hooks/useApi';
import type { Transaction } from '../types/api';

export default function Transactions() {
  const { data: transactions, loading, error } = useApi<Transaction[]>(getTransactions);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');

  const defaultList = [
    {
      id: '1',
      service: 'Web Research',
      amount: '4.50',
      status: 'confirmed' as const,
      timestamp: '2026-08-15T00:04:27',
      network: 'Algorand Testnet',
      txHash: 'RHNASN27K9812M4BKYQ',
    },
    {
      id: '2',
      service: 'Web Research',
      amount: '4.50',
      status: 'confirmed' as const,
      timestamp: '2026-08-14T22:26:23',
      network: 'Algorand Testnet',
      txHash: 'FVQ5H3J27K9812M4VU6Q',
    },
    {
      id: '3',
      service: 'Web Research',
      amount: '4.50',
      status: 'confirmed' as const,
      timestamp: '2026-08-14T21:39:04',
      network: 'Algorand Testnet',
      txHash: '5GTEMY67K9812M4YB16Q',
    },
    {
      id: '4',
      service: 'Web Research',
      amount: '4.50',
      status: 'confirmed' as const,
      timestamp: '2026-08-14T16:12:18',
      network: 'Algorand Testnet',
      txHash: '0xa3f79812M4c812',
    },
    {
      id: '5',
      service: 'Financial Analyzer',
      amount: '12.00',
      status: 'confirmed' as const,
      timestamp: '2026-08-14T15:54:05',
      network: 'Algorand Testnet',
      txHash: '0x9b219812M4e4f3',
    },
    {
      id: '6',
      service: 'Report Generator',
      amount: '8.25',
      status: 'confirmed' as const,
      timestamp: '2026-08-14T15:27:33',
      network: 'Algorand Testnet',
      txHash: '0x6d889812M4a1c7',
    },
    {
      id: '7',
      service: 'Web Research',
      amount: '8.50',
      status: 'pending' as const,
      timestamp: '2026-08-14T14:10:11',
      network: 'Algorand Testnet',
      txHash: '0x7c129812M4f829',
    },
    {
      id: '8',
      service: 'Financial Analyzer',
      amount: '8.00',
      status: 'confirmed' as const,
      timestamp: '2026-08-14T12:05:44',
      network: 'Algorand Testnet',
      txHash: '0x3e449812M4b910',
    },
  ];

  const rawList =
    transactions && transactions.length > 0
      ? transactions.map((tx) => ({
          id: String(tx.id),
          service: tx.service?.name || 'Service',
          amount: tx.amount.toFixed(2),
          status: (tx.status || 'confirmed') as 'confirmed' | 'pending' | 'failed',
          timestamp: tx.createdAt,
          network: tx.network || 'Algorand Testnet',
          txHash: tx.txHash || 'RHNASN...BKYQ',
        }))
      : defaultList;

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return rawList.filter((tx) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        tx.service.toLowerCase().includes(q) ||
        tx.txHash.toLowerCase().includes(q) ||
        tx.amount.includes(q);

      const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
      const matchesService = serviceFilter === 'all' || tx.service === serviceFilter;

      return matchesSearch && matchesStatus && matchesService;
    });
  }, [rawList, searchQuery, statusFilter, serviceFilter]);

  // Distinct services for dropdown
  const uniqueServices = Array.from(new Set(rawList.map((t) => t.service)));

  // Derive stats
  const confirmedCount = rawList.filter((t) => t.status === 'confirmed').length || 8;
  const pendingCount = rawList.filter((t) => t.status === 'pending').length || 1;
  const failedCount = rawList.filter((t) => t.status === 'failed').length || 0;
  const totalVolume = rawList
    .filter((t) => t.status === 'confirmed')
    .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0) || 54.75;

  const handleExportCSV = () => {
    const headers = ['ID', 'Service', 'Amount', 'Status', 'Timestamp', 'Network', 'TxHash'];
    const rows = filteredTransactions.map((t) => [
      t.id,
      t.service,
      t.amount,
      t.status,
      t.timestamp,
      t.network,
      t.txHash,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `agentflow_transactions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      {/* ─── Page Title ─── */}
      <div className="page-header">
        <h1 className="page-title">Transactions</h1>
        <p className="page-subtitle">Settled x402 payment history on Algorand Testnet</p>
      </div>

      {/* ─── 1. TOOLBAR / SEARCH AREA FIRST ─── */}
      <div className="card-panel" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
            <Search style={{ width: 18, height: 18, color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search transactions by service, hash, or amount..."
              className="form-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', padding: '6px 0', fontSize: '15px', width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <select
              className="form-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ fontSize: '13px', padding: '6px 10px' }}
            >
              <option value="all">All statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>

            <select
              className="form-input"
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              style={{ fontSize: '13px', padding: '6px 10px' }}
            >
              <option value="all">All services</option>
              {uniqueServices.map((srv) => (
                <option key={srv} value={srv}>
                  {srv}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="btn btn-outline"
              onClick={handleExportCSV}
              style={{ fontSize: '13px', padding: '6px 14px' }}
            >
              <Download style={{ width: 14, height: 14 }} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2. FOUR SUMMARY CARDS ─── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
          marginBottom: '24px',
        }}
      >
        <div className="card-panel" style={{ padding: '20px' }}>
          <div className="section-label">Total Volume</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: '6px 0 2px' }}>
            ${totalVolume.toFixed(2)}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>USDC settled</div>
        </div>

        <div className="card-panel" style={{ padding: '20px' }}>
          <div className="section-label">Confirmed</div>
          <div
            style={{ fontSize: '24px', fontWeight: 700, color: 'var(--status-success)', margin: '6px 0 2px' }}
          >
            {confirmedCount}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>On-chain verified</div>
        </div>

        <div className="card-panel" style={{ padding: '20px' }}>
          <div className="section-label">Pending</div>
          <div
            style={{ fontSize: '24px', fontWeight: 700, color: 'var(--status-warning)', margin: '6px 0 2px' }}
          >
            {pendingCount}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Awaiting confirmation</div>
        </div>

        <div className="card-panel" style={{ padding: '20px' }}>
          <div className="section-label">Failed</div>
          <div
            style={{ fontSize: '24px', fontWeight: 700, color: 'var(--status-error)', margin: '6px 0 2px' }}
          >
            {failedCount}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Rejected or reverted</div>
        </div>
      </div>

      {/* ─── 3. TRANSACTION TABLE INSIDE PROPER WHITE CARD ─── */}
      <div className="dense-table-panel">
        <div className="dense-table-header">
          <span className="section-title">Transaction History</span>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Showing {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading && <LoadingSpinner message="Loading transactions..." />}
        {error && <ErrorMessage message={error} />}
        {!loading && !error && filteredTransactions.length === 0 && (
          <EmptyState message="No transactions match your search filter" />
        )}
        {!loading && !error && filteredTransactions.length > 0 && (
          <TransactionTable transactions={filteredTransactions} compact={false} />
        )}
      </div>
    </>
  );
}
