import { useState, useEffect, useCallback } from 'react';
import { Search, Plus } from 'lucide-react';
import ServiceCard from '../components/ServiceCard';
import ServiceDetailModal from '../components/ServiceDetailModal';
import RegisterServiceModal from '../components/RegisterServiceModal';
import { LoadingSpinner, ErrorMessage, EmptyState } from '../components/ApiStates';
import { getServices, type ServiceQueryParams } from '../api/client';
import type { Service } from '../types/api';

const CATEGORIES = ['All', 'Research', 'Analytics', 'Productivity'];

export default function Marketplace() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Modal state
  const [detailService, setDetailService] = useState<Service | null>(null);
  const [showRegister, setShowRegister] = useState(false);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: ServiceQueryParams = {};
      if (search.trim()) params.search = search.trim();
      if (activeCategory !== 'All') params.category = activeCategory;

      const data = await getServices(params);
      setServices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load services');
    } finally {
      setLoading(false);
    }
  }, [search, activeCategory]);

  useEffect(() => {
    const timer = setTimeout(fetchServices, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchServices]);

  return (
    <>
      {/* ─── Header & Top Actions ─── */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Service Marketplace</h1>
          <p className="page-subtitle">Discover and purchase AI capabilities with x402 USDC micropayments</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowRegister(true)} style={{ padding: '10px 18px' }}>
          <Plus style={{ width: 16, height: 16 }} />
          <span>Register Service</span>
        </button>
      </div>

      {/* ─── Search & Category Filters Bar ─── */}
      <div className="card-panel" style={{ padding: '18px 24px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
            <Search style={{ width: 18, height: 18, color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search services..."
              className="form-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', padding: '6px 0', fontSize: '15px', width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span className="section-label" style={{ marginRight: '4px' }}>Category:</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`btn btn-ghost${activeCategory === cat ? ' active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                  style={{ fontSize: '14px', padding: '6px 14px' }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Service Cards Grid (Desktop 3-col, Tablet 2-col, Mobile 1-col) ─── */}
      {loading && <LoadingSpinner message="Loading marketplace services..." />}
      {error && <ErrorMessage message={error} onRetry={fetchServices} />}
      {!loading && !error && services.length === 0 && (
        <EmptyState message="No services matched your query" />
      )}
      {!loading && !error && services.length > 0 && (
        <div className="marketplace-grid">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onViewDetails={setDetailService}
            />
          ))}
        </div>
      )}

      {/* ─── Modals ─── */}
      {detailService && (
        <ServiceDetailModal service={detailService} onClose={() => setDetailService(null)} />
      )}
      {showRegister && (
        <RegisterServiceModal
          onClose={() => setShowRegister(false)}
          onSuccess={fetchServices}
        />
      )}
    </>
  );
}
