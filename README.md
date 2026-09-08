<<<<<<< HEAD
# AI-Powered-CI-Pipeline-Bottleneck-Detection-and-Optimization-System
AI-powered system that analyzes CI pipelines, detects build bottlenecks using rules and machine learning, and provides evidence-based recommendations to reduce build time and improve feedback.
=======
# CI Insight: Intelligent CI Bottleneck Analyser for Regulated Enterprises

An intelligent telemetry analysis and machine learning platform designed to diagnose software continuous integration (CI) pipelines, identify execution bottlenecks, and recommend actionable speed optimizations with plain-language explainability for regulated enterprises.

---

## 1. Problem Statement

In modern regulated software engineering organisations (such as Banking, Healthcare, and Aerospace), continuous integration (CI) pipelines frequently suffer from gradual performance degradation. Feedback cycles can extend from a few minutes to 30–60+ minutes.

When CI feedback is slow:
- Developers lose focus and context-switch away from their active development flow.
- Merge frequency drops, causing larger, riskier code integration batches.
- Expensive dedicated compute agents remain tied up, escalating infrastructure costs.
- Non-specialist compliance reviewers and engineering managers lack visibility into whether delays stem from queue starvation, un-cached dependencies, or inefficient sequential task configurations.

The central question CI Insight answers is:
> **"What is making this CI pipeline slow, and what concrete, evidence-based steps will improve it?"**

---

## 2. Objective

The objective of CI Insight is to build an automated, evidence-backed diagnostic engine that:
1. Ingests and aggregates granular pipeline telemetry (builds, task timings, cache events, and host agent saturation).
2. Distinguishes between healthy builds and distinct bottleneck archetypes (Queue Congestion, Cache Inefficiencies, Slow Outlier Tasks, Agent Saturation, and Parallelisation Deficits).
3. Produces actionable recommendations structured around non-specialist explainability (*What happened, Why it matters, What should be done, Supporting empirical evidence*).
4. Supports multi-organisation tenant isolation and role-based access control (RBAC) across five enterprise personas.

> **Current Foundation Phase Scope:**  
> This release establishes the robust foundation: reproducible synthetic telemetry generation (1,200 builds across 3 organisations), SQLite ingestion layer, modular analyzer and recommendation foundations, role permission definitions, automated validation suites, and FastAPI REST endpoints.

---

## 3. Technology Stack

- **Backend Framework**: Python 3.10+ with [FastAPI](https://fastapi.tiangolo.com/) (high-performance asynchronous REST API)
- **Data Engineering**: [Pandas](https://pandas.pydata.org/) & [NumPy](https://numpy.org/) for reproducible telemetry generation and statistical aggregations
- **Database**: SQLite (`ci_insight.db`) for indexed relational storage and cross-table telemetry joins
- **Data Validation & Typing**: [Pydantic v2](https://docs.pydantic.dev/) for strict schema definitions and role contexts
- **Testing**: [Pytest](https://docs.pytest.org/) with FastAPI TestClient for automated endpoint and dataset verification
- **Frontend Architecture**: React dashboard structure with modular views and role-based UI toggle
- **Server Runner**: [Uvicorn](https://www.uvicorn.org/) ASGI server

---

## 4. Folder Structure

```text
ci-bottleneck-analyser/
│
├── backend/
│   ├── main.py              # FastAPI application & REST endpoints (/health, /organisations, /builds)
│   ├── models.py            # Pydantic v2 data models and enterprise role RBAC foundation
│   ├── database.py          # SQLite database connection, indexing, and CSV ingestion
│   ├── analyzer.py          # Foundation modular structure for CI bottleneck detection
│   ├── recommendations.py   # Foundation modular structure for advisory recommendations
│   ├── generate_dataset.py  # 1,200-build synthetic telemetry generator across Org_A, Org_B, Org_C
│   └── requirements.txt     # Python backend dependencies
│
├── frontend/
│   └── dashboard/           # Clean React dashboard structure & telemetry views
│
├── data/
│   ├── builds.csv           # 1,200 builds with total duration, queue time, and agent allocation
│   ├── task_timings.csv     # 7,200+ task records across 7 CI execution categories
│   ├── cache_events.csv     # 4,100+ HIT / MISS cache event records with cache keys
│   ├── agent_utilisation.csv# CPU, Memory, and Agent saturation metrics
│   └── ground_truth.csv     # Bottleneck archetype ground truth and severity labels
│
├── experiments/
│   └── baseline_eda.py      # Baseline telemetry exploration and statistical summary
│
├── tests/
│   ├── test_api.py          # Unit & integration tests for all REST endpoints & 404 handling
│   └── test_dataset.py      # Validation tests for schemas, row counts, and data distributions
│
├── docs/
│   ├── requirements.md      # Functional (FR-1..FR-10) and Non-Functional (NFR-1..NFR-6) requirements
│   └── limitations.md      # Operational limitations and enterprise scope boundaries
│
└── README.md                # Comprehensive project documentation
```

---

## 5. Dataset Description

The system includes a reproducible synthetic dataset generating **1,200 build records** distributed across **3 enterprise organisations**:
- **Org_A (Global Retail Banking)**: 466 builds across 4 core banking services. Primary simulated vulnerability: *Queue Congestion* due to agent fleet constraints during peak trading windows.
- **Org_B (Healthcare Claims Network)**: 407 builds across 4 HIPAA-compliant services. Primary simulated vulnerability: *Cache Problems* caused by large dependency trees and frequent cache key invalidation.
- **Org_C (Aviation Logistics Platform)**: 327 builds across 3 mission-critical telemetry services. Primary simulated vulnerability: *Parallelisation Problems* caused by legacy monolithic sequential pipeline scripts.

### Telemetry Tables (`data/`)

1. **`builds.csv`** (1,200 rows):
   - `build_id`, `organisation_id`, `project_id`, `build_status`, `start_time`, `end_time`, `total_duration_seconds`, `queue_time_seconds`, `agent_id`.
2. **`task_timings.csv`** (7,226 rows):
   - `build_id`, `task_name` (chosen from: `dependency_install`, `compile`, `unit_tests`, `integration_tests`, `security_scan`, `package_build`, `deployment_validation`), `duration_seconds`, `dependency_group`, `parallelisable`.
3. **`cache_events.csv`** (4,146 rows):
   - `build_id`, `task_name`, `cache_status` (`HIT` or `MISS`), `cache_key`.
4. **`agent_utilisation.csv`** (1,200 rows):
   - `build_id`, `agent_id`, `cpu_utilisation`, `memory_utilisation`, `busy_percentage`, `available_agents`.
5. **`ground_truth.csv`** (1,200 rows):
   - `build_id`, `actual_bottleneck` (`NORMAL`, `CACHE_PROBLEM`, `PARALLELISATION_PROBLEM`, `QUEUE_CONGESTION`, `SLOW_TASK`, `RESOURCE_BOTTLENECK`), `severity` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).

---

## 6. How to Generate the Dataset

To re-generate or refresh the synthetic dataset with the deterministic random seed (`seed=42`):

```powershell
python backend/generate_dataset.py
```

Output:
```text
[OK] Generated 1200 builds in data/builds.csv
[OK] Generated 7226 task timings in data/task_timings.csv
[OK] Generated 4146 cache events in data/cache_events.csv
[OK] Generated 1200 agent records in data/agent_utilisation.csv
[OK] Generated 1200 ground truth records in data/ground_truth.csv
```

To run the exploratory baseline statistical analysis:
```powershell
python experiments/baseline_eda.py
```

---

## 7. How to Run the Backend

### 9. GitHub 25MB Folder Limit & Rejoin Instructions

To comply with GitHub's **25 MB per-folder web upload limit**, all project folders are strictly sized under 25 MB without deleting any code or dependency files. The large `frontend/node_modules` directory has been split into 4 modular folders:
- `frontend_part1_lucide` (21.57 MB)
- `frontend_part2_build_tools` (20.88 MB)
- `frontend_part3_bundler_charts` (21.13 MB)
- `frontend_part4_core_deps` (9.28 MB)
- `frontend` (0.50 MB)
- `backend` (2.75 MB)
- `data` (2.91 MB)
- `models` (1.72 MB)

### To Restore/Rejoin frontend on any machine:
Run the one-click restore script:
```powershell
python rejoin_frontend.py
```
This recombines the 4 parts into `frontend/node_modules` in 2 seconds so you can immediately run `npm run dev`.

### To Re-split before uploading to GitHub:
```powershell
python split_frontend.py
```

### To Verify All Folder Sizes:
```powershell
python check_sizes.py
```

---

## 10. Installation & Running Instructions
```powershell
pip install -r backend/requirements.txt
```

### 2. Start the FastAPI Server
```powershell
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

Once started:
- **Interactive Swagger Documentation**: `http://127.0.0.1:8000/docs`
- **Alternative ReDoc Documentation**: `http://127.0.0.1:8000/redoc`
- **Service Health Check**: `http://127.0.0.1:8000/health`

### 3. Verify API Endpoints

#### Check System Health
```powershell
curl -s http://127.0.0.1:8000/health
```
Expected response:
```json
{
  "status": "healthy",
  "service": "CI Bottleneck Analyser"
}
```

#### List Organisations & Summary Metrics
```powershell
curl -s http://127.0.0.1:8000/organisations
```

#### Query Filtered Builds (e.g. Org_A, page limit 5)
```powershell
curl -s "http://127.0.0.1:8000/builds?organisation_id=Org_A&limit=5"
```

#### Inspect Specific Build Detail
```powershell
curl -s http://127.0.0.1:8000/builds/BUILD-0001
```

#### Verify 404 Error Handling on Missing Build
```powershell
curl -s -i http://127.0.0.1:8000/builds/BUILD-INVALID-999
```
Returns HTTP `404 Not Found` with a descriptive JSON error payload.

---

## 8. Running Automated Tests

Execute the comprehensive Pytest suite:
```powershell
python -m pytest tests -v
```

All 13 automated tests validate:
- Exact `/health` response schema
- Multi-organisation telemetry and project listings
- Build pagination and filter queries
- Build detail composition across tasks, cache, and agent metrics
- 404 error handling for missing build IDs
- CSV file completeness, record counts (>= 1,000), schema constraints, and realistic bottleneck distributions

---

## 9. Future Development Phases

1. **Phase 2 — Rule-Based Bottleneck Detection Engine**:
   - Calibrated detection heuristics for queue starvation (>300s), cache degradation (<50%), P90 slow tasks, and agent host saturation (>85%).
2. **Phase 3 — Machine Learning Classifier & Error Analysis**:
   - Train and benchmark supervised models (e.g., Random Forest vs Logistic Regression) on telemetry features.
   - Comprehensive False Positive vs False Negative error trade-off matrix.
3. **Phase 4 — Structured Explainability & Recommendation Service**:
   - Implement the complete 4-question plain-language explainability framework for non-specialist compliance stakeholders.
   - Calculate potential wall-clock and financial savings.
4. **Phase 5 — Full Enterprise Dashboard & CI Platform Integrations**:
   - Interactive role-governed UI with telemetry charts, live prediction playground, and CI platform webhook listeners (GitHub Actions, GitLab CI).
>>>>>>> 7237041 (Initial commit: CI Bottleneck Analyser 50% MVP with folders under 25MB)
