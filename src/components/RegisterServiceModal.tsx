import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { createService } from '../api/client';

interface RegisterServiceModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = ['Research', 'Analytics', 'Productivity'];

export default function RegisterServiceModal({ onClose, onSuccess }: RegisterServiceModalProps) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    provider: '',
    category: CATEGORIES[0],
    price: '',
    rating: '',
    endpoint: '',
    capabilities: '',
    inputDescription: '',
    outputDescription: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const capabilities = form.capabilities
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await createService({
        name: form.name,
        description: form.description,
        provider: form.provider,
        category: form.category,
        price: parseFloat(form.price),
        rating: parseFloat(form.rating),
        endpoint: form.endpoint || undefined,
        capabilities: capabilities.length > 0 ? capabilities : undefined,
        inputDescription: form.inputDescription || undefined,
        outputDescription: form.outputDescription || undefined,
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Register New Service</h2>
          <button type="button" className="btn btn-ghost" onClick={onClose} style={{ padding: '4px' }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
                background: 'var(--status-error-light)',
                border: '1px solid var(--status-error-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--status-error)',
                fontSize: '13px',
                marginBottom: '16px',
              }}
            >
              {error}
            </div>
          )}

          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">Service Name *</label>
              <input
                className="form-input"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. DocForge Report Generator"
                required
              />
            </div>
            <div className="form-field">
              <label className="form-label">Provider Name *</label>
              <input
                className="form-input"
                name="provider"
                value={form.provider}
                onChange={handleChange}
                placeholder="e.g. DocForge"
                required
              />
            </div>
            <div className="form-field">
              <label className="form-label">Category *</label>
              <select className="form-input" name="category" value={form.category} onChange={handleChange}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Price (USDC) *</label>
              <input
                className="form-input"
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={handleChange}
                placeholder="8.25"
                required
              />
            </div>
            <div className="form-field">
              <label className="form-label">Rating (0–5) *</label>
              <input
                className="form-input"
                name="rating"
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={form.rating}
                onChange={handleChange}
                placeholder="4.7"
                required
              />
            </div>
            <div className="form-field">
              <label className="form-label">Endpoint URL</label>
              <input
                className="form-input"
                name="endpoint"
                value={form.endpoint}
                onChange={handleChange}
                placeholder="https://api.docforge.io/v1/generate"
              />
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Description *</label>
            <textarea
              className="form-input form-textarea"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Produces polished publication-ready reports with charts, tables and executive summaries."
              rows={3}
              required
            />
          </div>

          <div className="form-field">
            <label className="form-label">Capabilities (comma-separated)</label>
            <input
              className="form-input"
              name="capabilities"
              value={form.capabilities}
              onChange={handleChange}
              placeholder="report generation, markdown formatting, charts"
            />
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">Input Description</label>
              <textarea
                className="form-input form-textarea"
                name="inputDescription"
                value={form.inputDescription}
                onChange={handleChange}
                placeholder="JSON payload with topic and research findings"
                rows={2}
              />
            </div>
            <div className="form-field">
              <label className="form-label">Output Description</label>
              <textarea
                className="form-input form-textarea"
                name="outputDescription"
                value={form.outputDescription}
                onChange={handleChange}
                placeholder="PDF / Markdown formatted report output"
                rows={2}
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Plus style={{ width: 14, height: 14 }} />
              {submitting ? 'Registering...' : 'Register Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
