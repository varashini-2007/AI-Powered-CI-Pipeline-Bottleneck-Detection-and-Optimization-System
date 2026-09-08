import React from 'react';
import { Database, AlertOctagon, Flame, Clock, Archive, Timer } from 'lucide-react';

export default function SummaryCards({ summary }) {
  if (!summary) {
    return (
      <div className="metrics-grid">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="glass-card metric-card" style={{ minHeight: '125px', justifyContent: 'center' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
              Gathering Telemetry Metrics...
            </div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: 'Total Builds',
      value: summary.total_builds?.toLocaleString() || '0',
      sub: 'Processed & Indexed',
      icon: Database,
      color: '#6366f1',
      stripe: 'linear-gradient(90deg, #6366f1, #818cf8)'
    },
    {
      label: 'Bottlenecks Found',
      value: summary.bottlenecks_found?.toLocaleString() || '0',
      sub: 'Algorithmic Detections',
      icon: AlertOctagon,
      color: '#f59e0b',
      stripe: 'linear-gradient(90deg, #f59e0b, #fbbf24)'
    },
    {
      label: 'High Priority Issues',
      value: summary.high_priority_issues?.toLocaleString() || '0',
      sub: 'High & Critical Severity',
      icon: Flame,
      color: '#ef4444',
      stripe: 'linear-gradient(90deg, #ef4444, #f87171)'
    },
    {
      label: 'Avg Queue Time',
      value: `${summary.avg_queue_time_seconds || 0}s`,
      sub: 'Time waiting for runner',
      icon: Clock,
      color: '#06b6d4',
      stripe: 'linear-gradient(90deg, #06b6d4, #38bdf8)'
    },
    {
      label: 'Avg Cache Hit Rate',
      value: `${((summary.avg_cache_hit_rate || 0) * 100).toFixed(1)}%`,
      sub: 'Telemetry Cache Reuse',
      icon: Archive,
      color: '#10b981',
      stripe: 'linear-gradient(90deg, #10b981, #34d399)'
    },
    {
      label: 'Avg Build Duration',
      value: `${summary.avg_build_duration_seconds || 0}s`,
      sub: 'Pipeline wall-clock time',
      icon: Timer,
      color: '#a855f7',
      stripe: 'linear-gradient(90deg, #a855f7, #c084fc)'
    }
  ];

  return (
    <div className="metrics-grid">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div key={idx} className="glass-card metric-card">
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: card.stripe
              }}
            />
            <div className="metric-card-header">
              <span className="metric-label">{card.label}</span>
              <div
                className="neu-icon-bed"
                style={{ color: card.color }}
                title={card.label}
              >
                <Icon size={19} />
              </div>
            </div>
            <div className="metric-value">{card.value}</div>
            <div className="metric-sub">{card.sub}</div>
          </div>
        );
      })}
    </div>
  );
}
