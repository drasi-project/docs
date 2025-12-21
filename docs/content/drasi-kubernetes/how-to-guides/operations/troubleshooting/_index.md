---
type: "docs"
title: "Troubleshooting"
linkTitle: "Troubleshooting"
weight: 40
description: >
    Diagnose and resolve common issues with your Drasi deployment
---

This guide helps you diagnose and resolve common issues with Drasi deployments. For each issue, we provide symptoms, possible causes, and resolution steps.

## General Diagnostics

### Checking Component Status

Start by checking the status of all Drasi components:

```bash
# List all Drasi resources
kubectl get sources,continuousqueries,reactions -n drasi-system

# Check pod status
kubectl get pods -n drasi-system

# View recent events
kubectl get events -n drasi-system --sort-by='.lastTimestamp'
```

### Viewing Logs

Access logs for troubleshooting:

```bash
# Source connector logs
kubectl logs -n drasi-system -l drasi.io/component=source

# Query container logs
kubectl logs -n drasi-system -l drasi.io/component=query-container

# Reaction logs
kubectl logs -n drasi-system -l drasi.io/component=reaction

# Follow logs in real-time
kubectl logs -n drasi-system -l drasi.io/component=source -f
```

## Source Issues

### Source Not Connecting

**Symptoms:**
- Source shows `Disconnected` status
- No changes being received
- Connection timeout errors in logs

**Possible Causes:**
1. Incorrect connection credentials
2. Network connectivity issues
3. Database firewall blocking connections
4. SSL/TLS configuration mismatch

**Resolution:**

1. Verify credentials:
```bash
kubectl get secret <source-secret> -n drasi-system -o yaml
```

2. Test network connectivity:
```bash
kubectl run -it --rm debug --image=alpine -n drasi-system -- nc -vz <db-host> <port>
```

3. Check source configuration:
```bash
kubectl describe source <source-name> -n drasi-system
```

4. Review database logs for connection attempts

### High Replication Lag

**Symptoms:**
- Changes arriving late
- Monitoring shows increasing lag
- `drasi_source_replication_lag_ms` metric high

**Possible Causes:**
1. Source database under heavy load
2. Network latency
3. Large transactions
4. Insufficient source connector resources

**Resolution:**

1. Check database replication status:
```sql
-- PostgreSQL
SELECT * FROM pg_stat_replication;
```

2. Review source connector resources:
```bash
kubectl top pod -n drasi-system -l drasi.io/component=source
```

3. Consider scaling source connector resources

## Query Issues

### Query Not Producing Results

**Symptoms:**
- Query shows `Running` but no results
- Expected changes not triggering reactions

**Possible Causes:**
1. Query syntax error
2. No matching data in source
3. Query filters too restrictive
4. Source not receiving changes

**Resolution:**

1. Verify query syntax in logs:
```bash
kubectl logs -n drasi-system deploy/drasi-query-<name> | grep -i error
```

2. Test query logic with debug reaction:
```yaml
apiVersion: v1
kind: Reaction
metadata:
  name: debug-test
spec:
  kind: Debug
  queries:
    - <your-query-name>
```

3. Check source is receiving changes:
```bash
kubectl logs -n drasi-system deploy/drasi-source-<name> | grep "change received"
```

### Query Evaluation Errors

**Symptoms:**
- `drasi_query_errors_total` increasing
- Error messages in query container logs
- Intermittent result delivery

**Possible Causes:**
1. Data type mismatches
2. Null value handling issues
3. Invalid property references
4. Resource exhaustion

**Resolution:**

1. Review error details:
```bash
kubectl logs -n drasi-system deploy/drasi-query-<name> | grep -i error
```

2. Check for data issues in source:
```sql
-- Look for unexpected nulls or types
SELECT * FROM <table> WHERE <column> IS NULL;
```

3. Update query to handle edge cases

### High Query Latency

**Symptoms:**
- `drasi_query_evaluation_duration_ms` high
- Results arriving late
- CPU utilization high on query containers

**Possible Causes:**
1. Complex query logic
2. Large result sets
3. Insufficient resources
4. Too many concurrent queries

**Resolution:**

1. Review query complexity and optimize
2. Add more selective filters
3. Scale query container resources
4. Distribute queries across containers

## Reaction Issues

### Reaction Not Executing

**Symptoms:**
- Query producing results but reaction not triggering
- No logs in reaction container

**Possible Causes:**
1. Reaction not connected to query
2. Reaction configuration error
3. Reaction crashed or unhealthy

**Resolution:**

1. Verify reaction configuration:
```bash
kubectl describe reaction <reaction-name> -n drasi-system
```

2. Check reaction pod status:
```bash
kubectl get pods -n drasi-system -l drasi.io/reaction=<name>
```

3. Review reaction logs for startup errors

### Reaction Failures

**Symptoms:**
- `drasi_reaction_errors_total` increasing
- Error messages in reaction logs
- Partial execution of actions

**Possible Causes:**
1. Target endpoint unavailable
2. Authentication failures
3. Rate limiting
4. Invalid payload format

**Resolution:**

1. Check target endpoint accessibility:
```bash
kubectl run -it --rm debug --image=alpine -n drasi-system -- nc -vz <endpoint-host> <port>
```

2. Verify credentials:
```bash
kubectl get secret <reaction-secret> -n drasi-system -o yaml
```

3. Review reaction logs for specific errors:
```bash
kubectl logs -n drasi-system deploy/drasi-reaction-<name> | grep -i error
```

## Resource Issues

### Out of Memory (OOM)

**Symptoms:**
- Pods being killed and restarted
- OOMKilled in pod events
- Memory usage at limits

**Resolution:**

1. Check memory usage:
```bash
kubectl top pods -n drasi-system
```

2. Increase memory limits:
```yaml
resources:
  limits:
    memory: "2Gi"
```

3. Review query result set sizes

### CPU Throttling

**Symptoms:**
- High latency
- CPU throttling events
- Slow response times

**Resolution:**

1. Check CPU usage:
```bash
kubectl top pods -n drasi-system
```

2. Increase CPU limits:
```yaml
resources:
  limits:
    cpu: "2"
```

3. Scale horizontally if single-pod scaling isn't sufficient

## Installation Issues

### Installation Fails

**Symptoms:**
- `drasi init` returns errors
- Components fail to deploy

**Resolution:**

1. Check cluster connectivity:
```bash
kubectl cluster-info
```

2. Verify RBAC permissions:
```bash
kubectl auth can-i create deployments -n drasi-system
```

3. Review installation logs carefully for specific errors

4. Try with verbose output:
```bash
drasi init --verbose
```

## Getting Help

If you can't resolve an issue:

1. Gather diagnostic information:
```bash
# Export logs
kubectl logs -n drasi-system --all-containers=true > drasi-logs.txt

# Export resource state
kubectl get all -n drasi-system -o yaml > drasi-resources.yaml
```

2. Check [Known Issues](/reference/troubleshooting/) in the reference documentation

3. Ask in the [Discord community](https://aka.ms/drasidiscord)

4. Open an issue on [GitHub](https://github.com/drasi-project/drasi/issues)
