import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { TrendingUp, Clock, Archive, Cpu } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function ChartsSection({ builds }) {
  if (!builds || builds.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading CI build telemetry charts...
      </div>
    );
  }

  // Sample recent 20 builds chronologically for clean visualization
  const sampleBuilds = builds.slice(0, 20).reverse();
  const labels = sampleBuilds.map((b) => b.build_id);

  // Common dark theme chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#111827',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 10
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#64748b', font: { size: 10 } }
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#64748b', font: { size: 10 } }
      }
    }
  };

  // 1. Build Duration Trend
  const durationData = {
    labels,
    datasets: [
      {
        fill: true,
        label: 'Build Duration (s)',
        data: sampleBuilds.map((b) => b.build_duration_seconds),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.12)',
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 6
      }
    ]
  };

  // 2. Queue Time Distribution
  const queueData = {
    labels,
    datasets: [
      {
        fill: true,
        label: 'Queue Time (s)',
        data: sampleBuilds.map((b) => b.queue_time_seconds),
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.12)',
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 6
      }
    ]
  };

  // 3. Cache Hit Rate (%)
  const cacheData = {
    labels,
    datasets: [
      {
        label: 'Cache Hit Rate (%)',
        data: sampleBuilds.map((b) => Math.round(b.cache_hit_rate * 100)),
        backgroundColor: sampleBuilds.map((b) =>
          b.cache_hit_rate < 0.5 ? 'rgba(239, 68, 68, 0.75)' : 'rgba(16, 185, 129, 0.75)'
        ),
        borderRadius: 4
      }
    ]
  };

  // 4. Agent Utilisation (%)
  const agentData = {
    labels,
    datasets: [
      {
        label: 'Agent Utilisation (%)',
        data: sampleBuilds.map((b) => Math.round(b.agent_utilisation_percent * 100)),
        backgroundColor: sampleBuilds.map((b) =>
          b.agent_utilisation_percent > 0.90 ? 'rgba(239, 68, 68, 0.75)' : 'rgba(168, 85, 247, 0.75)'
        ),
        borderRadius: 4
      }
    ]
  };

  return (
    <div className="charts-grid">
      {/* Chart 1 */}
      <div className="glass-card chart-card">
        <div className="chart-header">
          <div className="chart-title">
            <TrendingUp size={18} color="#6366f1" />
            Build Duration Trend
          </div>
          <span className="badge badge-pill">Seconds</span>
        </div>
        <div className="chart-canvas-container">
          <Line data={durationData} options={chartOptions} />
        </div>
      </div>

      {/* Chart 2 */}
      <div className="glass-card chart-card">
        <div className="chart-header">
          <div className="chart-title">
            <Clock size={18} color="#06b6d4" />
            Queue Wait Time (Threshold: 300s)
          </div>
          <span className="badge badge-pill">Runner Latency</span>
        </div>
        <div className="chart-canvas-container">
          <Line data={queueData} options={chartOptions} />
        </div>
      </div>

      {/* Chart 3 */}
      <div className="glass-card chart-card">
        <div className="chart-header">
          <div className="chart-title">
            <Archive size={18} color="#10b981" />
            Cache Hit Efficiency (Target &gt; 50%)
          </div>
          <span className="badge badge-pill">Red = Low Cache</span>
        </div>
        <div className="chart-canvas-container">
          <Bar data={cacheData} options={chartOptions} />
        </div>
      </div>

      {/* Chart 4 */}
      <div className="glass-card chart-card">
        <div className="chart-header">
          <div className="chart-title">
            <Cpu size={18} color="#a855f7" />
            Agent Utilisation (Saturation &gt; 90%)
          </div>
          <span className="badge badge-pill">Red = Overloaded</span>
        </div>
        <div className="chart-canvas-container">
          <Bar data={agentData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}
