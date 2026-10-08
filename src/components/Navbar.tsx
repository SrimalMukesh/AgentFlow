import { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Check,
  Copy,
  Menu,
  X,
  ChevronDown,
  Settings as SettingsIcon,
  LogOut,
  Wallet,
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/agent', label: 'Agent' },
  { to: '/policy', label: 'Spending Policy' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/settings', label: 'Settings' },
];

export default function Navbar() {
  const [copied, setCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { connectedAddress, activeAddress, shortAddress, disconnect } = useWallet();

  const copyAddress = () => {
    navigator.clipboard.writeText(activeAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleDisconnect = () => {
    disconnect();
    setDropdownOpen(false);
    navigate('/');
  };

  const handleNavigateSettings = () => {
    setDropdownOpen(false);
    navigate('/settings');
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Left: Brand */}
        <div className="navbar-left">
          <Link to="/dashboard" className="navbar-brand">
            <svg
              className="navbar-brand-logo"
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
            <span className="navbar-brand-text">AgentFlow</span>
          </Link>
        </div>

        {/* Center: Navigation Links */}
        <nav className="navbar-center desktop-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `navbar-link${isActive ? ' active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right: Profile Avatar with Clean Dropdown */}
        <div className="navbar-right" ref={dropdownRef}>
          <div className="profile-dropdown-wrapper">
            <button
              type="button"
              className={`user-profile-btn${dropdownOpen ? ' active' : ''}`}
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-expanded={dropdownOpen}
              aria-label="User Profile Menu"
            >
              <div className="avatar">M</div>
              <ChevronDown className={`avatar-chevron${dropdownOpen ? ' rotated' : ''}`} />
            </button>

            {/* Profile Dropdown Menu */}
            {dropdownOpen && (
              <div className="profile-dropdown-menu">
                {/* Header User info */}
                <div className="profile-dropdown-header">
                  <div className="avatar avatar-md">M</div>
                  <div className="profile-user-info">
                    <span className="profile-user-name">Mukesh</span>
                    <div className="profile-status-row">
                      <span className={`status-dot ${connectedAddress ? 'online' : 'offline'}`} />
                      <span className="profile-status-text">
                        {connectedAddress ? 'Wallet connected' : 'Wallet disconnected'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="profile-dropdown-divider" />

                {/* Wallet Info Block */}
                <div className="profile-dropdown-section">
                  <div className="profile-section-label">Wallet</div>
                  <div className="profile-wallet-row">
                    <div className="profile-wallet-address">
                      <Wallet style={{ width: 14, height: 14, color: 'var(--text-muted)' }} />
                      <span>{shortAddress}</span>
                    </div>
                    <button
                      type="button"
                      className="profile-copy-btn"
                      onClick={copyAddress}
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
                  </div>
                </div>

                <div className="profile-dropdown-divider" />

                {/* Network Info Block */}
                <div className="profile-dropdown-section">
                  <div className="profile-section-label">Network</div>
                  <div className="profile-network-row">
                    <span className="status-dot online" />
                    <span className="profile-network-val">Algorand Testnet</span>
                  </div>
                </div>

                <div className="profile-dropdown-divider" />

                {/* Navigation & Actions */}
                <div className="profile-dropdown-actions">
                  <button
                    type="button"
                    className="profile-action-btn"
                    onClick={handleNavigateSettings}
                  >
                    <SettingsIcon style={{ width: 15, height: 15 }} />
                    <span>Account Settings</span>
                  </button>

                  <button
                    type="button"
                    className="profile-action-btn disconnect-btn"
                    onClick={handleDisconnect}
                  >
                    <LogOut style={{ width: 15, height: 15 }} />
                    <span>Disconnect Wallet</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `mobile-nav-link${isActive ? ' active' : ''}`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  );
}
