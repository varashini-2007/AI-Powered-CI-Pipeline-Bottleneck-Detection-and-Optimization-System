import React, { useEffect, useState } from 'react';
import { ShieldCheck, AlertCircle, HelpCircle, Check, X, FileText, Award, BarChart2 } from 'lucide-react';
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
      <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div className="neu-icon-bed" style={{ width: '48px', height: '48px', margin: '0 auto 1rem auto' }}>
          <ShieldCheck size={24} color="var(--primary)" />
        </div>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Loading ML evaluation &amp; error analysis metrics...</p>
      </div>
    );
  }

  if (error || !metricsData) {
    return (
      <div className="glass-card" style={{ padding: '2.5rem', color: 'var(--danger)', textAlign: 'center' }}>
        <AlertCircle size={32} style={{ marginBottom: '0.75rem' }} />
        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Failed to Load ML Metrics</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{error}</p>
      </div>
    );
  }

  const { metrics, confusion_matrix, error_analysis, model_comparison, selected_model, selection_rationale } = metricsData;

  const topMetrics = [
    { label: 'Accuracy', val: `${(metrics.accuracy * 100).toFixed(1)}%`, sub: 'Overall Correctness', color: '#38bdf8', stripe: 'linear-gradient(90deg, #38bdf8, #0ea5e9)' },
    { label: 'Precision', val: `${(metrics.precision * 100).toFixed(1)}%`, sub: 'True Bottlenecks / Flagged', color: '#a78bfa', stripe: 'linear-gradient(90deg, #a78bfa, #8b5cf6)' },
    { label: 'Recall (Sensitivity)', val: `${(metrics.recall * 100).toFixed(1)}%`, sub: 'Detected True Bottlenecks', color: '#34d399', stripe: 'linear-gradient(90deg, #34d399, #10b981)' },
    { label: 'F1-Score', val: `${(metrics.f1_score * 100).toFixed(1)}%`, sub: 'Harmonic Balance', color: '#f59e0b', stripe: 'linear-gradient(90deg, #f59e0b, #d97706)' },
    { label: 'False Positives', val: confusion_matrix.false_positives, sub: 'Normal marked as Bottleneck', color: '#fb923c', stripe: 'linear-gradient(90deg, #fb923c, #ea580c)' },
    { label: 'False Negatives', val: confusion_matrix.false_negatives, sub: 'Missed Actual Bottlenecks', color: '#f87171', stripe: 'linear-gradient(90deg, #f87171, #ef4444)' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', marginBottom: '3.5rem' }}>
      {/* Overview Cards with Neumorphic Relief */}
      <div className="metrics-grid" style={{ marginBottom: 0 }}>
        {topMetrics.map((tm, idx) => (
          <div key={idx} className="glass-card metric-card">
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: tm.stripe }} />
            <div className="metric-label">{tm.label}</div>
            <div className="metric-value" style={{ color: tm.color, marginTop: '0.4rem' }}>
              {tm.val}
            </div>
            <div className="metric-sub">{tm.sub}</div>
          </div>
        ))}
      </div>

      {/* Model Selection & Recall Note Alert */}
      <div className="glass-card" style={{ padding: '1.75rem', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99,102,241,0.25)' }}>
        <div className="flex-row" style={{ marginBottom: '0.65rem', color: '#a5b4fc', fontWeight: 700, fontSize: '1.05rem' }}>
          <Award size={20} color="#6366f1" />
          <span>Selected Model: {selected_model}</span>
        </div>
        <p style={{ fontSize: '0.92rem', color: '#e2e8f0', lineHeight: 1.65 }}>
          {selection_rationale}
        </p>
        <p style={{ fontSize: '0.86rem', color: '#94a3b8', marginTop: '0.65rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.65rem' }}>
          <strong style={{ color: '#fff' }}>Why Recall Matters in CI/CD:</strong> Accuracy alone is misleading in imbalanced telemetry. Failing to catch an actual bottleneck (False Negative) allows slow builds to silently degrade developer velocity unnoticed. High Recall guarantees critical bottlenecks are immediately flagged for optimization.
        </p>
      </div>

      {/* Confusion Matrix & Model Comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.75rem' }}>
        {/* Confusion Matrix with 3D Neumorphic Tactile Cells */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <h2 className="table-title" style={{ marginBottom: '0.35rem' }}>
            <BarChart2 size={20} color="#6366f1" />
            Confusion Matrix (Test Split)
          </h2>
          <p className="metric-sub" style={{ marginBottom: '1.25rem' }}>
            Evaluated on holdout test set (n = {confusion_matrix.true_negatives + confusion_matrix.false_positives + confusion_matrix.false_negatives + confusion_matrix.true_positives})
          </p>

          <div className="cm-grid">
            <div className="cm-cell cm-cell-success">
              <div className="cm-cell-title">True Negatives (TN)</div>
              <div className="cm-cell-num" style={{ color: '#34d399' }}>{confusion_matrix.true_negatives}</div>
              <div className="cm-cell-sub">Correctly Predicted Normal</div>
            </div>

            <div className="cm-cell" style={{ borderTop: '3px solid #f59e0b' }}>
              <div className="cm-cell-title">False Positives (FP)</div>
              <div className="cm-cell-num" style={{ color: '#fbbf24' }}>{confusion_matrix.false_positives}</div>
              <div className="cm-cell-sub">Normal flagged as Bottleneck</div>
            </div>

            <div className="cm-cell cm-cell-danger">
              <div className="cm-cell-title">False Negatives (FN)</div>
              <div className="cm-cell-num" style={{ color: '#f87171' }}>{confusion_matrix.false_negatives}</div>
              <div className="cm-cell-sub">Missed Actual Bottlenecks</div>
            </div>

            <div className="cm-cell" style={{ borderTop: '3px solid #6366f1' }}>
              <div className="cm-cell-title">True Positives (TP)</div>
              <div className="cm-cell-num" style={{ color: '#818cf8' }}>{confusion_matrix.true_positives}</div>
              <div className="cm-cell-sub">Correctly Detected Bottlenecks</div>
            </div>
          </div>
        </div>

        {/* Algorithm Comparison Table */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <h2 className="table-title" style={{ marginBottom: '0.35rem' }}>
            Algorithm Benchmark Comparison
          </h2>
          <p className="metric-sub" style={{ marginBottom: '1.25rem' }}>
            Logistic Regression vs Random Forest Classifier
          </p>

          <div className="table-container">
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
                        <span className="badge badge-low">Winner</span>
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
      </div>

      {/* Error Analysis Concrete Records */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <h2 className="table-title" style={{ marginBottom: '0.35rem' }}>
          <FileText size={20} color="#6366f1" />
          Error Analysis: Concrete Test Sample Telemetry
        </h2>
        <p className="metric-sub" style={{ marginBottom: '1.35rem' }}>
          Real sample cases from the test dataset illustrating model false alarms and missed detections.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* False Positives */}
          <div style={{ background: 'var(--bg-sunken)', padding: '1.35rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: 'var(--neu-sunken)' }}>
            <div className="flex-row" style={{ color: '#fbbf24', fontWeight: 700, marginBottom: '0.5rem' }}>
              <AlertCircle size={16} />
              <span>False Positive Samples (Predicted 1, Actual 0)</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
              {error_analysis.fp_description}
            </p>
            {error_analysis.fp_examples?.map((ex, idx) => (
              <div key={idx} className="telemetry-chip">
                <div><strong>Build:</strong> {ex.build_id} &bull; <strong>Task:</strong> {ex.task_name}</div>
                <div style={{ marginTop: '3px', color: '#94a3b8' }}>
                  Queue: {ex.queue_time_seconds}s | Duration: {ex.task_duration_seconds}s | Cache: {((ex.cache_hit_rate || 0) * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>

          {/* False Negatives */}
          <div style={{ background: 'var(--bg-sunken)', padding: '1.35rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: 'var(--neu-sunken)' }}>
            <div className="flex-row" style={{ color: '#f87171', fontWeight: 700, marginBottom: '0.5rem' }}>
              <X size={16} />
              <span>False Negative Samples (Predicted 0, Actual 1)</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
              {error_analysis.fn_description}
            </p>
            {error_analysis.fn_examples?.map((ex, idx) => (
              <div key={idx} className="telemetry-chip">
                <div><strong>Build:</strong> {ex.build_id} &bull; <strong>Task:</strong> {ex.task_name}</div>
                <div style={{ marginTop: '3px', color: '#94a3b8' }}>
                  Queue: {ex.queue_time_seconds}s | Duration: {ex.task_duration_seconds}s | Cache: {((ex.cache_hit_rate || 0) * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
