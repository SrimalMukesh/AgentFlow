import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Wallet,
  Loader2,
  AlertCircle,
  Layers,
  Sliders,
  Zap,
  Lock,
  Eye,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';

export default function LandingPage() {
  const { connectedAddress, isConnecting, error, connect } = useWallet();
  const [connectError, setConnectError] = useState<string | null>(null);
  const [networkDropdownOpen, setNetworkDropdownOpen] = useState(false);
  const networkDropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (networkDropdownRef.current && !networkDropdownRef.current.contains(event.target as Node)) {
        setNetworkDropdownOpen(false);
      }
    }
    if (networkDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [networkDropdownOpen]);

  const handleConnectWallet = async () => {
    setConnectError(null);
    if (connectedAddress) {
      navigate('/dashboard');
      return;
    }
    const address = await connect();
    if (address) {
      navigate('/dashboard');
    } else {
      setConnectError('Wallet connection failed. Please try again.');
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-container">
      {/* ─── LANDING HEADER ─── */}
      <header className="landing-header">
        <div className="landing-header-inner">
          <div className="landing-brand">
            <svg
              className="landing-brand-logo"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="AgentFlow Logo"
            >
              <circle cx="16" cy="7" r="5" fill="#2563EB" />
              <circle cx="8" cy="22" r="5" fill="#2563EB" />
              <circle cx="24" cy="22" r="5" fill="#2563EB" />
              <path
                d="M16 12V18M11 20L14 18M21 20L18 18"
                stroke="#2563EB"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="landing-brand-text">AgentFlow</span>
          </div>

          <nav className="landing-nav-links">
            <button
              type="button"
              className="landing-nav-link"
              onClick={() => scrollToSection('about')}
            >
              About
            </button>
            <button
              type="button"
              className="landing-nav-link"
              onClick={() => scrollToSection('how-it-works')}
            >
              How it works
            </button>
            <button
              type="button"
              className="landing-nav-link"
              onClick={() => scrollToSection('security')}
            >
              Security
            </button>
          </nav>

          <div className="landing-header-actions" ref={networkDropdownRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className={`landing-network-btn ${networkDropdownOpen ? 'active' : ''}`}
              onClick={() => setNetworkDropdownOpen(!networkDropdownOpen)}
              aria-expanded={networkDropdownOpen}
              aria-label="Network Information"
            >
              <span className="landing-network-dot" />
              <span className="landing-network-text">Algorand Testnet</span>
              <ChevronDown className={`landing-network-chevron ${networkDropdownOpen ? 'rotated' : ''}`} style={{ width: 13, height: 13 }} />
            </button>

            {networkDropdownOpen && (
              <div className="landing-network-popover">
                <div className="landing-popover-header">
                  <span className="landing-popover-dot" />
                  <span className="landing-popover-title">Algorand Testnet</span>
                </div>

                <div className="landing-popover-divider" />

                <div className="landing-popover-row">
                  <span className="landing-popover-label">Network</span>
                  <span className="landing-popover-value">Algorand Testnet</span>
                </div>

                <div className="landing-popover-row">
                  <span className="landing-popover-label">Status</span>
                  <div className="landing-popover-status">
                    <span className="landing-popover-dot" />
                    <span className="landing-popover-status-text">Operational</span>
                  </div>
                </div>

                <div className="landing-popover-row">
                  <span className="landing-popover-label">Currency</span>
                  <span className="landing-popover-value">ALGO / USDC</span>
                </div>

                <div className="landing-popover-row" style={{ alignItems: 'flex-start' }}>
                  <span className="landing-popover-label">Used for</span>
                  <span className="landing-popover-value" style={{ textAlign: 'right', lineHeight: '1.4' }}>
                    Agent service payments<br />via x402
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION ─── */}
      <section className="landing-hero-section">
        <div className="landing-hero-inner">
          {/* Left Hero Column */}
          <div className="landing-hero-left">
            <div className="landing-hero-tag">
              <span className="landing-hero-tag-dot" />
              <span>AgentFlow</span>
            </div>

            <h1 className="landing-hero-title">
              Welcome to <span className="text-gradient">AgentFlow</span>
            </h1>

            <p className="landing-hero-lead">
              Autonomous agents. Real-world services. On-chain payments.
            </p>

            <div className="landing-hero-cta-wrapper">
              <button
                type="button"
                className="btn btn-primary landing-hero-cta"
                onClick={handleConnectWallet}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="btn-spinner" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Wallet style={{ width: 20, height: 20 }} />
                    <span>Connect Wallet</span>
                  </>
                )}
              </button>

              {(error || connectError) && (
                <div className="landing-wallet-error">
                  <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                  <span>{connectError || error}</span>
                </div>
              )}
            </div>

            <div className="landing-hero-badge">
              <ShieldCheck className="landing-hero-badge-icon" />
              <span>Your wallet remains in your control.</span>
            </div>
          </div>

          {/* Right Hero Visual Column */}
          <div className="landing-hero-right">
            <div className="hero-visual-wrapper">
              {/* Soft background glows */}
              <div className="hero-glow-layer glow-outer" />
              <div className="hero-glow-layer glow-inner" />

              {/* Decorative SVG network mesh matching reference image */}
              <svg
                className="hero-network-svg"
                viewBox="0 0 600 600"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="lineGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.1" />
                  </linearGradient>
                  <linearGradient id="lineGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#93C5FD" stopOpacity="0.08" />
                  </linearGradient>
                  <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="8" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <radialGradient id="centerRadial" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#EFF6FF" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Ambient concentric circles */}
                <circle cx="300" cy="300" r="230" stroke="#DBEAFE" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx="300" cy="300" r="170" stroke="#BFDBFE" strokeWidth="1.2" strokeOpacity="0.7" />
                <circle cx="300" cy="300" r="110" fill="url(#centerRadial)" stroke="#93C5FD" strokeWidth="1" />

                {/* Connection lines from center to nodes */}
                <line x1="300" y1="300" x2="385" y2="145" stroke="url(#lineGrad1)" strokeWidth="1.5" />
                <line x1="300" y1="300" x2="480" y2="175" stroke="url(#lineGrad1)" strokeWidth="1.5" />
                <line x1="300" y1="300" x2="455" y2="310" stroke="url(#lineGrad1)" strokeWidth="1.5" />
                <line x1="300" y1="300" x2="395" y2="455" stroke="url(#lineGrad2)" strokeWidth="1.5" />
                <line x1="300" y1="300" x2="230" y2="450" stroke="url(#lineGrad2)" strokeWidth="1.5" />
                <line x1="300" y1="300" x2="150" y2="360" stroke="url(#lineGrad2)" strokeWidth="1.5" />
                <line x1="300" y1="300" x2="145" y2="190" stroke="url(#lineGrad1)" strokeWidth="1.5" />
                <line x1="300" y1="300" x2="225" y2="140" stroke="url(#lineGrad1)" strokeWidth="1.5" />

                {/* Inter-node perimeter connection web */}
                <path
                  d="M225 140 L385 145 L480 175 L455 310 L495 365 L395 455 L230 450 L150 360 L145 190 Z"
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <path
                  d="M145 190 L225 140 L385 145 M480 175 L455 310 M395 455 L455 310 M150 360 L230 450"
                  stroke="#CBD5E1"
                  strokeWidth="1"
                />

                {/* Outer satellite dots & micro nodes */}
                <circle cx="360" cy="85" r="4.5" fill="#2563EB" />
                <line x1="360" y1="85" x2="385" y2="145" stroke="#93C5FD" strokeWidth="1" />

                <circle cx="515" cy="210" r="6" fill="#3B82F6" fillOpacity="0.8" />
                <line x1="480" y1="175" x2="515" y2="210" stroke="#BFDBFE" strokeWidth="1" />

                <circle cx="455" cy="310" r="5" fill="#2563EB" />
                <circle cx="505" cy="370" r="5.5" fill="#60A5FA" />
                <line x1="455" y1="310" x2="505" y2="370" stroke="#BFDBFE" strokeWidth="1" />

                <circle cx="445" cy="485" r="4" fill="#3B82F6" />
                <line x1="395" y1="455" x2="445" y2="485" stroke="#BFDBFE" strokeWidth="1" />

                <circle cx="395" cy="455" r="5" fill="#2563EB" />
                <circle cx="230" cy="450" r="6" fill="#93C5FD" />
                <circle cx="180" cy="415" r="4" fill="#2563EB" />

                <circle cx="120" cy="275" r="4.5" fill="#3B82F6" />
                <line x1="145" y1="190" x2="120" y2="275" stroke="#BFDBFE" strokeWidth="1" />
                <line x1="120" y1="275" x2="150" y2="360" stroke="#BFDBFE" strokeWidth="1" />

                <circle cx="200" cy="115" r="3.5" fill="#60A5FA" />
                <circle cx="270" cy="110" r="4" fill="#2563EB" />

                {/* Dot grid clusters */}
                <g opacity="0.45" fill="#93C5FD">
                  <circle cx="490" cy="100" r="1.5" />
                  <circle cx="500" cy="100" r="1.5" />
                  <circle cx="510" cy="100" r="1.5" />
                  <circle cx="490" cy="110" r="1.5" />
                  <circle cx="500" cy="110" r="1.5" />
                  <circle cx="510" cy="110" r="1.5" />
                  <circle cx="490" cy="120" r="1.5" />
                  <circle cx="500" cy="120" r="1.5" />
                  <circle cx="510" cy="120" r="1.5" />

                  <circle cx="530" cy="410" r="1.5" />
                  <circle cx="540" cy="410" r="1.5" />
                  <circle cx="550" cy="410" r="1.5" />
                  <circle cx="530" cy="420" r="1.5" />
                  <circle cx="540" cy="420" r="1.5" />
                  <circle cx="550" cy="420" r="1.5" />

                  <circle cx="370" cy="520" r="1.5" />
                  <circle cx="380" cy="520" r="1.5" />
                  <circle cx="390" cy="520" r="1.5" />
                  <circle cx="370" cy="530" r="1.5" />
                  <circle cx="380" cy="530" r="1.5" />
                  <circle cx="390" cy="530" r="1.5" />
                </g>
              </svg>

              {/* Floating Service & Execution Badges mimicking the reference illustration */}
              <div className="hero-node-badge badge-top-left">
                <div className="node-icon-grid">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </div>

              <div className="hero-node-badge badge-top-right">
                <div className="node-icon-doc">
                  <span className="doc-line line-1" />
                  <span className="doc-line line-2" />
                  <span className="doc-line line-3" />
                </div>
              </div>

              <div className="hero-node-badge badge-bottom-left">
                <svg className="node-icon-poly" viewBox="0 0 24 24" fill="none">
                  <polygon points="12,3 21,8.5 21,17.5 12,23 3,17.5 3,8.5" stroke="#2563EB" strokeWidth="2.2" strokeLinejoin="round" fill="none" />
                </svg>
              </div>

              <div className="hero-node-badge badge-bottom-right">
                <div className="node-icon-bars">
                  <span className="bar bar-1" />
                  <span className="bar bar-2" />
                  <span className="bar bar-3" />
                </div>
              </div>

              {/* Center Core AgentFlow Hexagon Node */}
              <div className="hero-core-container">
                <div className="hero-core-ring-pulse" />
                <div className="hero-core-ring" />
                <div className="hero-core-hex">
                  <svg className="hero-hex-svg" viewBox="0 0 72 72" fill="none">
                    <polygon
                      points="36,4 66,20 66,52 36,68 6,52 6,20"
                      fill="#2563EB"
                    />
                    <polygon
                      points="36,16 54,26 54,46 36,56 18,46 18,26"
                      stroke="#FFFFFF"
                      strokeWidth="3.5"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── WHAT IS AGENTFLOW? ─── */}
      <section id="about" className="landing-section bg-white">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <span className="landing-section-kicker">Autonomous Agent Platform</span>
            <h2 className="landing-section-title">
              One agent. Multiple services. One controlled wallet.
            </h2>
            <p className="landing-section-subtitle">
              AgentFlow lets autonomous agents discover services, follow spending rules, make
              payments, and complete tasks while keeping the wallet under the user&apos;s control.
            </p>
          </div>

          <div className="landing-features-grid">
            <div className="landing-feature-card">
              <div className="landing-feature-num">01</div>
              <div className="landing-feature-icon-box">
                <Layers className="landing-feature-icon" />
              </div>
              <h3 className="landing-feature-heading">DISCOVER SERVICES</h3>
              <p className="landing-feature-text">
                Your agent can discover and select services based on the task it needs to complete.
              </p>
            </div>

            <div className="landing-feature-card">
              <div className="landing-feature-num">02</div>
              <div className="landing-feature-icon-box">
                <Sliders className="landing-feature-icon" />
              </div>
              <h3 className="landing-feature-heading">CONTROL SPENDING</h3>
              <p className="landing-feature-text">
                Set spending limits and policies before your agent makes payments.
              </p>
            </div>

            <div className="landing-feature-card">
              <div className="landing-feature-num">03</div>
              <div className="landing-feature-icon-box">
                <Zap className="landing-feature-icon" />
              </div>
              <h3 className="landing-feature-heading">PAY &amp; EXECUTE</h3>
              <p className="landing-feature-text">
                Your agent can authorize service payments and complete tasks without manual
                intervention.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="landing-section">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <span className="landing-section-kicker">Simple Execution Workflow</span>
            <h2 className="landing-section-title">How It Works</h2>
            <p className="landing-section-subtitle">
              From wallet connection to autonomous execution in four clear steps.
            </p>
          </div>

          <div className="landing-steps-row">
            <div className="landing-step-item">
              <div className="landing-step-badge">01</div>
              <h4 className="landing-step-title">Connect Wallet</h4>
              <p className="landing-step-desc">
                Connect your Algorand wallet to establish user-controlled identity and signing.
              </p>
            </div>

            <div className="landing-step-divider" />

            <div className="landing-step-item">
              <div className="landing-step-badge">02</div>
              <h4 className="landing-step-title">Create / Configure Agent</h4>
              <p className="landing-step-desc">
                Define your agent&apos;s objective, operational scope, and execution capabilities.
              </p>
            </div>

            <div className="landing-step-divider" />

            <div className="landing-step-item">
              <div className="landing-step-badge">03</div>
              <h4 className="landing-step-title">Set Spending Policy</h4>
              <p className="landing-step-desc">
                Set daily spending limits, per-transaction caps, and service approval rules.
              </p>
            </div>

            <div className="landing-step-divider" />

            <div className="landing-step-item">
              <div className="landing-step-badge">04</div>
              <h4 className="landing-step-title">Let Agent Execute</h4>
              <p className="landing-step-desc">
                Your agent discovers services, authorizes payments under policy, and completes tasks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECURITY & TRUST ─── */}
      <section id="security" className="landing-section bg-white">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <span className="landing-section-kicker">Security First</span>
            <h2 className="landing-section-title">
              Built around user-controlled execution.
            </h2>
            <p className="landing-section-subtitle">
              Safety and transparency are baked into every interaction. You retain ultimate authority.
            </p>
          </div>

          <div className="landing-security-grid">
            <div className="landing-security-item">
              <div className="landing-security-icon-wrap">
                <Lock className="landing-security-icon" />
              </div>
              <div className="landing-security-content">
                <h4 className="landing-security-point-title">User-Controlled Wallet</h4>
                <p className="landing-security-point-desc">
                  Your wallet remains under your control. Private keys never leave your custody.
                </p>
              </div>
            </div>

            <div className="landing-security-item">
              <div className="landing-security-icon-wrap">
                <ShieldCheck className="landing-security-icon" />
              </div>
              <div className="landing-security-content">
                <h4 className="landing-security-point-title">Policy Enforcement</h4>
                <p className="landing-security-point-desc">
                  Spending policies define what the agent can spend and prevent unauthorized actions.
                </p>
              </div>
            </div>

            <div className="landing-security-item">
              <div className="landing-security-icon-wrap">
                <CheckCircle2 className="landing-security-icon" />
              </div>
              <div className="landing-security-content">
                <h4 className="landing-security-point-title">On-Chain Verification</h4>
                <p className="landing-security-point-desc">
                  Payments are verified on-chain to ensure cryptographic finality and correctness.
                </p>
              </div>
            </div>

            <div className="landing-security-item">
              <div className="landing-security-icon-wrap">
                <Eye className="landing-security-icon" />
              </div>
              <div className="landing-security-content">
                <h4 className="landing-security-point-title">Complete Audit Trail</h4>
                <p className="landing-security-point-desc">
                  Transactions remain visible and traceable with full immutable event history.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Box */}
          <div className="landing-cta-banner">
            <div className="landing-cta-banner-content">
              <h3 className="landing-cta-banner-title">
                Ready to empower your autonomous agents?
              </h3>
              <p className="landing-cta-banner-text">
                Connect your wallet and start delegating tasks safely and securely.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary landing-hero-cta"
              onClick={handleConnectWallet}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="btn-spinner" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Wallet style={{ width: 18, height: 18 }} />
                  <span>Connect Wallet</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-left">
            <div className="landing-brand">
              <svg
                className="landing-brand-logo"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="16" cy="7" r="5" fill="#2563EB" />
                <circle cx="8" cy="22" r="5" fill="#2563EB" />
                <circle cx="24" cy="22" r="5" fill="#2563EB" />
                <path
                  d="M16 12V18M11 20L14 18M21 20L18 18"
                  stroke="#2563EB"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
              <span className="landing-brand-text">AgentFlow</span>
            </div>
            <p className="landing-footer-tagline">
              Autonomous agent economic infrastructure and service execution.
            </p>
          </div>

          <div className="landing-footer-links">
            <div className="landing-footer-col">
              <span className="footer-col-title">Platform</span>
              <button type="button" onClick={() => scrollToSection('about')} className="footer-link-btn">
                About
              </button>
              <button type="button" onClick={() => scrollToSection('how-it-works')} className="footer-link-btn">
                How It Works
              </button>
              <button type="button" onClick={() => scrollToSection('security')} className="footer-link-btn">
                Security
              </button>
            </div>
            <div className="landing-footer-col">
              <span className="footer-col-title">Application</span>
              <button type="button" onClick={() => navigate('/dashboard')} className="footer-link-btn">
                Dashboard
              </button>
              <button type="button" onClick={() => navigate('/marketplace')} className="footer-link-btn">
                Marketplace
              </button>
              <button type="button" onClick={() => navigate('/agent')} className="footer-link-btn">
                Agent
              </button>
            </div>
          </div>
        </div>

        <div className="landing-footer-bottom">
          <span>&copy; {new Date().getFullYear()} AgentFlow. All rights reserved.</span>
          <span>User-controlled autonomous execution.</span>
        </div>
      </footer>
    </div>
  );
}
