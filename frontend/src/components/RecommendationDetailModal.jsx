import React from 'react';
import { X, AlertTriangle, CheckCircle, HelpCircle, ArrowRight, Activity, ShieldAlert, Cpu } from 'lucide-react';

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
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <div className="flex-row" style={{ marginBottom: '0.6rem' }}>
              <span className={`badge ${getSeverityBadgeClass(recommendation.severity)}`}>
                {recommendation.severity} SEVERITY
              </span>
              <span className="badge badge-none" style={{ fontFamily: 'var(--font-mono)' }}>
                BUILD: {recommendation.build_id}
              </span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
              {recommendation.problem?.replace(/_/g, ' ')}
            </h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            <X size={20} />
          </button>
        </div>

        {/* 4-Question Explainable Framework Cards */}
        <div className="explain-card" style={{ borderLeft: '4px solid #38bdf8' }}>
          <div className="explain-card-title" style={{ color: '#38bdf8' }}>
            <HelpCircle size={17} />
            <span>1. What Happened?</span>
          </div>
          <p className="explain-card-body">{explanation.what_happened}</p>
        </div>

        <div className="explain-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="explain-card-title" style={{ color: '#fbbf24' }}>
            <AlertTriangle size={17} />
            <span>2. Why Does It Matter?</span>
          </div>
          <p className="explain-card-body">{explanation.why_it_matters}</p>
        </div>

        <div className="explain-card" style={{ borderLeft: '4px solid #10b981', background: 'rgba(16, 185, 129, 0.08)' }}>
          <div className="explain-card-title" style={{ color: '#34d399' }}>
            <CheckCircle size={17} />
            <span>3. Prescribed Optimization Strategy</span>
          </div>
          <div style={{ fontSize: '0.96rem', color: '#ffffff', lineHeight: 1.6, fontWeight: 500 }}>
            {recommendation.recommendation}
          </div>
        </div>

        <div className="explain-card" style={{ borderLeft: '4px solid #a855f7' }}>
          <div className="explain-card-title" style={{ color: '#c084fc' }}>
            <Activity size={17} />
            <span>4. Supporting Evidence &amp; Telemetry Data</span>
          </div>
          <p className="explain-card-body" style={{ marginBottom: '0.65rem' }}>
            {explanation.evidence_supports}
          </p>
          <div className="evidence-box">
            <pre style={{ margin: 0 }}>{JSON.stringify(recommendation.evidence, null, 2)}</pre>
          </div>
        </div>

        {/* Observed vs Threshold Telemetry Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: '1.25rem',
            background: 'var(--bg-sunken)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            boxShadow: 'var(--neu-sunken)',
            marginTop: '1.5rem'
          }}
        >
          <div>
            <div className="metric-sub">OBSERVED VALUE</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff', fontSize: '1.05rem', marginTop: '3px' }}>
              {recommendation.observed_value}
            </div>
          </div>
          <div>
            <div className="metric-sub">BENCHMARK THRESHOLD</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#94a3b8', fontSize: '1.05rem', marginTop: '3px' }}>
              {recommendation.threshold}
            </div>
          </div>
          <div>
            <div className="metric-sub">ESTIMATED EFFICIENCY IMPACT</div>
            <div style={{ fontWeight: 600, color: 'var(--accent-cyan)', fontSize: '0.9rem', marginTop: '3px' }}>
              {recommendation.estimated_impact || 'Reduces critical pipeline latency.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
