import React, { useState } from 'react';
import { Filter, ExternalLink, AlertCircle, Sparkles } from 'lucide-react';

export default function BottleneckTable({ bottlenecks, onSelectBottleneck }) {
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [problemFilter, setProblemFilter] = useState('ALL');

  const severities = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  const filteredBottlenecks = bottlenecks.filter((b) => {
    const matchesSev = severityFilter === 'ALL' || b.severity?.toUpperCase() === severityFilter;
    const matchesProb = problemFilter === 'ALL' || b.problem === problemFilter;
    return matchesSev && matchesProb;
  });

  const getSeverityBadgeClass = (sev) => {
    switch (sev?.toUpperCase()) {
      case 'CRITICAL': return 'badge-critical';
      case 'HIGH': return 'badge-high';
      case 'MEDIUM': return 'badge-medium';
      case 'LOW': return 'badge-low';
      default: return 'badge-none';
    }
  };

  return (
    <div className="glass-card table-card">
      <div className="table-header-row">
        <div>
          <h2 className="table-title">
            <AlertCircle size={22} color="#f59e0b" />
            Detected CI Bottlenecks
          </h2>
          <p className="metric-sub" style={{ marginTop: '4px' }}>
            Showing {filteredBottlenecks.length} of {bottlenecks.length} detected pipeline anomalies. Click any row for in-depth explainability.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Neumorphic Severity Pill Filters */}
          <div className="table-filters" role="radiogroup" aria-label="Filter by Severity">
            {severities.map((sev) => (
              <button
                key={sev}
                type="button"
                className={`filter-pill ${severityFilter === sev ? 'active' : ''}`}
                onClick={() => setSeverityFilter(sev)}
              >
                {sev}
              </button>
            ))}
          </div>

          <select
            className="neu-input"
            style={{ padding: '0.42rem 0.85rem', fontSize: '0.82rem', minWidth: '180px' }}
            value={problemFilter}
            onChange={(e) => setProblemFilter(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            <option value="QUEUE_BOTTLENECK">Queue Bottleneck</option>
            <option value="LOW_CACHE_EFFICIENCY">Low Cache Efficiency</option>
            <option value="SLOW_TASK">Slow Task</option>
            <option value="AGENT_UTILISATION">Agent Utilisation</option>
            <option value="PARALLELISATION_OPPORTUNITY">Parallelisation Opportunity</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Build ID</th>
              <th>Problem Category</th>
              <th>Severity</th>
              <th>Observed Telemetry</th>
              <th>Prescribed Optimization</th>
              <th style={{ textAlign: 'right' }}>Diagnosis</th>
            </tr>
          </thead>
          <tbody>
            {filteredBottlenecks.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No bottlenecks found matching selected filters.
                </td>
              </tr>
            ) : (
              filteredBottlenecks.slice(0, 40).map((b, idx) => (
                <tr key={b.id || idx} onClick={() => onSelectBottleneck(b)}>
                  <td>{b.build_id}</td>
                  <td style={{ fontWeight: 600 }}>
                    {b.problem?.replace(/_/g, ' ')}
                  </td>
                  <td>
                    <span className={`badge ${getSeverityBadgeClass(b.severity)}`}>
                      {b.severity}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.84rem', color: '#cbd5e1' }}>
                    {b.observed_value}
                  </td>
                  <td style={{ maxWidth: '380px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {b.recommendation}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn-inspect"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBottleneck(b);
                      }}
                    >
                      <span>Explain</span>
                      <ExternalLink size={12} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
