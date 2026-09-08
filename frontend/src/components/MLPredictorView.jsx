import React, { useState } from 'react';
import { Zap, Play, CheckCircle2, AlertTriangle, BarChart3 } from 'lucide-react';
import { predictML } from '../services/api';
import { Bar } from 'react-chartjs-2';

export default function MLPredictorView() {
  const [formData, setFormData] = useState({
    queue_time_seconds: 420.0,
    task_duration_seconds: 240.0,
    cache_hit_rate: 0.25,
    agent_utilisation_percent: 0.94,
    number_of_tasks: 8,
    failed_tasks: 0,
    parallelizable_tasks: 3,
    build_duration_seconds: 680.0
  });

  const [loading, setLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handlePreset = (type) => {
    if (type === 'bottleneck') {
      setFormData({
        queue_time_seconds: 480.0,
        task_duration_seconds: 290.0,
        cache_hit_rate: 0.15,
        agent_utilisation_percent: 0.96,
        number_of_tasks: 10,
        failed_tasks: 1,
        parallelizable_tasks: 2,
        build_duration_seconds: 780.0
      });
    } else {
      setFormData({
        queue_time_seconds: 45.0,
        task_duration_seconds: 65.0,
        cache_hit_rate: 0.88,
        agent_utilisation_percent: 0.55,
        number_of_tasks: 6,
        failed_tasks: 0,
        parallelizable_tasks: 0,
        build_duration_seconds: 180.0
      });
    }
  };

  const handlePredict = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await predictML(formData);
      setPredictionResult(result);
    } catch (err) {
      setError(err.message || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  // Feature contributions chart data
  const featureChartData = predictionResult?.feature_contributions ? {
    labels: predictionResult.feature_contributions.map((fc) => fc.feature.replace(/_/g, ' ')),
    datasets: [
      {
        label: 'Feature Importance Weight',
        data: predictionResult.feature_contributions.map((fc) => fc.importance),
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderRadius: 4
      }
    ]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 11 } } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 11 } } }
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
      {/* Input Parameters Panel */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 className="table-title">
              <Zap size={20} color="#6366f1" />
              Build Telemetry Parameters
            </h2>
            <p className="metric-sub">Configure real-time CI metrics for ML inference</p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="badge badge-high"
              style={{ cursor: 'pointer', border: '1px solid rgba(239,68,68,0.4)' }}
              onClick={() => handlePreset('bottleneck')}
            >
              Load Bottleneck Preset
            </button>
            <button
              type="button"
              className="badge badge-low"
              style={{ cursor: 'pointer', border: '1px solid rgba(16,185,129,0.4)' }}
              onClick={() => handlePreset('normal')}
            >
              Load Normal Preset
            </button>
          </div>
        </div>

        <form onSubmit={handlePredict}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Queue Time (seconds)</label>
              <input
                type="number"
                step="any"
                className="form-input"
                name="queue_time_seconds"
                value={formData.queue_time_seconds}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Task Duration (seconds)</label>
              <input
                type="number"
                step="any"
                className="form-input"
                name="task_duration_seconds"
                value={formData.task_duration_seconds}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Cache Hit Rate (0.0 - 1.0)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                className="form-input"
                name="cache_hit_rate"
                value={formData.cache_hit_rate}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Agent Utilisation (0.0 - 1.0)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                className="form-input"
                name="agent_utilisation_percent"
                value={formData.agent_utilisation_percent}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Number of Tasks</label>
              <input
                type="number"
                className="form-input"
                name="number_of_tasks"
                value={formData.number_of_tasks}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Failed Tasks</label>
              <input
                type="number"
                className="form-input"
                name="failed_tasks"
                value={formData.failed_tasks}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Parallelizable Tasks</label>
              <input
                type="number"
                className="form-input"
                name="parallelizable_tasks"
                value={formData.parallelizable_tasks}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Build Total Duration (s)</label>
              <input
                type="number"
                step="any"
                className="form-input"
                name="build_duration_seconds"
                value={formData.build_duration_seconds}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            <Play size={16} />
            {loading ? 'Evaluating Model...' : 'Run ML Prediction'}
          </button>
          {error && <p style={{ color: 'var(--danger)', marginTop: '0.75rem' }}>{error}</p>}
        </form>
      </div>

      {/* Prediction Output & Feature Importance */}
      <div className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column' }}>
        <h2 className="table-title" style={{ marginBottom: '0.5rem' }}>
          ML Prediction Result
        </h2>
        <p className="metric-sub" style={{ marginBottom: '1.25rem' }}>
          Trained Classifier Inference &amp; Probability
        </p>

        {predictionResult ? (
          <div>
            <div style={{
              background: predictionResult.prediction === 1 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
              border: `1px solid ${predictionResult.prediction === 1 ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Classification Outcome
              </div>
              <div style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: predictionResult.prediction === 1 ? '#f87171' : '#34d399',
                fontFamily: 'var(--font-mono)'
              }}>
                {predictionResult.prediction_label}
              </div>
              <div style={{ fontSize: '1.05rem', marginTop: '0.35rem', color: '#fff', fontWeight: 600 }}>
                Confidence / Probability: {predictionResult.probability_percent}%
              </div>
              <div className="badge badge-pill" style={{ marginTop: '0.75rem' }}>
                Model: {predictionResult.model_used}
              </div>
            </div>

            {/* Feature Importance */}
            <div>
              <div className="flex-row" style={{ marginBottom: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 700 }}>
                <BarChart3 size={16} color="#6366f1" />
                Top Contributing Feature Importances
              </div>
              <div style={{ height: '180px', width: '100%' }}>
                {featureChartData && <Bar data={featureChartData} options={chartOptions} />}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
            <Zap size={36} color="var(--border-subtle)" style={{ marginBottom: '0.75rem' }} />
            <p>Click "Run ML Prediction" or select a preset to evaluate build risk.</p>
          </div>
        )}
      </div>
    </div>
  );
}
