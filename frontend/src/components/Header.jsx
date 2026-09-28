import React from 'react';
import {
  Activity,
  Cpu,
  Layers,
  ShieldCheck,
  Zap,
  AlertTriangle,
  TrendingDown,
  Terminal,
  Award,
  Building,
  UserCheck
} from 'lucide-react';

export default function Header({
  activeTab,
  setActiveTab,
  healthStatus,
  userRole,
  setUserRole,
  selectedOrg,
  setSelectedOrg
}) {
  const tabs = [
    { id: 'overview', label: 'Overview & Telemetry', icon: Activity },
    { id: 'bottlenecks', label: 'Bottlenecks & Fixes', icon: AlertTriangle },
    { id: 'experiment', label: 'Feedback Time (-70.9%)', icon: TrendingDown, badge: 'Target Met' },
    { id: 'prediction', label: 'ML Failure Prediction', icon: Zap },
    { id: 'validation', label: 'Model Validation', icon: ShieldCheck },
    { id: 'edge-cases', label: '3 Edge Cases', icon: Layers },
    { id: 'ci-integration', label: 'CI Webhook Stub', icon: Terminal, badge: 'Live API' },
    { id: 'stakeholders', label: 'Stakeholder Sign-Off', icon: Award }
  ];

  const handleRoleChange = (newRole) => {
    setUserRole(newRole);
    if (newRole === 'external_partner') {
      setSelectedOrg('Org_C');
    }
  };

  return (
    <header className="app-header" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Top Bar: Brand, Status, and Selectors */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', width: '100%' }}>
        <div className="header-brand">
          <div className="header-logo" title="CI Intelligent Optimization Engine">
            <Cpu size={26} color="#ffffff" />
          </div>
          <div className="header-title-wrap">
            <h1>CI BOTTLENECK ANALYSER</h1>
            <div className="header-meta">
              <span className="header-subtitle">Intelligent Telemetry &amp; Explainable ML Optimisation</span>
              <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>•</span>
              <div className="live-status-pill">
                <span className="status-beacon" />
                <span>{healthStatus === 'healthy' ? 'API ONLINE • 1,200 ENTERPRISE BUILDS' : 'CONNECTING...'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enterprise Role & Org Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Org Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(30, 41, 59, 0.6)', padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Building size={16} color="#94a3b8" />
            <label htmlFor="org-select" style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
              Org Tenant:
            </label>
            <select
              id="org-select"
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              disabled={userRole === 'external_partner'}
              style={{
                background: 'transparent',
                color: '#f8fafc',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: 600,
                outline: 'none',
                cursor: userRole === 'external_partner' ? 'not-allowed' : 'pointer'
              }}
            >
              <option value="all" style={{ background: '#1e293b', color: '#fff' }}>All Organisations</option>
              <option value="Org_A" style={{ background: '#1e293b', color: '#fff' }}>Org_A (Retail Banking)</option>
              <option value="Org_B" style={{ background: '#1e293b', color: '#fff' }}>Org_B (Healthcare Claims)</option>
              <option value="Org_C" style={{ background: '#1e293b', color: '#fff' }}>Org_C (Aviation Logistics)</option>
            </select>
          </div>

          {/* Role Persona Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(30, 41, 59, 0.6)', padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <UserCheck size={16} color="#60a5fa" />
            <label htmlFor="role-select" style={{ fontSize: '0.8rem', color: '#93c5fd', fontWeight: 600 }}>
              Permission Role:
            </label>
            <select
              id="role-select"
              value={userRole}
              onChange={(e) => handleRoleChange(e.target.value)}
              style={{
                background: 'transparent',
                color: '#38bdf8',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: 700,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="developer" style={{ background: '#1e293b', color: '#fff' }}>Developer</option>
              <option value="manager" style={{ background: '#1e293b', color: '#fff' }}>Engineering Manager</option>
              <option value="compliance" style={{ background: '#1e293b', color: '#fff' }}>Compliance Reviewer</option>
              <option value="external_partner" style={{ background: '#1e293b', color: '#fff' }}>External Partner</option>
              <option value="admin" style={{ background: '#1e293b', color: '#fff' }}>Enterprise Admin</option>
            </select>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <nav className="header-nav" aria-label="Dashboard Navigation" style={{ overflowX: 'auto', width: '100%', paddingBottom: '0.25rem' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`nav-tab ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span style={{
                  fontSize: '0.65rem',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '9999px',
                  backgroundColor: isActive ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontWeight: 700
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
