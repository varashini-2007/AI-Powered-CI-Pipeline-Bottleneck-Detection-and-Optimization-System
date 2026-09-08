import React from 'react';
import { X, AlertTriangle, CheckCircle, HelpCircle, ArrowRight, Activity } from 'lucide-react';

export default function RecommendationDetailModal({ recommendation, onClose }) {
  if (!recommendation) return null;

  const getSeverityBadgeClass = (sev) => {
    switch (sev?.toUpperCase()) {
      case 'CRITICAL': return 'badge-critical';
      case 'HIGH': return 'badge-high';
      case 'MEDIUM': return 'badge-medium';
      case 'LOW': return 'badge-low';
      default: return 'badge-none';
    }
  };

  const explanation = recommendation.explanation || {
    what_happened: 'Telemetry anomaly detected in pipeline execution.',
    why_it_matters: 'Affects overall pipeline throughput and developer turnaround time.',
    what_to_do: recommendation.recommendation || 'Investigate runner and task metrics.',
    evidence_supports: `Observed: ${recommendation.observed_value} vs Threshold: ${recommendation.threshold}`
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="flex-row" style={{ marginBottom: '0.5rem' }}>
              <span className={`badge ${getSeverityBadgeClass(recommendation.severity)}`}>
                {recommendation.severity} SEVERITY
              </span>
              <span className="badge badge-pill">
                BUILD: {recommendation.build_id}
              </span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
              {recommendation.problem?.replace(/_/g, ' ')}
            </h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={22} />
          </button>
        </div>

        {/* 4-Question Breakdown */}
        <div className="detail-section">
          <div className="detail-section-title flex-row">
            <HelpCircle size={14} />
            1. What Happened?
          </div>
          <p className="detail-text">{explanation.what_happened}</p>
        </div>

        <div className="detail-section">
          <div className="detail-section-title flex-row" style={{ color: 'var(--warning)' }}>
            <AlertTriangle size={14} />
            2. Why Does It Matter?
          </div>
          <p className="detail-text">{explanation.why_it_matters}</p>
        </div>

        <div className="detail-section">
          <div className="detail-section-title flex-row" style={{ color: 'var(--success)' }}>
            <CheckCircle size={14} />
            3. What Should Be Done? (Recommendation)
          </div>
          <div style={{
            background: 'rgba(99, 102, 241, 0.08)',
            borderLeft: '4px solid var(--primary)',
            padding: '1rem',
            borderRadius: '0 8px 8px 0',
            fontSize: '0.95rem',
            lineHeight: 1.6
          }}>
            {recommendation.recommendation}
          </div>
        </div>

        <div className="detail-section">
          <div className="detail-section-title flex-row" style={{ color: 'var(--accent-cyan)' }}>
            <Activity size={14} />
            4. Supporting Evidence & Telemetry
          </div>
          <p className="detail-text" style={{ marginBottom: '0.5rem' }}>
            {explanation.evidence_supports}
          </p>
          <div className="evidence-box">
            <pre>{JSON.stringify(recommendation.evidence, null, 2)}</pre>
          </div>
        </div>

        {/* Threshold & Impact Details */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          background: 'rgba(0,0,0,0.25)',
          padding: '1rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div>
            <div className="metric-sub">OBSERVED VALUE</div>
            <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>
              {recommendation.observed_value}
            </div>
          </div>
          <div>
            <div className="metric-sub">CONFIGURED THRESHOLD</div>
            <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>
              {recommendation.threshold}
            </div>
          </div>
          <div>
            <div className="metric-sub">ESTIMATED IMPACT</div>
            <div style={{ fontWeight: 600, color: 'var(--accent-cyan)', fontSize: '0.88rem' }}>
              {recommendation.estimated_impact || 'Reduces critical pipeline latency.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
