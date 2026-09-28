import React from 'react';
import { UserCheck, Shield, Users, Lock, Sliders, AlertCircle, FileCheck, CheckCircle2 } from 'lucide-react';

export default function RoleBanner({ userRole, selectedOrg, onThresholdsOpen }) {
  const roleConfigs = {
    developer: {
      title: 'Developer Persona Active',
      icon: UserCheck,
      color: '#38bdf8',
      badge: 'BUILD FEEDBACK OPTIMISATION',
      focus: 'Task-level timings, personal build caching snippets, and test suite parallelisation.',
      workflowNote: 'Visible Workflow: Highlighting direct actionable code changes, actions/cache YAML snippets, and personal test duration reductions. External fleet complexity is minimized to keep you focused on shipping code.'
    },
    manager: {
      title: 'Engineering Manager Persona Active',
      icon: Users,
      color: '#a855f7',
      badge: 'TEAM THROUGHPUT & ROI',
      focus: 'Organization-wide pipeline throughput, developer idle hours saved, and runner fleet sizing.',
      workflowNote: 'Visible Workflow: Surfacing queue starvation trends, agent host saturation %, developer context-switching costs, and runner autoscaling ROI.'
    },
    compliance: {
      title: 'Compliance & Regulatory Reviewer Persona Active',
      icon: Shield,
      color: '#10b981',
      badge: 'REGULATED CHANGE GOVERNANCE',
      focus: 'Cryptographic SHA-256 audit trails, 4-question plain language explainability, and production change sign-offs.',
      workflowNote: 'Visible Workflow: Audit-mode enabled. Every high-priority finding displays non-specialist explainability, empirical evidence thresholds, SHA-256 hash seals, and change-approval CAB sign-off buttons.'
    },
    external_partner: {
      title: 'External Partner Persona Active',
      icon: Lock,
      color: '#f59e0b',
      badge: 'MULTI-TENANT RESTRICTED SCOPE',
      focus: 'Strict tenant data isolation: access scoped exclusively to shared partner gateway pipelines (Org_C).',
      workflowNote: 'Visible Workflow: Internal runner hostnames, internal employee emails, and non-partner organization pipelines are cryptographically masked ([REDACTED_RUNNER]) to satisfy enterprise data isolation mandates.'
    },
    admin: {
      title: 'Enterprise Administrator Persona Active',
      icon: Sliders,
      color: '#ef4444',
      badge: 'GLOBAL FLEET & THRESHOLD TUNING',
      focus: 'Cross-tenant oversight (Org_A, Org_B, Org_C) and dynamic analytical rule threshold calibration.',
      workflowNote: 'Visible Workflow: Full access across all 3 organisations and infrastructure fleets. Analytical heuristic thresholds (Queue wait, Cache hit rate %, Agent saturation %, P90 task cutoffs) can be tuned live.'
    }
  };

  const current = roleConfigs[userRole] || roleConfigs.developer;
  const Icon = current.icon;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
      border: `1px solid ${current.color}40`,
      borderRadius: 'var(--radius-lg, 12px)',
      padding: '1.25rem 1.75rem',
      marginBottom: '1.75rem',
      boxShadow: `0 4px 20px -2px ${current.color}15`,
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '4px',
        height: '100%',
        backgroundColor: current.color
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: `${current.color}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${current.color}50`
          }}>
            <Icon size={24} color={current.color} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: '#f8fafc' }}>
                {current.title}
              </h2>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                backgroundColor: `${current.color}25`,
                color: current.color,
                border: `1px solid ${current.color}40`
              }}>
                {current.badge}
              </span>
              {selectedOrg !== 'all' && (
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#e2e8f0'
                }}>
                  Tenant Scope: {selectedOrg}
                </span>
              )}
            </div>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.4' }}>
              <strong>Primary Objective:</strong> {current.focus}
            </p>
          </div>
        </div>

        {userRole === 'compliance' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.85rem',
            borderRadius: '8px',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#6ee7b7',
            fontSize: '0.85rem'
          }}>
            <CheckCircle2 size={16} />
            <span>Audit Trail Mode Active (SHA-256 Verified)</span>
          </div>
        )}

        {userRole === 'external_partner' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.85rem',
            borderRadius: '8px',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#fcd34d',
            fontSize: '0.85rem'
          }}>
            <Lock size={16} />
            <span>Sensitive Host Fleet Telemetry Redacted</span>
          </div>
        )}
      </div>

      <div style={{
        marginTop: '0.85rem',
        paddingTop: '0.75rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        fontSize: '0.85rem',
        color: '#94a3b8',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <AlertCircle size={15} color={current.color} style={{ flexShrink: 0 }} />
        <span>{current.workflowNote}</span>
      </div>
    </div>
  );
}
