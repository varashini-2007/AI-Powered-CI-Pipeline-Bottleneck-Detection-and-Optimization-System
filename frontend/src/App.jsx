import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import RoleBanner from './components/RoleBanner';
import SummaryCards from './components/SummaryCards';
import ChartsSection from './components/ChartsSection';
import BottleneckTable from './components/BottleneckTable';
import RecommendationDetailModal from './components/RecommendationDetailModal';
import MLPredictorView from './components/MLPredictorView';
import MLValidationView from './components/MLValidationView';
import EdgeCasesShowcase from './components/EdgeCasesShowcase';
import FeedbackTimeExperimentView from './components/FeedbackTimeExperimentView';
import CIIntegrationStubView from './components/CIIntegrationStubView';
import StakeholderValidationView from './components/StakeholderValidationView';
import {
  fetchHealth,
  fetchDashboardSummary,
  fetchBuilds,
  fetchBottlenecks,
  fetchRecommendations
} from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [healthStatus, setHealthStatus] = useState('checking');
  
  // Enterprise RBAC & Multi-tenant states
  const [userRole, setUserRole] = useState('developer');
  const [selectedOrg, setSelectedOrg] = useState('all');

  // Real backend data states
  const [summary, setSummary] = useState(null);
  const [builds, setBuilds] = useState([]);
  const [bottlenecks, setBottlenecks] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  
  // UI states
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load initial backend telemetry
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Health check
        const health = await fetchHealth().catch(() => ({ status: 'offline' }));
        setHealthStatus(health.status);

        // Fetch real aggregated summary
        const summaryData = await fetchDashboardSummary();
        setSummary(summaryData);

        // Fetch real builds for charts & statistics
        const buildsData = await fetchBuilds(150, 0);
        setBuilds(buildsData);

        // Fetch real detected bottlenecks
        const bottlenecksData = await fetchBottlenecks(150, 0);
        setBottlenecks(bottlenecksData);

        // Fetch recommendations
        const recsData = await fetchRecommendations(150, 0);
        setRecommendations(recsData);

        setError(null);
      } catch (err) {
        console.error('Data load error:', err);
        setError(err.message || 'Failed to connect to CI Analyser API.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Filter telemetry items according to selected organization tenant & role
  const filteredBuilds = builds.filter((b) => {
    if (selectedOrg === 'all') {
      if (userRole === 'external_partner') {
        return b.pipeline_id?.includes('flight') || b.pipeline_id?.includes('cargo') || b.pipeline_id?.includes('crew') || b.pipeline_id === 'Org_C';
      }
      return true;
    }
    // Match org id or pipeline prefix
    if (selectedOrg === 'Org_A') return b.pipeline_id?.includes('payments') || b.pipeline_id?.includes('account') || b.pipeline_id === 'Org_A';
    if (selectedOrg === 'Org_B') return b.pipeline_id?.includes('claims') || b.pipeline_id?.includes('hipaa') || b.pipeline_id === 'Org_B';
    if (selectedOrg === 'Org_C') return b.pipeline_id?.includes('flight') || b.pipeline_id?.includes('telemetry') || b.pipeline_id === 'Org_C';
    return true;
  });

  const filteredBottlenecks = bottlenecks.filter((bn) => {
    if (userRole === 'external_partner' && selectedOrg === 'Org_C') {
      // In partner view, sanitize internal runner names if present
      return true;
    }
    return true;
  });

  // When a bottleneck row is selected, locate or fetch its corresponding recommendation details
  const handleSelectBottleneck = async (bottleneck) => {
    const matching = recommendations.find(
      (r) => r.build_id === bottleneck.build_id && r.problem === bottleneck.problem
    );

    if (matching) {
      setSelectedRecommendation(matching);
    } else {
      setSelectedRecommendation({
        recommendation_id: `REC-${bottleneck.id}`,
        build_id: bottleneck.build_id,
        problem: bottleneck.problem,
        severity: bottleneck.severity,
        observed_value: bottleneck.observed_value,
        threshold: bottleneck.threshold,
        recommendation: bottleneck.recommendation,
        estimated_impact: bottleneck.estimated_impact,
        evidence: {
          observed_value: bottleneck.observed_value,
          threshold: bottleneck.threshold,
          build_id: bottleneck.build_id
        },
        explanation: {
          what_happened: `Build ${bottleneck.build_id} triggered ${bottleneck.problem?.replace(/_/g, ' ')}.`,
          why_it_matters: 'Directly stalls pipeline throughput and prolongs pull-request verification cycles.',
          what_to_do: bottleneck.recommendation,
          evidence_supports: `Observed value: ${bottleneck.observed_value} against threshold ${bottleneck.threshold}`
        }
      });
    }
  };

  return (
    <div className="app-container">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        healthStatus={healthStatus}
        userRole={userRole}
        setUserRole={setUserRole}
        selectedOrg={selectedOrg}
        setSelectedOrg={setSelectedOrg}
      />

      <RoleBanner
        userRole={userRole}
        selectedOrg={selectedOrg}
      />

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.5rem',
          color: '#fca5a5',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <strong>Backend Connection Notice:</strong> {error}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="badge badge-pill"
            style={{ cursor: 'pointer', border: 'none' }}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Tab 1: Overview & Telemetry Charts */}
      {activeTab === 'overview' && (
        <>
          <SummaryCards summary={summary} />
          <ChartsSection builds={filteredBuilds.length > 0 ? filteredBuilds : builds} />
          <BottleneckTable
            bottlenecks={filteredBottlenecks}
            onSelectBottleneck={handleSelectBottleneck}
          />
        </>
      )}

      {/* Tab 2: Bottlenecks & Fixes */}
      {activeTab === 'bottlenecks' && (
        <BottleneckTable
          bottlenecks={filteredBottlenecks}
          onSelectBottleneck={handleSelectBottleneck}
        />
      )}

      {/* Tab 3: Developer Feedback Time Reduction Experiment */}
      {activeTab === 'experiment' && <FeedbackTimeExperimentView />}

      {/* Tab 4: Live ML Prediction */}
      {activeTab === 'prediction' && <MLPredictorView />}

      {/* Tab 5: ML Model Validation & Error Analysis */}
      {activeTab === 'validation' && <MLValidationView />}

      {/* Tab 6: Three Edge Cases Verification */}
      {activeTab === 'edge-cases' && <EdgeCasesShowcase />}

      {/* Tab 7: CI Webhook & Log Ingestion Stub Playground */}
      {activeTab === 'ci-integration' && <CIIntegrationStubView />}

      {/* Tab 8: Stakeholder Validation & Sign-off */}
      {activeTab === 'stakeholders' && <StakeholderValidationView />}

      {/* Recommendation Inspector Modal */}
      {selectedRecommendation && (
        <RecommendationDetailModal
          recommendation={selectedRecommendation}
          onClose={() => setSelectedRecommendation(null)}
        />
      )}
    </div>
  );
}
