# Requirements Specification — CI Insight

**Project Title:** CI Insight: Intelligent CI Bottleneck Analyser for Regulated Enterprises  
**Document Version:** 1.0.0-foundation  
**Compliance Context:** Regulated enterprise CI/CD environments (Finance, Healthcare, Aerospace)

---

## 1. Functional Requirements

1. **FR-1: CI Telemetry Ingestion & Log Analysis**  
   The system shall ingest, parse, and analyze CI/CD pipeline execution logs and performance metrics across builds, individual tasks, queue periods, cache events, and agent hosts.

2. **FR-2: CI Bottleneck Detection**  
   The system shall detect pipeline execution bottlenecks categorized into queue congestion, cache inefficiencies, slow individual tasks, agent resource saturation, and missed parallelisation opportunities.

3. **FR-3: Build-Cache Recommendations**  
   The system shall generate evidence-based recommendations to improve caching strategies, identifying specific tasks suffering from cache misses or frequent cache key invalidations.

4. **FR-4: Task Parallelisation Recommendations**  
   The system shall identify independent tasks running sequentially within the pipeline and recommend concurrent execution strategies with estimated wall-clock time savings.

5. **FR-5: Empirical Telemetry Evidence for High-Priority Findings**  
   Every high-priority and critical recommendation shall provide empirical supporting evidence, including exact timestamps, observed metric values, threshold comparisons, and historical run percentiles.

6. **FR-6: Non-Technical Explainability Framework**  
   The system shall translate technical CI bottleneck diagnostics into plain, non-specialist language structured around four core questions:
   - *What happened?*
   - *Why does it matter?*
   - *What should be done?*
   - *What supporting evidence exists?*

7. **FR-7: Multi-Organisation Enterprise Support & Isolation**  
   The system shall support multi-organisation deployments with strict tenant data isolation, preventing cross-tenant telemetry exposure.

8. **FR-8: Role-Based Access Control (RBAC)**  
   The system shall support five distinct enterprise roles with differentiated data views and action rights:
   - **Developer**: Focuses on task-level timings, failure causes, and actionable code/cache fixes.
   - **Engineering Manager**: Views aggregate pipeline trends, team throughput, and feedback delays.
   - **Compliance Reviewer**: Reviews audit-trail evidence, governance checks, and verification logs.
   - **External Partner**: Accesses strictly scoped, redacted pipeline status without internal metadata.
   - **Admin**: Configures global thresholds, manages tenant access, and oversees system health.

9. **FR-9: Baseline and Post-Optimisation Metrics**  
   The system shall capture baseline performance distributions and compare them against post-optimisation runs to evaluate the efficacy of implemented recommendations.

10. **FR-10: Median Developer Feedback Time Tracking**  
    The system shall track and report the median developer feedback time (end-to-end duration from commit/trigger to actionable test result) across repositories and teams.

---

## 2. Non-Functional Requirements

1. **NFR-1: Explainability & Transparency**  
   All automated recommendations and bottleneck classifications must provide auditable rationales without relying on inscrutable black-box decisions.

2. **NFR-2: Evidentiary Rigor**  
   All diagnostic outputs tagged as High or Critical priority must cite concrete metric observations from recorded build executions.

3. **NFR-3: Tenant Data Isolation**  
   Organisation telemetry must remain strictly compartmentalized at query and database levels to comply with enterprise data segregation standards.

4. **NFR-4: Role-Based View Governance**  
   Information presented through APIs and dashboards must be filtered and masked according to the authenticated user's assigned role.

5. **NFR-5: Reproducibility**  
   Dataset generation and analytical baseline benchmarks must be 100% reproducible through deterministic pseudo-random seeds and documented generation procedures.

6. **NFR-6: Error Analysis & Model Evaluation Support**  
   The system architecture must record ground truth labels alongside telemetry to support comprehensive error analysis, specifically measuring and balancing false positives (unnecessary developer alarms) versus false negatives (missed bottlenecks).
