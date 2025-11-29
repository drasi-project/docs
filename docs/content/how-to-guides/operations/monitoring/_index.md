---
type: "docs"
title: "Monitoring"
linkTitle: "Monitoring"
weight: 20
description: >
    Set up health checks, alerting, and dashboards for your Drasi deployment
---

Effective monitoring helps you identify issues before they impact your users. This guide covers how to set up health checks, configure alerting, and create useful dashboards.

## Prerequisites

Before setting up monitoring, ensure you have [observability configured](/how-to-guides/operations/observability/) in your Drasi deployment.

## Health Checks

### Component Health Endpoints

Drasi components expose health endpoints that you can use to monitor their status:

```bash
# Check source connector health
kubectl exec -n drasi-system deploy/drasi-source-<name> -- curl -s http://localhost:8080/health

# Check query container health
kubectl exec -n drasi-system deploy/drasi-query-<name> -- curl -s http://localhost:8080/health

# Check reaction health
kubectl exec -n drasi-system deploy/drasi-reaction-<name> -- curl -s http://localhost:8080/health
```

### Kubernetes Readiness/Liveness Probes

Drasi components include Kubernetes probes. Monitor probe failures to detect unhealthy components:

```bash
kubectl get events -n drasi-system --field-selector reason=Unhealthy
```

## Key Metrics to Monitor

### Source Metrics

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `drasi_source_changes_received_total` | Total changes received from source | N/A (track rate) |
| `drasi_source_changes_per_second` | Change rate from source | Varies by workload |
| `drasi_source_connection_status` | Source connection health | 0 = disconnected |
| `drasi_source_replication_lag_ms` | Lag behind source | > 10000ms |

### Query Metrics

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `drasi_query_evaluation_duration_ms` | Time to evaluate queries | p99 > 1000ms |
| `drasi_query_results_total` | Query result count | N/A (track changes) |
| `drasi_query_errors_total` | Query evaluation errors | Any increase |
| `drasi_query_memory_usage_bytes` | Query container memory | > 80% of limit |

### Reaction Metrics

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `drasi_reaction_executions_total` | Total reaction executions | N/A (track rate) |
| `drasi_reaction_duration_ms` | Reaction execution time | p99 > 5000ms |
| `drasi_reaction_errors_total` | Reaction errors | Any increase |
| `drasi_reaction_queue_depth` | Pending reactions | > 1000 |

## Setting Up Alerts

### Prometheus Alerting Rules

Create alerting rules for critical conditions:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: drasi-alerts
  namespace: drasi-system
spec:
  groups:
  - name: drasi.rules
    rules:
    - alert: DrasiSourceDisconnected
      expr: drasi_source_connection_status == 0
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "Drasi source {{ $labels.source }} is disconnected"

    - alert: DrasiHighReplicationLag
      expr: drasi_source_replication_lag_ms > 10000
      for: 10m
      labels:
        severity: warning
      annotations:
        summary: "Drasi source {{ $labels.source }} has high replication lag"

    - alert: DrasiQueryErrors
      expr: increase(drasi_query_errors_total[5m]) > 0
      labels:
        severity: warning
      annotations:
        summary: "Query {{ $labels.query }} has errors"

    - alert: DrasiReactionErrors
      expr: increase(drasi_reaction_errors_total[5m]) > 0
      labels:
        severity: warning
      annotations:
        summary: "Reaction {{ $labels.reaction }} has errors"
```

### Alert Destinations

Configure alert routing to appropriate destinations:

- **PagerDuty** for critical production alerts
- **Slack** for warning-level notifications
- **Email** for daily summaries

## Creating Dashboards

### Grafana Dashboard

Create a comprehensive Drasi dashboard in Grafana:

1. Access Grafana (see [Observability](/how-to-guides/operations/observability/))
2. Create a new dashboard
3. Add panels for:
   - Source change rate (time series)
   - Query evaluation latency (histogram)
   - Reaction success/failure rate (gauge)
   - Resource utilization (time series)

### Example Dashboard JSON

```json
{
  "title": "Drasi Overview",
  "panels": [
    {
      "title": "Changes per Second",
      "type": "timeseries",
      "targets": [
        {
          "expr": "rate(drasi_source_changes_received_total[5m])",
          "legendFormat": "{{ source }}"
        }
      ]
    },
    {
      "title": "Query Latency (p99)",
      "type": "timeseries",
      "targets": [
        {
          "expr": "histogram_quantile(0.99, drasi_query_evaluation_duration_ms_bucket)",
          "legendFormat": "{{ query }}"
        }
      ]
    }
  ]
}
```

## Monitoring Best Practices

### Establish Baselines

Before setting alert thresholds:
1. Run Drasi under normal load for several days
2. Collect baseline metrics
3. Set thresholds based on observed patterns

### Use Multi-Signal Alerting

Combine multiple signals to reduce false positives:
- High latency AND error rate increase
- Memory usage high AND approaching OOM

### Document Runbooks

For each alert, document:
- What the alert means
- Potential causes
- Investigation steps
- Remediation actions

## Next Steps

- Configure [Scaling](/how-to-guides/operations/scaling/) for high workloads
- Set up [Troubleshooting](/how-to-guides/operations/troubleshooting/) procedures
- Review [Performance patterns](/patterns/performance/)
