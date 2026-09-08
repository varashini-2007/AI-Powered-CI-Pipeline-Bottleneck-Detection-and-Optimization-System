import React from 'react';
import { Database, AlertOctagon, Flame, Clock, Archive, Timer } from 'lucide-react';

export default function SummaryCards({ summary }) {
  if (!summary) {
    return (
      <div className="metrics-grid">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="glass-card metric-card" style={{ minHeight: '110px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading metric...</div>
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
      color: '#6366f1'
    },
    {
      label: 'Bottlenecks Found',
      value: summary.bottlenecks_found?.toLocaleString() || '0',
      sub: 'Algorithmic Detections',
      icon: AlertOctagon,
      color: '#f59e0b'
    },
    {
      label: 'High Priority Issues',
      value: summary.high_priority_issues?.toLocaleString() || '0',
      sub: 'High & Critical Severity',
      icon: Flame,
      color: '#ef4444'
    },
    {
      label: 'Avg Queue Time',
      value: `${summary.avg_queue_time_seconds || 0}s`,
      sub: 'Time waiting for runner',
      icon: Clock,
      color: '#06b6d4'
    },
    {
      label: 'Avg Cache Hit Rate',
      value: `${((summary.avg_cache_hit_rate || 0) * 100).toFixed(1)}%`,
      sub: 'Telemetry Cache Reuse',
      icon: Archive,
      color: '#10b981'
    },
    {
      label: 'Avg Build Duration',
      value: `${summary.avg_build_duration_seconds || 0}s`,
      sub: 'Pipeline wall-clock time',
      icon: Timer,
      color: '#a855f7'
    }
  ];

  return (
    <div className="metrics-grid">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div key={idx} className="glass-card metric-card">
            <div className="metric-card-header">
              <span className="metric-label">{card.label}</span>
              <div className="metric-icon" style={{ color: card.color, background: `${card.color}18` }}>
                <Icon size={18} />
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
