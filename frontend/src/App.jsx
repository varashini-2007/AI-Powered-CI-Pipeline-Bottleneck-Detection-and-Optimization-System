import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import SummaryCards from './components/SummaryCards';
import ChartsSection from './components/ChartsSection';
import BottleneckTable from './components/BottleneckTable';
import RecommendationDetailModal from './components/RecommendationDetailModal';
import MLPredictorView from './components/MLPredictorView';
import MLValidationView from './components/MLValidationView';
import EdgeCasesShowcase from './components/EdgeCasesShowcase';
import {
  fetchHealth,
  fetchDashboardSummary,
  fetchBuilds,
  fetchBottlenecks,
  fetchRecommendations,
  fetchRecommendationById
} from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [healthStatus, setHealthStatus] = useState('checking');
  
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
        const buildsData = await fetchBuilds(100, 0);
        setBuilds(buildsData);

        // Fetch real detected bottlenecks
        const bottlenecksData = await fetchBottlenecks(100, 0);
        setBottlenecks(bottlenecksData);

        // Fetch recommendations
        const recsData = await fetchRecommendations(100, 0);
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

  // When a bottleneck row is selected, locate or fetch its corresponding recommendation details
  const handleSelectBottleneck = async (bottleneck) => {
    // Check if matching recommendation exists in preloaded recommendations
    const matching = recommendations.find(
      (r) => r.build_id === bottleneck.build_id && r.problem === bottleneck.problem
    );

    if (matching) {
      setSelectedRecommendation(matching);
    } else {
      // Create detailed view object directly from bottleneck
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

      {/* Tab 1: Overview & Telemetry */}
      {activeTab === 'overview' && (
        <>
          <SummaryCards summary={summary} />
          <ChartsSection builds={builds} />
          <BottleneckTable
            bottlenecks={bottlenecks}
            onSelectBottleneck={handleSelectBottleneck}
          />
        </>
      )}

      {/* Tab 2: Bottlenecks & Fixes */}
      {activeTab === 'bottlenecks' && (
        <BottleneckTable
          bottlenecks={bottlenecks}
          onSelectBottleneck={handleSelectBottleneck}
        />
      )}

      {/* Tab 3: Live ML Prediction */}
      {activeTab === 'prediction' && <MLPredictorView />}

      {/* Tab 4: ML Model Validation & Error Analysis */}
      {activeTab === 'validation' && <MLValidationView />}

      {/* Tab 5: Three Edge Cases Verification */}
      {activeTab === 'edge-cases' && <EdgeCasesShowcase />}

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
