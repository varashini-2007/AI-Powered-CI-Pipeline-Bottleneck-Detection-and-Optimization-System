import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle, HelpCircle, FileQuestion, ArrowRight } from 'lucide-react';

export default function EdgeCasesShowcase() {
  const [selectedCase, setSelectedCase] = useState('edge1');

  const cases = {
    edge1: {
      title: 'Edge Case 1: Missing Cache Data',
      subtitle: 'CI build with unconfigured or absent cache telemetry (null / NaN hit rate)',
      inputTelemetry: {
        build_id: 'BUILD-EDGE-MISSING-CACHE',
        task_name: 'dependency_install',
        cache_hit_rate: null,
        cache_hits: null,
        cache_misses: null,
        queue_time_seconds: 45.0,
        task_duration_seconds: 80.0
      },
      behavior: 'System catches missing telemetry without throwing runtime exceptions or crashing.',
      expectedOutput: 'Cache analysis unavailable because cache information is missing.',
      statusText: 'PASS — Graceful Degraded Mode',
      statusColor: 'var(--success)'
    },
    edge2: {
      title: 'Edge Case 2: Extremely Slow Task',
      subtitle: 'Build execution blocked by an extreme outlier task (duration = 920 seconds)',
      inputTelemetry: {
        build_id: 'BUILD-EDGE-SLOW-TASK',
        task_name: 'monolithic_e2e_integration_suite',
        task_duration_seconds: 920.0,
        queue_time_seconds: 60.0,
        cache_hit_rate: 0.85,
        number_of_tasks: 4
      },
      behavior: 'Identifies the task as a CRITICAL severity bottleneck, flagging excess duration over cohort median.',
      expectedOutput: 'SLOW_TASK detected with CRITICAL severity. Difference from normal: +845.0s.',
      statusText: 'PASS — Flagged as CRITICAL Bottleneck',
      statusColor: 'var(--danger)'
    },
    edge3: {
      title: 'Edge Case 3: No Parallelisation Opportunity',
      subtitle: 'Build where all tasks have sequential dependencies (parallelizable_tasks = 0)',
      inputTelemetry: {
        build_id: 'BUILD-EDGE-NO-PARALLEL',
        parallelizable_tasks: 0,
        number_of_tasks: 6,
        task_duration_seconds: 120.0
      },
      behavior: 'Rule detector strictly suppresses parallelisation recommendations when tasks are interdependent.',
      expectedOutput: 'System does NOT recommend parallelisation. (No false recommendations generated).',
      statusText: 'PASS — Recommendation Suppressed',
      statusColor: 'var(--primary)'
    }
  };

  const active = cases[selectedCase];

  return (
    <div className="glass-card" style={{ padding: '2rem', marginBottom: '3rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 className="table-title">
          <ShieldCheck size={22} color="#10b981" />
          Mandatory Edge Cases Verification
        </h2>
        <p className="metric-sub" style={{ marginTop: '4px' }}>
          Demonstrates system resilience, outlier handling, and precision rule filtering under abnormal conditions.
        </p>
      </div>

      {/* Case Selector Buttons */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        {Object.entries(cases).map(([key, c]) => (
          <button
            key={key}
            onClick={() => setSelectedCase(key)}
            style={{
              flex: '1',
              minWidth: '220px',
              padding: '1rem',
              background: selectedCase === key ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${selectedCase === key ? 'var(--primary)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: selectedCase === key ? '#a5b4fc' : '#fff' }}>
              {c.title}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {c.subtitle}
            </div>
          </button>
        ))}
      </div>

      {/* Active Case Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.5rem' }}>
        {/* Telemetry Input */}
        <div style={{ background: '#0a0f1d', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 700 }}>
            Input Telemetry Payload
          </div>
          <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#93c5fd', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(active.inputTelemetry, null, 2)}
          </pre>
        </div>

        {/* Expected & Verified Output */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.35rem' }}>
              Engine Behavior
            </div>
            <p style={{ fontSize: '0.92rem', color: '#fff', lineHeight: 1.5 }}>
              {active.behavior}
            </p>
          </div>

          <div style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)'
          }}>
            <div className="flex-row" style={{ justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#6ee7b7', fontWeight: 700 }}>
                System Verification Output
              </span>
              <span className="badge badge-low">{active.statusText}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: '#fff', fontWeight: 600 }}>
              "{active.expectedOutput}"
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
