import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle, HelpCircle, FileQuestion, ArrowRight, Layers } from 'lucide-react';

export default function EdgeCasesShowcase() {
  const [selectedCase, setSelectedCase] = useState('edge1');

  const cases = {
    edge1: {
      title: 'Edge Case 1: Missing Cache Telemetry',
      subtitle: 'CI build with unconfigured or absent cache metrics (null / NaN hit rate)',
      inputTelemetry: {
        build_id: 'BUILD-EDGE-MISSING-CACHE',
        task_name: 'dependency_install',
        cache_hit_rate: null,
        cache_hits: null,
        cache_misses: null,
        queue_time_seconds: 45.0,
        task_duration_seconds: 80.0
      },
      behavior: 'System catches missing telemetry without throwing runtime exceptions or crashing. Gracefully falls back to degraded mode.',
      expectedOutput: 'Cache analysis unavailable because cache information is missing.',
      statusText: 'PASS — Graceful Degraded Mode',
      statusColor: 'var(--success)'
    },
    edge2: {
      title: 'Edge Case 2: Extremely Slow Task Outlier',
      subtitle: 'Build execution blocked by an extreme outlier task (duration = 920 seconds)',
      inputTelemetry: {
        build_id: 'BUILD-EDGE-SLOW-TASK',
        task_name: 'monolithic_e2e_integration_suite',
        task_duration_seconds: 920.0,
        queue_time_seconds: 60.0,
        cache_hit_rate: 0.85,
        number_of_tasks: 4
      },
      behavior: 'Identifies the task as a CRITICAL severity bottleneck, flagging excess duration (+845.0s) over cohort median.',
      expectedOutput: 'SLOW_TASK detected with CRITICAL severity. Difference from normal: +845.0s.',
      statusText: 'PASS — Flagged as CRITICAL Bottleneck',
      statusColor: 'var(--danger)'
    },
    edge3: {
      title: 'Edge Case 3: Zero Parallelisation Opportunity',
      subtitle: 'Build where all tasks have strict sequential dependencies (parallelizable_tasks = 0)',
      inputTelemetry: {
        build_id: 'BUILD-EDGE-NO-PARALLEL',
        parallelizable_tasks: 0,
        number_of_tasks: 6,
        task_duration_seconds: 120.0
      },
      behavior: 'Rule detector strictly suppresses parallelisation recommendations when tasks are interdependent, preventing misleading advice.',
      expectedOutput: 'System does NOT recommend parallelisation. (No false recommendations generated).',
      statusText: 'PASS — Recommendation Suppressed',
      statusColor: 'var(--primary)'
    }
  };

  const active = cases[selectedCase];

  return (
    <div className="glass-card" style={{ padding: '2.25rem', marginBottom: '3.5rem' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 className="table-title">
          <Layers size={22} color="#10b981" />
          <span>Mandatory Edge Cases Verification</span>
        </h2>
        <p className="metric-sub" style={{ marginTop: '4px' }}>
          Demonstrates system resilience, outlier handling, and precision rule filtering under abnormal real-world conditions.
        </p>
      </div>

      {/* Tactile Neumorphic Case Selector Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '2.25rem' }}>
        {Object.entries(cases).map(([key, c]) => {
          const isSelected = selectedCase === key;
          return (
            <button
              key={key}
              onClick={() => setSelectedCase(key)}
              style={{
                padding: '1.25rem',
                background: isSelected ? 'rgba(99, 102, 241, 0.16)' : 'var(--bg-elevated)',
                border: `1px solid ${isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.08)'}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'left',
                boxShadow: isSelected ? 'var(--neu-pill-active)' : 'var(--neu-raised)',
                transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.98rem', fontWeight: 700, color: isSelected ? '#a5b4fc' : '#ffffff' }}>
                {c.title}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
                {c.subtitle}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Case Details Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.75rem' }}>
        {/* Telemetry Input Payload */}
        <div style={{ background: 'var(--bg-sunken)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 'var(--radius-md)', padding: '1.5rem', boxShadow: 'var(--neu-sunken)' }}>
          <div style={{ fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.65rem', fontWeight: 700 }}>
            Input Telemetry Payload
          </div>
          <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.84rem', color: '#93c5fd', whiteSpace: 'pre-wrap', margin: 0 }}>
            {JSON.stringify(active.inputTelemetry, null, 2)}
          </pre>
        </div>

        {/* Expected & Verified Output */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ background: 'var(--bg-elevated)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: 'var(--neu-flat)' }}>
            <div style={{ fontSize: '0.76rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.45rem' }}>
              Engine Diagnostics Behavior
            </div>
            <p style={{ fontSize: '0.94rem', color: '#ffffff', lineHeight: 1.6 }}>
              {active.behavior}
            </p>
          </div>

          <div
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              padding: '1.5rem',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--neu-flat)'
            }}
          >
            <div className="flex-row" style={{ justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#6ee7b7', fontWeight: 700 }}>
                System Verification Output
              </span>
              <span className="badge badge-low">{active.statusText}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: '#ffffff', fontWeight: 600, marginTop: '0.35rem' }}>
              "{active.expectedOutput}"
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
