import React from 'react';
import { Activity, Cpu, Layers, ShieldCheck, Zap, AlertTriangle } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, healthStatus }) {
  const tabs = [
    { id: 'overview', label: 'Overview & Charts', icon: Activity },
    { id: 'bottlenecks', label: 'Bottlenecks & Fixes', icon: AlertTriangle },
    { id: 'prediction', label: 'ML Prediction', icon: Zap },
    { id: 'validation', label: 'Model Validation', icon: ShieldCheck },
    { id: 'edge-cases', label: 'Edge Cases Demo', icon: Layers }
  ];

  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="header-logo" title="CI Intelligent Optimization Engine">
          <Cpu size={26} color="#ffffff" />
        </div>
        <div className="header-title-wrap">
          <h1>CI BOTTLENECK ANALYSER</h1>
          <div className="header-meta">
            <span className="header-subtitle">Intelligent Telemetry &amp; ML Optimization</span>
            <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>•</span>
            <div className="live-status-pill">
              <span className="status-beacon" />
              <span>{healthStatus === 'healthy' ? 'API ONLINE • 1,500 BUILDS' : 'CONNECTING...'}</span>
            </div>
          </div>
        </div>
      </div>

      <nav className="header-nav" aria-label="Dashboard Navigation">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`nav-tab ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
