import { Wallet, TrendingUp, Layers, Activity } from 'lucide-react';
import type { StatItem } from '../data/mockData';

const iconMap = {
  wallet: Wallet,
  trending: TrendingUp,
  layers: Layers,
  activity: Activity,
};

interface StatCardProps {
  stat: StatItem;
}

export default function StatCard({ stat }: StatCardProps) {
  const Icon = iconMap[stat.icon];

  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-card-label">{stat.label}</span>
        <div className={`stat-card-icon ${stat.variant}`}>
          <Icon />
        </div>
      </div>
      <div className="stat-card-value">
        {stat.icon === 'wallet' || stat.icon === 'trending' ? '$' : ''}
        {stat.value}
      </div>
      {stat.change && <div className="stat-card-change">{stat.change}</div>}
    </div>
  );
}
