import { CheckCircle2, FileText, Search, Disc, ShieldCheck } from 'lucide-react';
import type { ActivityItem as ActivityItemType } from '../data/mockData';

interface ActivityListProps {
  items: ActivityItemType[];
}

function getActivityIcon(title: string, variant?: 'accent' | 'success' | 'warning') {
  const lower = title.toLowerCase();
  if (lower.includes('verified') || lower.includes('confirmed') || lower.includes('payment verified')) {
    return <CheckCircle2 />;
  }
  if (lower.includes('task completed') || lower.includes('accomplished')) {
    return <Disc />;
  }
  if (lower.includes('policy') || lower.includes('approved') || lower.includes('evaluation')) {
    return <ShieldCheck />;
  }
  if (lower.includes('selected') || lower.includes('search') || lower.includes('discovered')) {
    return <Search />;
  }
  if (lower.includes('request') || lower.includes('x402')) {
    return <FileText />;
  }
  if (variant === 'success') return <CheckCircle2 />;
  return <Disc />;
}

function getIconVariant(title: string, variant?: 'accent' | 'success' | 'warning'): 'success' | 'accent' | 'warning' {
  const lower = title.toLowerCase();
  if (lower.includes('verified') || lower.includes('confirmed') || lower.includes('approved')) {
    return 'success';
  }
  if (lower.includes('task completed') || lower.includes('selected')) {
    return 'accent';
  }
  if (lower.includes('warning') || lower.includes('pending')) {
    return 'warning';
  }
  return variant || 'accent';
}

export default function ActivityList({ items }: ActivityListProps) {
  return (
    <div className="activity-list">
      {items.map((item) => {
        const iconVar = getIconVariant(item.title, item.variant);
        return (
          <div className="activity-list-item" key={item.id}>
            <div className={`activity-step-icon ${iconVar}`}>
              {getActivityIcon(item.title, item.variant)}
            </div>
            <div className="activity-step-content">
              <div className="activity-step-title">{item.title}</div>
              <div className="activity-step-meta">
                <span>{item.time}</span>
                {item.amount && (
                  <>
                    <span>•</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.amount} USDC
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
