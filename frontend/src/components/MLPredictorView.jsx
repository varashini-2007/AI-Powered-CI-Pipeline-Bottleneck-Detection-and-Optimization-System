import React, { useState } from 'react';
import { Zap, Play, CheckCircle2, AlertTriangle, BarChart3, Sparkles } from 'lucide-react';
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
        label: 'Feature Weight',
        data: predictionResult.feature_contributions.map((fc) => fc.importance),
        backgroundColor: [
          'rgba(99, 102, 241, 0.85)',
          'rgba(6, 182, 212, 0.85)',
          'rgba(168, 85, 247, 0.85)',
          'rgba(59, 130, 246, 0.85)'
        ],
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)'
      }
    ]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(14, 22, 38, 0.95)',
        titleColor: '#fff',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#94a3b8', font: { size: 11, family: 'Inter' } }
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#94a3b8', font: { size: 11, family: 'Inter' } }
      }
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.75rem', marginBottom: '3rem' }}>
      {/* Input Parameters Panel */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 className="table-title">
              <Zap size={22} color="#6366f1" />
              Build Telemetry Parameters
            </h2>
            <p className="metric-sub" style={{ marginTop: '2px' }}>
              Configure real-time pipeline metrics to evaluate failure probability
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              type="button"
              className="neu-button-preset"
              style={{ color: '#fca5a5' }}
              onClick={() => handlePreset('bottleneck')}
            >
              <AlertTriangle size={14} color="#ef4444" />
              Bottleneck Preset
            </button>
            <button
              type="button"
              className="neu-button-preset"
              style={{ color: '#6ee7b7' }}
              onClick={() => handlePreset('normal')}
            >
              <CheckCircle2 size={14} color="#10b981" />
              Normal Preset
            </button>
          </div>
        </div>

        <form onSubmit={handlePredict}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                <span>Queue Time</span>
                <span className="form-label-hint">seconds</span>
              </label>
              <input
                type="number"
                step="any"
                className="neu-input"
                name="queue_time_seconds"
                value={formData.queue_time_seconds}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Task Duration</span>
                <span className="form-label-hint">seconds</span>
              </label>
              <input
                type="number"
                step="any"
                className="neu-input"
                name="task_duration_seconds"
                value={formData.task_duration_seconds}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Cache Hit Rate</span>
                <span className="form-label-hint">0.0 – 1.0 or %</span>
              </label>
              <input
                type="number"
                step="any"
                className="neu-input"
                name="cache_hit_rate"
                value={formData.cache_hit_rate}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Agent Utilisation</span>
                <span className="form-label-hint">0.0 – 1.0 or %</span>
              </label>
              <input
                type="number"
                step="any"
                className="neu-input"
                name="agent_utilisation_percent"
                value={formData.agent_utilisation_percent}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Total Tasks</span>
                <span className="form-label-hint">count</span>
              </label>
              <input
                type="number"
                className="neu-input"
                name="number_of_tasks"
                value={formData.number_of_tasks}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Failed Tasks</span>
                <span className="form-label-hint">count</span>
              </label>
              <input
                type="number"
                className="neu-input"
                name="failed_tasks"
                value={formData.failed_tasks}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Parallelizable Tasks</span>
                <span className="form-label-hint">count</span>
              </label>
              <input
                type="number"
                className="neu-input"
                name="parallelizable_tasks"
                value={formData.parallelizable_tasks}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Build Duration</span>
                <span className="form-label-hint">wall-clock (s)</span>
              </label>
              <input
                type="number"
                step="any"
                className="neu-input"
                name="build_duration_seconds"
                value={formData.build_duration_seconds}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="submit" className="btn-primary" disabled={loading}>
              <Play size={17} />
              {loading ? 'Evaluating Model...' : 'Run ML Prediction'}
            </button>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Evaluates using trained Random Forest Classifier
            </span>
          </div>
          {error && (
            <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', color: '#f87171', fontSize: '0.86rem' }}>
              {error}
            </div>
          )}
        </form>
      </div>

      {/* Prediction Output & Feature Importance Panel */}
      <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
        <h2 className="table-title" style={{ marginBottom: '0.4rem' }}>
          ML Prediction Inference
        </h2>
        <p className="metric-sub" style={{ marginBottom: '1.5rem' }}>
          Real-time Classification Outcome &amp; Factor Attribution
        </p>

        {predictionResult ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Outcome Banner */}
            <div
              style={{
                background: predictionResult.prediction === 1 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                border: `1px solid ${predictionResult.prediction === 1 ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: '1.6rem',
                textAlign: 'center',
                boxShadow: 'var(--neu-raised)'
              }}
            >
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 700 }}>
                Classification Result
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2.4rem',
                  fontWeight: 800,
                  color: predictionResult.prediction === 1 ? '#f87171' : '#34d399',
                  lineHeight: 1.1
                }}
              >
                {predictionResult.prediction_label}
              </div>
              <div style={{ fontSize: '1.1rem', marginTop: '0.5rem', color: '#ffffff', fontWeight: 600 }}>
                Risk Probability: <span style={{ color: predictionResult.prediction === 1 ? '#f87171' : '#34d399' }}>{predictionResult.probability_percent}%</span>
              </div>
              <div style={{ marginTop: '0.85rem' }}>
                <span className="badge badge-pill">
                  Model: {predictionResult.model_used}
                </span>
              </div>
            </div>

            {/* Feature Contributions */}
            <div style={{ background: 'var(--bg-sunken)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: 'var(--neu-sunken)' }}>
              <div className="flex-row" style={{ marginBottom: '0.85rem', color: 'var(--text-primary)', fontSize: '0.86rem', fontWeight: 700 }}>
                <BarChart3 size={17} color="#6366f1" />
                Key Contributing Telemetry Drivers
              </div>
              <div style={{ height: '180px', width: '100%' }}>
                {featureChartData && <Bar data={featureChartData} options={chartOptions} />}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 1.5rem' }}>
            <div className="neu-icon-bed" style={{ width: '56px', height: '56px', marginBottom: '1rem' }}>
              <Zap size={28} color="var(--primary)" />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginBottom: '0.35rem', fontSize: '1.1rem' }}>
              Awaiting Telemetry Parameters
            </h3>
            <p style={{ fontSize: '0.86rem', maxWidth: '320px', lineHeight: 1.5 }}>
              Click <strong>"Run ML Prediction"</strong> or load a preset above to compute real-time bottleneck risk and driving factors.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
