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
      <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
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
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(14, 22, 38, 0.96)',
        titleColor: '#ffffff',
        titleFont: { family: 'Outfit', size: 13, weight: 'bold' },
        bodyColor: '#cbd5e1',
        bodyFont: { family: 'Inter', size: 12 },
        borderColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
        boxPadding: 4
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.03)' },
        ticks: { color: '#94a3b8', font: { size: 10, family: 'JetBrains Mono' } }
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#94a3b8', font: { size: 10, family: 'Inter' } }
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
        backgroundColor: 'rgba(99, 102, 241, 0.14)',
        tension: 0.38,
        borderWidth: 2.5,
        pointRadius: 4,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5,
        pointHoverRadius: 7
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
        backgroundColor: 'rgba(6, 182, 212, 0.14)',
        tension: 0.38,
        borderWidth: 2.5,
        pointRadius: 4,
        pointBackgroundColor: '#06b6d4',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5,
        pointHoverRadius: 7
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
          b.cache_hit_rate < 0.5 ? 'rgba(239, 68, 68, 0.85)' : 'rgba(16, 185, 129, 0.85)'
        ),
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)'
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
          b.agent_utilisation_percent > 0.90 ? 'rgba(239, 68, 68, 0.85)' : 'rgba(168, 85, 247, 0.85)'
        ),
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)'
      }
    ]
  };

  return (
    <div className="charts-grid">
      {/* Chart 1 */}
      <div className="glass-card chart-card">
        <div className="chart-header">
          <div className="chart-title">
            <TrendingUp size={20} color="#6366f1" />
            <span>Build Duration Trend</span>
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
            <Clock size={20} color="#06b6d4" />
            <span>Queue Wait Time (Threshold: 300s)</span>
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
            <Archive size={20} color="#10b981" />
            <span>Cache Hit Efficiency (Target &gt; 50%)</span>
          </div>
          <span className="badge badge-low">Red = Misses</span>
        </div>
        <div className="chart-canvas-container">
          <Bar data={cacheData} options={chartOptions} />
        </div>
      </div>

      {/* Chart 4 */}
      <div className="glass-card chart-card">
        <div className="chart-header">
          <div className="chart-title">
            <Cpu size={20} color="#a855f7" />
            <span>Agent Utilisation (Threshold &gt; 90%)</span>
          </div>
          <span className="badge badge-critical">Red = Saturated</span>
        </div>
        <div className="chart-canvas-container">
          <Bar data={agentData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}
