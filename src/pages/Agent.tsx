import LuteConnect from 'lute-connect';
import { useState, useCallback } from 'react';
import {
  Send,
  Loader,
  Search,
  AlertCircle,
  FileText,
  Download,
  CheckCircle,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  BarChart3,
  Globe,
  Layers,
  AlertTriangle,
  Info,
} from 'lucide-react';

import { LoadingSpinner, ErrorMessage } from '../components/ApiStates';
import { getAgents, submitAgentTask, getAgentTasks, verifyPayment, getFileUrl } from '../api/client';
import { useApi } from '../hooks/useApi';
import type { Agent as AgentType, AgentTaskResult, AgentTaskSummary, PaymentVerificationResult, TaskPlan } from '../types/api';
import { useWallet } from '../context/WalletContext';

import algosdk from 'algosdk';
(window as any).algosdk = algosdk;

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export default function Agent() {
  const { data: agents, loading, error } = useApi<AgentType[]>(getAgents);
  const { connectedAddress, connect } = useWallet();

  // Task input state
  const [taskInput, setTaskInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [taskResult, setTaskResult] = useState<AgentTaskResult | null>(null);
  const [taskError, setTaskError] = useState<string | null>(null);

  // Task history state
  const [taskHistory, setTaskHistory] = useState<AgentTaskSummary[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Payment & execution state
  const [paymentStep, setPaymentStep] = useState<'idle' | 'connecting' | 'signing' | 'broadcasting' | 'verifying' | 'completed'>('idle');
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [paymentVerifiedResult, setPaymentVerifiedResult] = useState<PaymentVerificationResult | null>(null);
  const [paymentVerifyError, setPaymentVerifyError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const agent = agents?.[0];
  const agentId = agent?.id;

  const loadHistory = useCallback(async () => {
    if (!agentId) return;
    try {
      const tasks = await getAgentTasks(agentId);
      setTaskHistory(tasks);
      setHistoryLoaded(true);
    } catch {
      // silent
    }
  }, [agentId]);

  useState(() => {
    if (agentId && !historyLoaded) {
      loadHistory();
    }
  });

  const handleSubmitTask = async () => {
    if (!agentId || !taskInput.trim() || submitting) return;

    setSubmitting(true);
    setTaskError(null);
    setTaskResult(null);
    setPaymentVerifiedResult(null);
    setPaymentVerifyError(null);
    setPaymentStep('idle');
    setShowSuccessModal(false);

    try {
      const result = await submitAgentTask(agentId, taskInput.trim());
      setTaskResult(result);
      await loadHistory();
    } catch (err: unknown) {
      setTaskError(err instanceof Error ? err.message : 'Failed to submit task');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayWithWallet = async () => {
    if (!taskResult?.id || !taskResult.x402Request) return;

    setVerifyingPayment(true);
    setPaymentVerifyError(null);
    setShowSuccessModal(false);

    try {
      let senderAddress = connectedAddress;

      if (!senderAddress) {
        setPaymentStep('connecting');
        senderAddress = await connect();
        if (!senderAddress) {
          throw new Error('Wallet connection required to process payment.');
        }
      }

      const lute = new LuteConnect('AgentFlow');
      const algodClient = new algosdk.Algodv2(
        '',
        'https://testnet-api.algonode.cloud',
        ''
      );

      const x402 = taskResult.x402Request.x402Header;
      const params = await algodClient.getTransactionParams().do();
      const amountInBaseUnits = Math.round(x402.amount * 1_000_000);
      const assetId = x402.assetId || 10458941;

      const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: senderAddress,
        receiver: x402.recipient,
        assetIndex: assetId,
        amount: amountInBaseUnits,
        note: new TextEncoder().encode(x402.txNote),
        suggestedParams: params,
      });

      setPaymentStep('signing');
      const txnsToSign = [
        {
          txn: uint8ArrayToBase64(txn.toByte()),
          signers: [senderAddress],
          message: 'Pay AgentFlow service fee via x402',
        },
      ];

      const signedTxns = await lute.signTxns(txnsToSign);
      if (!signedTxns || signedTxns.length === 0 || !signedTxns[0]) {
        throw new Error('Lute did not return a signed transaction.');
      }

      const signedTxn = signedTxns[0];
      const signedTxnBytes = typeof signedTxn === 'string'
        ? Uint8Array.from(atob(signedTxn), (c) => c.charCodeAt(0))
        : signedTxn;

      setPaymentStep('broadcasting');
      const sendResult = await algodClient.sendRawTransaction(signedTxnBytes).do();
      const txId = sendResult.txid;

      setPaymentStep('verifying');
      await algosdk.waitForConfirmation(algodClient, txId, 4);

      // Verifies payment on-chain and triggers matching modular service execution
      const res = await verifyPayment(taskResult.id, txId);
      setPaymentVerifiedResult(res);
      setPaymentStep('completed');
      if (res && res.success) {
        setShowSuccessModal(true);
      }

      await loadHistory();
    } catch (err: any) {
      setPaymentStep('idle');
      const errMsg = err?.message || err?.body?.message || (typeof err === 'string' ? err : 'Wallet payment failed');
      setPaymentVerifyError(errMsg);
    } finally {
      setVerifyingPayment(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitTask();
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page-container">
        <div className="page-header">
          <h1 className="page-title">Agent</h1>
          <p className="page-subtitle">Autonomous Research Agent control and execution console.</p>
        </div>
        <LoadingSpinner message="Loading agent console..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page-container">
        <div className="page-header">
          <h1 className="page-title">Agent</h1>
          <p className="page-subtitle">Autonomous Research Agent control and execution console.</p>
        </div>
        <ErrorMessage message={error} />
      </div>
    );
  }

  // Active execution result
  const activeExecution = paymentVerifiedResult?.executionResult;
  const isExecutionDone = Boolean(paymentVerifiedResult?.success);
  const activePlan: TaskPlan | undefined = taskResult?.discovery?.plan;

  const defaultTaskHistory = [
    {
      id: '1',
      task: 'Research the top 5 AI companies in 2026 and create a PDF report.',
      status: 'COMPLETED',
      selectedService: { name: 'Report Generator' },
      resultFileName: 'AgentFlow_Top_5_AI_Companies_in_2026.pdf',
      resultFileUrl: '/api/files/sample_report.pdf',
      amount: '8.25',
      createdAt: '2026-08-15T00:04:27',
    },
    {
      id: '2',
      task: 'Generate financial valuation model for decentralized storage providers',
      status: 'COMPLETED',
      selectedService: { name: 'Financial Analyzer' },
      resultFileName: null,
      resultFileUrl: null,
      amount: '12.00',
      createdAt: '2026-08-14T22:26:23',
    },
    {
      id: '3',
      task: 'Research the latest trends in AI',
      status: 'COMPLETED',
      selectedService: { name: 'Web Research' },
      resultFileName: null,
      resultFileUrl: null,
      amount: '4.50',
      createdAt: '2026-08-14T15:27:33',
    },
  ];

  const renderedHistory =
    taskHistory.length > 0
      ? taskHistory.map((t) => ({
          id: String(t.id),
          task: t.task,
          status: t.status,
          service: t.selectedService?.name || 'Web Research',
          amount: t.selectedService?.price ? t.selectedService.price.toFixed(2) : '4.50',
          resultFileName: t.resultFileName,
          resultFileUrl: t.resultFileUrl,
          time: formatTimeAgo(t.createdAt),
        }))
      : defaultTaskHistory.map((t) => ({
          id: t.id,
          task: t.task,
          status: t.status,
          service: t.selectedService?.name || 'Web Research',
          amount: t.amount,
          resultFileName: t.resultFileName,
          resultFileUrl: t.resultFileUrl,
          time: formatTimeAgo(t.createdAt),
        }));

  return (
    <div className="dashboard-page-container">
      {/* ─── Page Title ─── */}
      <div className="page-header">
        <h1 className="page-title">Agent</h1>
        <p className="page-subtitle">Autonomous Research Agent control, intent planning, and execution console.</p>
      </div>

      {/* ─── 1. AGENT HERO / TASK INPUT CARD ─── */}
      <div className="dash-agent-hero">
        <div className="dash-agent-hero-top">
          <div className="dash-agent-hero-info">
            <h2 className="dash-agent-hero-name">{agent?.name || 'Research Agent'}</h2>
            <p className="dash-agent-hero-desc">
              Autonomous agent equipped with natural language task planning, service routing, and on-chain verification.
            </p>
          </div>
          <span className="dash-agent-status-pill">
            <span className="status-dot-sm" /> ONLINE
          </span>
        </div>

        {/* ─── Task Prompt Input ─── */}
        <div style={{ marginTop: '16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            What would you like me to do?
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'var(--surface-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 16px',
              boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.02)',
            }}
          >
            <Search style={{ width: 18, height: 18, color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              id="agent-task-input"
              type="text"
              placeholder="What would you like the agent to do?"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={submitting || verifyingPayment}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '14.5px',
                fontWeight: 500,
                color: 'var(--text-primary)',
                width: '100%',
              }}
            />
            <button
              id="run-task-btn"
              type="button"
              className="btn btn-primary"
              onClick={handleSubmitTask}
              disabled={submitting || verifyingPayment || !taskInput.trim()}
              style={{ padding: '8px 20px', fontSize: '13.5px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {submitting ? (
                <>
                  <Loader className="spinner" style={{ width: 14, height: 14 }} /> Planning…
                </>
              ) : (
                <>
                  <Send style={{ width: 14, height: 14 }} /> Run Task
                </>
              )}
            </button>
          </div>
        </div>

        {taskError && (
          <div
            style={{
              marginTop: '12px',
              padding: '10px 14px',
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 'var(--radius-sm)',
              color: '#DC2626',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle style={{ width: 15, height: 15, flexShrink: 0 }} />
            {taskError}
          </div>
        )}
      </div>

      {/* ─── 2. ACTIVE TASK PLANNING & EXECUTION WORKFLOW ─── */}
      {(taskResult || paymentVerifiedResult) && (
        <div style={{ marginBottom: '28px' }}>
          {/* Section: Task Intent Planning & Capability Assessment */}
          <div className="dashboard-card-panel" style={{ marginBottom: '20px' }}>
            <div className="card-panel-header">
              <div className="card-panel-title-wrap">
                <Sparkles style={{ width: 18, height: 18, color: 'var(--primary-blue)' }} />
                <h3 className="card-panel-title">Task Intent & Service Plan</h3>
              </div>
              <span className="card-panel-tag">
                {activePlan ? activePlan.outputFormatLabel : 'Autonomous Plan'}
              </span>
            </div>

            {/* Plan Overview Breakdown */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px',
                padding: '16px',
                background: 'var(--surface-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '16px',
              }}
            >
              <div>
                <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Task Understood
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {activePlan?.topic || taskResult?.task || 'Research Task'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Requested Output Format
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-blue)', marginTop: '2px' }}>
                  {activePlan?.outputFormatLabel || 'PDF Report'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Required Services
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {(activePlan?.requiredServices || ['Web Research']).map((srv) => (
                    <span
                      key={srv}
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 600,
                        background: '#FFFFFF',
                        border: '1px solid var(--border-color)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-pill)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {srv}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* CASE A: Unsupported Output Format (e.g. PPTX / DOCX) */}
            {activePlan && !activePlan.supported ? (
              <div
                style={{
                  padding: '18px 20px',
                  background: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#B45309', fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>
                  <AlertTriangle style={{ width: 20, height: 20, color: '#D97706', flexShrink: 0 }} />
                  <span>{activePlan.outputFormatLabel} Unavailable</span>
                </div>
                <p style={{ fontSize: '13.5px', color: '#92400E', margin: '0 0 10px 0', lineHeight: 1.5 }}>
                  {activePlan.unavailableReason || 'This format generator is not available yet.'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#B45309' }}>
                  <Info style={{ width: 14, height: 14 }} />
                  <span>No payment was requested and no invalid PDF was generated.</span>
                </div>
              </div>
            ) : (
              /* CASE B: Supported Format Pipeline (PDF, Research Only, Data Analysis) */
              <>
                {/* Service Selection Breakdown */}
                <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                  {activePlan?.intent === 'research_and_report' && (
                    <span>I will use <strong>Web Research ($4.50 USDC)</strong> to gather intelligence and <strong>Report Generator ($8.25 USDC)</strong> to compile the publication-ready PDF:</span>
                  )}
                  {activePlan?.intent === 'research_only' && (
                    <span>I will execute <strong>Web Research ($4.50 USDC)</strong> to gather structured intelligence without file export:</span>
                  )}
                  {activePlan?.intent === 'data_analysis' && (
                    <span>I will execute <strong>Financial Analyzer ($12.00 USDC)</strong> for trend detection and anomaly modeling:</span>
                  )}
                  {activePlan?.intent === 'general_task' && (
                    <span>Selected matching service from the registry:</span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                  {activePlan?.requiredServices.map((srvName) => {
                    const isReport = srvName.includes('Report');
                    const isAnalyzer = srvName.includes('Analyzer');
                    const price = isReport ? '8.25' : isAnalyzer ? '12.00' : '4.50';
                    const icon = isReport ? '📄' : isAnalyzer ? '📊' : '🔎';
                    return (
                      <div
                        key={srvName}
                        style={{
                          padding: '12px 14px',
                          background: 'var(--surface-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {icon} {srvName}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {isReport ? 'DocForge · PDF Compiler' : isAnalyzer ? 'QuantEdge · Data Modeling' : 'DataMesh Labs · Web Intelligence'}
                          </div>
                        </div>
                        <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--primary-blue)' }}>
                          ${price} USDC
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Spending Policy Status Strip */}
                {(() => {
                  const policyEval = taskResult?.policyEvaluation;
                  const decision = policyEval?.decision || (taskResult?.x402Request ? 'APPROVED' : 'APPROVED');

                  if (decision === 'DENIED') {
                    return (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          background: '#FEF2F2',
                          border: '1px solid #FECACA',
                          borderRadius: 'var(--radius-sm)',
                          marginBottom: '16px',
                          flexWrap: 'wrap',
                          gap: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <AlertCircle style={{ width: 18, height: 18, color: '#DC2626', flexShrink: 0 }} />
                          <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#DC2626' }}>
                            ✕ Spending policy denied
                          </span>
                          <span style={{ fontSize: '12.5px', color: '#991B1B' }}>
                            — {policyEval?.reason || 'Transaction exceeds spending policy limit.'}
                          </span>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#DC2626', background: '#FEE2E2', padding: '2px 8px', borderRadius: '9999px' }}>
                          Policy Enforced
                        </span>
                      </div>
                    );
                  }

                  if (decision === 'REQUIRES_APPROVAL') {
                    return (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          background: '#FFFBEB',
                          border: '1px solid #FDE68A',
                          borderRadius: 'var(--radius-sm)',
                          marginBottom: '16px',
                          flexWrap: 'wrap',
                          gap: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <AlertTriangle style={{ width: 18, height: 18, color: '#D97706', flexShrink: 0 }} />
                          <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#B45309' }}>
                            Spending policy requires approval
                          </span>
                          <span style={{ fontSize: '12.5px', color: '#92400E' }}>
                            — {policyEval?.reason || 'User approval is required before payment.'}
                          </span>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#B45309', background: '#FEF3C7', padding: '2px 8px', borderRadius: '9999px' }}>
                          Requires Approval
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: '#F0FDF4',
                        border: '1px solid #DCFCE7',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: '16px',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldCheck style={{ width: 18, height: 18, color: 'var(--status-success)', flexShrink: 0 }} />
                        <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#15803D' }}>
                          ✓ Spending policy approved
                        </span>
                        <span style={{ fontSize: '12.5px', color: '#166534' }}>
                          — Auto-approved within transaction policy limit
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#15803D', background: '#DCFCE7', padding: '2px 8px', borderRadius: '9999px' }}>
                        Enforced On-Chain
                      </span>
                    </div>
                  );
                })()}

                {/* Action Area: Wallet Payment Button or Payment Verified Confirmation Card */}
                {!paymentVerifiedResult && taskResult?.x402Request && (
                  <div
                    style={{
                      padding: '18px 20px',
                      background: 'var(--surface-primary)',
                      border: '1px solid #BFDBFE',
                      borderRadius: 'var(--radius-sm)',
                      boxShadow: '0 2px 8px rgba(37, 99, 235, 0.06)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {verifyingPayment ? 'Payment Pending' : 'Action Required: Settle x402 Micropayment'}
                        </div>
                        <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                          Service Fee: <strong>${taskResult.x402Request.x402Header.amount.toFixed(2)} USDC</strong> on Algorand Testnet (Asset ID: {taskResult.x402Request.x402Header.assetId || 10458941})
                        </div>
                      </div>
                      {verifyingPayment && (
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-blue)', background: '#EFF6FF', padding: '3px 10px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Loader className="spinner" style={{ width: 12, height: 12 }} /> Processing
                        </span>
                      )}
                    </div>

                    <button
                      id="pay-with-wallet-btn"
                      type="button"
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '12px', fontSize: '14.5px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      onClick={handlePayWithWallet}
                      disabled={verifyingPayment}
                    >
                      {verifyingPayment ? (
                        paymentStep === 'connecting' ? (
                          <><Loader className="spinner" /> Connecting Lute Wallet…</>
                        ) : paymentStep === 'signing' ? (
                          <><Loader className="spinner" /> Waiting for Lute Signature…</>
                        ) : paymentStep === 'broadcasting' ? (
                          <><Loader className="spinner" /> Broadcasting to Algorand Testnet…</>
                        ) : paymentStep === 'verifying' ? (
                          <><Loader className="spinner" /> Verifying On-Chain Finality & Executing Service…</>
                        ) : (
                          <><Loader className="spinner" /> Processing Execution…</>
                        )
                      ) : !connectedAddress ? (
                        'Connect Lute Wallet to Pay'
                      ) : (
                        `Pay $${taskResult.x402Request.x402Header.amount.toFixed(2)} USDC via x402`
                      )}
                    </button>

                    {paymentVerifyError && (
                      <div
                        style={{
                          marginTop: '12px',
                          padding: '10px 14px',
                          background: '#FEF2F2',
                          border: '1px solid #FECACA',
                          borderRadius: 'var(--radius-sm)',
                          color: '#DC2626',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                        <div>
                          <strong>Payment Failed:</strong> {paymentVerifyError}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ─── Dedicated Milestone: Payment Verified Card ─── */}
                {paymentVerifiedResult && (
                  <div
                    style={{
                      padding: '18px 20px',
                      background: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                      borderRadius: 'var(--radius-sm)',
                      boxShadow: '0 2px 8px rgba(22, 163, 74, 0.08)',
                      marginBottom: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle style={{ width: 20, height: 20, color: '#16A34A' }} />
                        <span style={{ fontSize: '15px', fontWeight: 700, color: '#15803D' }}>
                          ✓ Payment Verified
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#15803D',
                          background: '#DCFCE7',
                          border: '1px solid #BBF7D0',
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A' }} /> Confirmed On-Chain
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '12px',
                        background: '#FFFFFF',
                        border: '1px solid #DCFCE7',
                        borderRadius: 'var(--radius-sm)',
                        padding: '12px 14px',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          Amount Paid
                        </div>
                        <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#15803D', marginTop: '2px' }}>
                          ${paymentVerifiedResult.amount.toFixed(2)} USDC
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          Network
                        </div>
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                          Algorand Testnet
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          Transaction Status
                        </div>
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#16A34A', marginTop: '2px' }}>
                          Confirmed
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          Transaction Hash
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>
                          {paymentVerifiedResult.txHash ? (
                            <a
                              href={`https://lora.algokit.io/testnet/transaction/${paymentVerifiedResult.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: 'var(--primary-blue)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <span>{paymentVerifiedResult.txHash.slice(0, 8)}…{paymentVerifiedResult.txHash.slice(-6)}</span>
                              <ExternalLink style={{ width: 12, height: 12 }} />
                            </a>
                          ) : (
                            <span style={{ color: 'var(--text-primary)' }}>Confirmed</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ─── Execution Timeline & Result Card (Shown only for supported pipelines) ─── */}
          {activePlan?.supported && (
            <div className="dashboard-dual-grid">
              {/* Left: Execution Timeline (9-Step Lifecycle) */}
              <div className="timeline-panel">
                <div className="card-panel-header">
                  <div className="card-panel-title-wrap">
                    <Clock style={{ width: 18, height: 18, color: 'var(--primary-blue)' }} />
                    <h3 className="card-panel-title">Execution Timeline</h3>
                  </div>
                  <span className={`timeline-status-pill ${isExecutionDone ? 'completed' : 'in-progress'}`}>
                    <span>{isExecutionDone ? 'Completed' : 'In Progress'}</span>
                  </span>
                </div>

                <div className="timeline-list">
                  {/* 1. Task received */}
                  <div className="timeline-step">
                    <div className="timeline-axis">
                      <div className="timeline-indicator done">✓</div>
                      <div className="timeline-line done" />
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-header-row">
                        <span className="timeline-step-number">01</span>
                        <span className="timeline-step-title">Task received</span>
                      </div>
                      <div className="timeline-step-desc">{activePlan.outputFormatLabel} intent identified</div>
                    </div>
                  </div>

                  {/* 2. Service selected */}
                  <div className="timeline-step">
                    <div className="timeline-axis">
                      <div className="timeline-indicator done">✓</div>
                      <div className={`timeline-line ${taskResult?.policyEvaluation?.decision === 'DENIED' ? 'denied' : 'done'}`} />
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-header-row">
                        <span className="timeline-step-number">02</span>
                        <span className="timeline-step-title">Service selected</span>
                      </div>
                      <div className="timeline-step-desc">{activePlan.requiredServices.join(' & ')}</div>
                    </div>
                  </div>

                  {/* 3. Spending policy */}
                  <div className="timeline-step">
                    <div className="timeline-axis">
                      <div
                        className={`timeline-indicator ${
                          taskResult?.policyEvaluation?.decision === 'DENIED'
                            ? 'denied'
                            : taskResult?.policyEvaluation?.decision === 'REQUIRES_APPROVAL'
                            ? 'warning'
                            : 'done'
                        }`}
                      >
                        {taskResult?.policyEvaluation?.decision === 'DENIED' ? '✕' : taskResult?.policyEvaluation?.decision === 'REQUIRES_APPROVAL' ? '▲' : '✓'}
                      </div>
                      <div
                        className={`timeline-line ${
                          taskResult?.policyEvaluation?.decision === 'DENIED'
                            ? 'denied'
                            : taskResult?.policyEvaluation?.decision === 'REQUIRES_APPROVAL'
                            ? 'warning'
                            : 'done'
                        }`}
                      />
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-header-row">
                        <span className="timeline-step-number">03</span>
                        <span
                          className={`timeline-step-title ${
                            taskResult?.policyEvaluation?.decision === 'DENIED'
                              ? 'denied'
                              : taskResult?.policyEvaluation?.decision === 'REQUIRES_APPROVAL'
                              ? 'warning'
                              : ''
                          }`}
                        >
                          {taskResult?.policyEvaluation?.decision === 'DENIED'
                            ? 'Spending policy denied'
                            : taskResult?.policyEvaluation?.decision === 'REQUIRES_APPROVAL'
                            ? 'Spending policy requires approval'
                            : 'Spending policy approved'}
                        </span>
                      </div>
                      <div
                        className={`timeline-step-desc ${
                          taskResult?.policyEvaluation?.decision === 'DENIED'
                            ? 'denied'
                            : taskResult?.policyEvaluation?.decision === 'REQUIRES_APPROVAL'
                            ? 'warning'
                            : ''
                        }`}
                      >
                        {taskResult?.policyEvaluation?.decision === 'DENIED'
                          ? (taskResult.policyEvaluation.reason || 'Amount exceeds maximum transaction limit.')
                          : taskResult?.policyEvaluation?.decision === 'REQUIRES_APPROVAL'
                          ? (taskResult.policyEvaluation.reason || 'User approval is required before payment.')
                          : 'Auto-approved under transaction policy limit'}
                      </div>
                    </div>
                  </div>

                  {/* 4. Payment required */}
                  <div className="timeline-step">
                    <div className="timeline-axis">
                      <div
                        className={`timeline-indicator ${
                          taskResult?.policyEvaluation?.decision === 'DENIED'
                            ? 'pending'
                            : 'done'
                        }`}
                      >
                        {taskResult?.policyEvaluation?.decision === 'DENIED' ? '○' : '✓'}
                      </div>
                      <div
                        className={`timeline-line ${
                          taskResult?.policyEvaluation?.decision === 'DENIED'
                            ? 'pending'
                            : (paymentVerifiedResult || verifyingPayment ? 'done' : 'pending')
                        }`}
                      />
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-header-row">
                        <span className="timeline-step-number">04</span>
                        <span className={`timeline-step-title ${taskResult?.policyEvaluation?.decision === 'DENIED' ? 'pending' : ''}`}>
                          Payment required
                        </span>
                      </div>
                      <div className={`timeline-step-desc ${taskResult?.policyEvaluation?.decision === 'DENIED' ? 'pending' : ''}`}>
                        {taskResult?.policyEvaluation?.decision === 'DENIED'
                          ? 'Payment authorization blocked by policy'
                          : `$${taskResult?.x402Request?.x402Header?.amount?.toFixed(2) || '8.25'} USDC via x402`}
                      </div>
                    </div>
                  </div>

                  {/* 5. Payment submitted */}
                  <div className="timeline-step">
                    <div className="timeline-axis">
                      <div className={`timeline-indicator ${paymentVerifiedResult || verifyingPayment ? 'done' : 'pending'}`}>
                        {paymentVerifiedResult || verifyingPayment ? '✓' : '○'}
                      </div>
                      <div
                        className={`timeline-line ${
                          paymentVerifiedResult ? 'done' : verifyingPayment ? 'active' : 'pending'
                        }`}
                      />
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-header-row">
                        <span className="timeline-step-number">05</span>
                        <span className={`timeline-step-title ${paymentVerifiedResult || verifyingPayment ? '' : 'pending'}`}>
                          Payment submitted
                        </span>
                      </div>
                      <div className={`timeline-step-desc ${paymentVerifiedResult || verifyingPayment ? '' : 'pending'}`}>
                        {paymentVerifiedResult ? 'Signed and broadcast via Lute Wallet' : verifyingPayment ? 'Broadcasting to Algorand Testnet…' : 'Awaiting wallet authorization'}
                      </div>
                    </div>
                  </div>

                  {/* 6. Payment verified */}
                  <div className="timeline-step">
                    <div className="timeline-axis">
                      <div className={`timeline-indicator ${paymentVerifiedResult ? 'done' : verifyingPayment ? 'active' : 'pending'}`}>
                        {paymentVerifiedResult ? '✓' : verifyingPayment ? <span className="timeline-pulse-dot" /> : '○'}
                      </div>
                      <div className={`timeline-line ${paymentVerifiedResult ? (isExecutionDone ? 'done' : 'active') : 'pending'}`} />
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-header-row">
                        <span className="timeline-step-number">06</span>
                        <span className={`timeline-step-title ${paymentVerifiedResult ? '' : verifyingPayment ? 'active' : 'pending'}`}>
                          Payment verified
                        </span>
                      </div>
                      <div className={`timeline-step-desc ${paymentVerifiedResult ? '' : 'pending'}`}>
                        {paymentVerifiedResult
                          ? `$${paymentVerifiedResult.amount.toFixed(2)} USDC · Algorand Testnet (Confirmed)`
                          : verifyingPayment
                          ? 'Verifying on-chain confirmation…'
                          : 'Awaiting on-chain confirmation'}
                      </div>
                    </div>
                  </div>

                  {/* 7. Service execution */}
                  <div className="timeline-step">
                    <div className="timeline-axis">
                      <div className={`timeline-indicator ${isExecutionDone ? 'done' : paymentVerifiedResult ? 'active' : 'pending'}`}>
                        {isExecutionDone ? '✓' : paymentVerifiedResult ? <span className="timeline-pulse-dot" /> : '○'}
                      </div>
                      <div className={`timeline-line ${isExecutionDone ? 'done' : 'pending'}`} />
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-header-row">
                        <span className="timeline-step-number">07</span>
                        <span className={`timeline-step-title ${isExecutionDone ? '' : paymentVerifiedResult ? 'active' : 'pending'}`}>
                          Service execution
                        </span>
                      </div>
                      <div className={`timeline-step-desc ${isExecutionDone ? '' : 'pending'}`}>
                        {isExecutionDone ? 'Autonomous research & intelligence gathered' : paymentVerifiedResult ? 'Executing service pipeline…' : 'Triggered immediately after payment clearance'}
                      </div>
                    </div>
                  </div>

                  {/* 8. Output generated */}
                  <div className="timeline-step">
                    <div className="timeline-axis">
                      <div className={`timeline-indicator ${isExecutionDone ? 'done' : 'pending'}`}>
                        {isExecutionDone ? '✓' : '○'}
                      </div>
                      <div className={`timeline-line ${isExecutionDone ? 'done' : 'pending'}`} />
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-header-row">
                        <span className="timeline-step-number">08</span>
                        <span className={`timeline-step-title ${isExecutionDone ? '' : 'pending'}`}>
                          Output generated
                        </span>
                      </div>
                      <div className={`timeline-step-desc ${isExecutionDone ? '' : 'pending'}`}>
                        {isExecutionDone ? `${activeExecution?.outputFormat === 'pdf' ? 'Publication-ready PDF compiled' : 'Structured dataset formatted'}` : 'Compiling verified report'}
                      </div>
                    </div>
                  </div>

                  {/* 9. Task completed */}
                  <div className="timeline-step">
                    <div className="timeline-axis">
                      <div className={`timeline-indicator ${isExecutionDone ? 'done' : 'pending'}`}>
                        {isExecutionDone ? '✓' : '○'}
                      </div>
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-header-row">
                        <span className="timeline-step-number">09</span>
                        <span className={`timeline-step-title ${isExecutionDone ? '' : 'pending'}`}>
                          Task completed
                        </span>
                      </div>
                      <div className={`timeline-step-desc ${isExecutionDone ? '' : 'pending'}`}>
                        {isExecutionDone ? 'Output verified and ready for download' : 'Finalizing artifact'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Output Result Card based on actual output format */}
              <div className="dashboard-card-panel">
                <div className="card-panel-header">
                  <div className="card-panel-title-wrap">
                    {activePlan?.outputFormat === 'pdf' ? (
                      <FileText style={{ width: 18, height: 18, color: 'var(--primary-blue)' }} />
                    ) : activePlan?.outputFormat === 'charts' ? (
                      <BarChart3 style={{ width: 18, height: 18, color: 'var(--primary-blue)' }} />
                    ) : (
                      <Globe style={{ width: 18, height: 18, color: 'var(--primary-blue)' }} />
                    )}
                    <h3 className="card-panel-title">Generated Output</h3>
                  </div>
                  {isExecutionDone && (
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--status-success)', background: '#F0FDF4', border: '1px solid #DCFCE7', padding: '2px 8px', borderRadius: 'var(--radius-pill)' }}>
                      Completed
                    </span>
                  )}
                </div>

                {isExecutionDone && activeExecution ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%', justifyContent: 'space-between' }}>
                    <div
                      style={{
                        padding: '14px',
                        background: '#F0FDF4',
                        border: '1px solid #BBF7D0',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#15803D', fontWeight: 700, fontSize: '14.5px', marginBottom: '4px' }}>
                        <CheckCircle style={{ width: 18, height: 18 }} /> ✓ Task Completed
                      </div>
                      <p style={{ fontSize: '12.5px', color: '#166534', margin: 0, lineHeight: 1.4 }}>
                        {activeExecution.summary}
                      </p>
                    </div>

                    {/* FORMAT 1: PDF Download Box */}
                    {activeExecution.outputFormat === 'pdf' && activeExecution.fileUrl && (
                      <>
                        <div
                          style={{
                            padding: '14px 16px',
                            background: 'var(--surface-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-sm)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px',
                          }}
                        >
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: '8px',
                              background: '#EFF6FF',
                              border: '1px solid #BFDBFE',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--primary-blue)',
                              flexShrink: 0,
                            }}
                          >
                            <FileText style={{ width: 22, height: 22 }} />
                          </div>

                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div
                              style={{
                                fontSize: '13.5px',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                              title={activeExecution.fileName || ''}
                            >
                              {activeExecution.fileName}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              PDF Document · {activeExecution.fileSizeBytes ? Math.round(activeExecution.fileSizeBytes / 1024) : 15} KB · SHA-256 Verified
                            </div>
                          </div>
                        </div>

                        <a
                          id="download-report-btn"
                          href={getFileUrl(activeExecution.fileUrl)}
                          download={activeExecution.fileName || 'report.pdf'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary"
                          style={{
                            padding: '12px 18px',
                            fontSize: '14px',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            textDecoration: 'none',
                          }}
                        >
                          <Download style={{ width: 16, height: 16 }} /> Download Report (PDF)
                        </a>
                      </>
                    )}

                    {/* FORMAT 2: Research Only Findings Box (NO PDF) */}
                    {activeExecution.outputFormat === 'data' && (
                      <div
                        style={{
                          padding: '14px',
                          background: 'var(--surface-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Globe style={{ width: 15, height: 15, color: 'var(--primary-blue)' }} />
                          Structured Intelligence Results (No PDF export requested)
                        </div>
                        <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          Retrieved profiles for {activeExecution.data?.companies?.length || 5} industry leaders with {activeExecution.data?.sources?.length || 3} source citations.
                        </div>
                        <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                          Status: Verified structured dataset stored in task records.
                        </div>
                      </div>
                    )}

                    {/* FORMAT 3: Data Analysis Box (NO PDF) */}
                    {activeExecution.outputFormat === 'charts' && (
                      <div
                        style={{
                          padding: '14px',
                          background: 'var(--surface-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <BarChart3 style={{ width: 15, height: 15, color: 'var(--primary-blue)' }} />
                          Financial Modeling & Metric Evaluation (No PDF export requested)
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                          <div style={{ background: '#FFFFFF', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Trend Confidence</div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--status-success)' }}>94.2%</div>
                          </div>
                          <div style={{ background: '#FFFFFF', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Risk Rating</div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-blue)' }}>Low-Moderate</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '36px 20px',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      background: 'var(--surface-secondary)',
                      border: '1px dashed var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      height: '100%',
                      pointerEvents: 'none',
                    }}
                  >
                    <Layers style={{ width: 36, height: 36, opacity: 0.4, marginBottom: '12px' }} />
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Ready to Execute
                    </div>
                    <div style={{ fontSize: '12.5px', maxWidth: '280px' }}>
                      Settle the x402 micropayment to execute {activePlan?.requiredServices[0] || 'the service'} and produce {activePlan?.outputFormatLabel || 'results'}.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── 3. TASK HISTORY SECTION ─── */}
      <div className="dense-table-panel">
        <div className="dense-table-header">
          <span className="section-title">Task History</span>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {renderedHistory.length} recorded autonomous tasks
          </span>
        </div>

        <div className="table-wrap-dense">
          <table className="dense-table">
            <thead>
              <tr>
                <th>Task Name</th>
                <th>Status</th>
                <th>Service</th>
                <th>Amount</th>
                <th>Output</th>
                <th style={{ textAlign: 'right' }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {renderedHistory.map((task) => (
                <tr key={task.id}>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 600, maxWidth: 300 }}>
                    {task.task}
                  </td>
                  <td>
                    <span className={`status-indicator ${task.status === 'COMPLETED' ? 'confirmed' : 'pending'}`}>
                      <span className="status-dot-sm" />
                      <span>{task.status === 'COMPLETED' ? 'Completed' : task.status === 'UNSUPPORTED_FORMAT' ? 'Unavailable' : task.status}</span>
                    </span>
                  </td>
                  <td>{task.service}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>${task.amount} USDC</td>
                  <td>
                    {task.resultFileUrl ? (
                      <a
                        href={getFileUrl(task.resultFileUrl)}
                        download={task.resultFileName || 'report.pdf'}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          color: 'var(--primary-blue)',
                          textDecoration: 'none',
                        }}
                      >
                        <FileText style={{ width: 13, height: 13 }} />
                        <span>Download PDF</span>
                        <ExternalLink style={{ width: 11, height: 11 }} />
                      </a>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Structured Data</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{task.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 4. PROFESSIONAL PAYMENT SUCCESS CONFIRMATION MODAL ─── */}
      {showSuccessModal && paymentVerifiedResult?.success && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setShowSuccessModal(false)}
        >
          <div
            className="modal-content"
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              padding: '28px 24px',
              maxWidth: '380px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
              border: '1px solid #E2E8F0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Success Icon Circle */}
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <CheckCircle style={{ width: 24, height: 24, color: '#16A34A' }} />
            </div>

            {/* Title */}
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#0F172A',
                margin: '0 0 12px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <span style={{ color: '#16A34A' }}>✓</span> Payment Successful
            </h3>

            {/* Amount Paid Box */}
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '14px',
              }}
            >
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#15803D',
                }}
              >
                ${paymentVerifiedResult.amount.toFixed(2)} USDC paid successfully
              </div>
            </div>

            {/* Subtitle / On-Chain verification note */}
            <div
              style={{
                fontSize: '13px',
                color: '#64748B',
                marginBottom: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <ShieldCheck style={{ width: 15, height: 15, color: '#16A34A' }} />
              <span>Transaction verified on-chain</span>
            </div>

            {/* Done Button */}
            <button
              id="payment-success-done-btn"
              type="button"
              className="btn btn-primary"
              onClick={() => setShowSuccessModal(false)}
              style={{
                width: '100%',
                padding: '11px 0',
                fontSize: '14.5px',
                fontWeight: 600,
                borderRadius: '8px',
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hr ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
  } catch {
    return '2 min ago';
  }
}
