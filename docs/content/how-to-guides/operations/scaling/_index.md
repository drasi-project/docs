---
type: "docs"
title: "Scaling"
linkTitle: "Scaling"
weight: 30
description: >
    Learn how to scale Drasi components to handle increased workloads
---

As your workload grows, you may need to scale your Drasi deployment. This guide covers strategies for scaling different components.

## Understanding Drasi's Architecture

Before scaling, understand how components interact:

1. **Sources** connect to databases and capture changes
2. **Query Containers** evaluate continuous queries against changes
3. **Reactions** execute actions based on query results

Each component can be scaled independently based on its specific bottleneck.

## Scaling Query Containers

Query containers are typically the first component that needs scaling as workload increases.

### Horizontal Scaling

Add more query container replicas:

```bash
# View current deployment
kubectl get deployment -n drasi-system -l component=query-container

# Scale up
kubectl scale deployment drasi-query-<name> -n drasi-system --replicas=3
```

### Distributing Queries

For better performance, distribute queries across multiple containers:

```yaml
# Create dedicated containers for different query types
apiVersion: v1
kind: QueryContainer
metadata:
  name: high-priority-queries
spec:
  queryContainerImage: drasi/query-container:latest
  resources:
    requests:
      memory: "1Gi"
      cpu: "1"
    limits:
      memory: "2Gi"
      cpu: "2"
---
apiVersion: v1
kind: QueryContainer
metadata:
  name: batch-queries
spec:
  queryContainerImage: drasi/query-container:latest
  resources:
    requests:
      memory: "512Mi"
      cpu: "500m"
```

### Vertical Scaling

Increase resources for query containers handling complex queries:

```yaml
spec:
  resources:
    requests:
      memory: "2Gi"
      cpu: "2"
    limits:
      memory: "4Gi"
      cpu: "4"
```

## Scaling Reactions

### High-Throughput Reactions

For reactions processing high volumes:

1. **Use async processing** - Queue-based reactions handle spikes better
2. **Increase concurrency** - Configure parallel execution where supported
3. **Add replicas** - Scale reaction deployments horizontally

```yaml
apiVersion: v1
kind: Reaction
metadata:
  name: high-volume-reaction
spec:
  kind: EventGrid
  properties:
    concurrency: 10
    batchSize: 100
```

### Reaction-Specific Scaling

Different reaction types have different scaling strategies:

| Reaction Type | Scaling Approach |
|---------------|------------------|
| HTTP | Increase concurrency, add connection pooling |
| EventGrid/EventHub | Use batching, partition across topics |
| SignalR | Scale SignalR service tier |
| Database (StoredProc) | Connection pooling, read replicas |

## Source Considerations

Sources generally don't need horizontal scaling but may need tuning:

### Connection Optimization

```yaml
apiVersion: v1
kind: Source
metadata:
  name: postgres-source
spec:
  kind: PostgreSQL
  properties:
    # Connection pool settings
    maxPoolSize: 20
    minPoolSize: 5
    connectionTimeout: 30
```

### Change Capture Tuning

For high-change-rate sources:
- Increase replication slot buffer size
- Tune batch size for change capture
- Monitor replication lag closely

## Resource Planning

### Estimating Requirements

Use these guidelines as starting points:

| Workload | Query Container | Memory | CPU |
|----------|-----------------|--------|-----|
| Low (< 100 changes/s) | 1 replica | 512Mi | 500m |
| Medium (100-1000 changes/s) | 2-3 replicas | 1Gi | 1 |
| High (> 1000 changes/s) | 3-5 replicas | 2Gi | 2 |

### Monitoring for Scaling Decisions

Monitor these metrics to identify scaling needs:

- **CPU utilization** > 70% sustained
- **Memory utilization** > 80%
- **Query evaluation latency** increasing
- **Reaction queue depth** growing

## Auto-Scaling

### Kubernetes HPA

Configure Horizontal Pod Autoscaler for query containers:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: drasi-query-hpa
  namespace: drasi-system
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: drasi-query-container
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### KEDA (Event-Driven Scaling)

For more sophisticated scaling based on custom metrics:

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: drasi-query-scaler
spec:
  scaleTargetRef:
    name: drasi-query-container
  triggers:
  - type: prometheus
    metadata:
      serverAddress: http://prometheus:9090
      metricName: drasi_query_queue_depth
      threshold: "100"
      query: drasi_query_queue_depth
```

## Multi-Cluster Scaling

For very large deployments, consider multi-cluster:

1. **Geographic distribution** - Deploy Drasi close to data sources
2. **Workload isolation** - Separate critical and batch workloads
3. **Fault isolation** - Prevent cascade failures

## Scaling Checklist

Before scaling:
- [ ] Identify the bottleneck (CPU, memory, I/O)
- [ ] Review current resource utilization
- [ ] Test scaling in non-production
- [ ] Update monitoring and alerts
- [ ] Document the new configuration

## Next Steps

- Set up [Monitoring](/how-to-guides/operations/monitoring/) for scaling decisions
- Review [Performance patterns](/patterns/performance/)
- Configure [Maintenance](/how-to-guides/operations/maintenance/) procedures
