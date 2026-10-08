import { Globe, BarChart3, FileText, Star, Tag, ArrowRight } from 'lucide-react';
import type { Service } from '../types/api';

const categoryIcon: Record<string, typeof Globe> = {
  Research: Globe,
  Analytics: BarChart3,
  Productivity: FileText,
};

interface ServiceCardProps {
  service: Service;
  onViewDetails?: (service: Service) => void;
}

export default function ServiceCard({ service, onViewDetails }: ServiceCardProps) {
  const Icon = categoryIcon[service.category] || Globe;

  return (
    <div className="service-card-v2">
      <div>
        <div className="service-card-icon-wrap">
          <Icon />
        </div>

        <div className="service-card-title">{service.name}</div>
        <div className="service-card-provider-text">by {service.provider}</div>

        <div className="service-card-description">{service.description}</div>
      </div>

      <div>
        <div className="service-card-meta-row">
          <div className="service-card-meta-tag">
            <Tag style={{ width: 13, height: 13, color: 'var(--text-muted)' }} />
            <span>{service.category}</span>
          </div>
          <span>·</span>
          <div className="service-card-rating">
            <Star style={{ width: 13, height: 13, fill: 'var(--status-warning)', color: 'var(--status-warning)' }} />
            <span>{service.rating.toFixed(1)}</span>
          </div>
        </div>

        <div className="service-card-footer-row">
          <div className="service-card-price-display">
            ${service.price.toFixed(2)}
            <span>USDC</span>
          </div>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => onViewDetails?.(service)}
            style={{ fontSize: '13px', padding: '6px 14px' }}
          >
            <span>View service</span>
            <ArrowRight style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>
    </div>
  );
}
