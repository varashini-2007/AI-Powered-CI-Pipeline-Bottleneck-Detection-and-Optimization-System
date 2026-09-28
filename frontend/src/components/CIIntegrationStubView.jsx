import React, { useState } from 'react';
import { Send, CheckCircle2, ShieldCheck, Terminal, Cpu, Database, AlertTriangle, FileCode } from 'lucide-react';
import { sendCIWebhook } from '../services/api';

export default function CIIntegrationStubView() {
  const presets = [
    {
      id: 'github_queue',
      title: 'GitHub Actions: Peak Queue Starvation (Org_A)',
      provider: 'github_actions',
      org: 'Org_A',
      repo: 'retail-banking/payments-api',
      payload: {
        event_type: "workflow_job_completed",
        provider: "github_actions",
        repository: "retail-banking/payments-api",
        organization_id: "Org_A",
        build_id: "BUILD-GH-8812",
        branch: "main",
        author: "sarah.jenkins@enterprise-bank.internal",
        queue_time_seconds: 440.0,
        build_duration_seconds: 980.0,
        agent_utilisation_percent: 0.94,
        tasks: [
          { name: "setup_dependencies", duration_seconds: 180.0, cache_hit: true, parallelisable: false },
          { name: "unit_tests", duration_seconds: 220.0, cache_hit: true, parallelisable: true },
          { name: "security_sast_scan", duration_seconds: 210.0, cache_hit: true, parallelisable: true },
          { name: "integration_tests", duration_seconds: 370.0, cache_hit: false, parallelisable: false }
        ],
        raw_logs: "2026-09-28T14:02:10Z [INFO] Waiting for available self-hosted runner in pool 'banking-core-runners'...\n2026-09-28T14:09:30Z [WARN] Waited 440s before runner assignment.\n2026-09-28T14:15:00Z [INFO] Host runner CPU utilization reached 94.2%."
      }
    },
    {
      id: 'gitlab_cache',
      title: 'GitLab CI: Cache Invalidation Churn (Org_B)',
      provider: 'gitlab_ci',
      org: 'Org_B',
      repo: 'healthcare-claims/claims-processor',
      payload: {
        event_type: "pipeline_completed",
        provider: "gitlab_ci",
        repository: "healthcare-claims/claims-processor",
        organization_id: "Org_B",
        build_id: "BUILD-GL-4491",
        branch: "feature/hipaa-claim-v2",
        author: "marcus.vance@health-claims.internal",
        queue_time_seconds: 45.0,
        build_duration_seconds: 860.0,
        agent_utilisation_percent: 0.72,
        tasks: [
          { name: "fetch_mvn_dependencies", duration_seconds: 340.0, cache_hit: false, parallelisable: false },
          { name: "compile_classes", duration_seconds: 210.0, cache_hit: false, parallelisable: false },
          { name: "hipaa_compliance_tests", duration_seconds: 190.0, cache_hit: true, parallelisable: true },
          { name: "package_docker_image", duration_seconds: 120.0, cache_hit: false, parallelisable: false }
        ],
        raw_logs: "2026-09-28T14:20:00Z [INFO] Restoring cache key 'mvn-deps-v1-hash'...\n2026-09-28T14:20:12Z [WARN] Cache MISS for key 'mvn-deps-v1-hash'. Rebuilding 450MB dependency repository from remote repository.\n2026-09-28T14:25:52Z [INFO] Maven download finished in 340.0s."
      }
    },
    {
      id: 'sequential_monolith',
      title: 'Enterprise Monolith: Sequential Tasks Bottleneck (Org_C)',
      provider: 'jenkins_pipeline',
      org: 'Org_C',
      repo: 'aviation-logistics/flight-telemetry',
      payload: {
        event_type: "build_finished",
        provider: "jenkins_pipeline",
        repository: "aviation-logistics/flight-telemetry",
        organization_id: "Org_C",
        build_id: "BUILD-JK-3022",
        branch: "develop",
        author: "elena.rostova@partner-gateway.internal",
        queue_time_seconds: 35.0,
        build_duration_seconds: 1120.0,
        agent_utilisation_percent: 0.65,
        tasks: [
          { name: "install_python_wheels", duration_seconds: 60.0, cache_hit: true, parallelisable: false },
          { name: "unit_tests_telemetry", duration_seconds: 280.0, cache_hit: true, parallelisable: true },
          { name: "integration_tests_radar", duration_seconds: 310.0, cache_hit: true, parallelisable: true },
          { name: "static_analysis_flighthub", duration_seconds: 240.0, cache_hit: true, parallelisable: true },
          { name: "contract_testing_gateway", duration_seconds: 230.0, cache_hit: true, parallelisable: true }
        ],
        raw_logs: "2026-09-28T14:35:00Z [INFO] Running stage 'Unit Tests' sequentially on agent-pool-aviation...\n2026-09-28T14:39:40Z [INFO] Stage finished in 280s. Starting stage 'Integration Tests' sequentially...\n2026-09-28T14:44:50Z [INFO] Stage finished in 310s. Starting stage 'Static Analysis' sequentially..."
      }
    }
  ];

  const [selectedPreset, setSelectedPreset] = useState(presets[0]);
  const [jsonInput, setJsonInput] = useState(JSON.stringify(presets[0].payload, null, 2));
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const handlePresetChange = (preset) => {
    setSelectedPreset(preset);
    setJsonInput(JSON.stringify(preset.payload, null, 2));
    setResponse(null);
    setError(null);
  };

  const handleSendWebhook = async () => {
    try {
      setLoading(true);
      setError(null);
      const parsed = JSON.parse(jsonInput);
      const res = await sendCIWebhook(parsed);
      setResponse(res);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Invalid JSON format or network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ci-integration-view" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Overview Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '12px',
        padding: '1.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <Terminal size={24} color="#60a5fa" />
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc' }}>
            CI/CD Webhook &amp; Log Ingestion Stub Playground
          </h2>
        </div>
        <p style={{ color: '#cbd5e1', lineHeight: '1.6', margin: 0, fontSize: '0.95rem' }}>
          Test the automated CI integration stub. Ingest real-time JSON webhooks and log telemetry from GitHub Actions, GitLab CI, or Jenkins pipelines. The engine parses task timings, cache hit/miss status, queue delay, and host CPU/memory, executes detection rules, and outputs <strong>plain-language recommendations with a cryptographic SHA-256 evidence integrity hash</strong> for regulated enterprise change governance.
        </p>
      </div>

      {/* Preset Selector */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => handlePresetChange(p)}
            style={{
              flex: '1 1 260px',
              padding: '1rem',
              borderRadius: '10px',
              border: selectedPreset.id === p.id ? '2px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.1)',
              background: selectedPreset.id === p.id ? 'rgba(59, 130, 246, 0.15)' : 'rgba(30, 41, 59, 0.5)',
              color: '#f8fafc',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ fontSize: '0.8rem', color: selectedPreset.id === p.id ? '#93c5fd' : '#94a3b8', fontWeight: 600 }}>
              {p.provider.toUpperCase()} • {p.org}
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.25rem' }}>
              {p.title}
            </div>
          </button>
        ))}
      </div>

      {/* Editor & Response Split View */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '1.5rem' }}>
        {/* Editor Box */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#94a3b8' }}>
              POST /api/ci/webhook (JSON Ingestion Body)
            </span>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Editable Payload</span>
          </div>

          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            rows={18}
            style={{
              width: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              color: '#38bdf8',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              resize: 'vertical',
              lineHeight: '1.4'
            }}
          />

          {error && (
            <div style={{ color: '#f87171', fontSize: '0.85rem', marginTop: '0.75rem' }}>
              Error: {error}
            </div>
          )}

          <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleSendWebhook}
              disabled={loading}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                borderRadius: '8px',
                cursor: loading ? 'wait' : 'pointer'
              }}
            >
              <Send size={16} />
              {loading ? 'Ingesting & Analyzing...' : 'Simulate CI Webhook Ingestion'}
            </button>
          </div>
        </div>

        {/* Live Analysis Output Box */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#94a3b8' }}>
              Analysis Output &amp; Compliance Audit Evidence
            </span>
            {response && (
              <span style={{
                background: response.compliance_status === 'COMPLIANT_PASS' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: response.compliance_status === 'COMPLIANT_PASS' ? '#34d399' : '#f87171',
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 700
              }}>
                {response.compliance_status}
              </span>
            )}
          </div>

          {!response ? (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              padding: '3rem 1rem',
              textAlign: 'center'
            }}>
              <Terminal size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p style={{ margin: 0, fontSize: '0.95rem' }}>
                Click 'Simulate CI Webhook Ingestion' to evaluate this pipeline run.
              </p>
              <span style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                Rules engine will parse telemetry, check thresholds, and emit SHA-256 evidence.
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Audit Header Banner */}
              <div style={{
                background: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '1rem',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', marginBottom: '0.25rem' }}>
                  <ShieldCheck size={18} />
                  <strong style={{ fontSize: '0.9rem' }}>Cryptographic Evidence Audit Record</strong>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', wordBreak: 'break-all' }}>
                  <strong>SHA-256:</strong> <code style={{ color: '#38bdf8' }}>{response.evidence_sha256_hash}</code>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                  Audited Under: {response.compliance_audit_record?.regulatory_frameworks?.join(' • ')}
                </div>
              </div>

              {/* Detected Bottlenecks */}
              <div>
                <h4 style={{ fontSize: '0.9rem', color: '#f8fafc', margin: '0 0 0.5rem' }}>
                  Detected Bottlenecks ({response.detected_bottlenecks?.length})
                </h4>
                {response.detected_bottlenecks?.map((b, idx) => (
                  <div key={idx} style={{
                    background: 'rgba(30, 41, 59, 0.4)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: '#fca5a5', fontSize: '0.85rem' }}>{b.problem}</span>
                      <span style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 700 }}>{b.severity}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '0.25rem' }}>
                      Observed: {b.observed_value} vs Threshold: {b.threshold}
                    </div>
                  </div>
                ))}
              </div>

              {/* Plain-Language Recommendations */}
              <div>
                <h4 style={{ fontSize: '0.9rem', color: '#f8fafc', margin: '0 0 0.5rem' }}>
                  Plain-Language Explainability Cards
                </h4>
                {response.recommendations?.map((r, idx) => (
                  <div key={idx} style={{
                    background: 'rgba(30, 41, 59, 0.4)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    padding: '0.85rem',
                    borderRadius: '6px',
                    marginBottom: '0.5rem',
                    fontSize: '0.82rem',
                    lineHeight: '1.4'
                  }}>
                    <div style={{ color: '#93c5fd', fontWeight: 600, marginBottom: '0.25rem' }}>
                      {r.recommendation}
                    </div>
                    <div style={{ color: '#cbd5e1' }}>
                      <strong>What Happened:</strong> {r.explanation?.what_happened}
                    </div>
                    <div style={{ color: '#cbd5e1', marginTop: '0.25rem' }}>
                      <strong>Why It Matters:</strong> {r.explanation?.why_it_matters}
                    </div>
                    <div style={{ color: '#cbd5e1', marginTop: '0.25rem' }}>
                      <strong>What To Do:</strong> {r.explanation?.what_to_do}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
