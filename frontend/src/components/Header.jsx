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
        <div className="header-logo">
          <Cpu size={26} color="#ffffff" />
        </div>
        <div className="header-title-wrap">
          <h1>CI BOTTLENECK ANALYSER</h1>
          <div className="flex-row" style={{ marginTop: '2px' }}>
            <span className="header-subtitle">Pipeline Diagnostics & ML Optimization Engine</span>
            <span style={{ color: 'var(--border-subtle)' }}>•</span>
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '0.75rem', 
              color: healthStatus === 'healthy' ? 'var(--success)' : 'var(--warning)',
              fontFamily: 'var(--font-mono)' 
            }}>
              <span style={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                background: healthStatus === 'healthy' ? 'var(--success)' : 'var(--warning)' 
              }}></span>
              API {healthStatus || 'Connecting...'}
            </span>
          </div>
        </div>
      </div>

      <nav className="header-nav">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
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
