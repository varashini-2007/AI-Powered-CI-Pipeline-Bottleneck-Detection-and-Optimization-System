# Limitations & Operational Scope — CI Insight

**Project Title:** CI Insight: Intelligent CI Bottleneck Analyser for Regulated Enterprises  
**Document Version:** 1.0.0-foundation  

---

## 1. Initial Limitations

### 1.1 Synthetic Dataset Usage
In accordance with regulated enterprise compliance and privacy obligations (e.g. SOC 2, HIPAA, PCI-DSS), actual production build logs and proprietary codebase artifacts cannot be utilized in initial non-production validation environments. The system currently evaluates on a statistically calibrated synthetic telemetry dataset simulating 1,200 builds across 3 organisations. While these models capture realistic Gaussian and log-normal distributions of queue, cache, and duration events, real enterprise pipelines may introduce idiosyncratic network jitter or multi-stage dependency topologies not captured in synthetic generation.

### 1.2 Rule Threshold Calibration
Initial threshold constants (e.g., queue wait > 300 seconds, cache hit rate < 50%, agent saturation > 85%) are configured as sensible defaults informed by common DevOps literature. These static thresholds may require per-organisation and per-repository tuning to avoid false alerts on naturally compute-intensive builds (e.g., large C++ or monorepo compilations).

### 1.3 Advisory Nature of Recommendations
All system outputs, diagnostics, and suggested speed improvements are strictly **advisory**. The system does not automatically modify CI workflow YAML definitions, alter pipeline execution triggers, or manipulate production infrastructure. Implementation of any recommendation remains under human engineer and change-approval board (CAB) governance.

### 1.4 Agent Resource Estimation
Agent host metrics (CPU, memory, agent busy percentage) in the current foundation rely on telemetry models where metrics are captured per build window. In heterogeneous cloud runner environments (e.g., ephemeral Kubernetes pods, AWS Fargate runners, or shared bare-metal runners), agent-level metric fidelity is contingent on the telemetry collection agent available on the host CI runner.

### 1.5 Targeted MVP Scope
The primary analytical focus of this foundation phase is on the two highest-impact bottlenecks in continuous integration:
1. **Build Caching Efficiency** (restoration vs re-execution penalties)
2. **Task Parallelisation Opportunities** (converting sequential steps to concurrent DAG stages)

Advanced enterprise capabilities such as cross-region runner federation, automated self-healing CI pipelines, and live production webhook listeners are scheduled for subsequent evolutionary milestones.
