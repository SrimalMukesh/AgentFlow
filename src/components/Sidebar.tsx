import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  Bot,
  Shield,
  ArrowLeftRight,
  Settings,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/marketplace', label: 'Marketplace', icon: Store },
  { to: '/agent', label: 'Agent', icon: Bot },
  { to: '/policy', label: 'Spending Policy', icon: Shield },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">AF</div>
        <span className="sidebar-brand-name">AgentFlow</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-link${isActive ? ' active' : ''}`
            }
            end={item.to === '/'}
          >
            <item.icon />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-version">AgentFlow v0.1.0 · Hackathon Preview</div>
      </div>
    </aside>
  );
}
