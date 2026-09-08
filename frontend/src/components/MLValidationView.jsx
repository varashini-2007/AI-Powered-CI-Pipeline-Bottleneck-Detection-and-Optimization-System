import React, { useEffect, useState } from 'react';
import { ShieldCheck, AlertCircle, HelpCircle, Check, X, FileText } from 'lucide-react';
import { fetchMLMetrics } from '../services/api';

export default function MLValidationView() {
  const [metricsData, setMetricsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMLMetrics()
      .then((data) => {
        setMetricsData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading ML evaluation &amp; error analysis metrics...
      </div>
    );
  }

  if (error || !metricsData) {
    return (
      <div className="glass-card" style={{ padding: '2rem', color: 'var(--danger)' }}>
        Failed to load ML metrics: {error}
      </div>
    );
  }

  const { metrics, confusion_matrix, error_analysis, model_comparison, selected_model, selection_rationale } = metricsData;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem' }}>
      {/* Overview Cards */}
      <div className="metrics-grid" style={{ marginBottom: 0 }}>
        <div className="glass-card metric-card">
          <div className="metric-label">Accuracy</div>
          <div className="metric-value" style={{ color: '#38bdf8' }}>
            {(metrics.accuracy * 100).toFixed(1)}%
          </div>
          <div className="metric-sub">Overall Correctness</div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-label">Precision</div>
          <div className="metric-value" style={{ color: '#a78bfa' }}>
            {(metrics.precision * 100).toFixed(1)}%
          </div>
          <div className="metric-sub">True Bottlenecks / Flagged</div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-label">Recall (Sensitivity)</div>
          <div className="metric-value" style={{ color: '#34d399' }}>
            {(metrics.recall * 100).toFixed(1)}%
          </div>
          <div className="metric-sub">Detected True Bottlenecks</div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-label">F1-Score</div>
          <div className="metric-value" style={{ color: '#f59e0b' }}>
            {(metrics.f1_score * 100).toFixed(1)}%
          </div>
          <div className="metric-sub">Harmonic Mean</div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-label">False Positives</div>
          <div className="metric-value" style={{ color: '#fb923c' }}>
            {confusion_matrix.false_positives}
          </div>
          <div className="metric-sub">Normal flagged as bottleneck</div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-label">False Negatives</div>
          <div className="metric-value" style={{ color: '#f87171' }}>
            {confusion_matrix.false_negatives}
          </div>
          <div className="metric-sub">Missed actual bottlenecks</div>
        </div>
      </div>

      {/* Model Selection & Recall Note Alert */}
      <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99,102,241,0.25)' }}>
        <div className="flex-row" style={{ marginBottom: '0.5rem', color: '#a5b4fc', fontWeight: 700 }}>
          <ShieldCheck size={18} />
          <span>Selected Model: {selected_model}</span>
        </div>
        <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6 }}>
          {selection_rationale}
        </p>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.5rem' }}>
          <strong>Why Recall Matters:</strong> In CI monitoring, accuracy alone is deceptive. Failing to detect an actual bottleneck (False Negative) allows slow builds to silently degrade developer productivity for days or weeks. High recall ensures issues are promptly surfaced.
        </p>
      </div>

      {/* Confusion Matrix & Model Comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.5rem' }}>
        {/* Confusion Matrix */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h2 className="table-title" style={{ marginBottom: '0.35rem' }}>
            Confusion Matrix (Test Split)
          </h2>
          <p className="metric-sub" style={{ marginBottom: '1rem' }}>
            Evaluated on holdout test set (n = {confusion_matrix.true_negatives + confusion_matrix.false_positives + confusion_matrix.false_negatives + confusion_matrix.true_positives})
          </p>

          <div className="cm-grid">
            <div className="cm-cell" style={{ borderLeft: '4px solid #10b981' }}>
              <div className="cm-cell-title">True Negatives (TN)</div>
              <div className="cm-cell-num" style={{ color: '#34d399' }}>{confusion_matrix.true_negatives}</div>
              <div className="metric-sub">Correctly Predicted Normal</div>
            </div>

            <div className="cm-cell" style={{ borderLeft: '4px solid #f59e0b' }}>
              <div className="cm-cell-title">False Positives (FP)</div>
              <div className="cm-cell-num" style={{ color: '#fbbf24' }}>{confusion_matrix.false_positives}</div>
              <div className="metric-sub">Normal marked as Bottleneck</div>
            </div>

            <div className="cm-cell" style={{ borderLeft: '4px solid #ef4444' }}>
              <div className="cm-cell-title">False Negatives (FN)</div>
              <div className="cm-cell-num" style={{ color: '#f87171' }}>{confusion_matrix.false_negatives}</div>
              <div className="metric-sub">Missed Actual Bottlenecks</div>
            </div>

            <div className="cm-cell" style={{ borderLeft: '4px solid #6366f1' }}>
              <div className="cm-cell-title">True Positives (TP)</div>
              <div className="cm-cell-num" style={{ color: '#818cf8' }}>{confusion_matrix.true_positives}</div>
              <div className="metric-sub">Correctly Detected Bottlenecks</div>
            </div>
          </div>
        </div>

        {/* Model Comparison Table */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h2 className="table-title" style={{ marginBottom: '0.35rem' }}>
            Algorithm Benchmark Comparison
          </h2>
          <p className="metric-sub" style={{ marginBottom: '1rem' }}>
            Logistic Regression vs Random Forest Classifier
          </p>

          <table className="custom-table">
            <thead>
              <tr>
                <th>Model</th>
                <th>Accuracy</th>
                <th>Precision</th>
                <th>Recall</th>
                <th>F1-Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(model_comparison).map(([mName, mStats]) => (
                <tr key={mName}>
                  <td style={{ fontWeight: 700, color: '#fff' }}>{mName}</td>
                  <td>{(mStats.accuracy * 100).toFixed(1)}%</td>
                  <td>{(mStats.precision * 100).toFixed(1)}%</td>
                  <td>{(mStats.recall * 100).toFixed(1)}%</td>
                  <td style={{ fontWeight: 700, color: '#a5b4fc' }}>{(mStats.f1_score * 100).toFixed(1)}%</td>
                  <td>
                    {selected_model === mName ? (
                      <span className="badge badge-low">Selected Winner</span>
                    ) : (
                      <span className="badge badge-none">Baseline</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Error Analysis Examples */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h2 className="table-title" style={{ marginBottom: '0.35rem' }}>
          <FileText size={18} color="#6366f1" />
          Error Analysis: Concrete Edge Case Records
        </h2>
        <p className="metric-sub" style={{ marginBottom: '1.25rem' }}>
          Real sample cases from the test dataset illustrating model false alarms and missed detections.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* False Positives */}
          <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex-row" style={{ color: '#fbbf24', fontWeight: 700, marginBottom: '0.5rem' }}>
              <AlertCircle size={16} />
              <span>False Positive Samples (Predicted 1, Actual 0)</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              {error_analysis.fp_description}
            </p>
            {error_analysis.fp_examples?.map((ex, idx) => (
              <div key={idx} style={{ background: '#0a0f1d', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#cbd5e1' }}>
                <div><strong>Build:</strong> {ex.build_id} | <strong>Task:</strong> {ex.task_name}</div>
                <div>Queue: {ex.queue_time_seconds}s | Duration: {ex.task_duration_seconds}s | Cache: {((ex.cache_hit_rate || 0) * 100).toFixed(0)}%</div>
              </div>
            ))}
          </div>

          {/* False Negatives */}
          <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex-row" style={{ color: '#f87171', fontWeight: 700, marginBottom: '0.5rem' }}>
              <X size={16} />
              <span>False Negative Samples (Predicted 0, Actual 1)</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              {error_analysis.fn_description}
            </p>
            {error_analysis.fn_examples?.map((ex, idx) => (
              <div key={idx} style={{ background: '#0a0f1d', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#cbd5e1' }}>
                <div><strong>Build:</strong> {ex.build_id} | <strong>Task:</strong> {ex.task_name}</div>
                <div>Queue: {ex.queue_time_seconds}s | Duration: {ex.task_duration_seconds}s | Cache: {((ex.cache_hit_rate || 0) * 100).toFixed(0)}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
