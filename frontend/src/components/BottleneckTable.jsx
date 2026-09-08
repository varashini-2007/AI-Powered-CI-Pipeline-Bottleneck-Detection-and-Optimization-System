import React, { useState } from 'react';
import { Filter, ExternalLink, AlertCircle } from 'lucide-react';

export default function BottleneckTable({ bottlenecks, onSelectBottleneck }) {
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [problemFilter, setProblemFilter] = useState('ALL');

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
            <AlertCircle size={20} color="#f59e0b" />
            Detected CI Bottlenecks
          </h2>
          <p className="metric-sub" style={{ marginTop: '3px' }}>
            Showing {filteredBottlenecks.length} of {bottlenecks.length} detected pipeline anomalies. Click any row for in-depth explainability.
          </p>
        </div>

        <div className="table-filters">
          <select
            className="filter-select"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            className="filter-select"
            value={problemFilter}
            onChange={(e) => setProblemFilter(e.target.value)}
          >
            <option value="ALL">All Bottleneck Types</option>
            <option value="QUEUE_BOTTLENECK">Queue Bottleneck</option>
            <option value="LOW_CACHE_EFFICIENCY">Low Cache Efficiency</option>
            <option value="SLOW_TASK">Slow Task</option>
            <option value="AGENT_UTILISATION">Agent Utilisation</option>
            <option value="PARALLELISATION_OPPORTUNITY">Parallelisation</option>
          </select>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Build ID</th>
              <th>Problem</th>
              <th>Severity</th>
              <th>Observed Value</th>
              <th>Recommendation</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredBottlenecks.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No bottlenecks found matching selected filters.
                </td>
              </tr>
            ) : (
              filteredBottlenecks.slice(0, 35).map((b, idx) => (
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
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#cbd5e1' }}>
                    {b.observed_value}
                  </td>
                  <td style={{ maxWidth: '380px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {b.recommendation}
                  </td>
                  <td>
                    <button
                      className="badge badge-pill"
                      style={{ cursor: 'pointer', border: 'none', padding: '0.35rem 0.75rem' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBottleneck(b);
                      }}
                    >
                      Inspect <ExternalLink size={12} style={{ marginLeft: 4 }} />
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
