import React, { useState, useEffect } from 'react';

/**
 * CI Insight Enterprise Dashboard
 * Provides telemetry views, organisation isolation, and role-based access toggle.
 */
export function Dashboard() {
  const [health, setHealth] = useState(null);
  const [organisations, setOrganisations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState('ALL');
  const [builds, setBuilds] = useState([]);
  const [totalBuilds, setTotalBuilds] = useState(0);
  const [selectedBuild, setSelectedBuild] = useState(null);
  const [currentRole, setCurrentRole] = useState('Engineering Manager');
  const [loading, setLoading] = useState(true);

  const API_BASE = 'http://127.0.0.1:8000';

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then(res => res.json())
      .then(data => setHealth(data))
      .catch(err => console.error('Health check error:', err));

    fetch(`${API_BASE}/organisations`)
      .then(res => res.json())
      .then(data => setOrganisations(data))
      .catch(err => console.error('Orgs error:', err));
  }, []);

  useEffect(() => {
    setLoading(true);
    const orgQuery = selectedOrg !== 'ALL' ? `?organisation_id=${selectedOrg}&limit=20` : '?limit=20';
    fetch(`${API_BASE}/builds${orgQuery}`, {
      headers: { 'X-User-Role': currentRole, 'X-User-Org': selectedOrg !== 'ALL' ? selectedOrg : '' }
    })
      .then(res => res.json())
      .then(data => {
        setBuilds(data.builds || []);
        setTotalBuilds(data.total || 0);
        setLoading(false);
      })
      .catch(err => {
        console.error('Builds error:', err);
        setLoading(false);
      });
  }, [selectedOrg, currentRole]);

  const loadBuildDetails = (buildId) => {
    fetch(`${API_BASE}/builds/${buildId}`)
      .then(res => res.json())
      .then(data => setSelectedBuild(data))
      .catch(err => console.error('Detail error:', err));
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1e293b' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>CI Insight: Bottleneck Analyser</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>Regulated Enterprise Pipeline Telemetry & Performance Governance</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', marginRight: '8px' }}>Active Role:</label>
            <select value={currentRole} onChange={e => setCurrentRole(e.target.value)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <option value="Developer">Developer</option>
              <option value="Engineering Manager">Engineering Manager</option>
              <option value="Compliance Reviewer">Compliance Reviewer</option>
              <option value="External Partner">External Partner</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', background: '#f1f5f9', padding: '6px 12px', borderRadius: '16px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: health?.status === 'healthy' ? '#10b981' : '#ef4444' }} />
            <span>{health?.service || 'Connecting...'}</span>
          </div>
        </div>
      </header>

      {/* Organisation Cards */}
      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>Organisations & Fleet Overview</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {organisations.map(org => (
            <div
              key={org.organisation_id}
              onClick={() => setSelectedOrg(selectedOrg === org.organisation_id ? 'ALL' : org.organisation_id)}
              style={{
                border: selectedOrg === org.organisation_id ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '16px',
                cursor: 'pointer',
                backgroundColor: selectedOrg === org.organisation_id ? '#eff6ff' : '#ffffff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{org.organisation_id}</span>
                <span style={{ fontSize: '13px', color: '#059669', fontWeight: '600' }}>{org.success_rate_percent}% Success</span>
              </div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                <div>Total Builds: <strong>{org.total_builds}</strong></div>
                <div>Avg Duration: <strong>{org.avg_duration_seconds}s</strong></div>
                <div>Avg Queue: <strong>{org.avg_queue_time_seconds}s</strong></div>
                <div>Projects: {org.projects.join(', ')}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Builds Table */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '18px', margin: 0 }}>Recent Builds ({totalBuilds} total)</h2>
          {selectedOrg !== 'ALL' && (
            <button onClick={() => setSelectedOrg('ALL')} style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer' }}>
              Clear Filter ({selectedOrg})
            </button>
          )}
        </div>

        {loading ? (
          <p>Loading telemetry...</p>
        ) : (
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
              <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '12px' }}>Build ID</th>
                  <th style={{ padding: '12px' }}>Org</th>
                  <th style={{ padding: '12px' }}>Project</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px' }}>Duration</th>
                  <th style={{ padding: '12px' }}>Queue</th>
                  <th style={{ padding: '12px' }}>Agent</th>
                  <th style={{ padding: '12px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {builds.map(b => (
                  <tr key={b.build_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 'bold' }}>{b.build_id}</td>
                    <td style={{ padding: '12px' }}>{b.organisation_id}</td>
                    <td style={{ padding: '12px' }}>{b.project_id}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                        backgroundColor: b.build_status === 'SUCCESS' ? '#dcfce7' : '#fee2e2',
                        color: b.build_status === 'SUCCESS' ? '#166534' : '#991b1b'
                      }}>
                        {b.build_status}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>{b.total_duration_seconds}s</td>
                    <td style={{ padding: '12px' }}>{b.queue_time_seconds}s</td>
                    <td style={{ padding: '12px', color: '#64748b' }}>{b.agent_id}</td>
                    <td style={{ padding: '12px' }}>
                      <button onClick={() => loadBuildDetails(b.build_id)} style={{ padding: '4px 10px', fontSize: '12px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Build Details Modal */}
      {selectedBuild && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '700px', width: '90%', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>Build Telemetry: {selectedBuild.build.build_id}</h3>
              <button onClick={() => setSelectedBuild(null)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', fontSize: '13px' }}>
              <div>Org: <strong>{selectedBuild.build.organisation_id}</strong></div>
              <div>Project: <strong>{selectedBuild.build.project_id}</strong></div>
              <div>Duration: <strong>{selectedBuild.build.total_duration_seconds}s</strong></div>
              <div>Queue: <strong>{selectedBuild.build.queue_time_seconds}s</strong></div>
              <div>Bottleneck Label: <strong>{selectedBuild.ground_truth?.actual_bottleneck}</strong></div>
              <div>Severity: <strong>{selectedBuild.ground_truth?.severity}</strong></div>
            </div>

            <h4 style={{ fontSize: '15px', marginBottom: '8px' }}>Task Breakdown ({selectedBuild.tasks.length} tasks)</h4>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden', marginBottom: '16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead style={{ backgroundColor: '#f8fafc' }}>
                  <tr>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Task</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Group</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Duration</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Parallelisable</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBuild.tasks.map((t, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px' }}>{t.task_name}</td>
                      <td style={{ padding: '8px', color: '#64748b' }}>{t.dependency_group}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>{t.duration_seconds}s</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>{t.parallelisable ? '✓ Yes' : '✗ No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedBuild.agent_utilisation && (
              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', fontSize: '13px' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '14px' }}>Agent Host Saturation</h4>
                <div>Host: {selectedBuild.agent_utilisation.agent_id} | CPU: {selectedBuild.agent_utilisation.cpu_utilisation}% | Mem: {selectedBuild.agent_utilisation.memory_utilisation}% | Busy: {selectedBuild.agent_utilisation.busy_percentage}%</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
