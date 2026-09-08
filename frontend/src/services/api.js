/**
 * API Service for CI Bottleneck Analyser.
 * Interacts with FastAPI backend endpoints.
 */
const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Failed to fetch API health');
  return res.json();
}

export async function fetchDashboardSummary() {
  const res = await fetch(`${API_BASE}/dashboard/summary`);
  if (!res.ok) throw new Error('Failed to fetch dashboard summary');
  return res.json();
}

export async function fetchBuilds(limit = 100, offset = 0, severity = '') {
  let url = `${API_BASE}/builds?limit=${limit}&offset=${offset}`;
  if (severity) url += `&severity=${severity}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch builds');
  return res.json();
}

export async function fetchBuildById(buildId) {
  const res = await fetch(`${API_BASE}/builds/${buildId}`);
  if (!res.ok) throw new Error(`Failed to fetch build ${buildId}`);
  return res.json();
}

export async function analyseBuild(buildId) {
  const res = await fetch(`${API_BASE}/analyse/${buildId}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error(`Failed to run analysis for build ${buildId}`);
  return res.json();
}

export async function fetchBottlenecks(limit = 100, offset = 0, severity = '') {
  let url = `${API_BASE}/bottlenecks?limit=${limit}&offset=${offset}`;
  if (severity) url += `&severity=${severity}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch bottlenecks');
  return res.json();
}

export async function fetchRecommendations(limit = 100, offset = 0, severity = '') {
  let url = `${API_BASE}/recommendations?limit=${limit}&offset=${offset}`;
  if (severity) url += `&severity=${severity}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch recommendations');
  return res.json();
}

export async function fetchRecommendationById(id) {
  const res = await fetch(`${API_BASE}/recommendations/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch recommendation ${id}`);
  return res.json();
}

export async function predictML(features) {
  const res = await fetch(`${API_BASE}/ml/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(features)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'ML Prediction failed');
  }
  return res.json();
}

export async function fetchMLMetrics() {
  const res = await fetch(`${API_BASE}/ml/metrics`);
  if (!res.ok) throw new Error('Failed to fetch ML metrics');
  return res.json();
}
