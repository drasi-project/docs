---
type: "docs"
title: "Performance Patterns"
linkTitle: "Performance"
weight: 30
description: >
    Guidelines for optimizing Drasi performance, scaling, and resource management
---

This guide covers performance optimization strategies for Drasi deployments. Understanding these patterns helps you build solutions that handle high volumes efficiently.

## Performance Fundamentals

### Understanding the Data Flow

Drasi's performance depends on several factors:

1. **Source change rate** - How frequently data changes in your sources
2. **Query complexity** - The computational cost of evaluating your queries
3. **Result set size** - The amount of data your queries return
4. **Reaction throughput** - How quickly reactions can process changes

Optimizing each of these areas contributes to overall system performance.

### Key Metrics to Monitor

Track these metrics to understand your Drasi deployment's performance:

- **Change processing latency** - Time from source change to query evaluation
- **Query evaluation time** - Time to process each change through a query
- **Reaction execution time** - Time for reactions to complete
- **Memory utilization** - Memory used by query containers
- **CPU utilization** - Compute resources consumed

## Query Optimization

### Reduce Query Complexity

Simpler queries evaluate faster. Consider breaking complex queries into multiple simpler ones.

**Before (complex):**
```cypher
MATCH (o:Order)-[:CONTAINS]->(p:Product)-[:SUPPLIED_BY]->(s:Supplier)
WHERE o.status = 'PENDING'
  AND p.category = 'Electronics'
  AND s.region = 'APAC'
WITH o, p, s, count(p) as productCount
WHERE productCount > 5
RETURN o.id, s.name, productCount
```

**After (simplified):**
```cypher
// Query 1: Find pending electronics orders
MATCH (o:Order)-[:CONTAINS]->(p:Product)
WHERE o.status = 'PENDING' AND p.category = 'Electronics'
RETURN o.id, o.total

// Handle supplier correlation in a separate query or reaction
```

### Optimize Filter Conditions

Place the most selective conditions first to reduce the data set early.

```cypher
// Better performance: Specific value first
MATCH (o:Order)
WHERE o.id = 'ORD-12345' AND o.status IN ['PENDING', 'PROCESSING']
RETURN o

// Slower: Broad condition first
MATCH (o:Order)
WHERE o.status IN ['PENDING', 'PROCESSING'] AND o.id = 'ORD-12345'
RETURN o
```

### Limit Result Set Size

Avoid queries that can return unbounded results:

```cypher
// Include meaningful filters to limit results
MATCH (o:Order)
WHERE o.createdAt > datetime() - duration('P1D')
  AND o.status = 'NEW'
RETURN o.id, o.total
```

## Source Configuration

### Connection Pooling

Configure appropriate connection pool sizes for your sources based on:
- Expected change rate
- Query count
- Source database capacity

### Change Capture Optimization

For database sources, optimize the change capture configuration:
- Use dedicated replication slots
- Configure appropriate batch sizes
- Monitor replication lag

## Scaling Strategies

### Horizontal Scaling

Scale out by adding more query container instances:

```yaml
apiVersion: v1
kind: QueryContainer
metadata:
  name: high-throughput-container
spec:
  replicas: 3  # Scale based on load
  resources:
    requests:
      memory: "512Mi"
      cpu: "500m"
    limits:
      memory: "1Gi"
      cpu: "1000m"
```

### Query Distribution

Distribute queries across multiple containers to parallelize processing:

- **By source** - Separate containers for each data source
- **By query type** - Group similar queries together
- **By priority** - Isolate critical queries in dedicated containers

### Reaction Scaling

Scale reactions based on the volume of changes they need to process:

- Use async reactions for high-volume scenarios
- Implement batching where appropriate
- Consider queue-based reactions for spike handling

## Resource Planning

### Memory Sizing

Query containers need memory for:
- Query state management
- Result set caching
- Change processing buffers

Start with these guidelines:
- Simple queries: 256MB - 512MB
- Complex queries: 512MB - 1GB
- High-volume queries: 1GB - 2GB+

### CPU Allocation

CPU requirements depend on:
- Query complexity
- Change rate
- Concurrent query count

Monitor CPU utilization and adjust allocations accordingly.

## Monitoring and Alerting

### Performance Dashboards

Create dashboards that show:
- Change processing latency percentiles (p50, p95, p99)
- Query throughput (changes/second)
- Error rates by component
- Resource utilization trends

### Alert Thresholds

Set up alerts for:
- Processing latency exceeding SLAs
- Error rate spikes
- Resource utilization above 80%
- Replication lag increases

## Anti-Patterns

### Over-Provisioning

Don't allocate excessive resources "just in case." Start with reasonable estimates, monitor, and adjust.

### Under-Monitoring

Performance issues are easier to prevent than fix. Invest in comprehensive monitoring from the start.

### Single Query Containers

Avoid running all queries in a single container. Distribute queries to:
- Isolate failures
- Enable independent scaling
- Improve performance

### Synchronous Reactions for High Volume

For high-volume scenarios, avoid synchronous reactions that can create backpressure. Use queues or async patterns instead.

## Performance Testing

### Load Testing

Before production deployment:
1. Simulate expected change volumes
2. Test with realistic query patterns
3. Verify reaction throughput
4. Identify bottlenecks

### Capacity Planning

Use load testing results to plan:
- Initial resource allocations
- Scaling thresholds
- Growth projections

## Next Steps

- Learn about [Security](/patterns/security/) best practices
- Review [Query Design](/patterns/query-design/) patterns
- Explore [Observability](/how-to-guides/operations/observability/) setup
