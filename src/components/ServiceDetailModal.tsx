import { X, Star, Zap, ArrowDownToLine, ArrowUpFromLine, Globe } from 'lucide-react';
import type { Service } from '../types/api';

interface ServiceDetailModalProps {
  service: Service;
  onClose: () => void;
}

export default function ServiceDetailModal({ service, onClose }: ServiceDetailModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="service-card-icon" style={{ width: 32, height: 32 }}>
              <Globe style={{ width: 16, height: 16 }} />
            </div>
            <h2 className="modal-title">{service.name}</h2>
          </div>
          <button type="button" className="btn btn-ghost" onClick={onClose} style={{ padding: '4px' }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div className="modal-body">
          {/* Provider & Category */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge accent">{service.category}</span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>by {service.provider}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Star style={{ width: 14, height: 14, fill: 'var(--status-warning)', color: 'var(--status-warning)' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{service.rating}</span>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '18px' }}>
            <div className="agent-stat-label">Description</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {service.description}
            </div>
          </div>

          {/* Price */}
          <div style={{ marginBottom: '18px' }}>
            <div className="agent-stat-label">Price per Call</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
              ${service.price.toFixed(2)}{' '}
              <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-muted)' }}>USDC via x402</span>
            </div>
          </div>

          {/* Capabilities */}
          {service.capabilities && service.capabilities.length > 0 && (
            <div style={{ marginBottom: '18px' }}>
              <div className="agent-stat-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Zap style={{ width: 12, height: 12 }} /> Capabilities
              </div>
              <div className="tag-list">
                {service.capabilities.map((cap) => (
                  <span key={cap} className="tag">
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Input / Output */}
          {service.inputDescription && (
            <div style={{ marginBottom: '14px' }}>
              <div className="agent-stat-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ArrowDownToLine style={{ width: 12, height: 12 }} /> Input Requirements
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {service.inputDescription}
              </div>
            </div>
          )}

          {service.outputDescription && (
            <div style={{ marginBottom: '14px' }}>
              <div className="agent-stat-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ArrowUpFromLine style={{ width: 12, height: 12 }} /> Output Schema
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {service.outputDescription}
              </div>
            </div>
          )}

          {/* Endpoint */}
          {service.endpoint && (
            <div>
              <div className="agent-stat-label">API Endpoint</div>
              <div
                style={{
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-secondary)',
                  background: 'var(--surface-secondary)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                }}
              >
                {service.endpoint}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
