---
type: "docs"
title: "Operations"
linkTitle: "Operations"
weight: 50
description: "Deploy, monitor, and maintain Drasi Server in production"
---

# Operations

This section covers operational aspects of running Drasi Server in production environments.

## State Store Configuration

Configure persistent storage for plugin state:

```yaml
state_store:
  kind: redb
  path: ${DATA_PATH:-./data}/state.redb
```

### REDB State Store

File-based persistent storage using REDB:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `kind` | string | Yes | Must be `redb` |
| `path` | string | Yes | Path to database file |

### In-Memory (Default)

Without `state_store`, an in-memory store is used. State is lost on restart.

### When to Use Persistent State

Use persistent state when:
- Sources need to track replication positions
- You need state to survive restarts
- Running in production environments

## Multi-Instance Configuration

For workload isolation, configure multiple DrasiLib instances:

```yaml
instances:
  - id: analytics
    persist_index: true
    state_store:
      kind: redb
      path: ./data/analytics-state.redb
    sources:
      - kind: postgres
        id: analytics-db
        # ...
    queries:
      - id: analytics-query
        # ...
    reactions:
      - kind: log
        id: analytics-log
        # ...

  - id: monitoring
    persist_index: false
    sources:
      - kind: http
        id: metrics
        # ...
    queries:
      - id: alert-query
        # ...
```

Each instance has:
- Isolated namespace
- Optional separate state store
- API access via `/api/v1/instances/{instanceId}/...`

## Monitoring

### Health Check

```bash
curl http://localhost:8080/health
```

Returns:
```json
{"status":"healthy"}
```

Use for:
- Load balancer health checks
- Kubernetes liveness probes
- Monitoring systems

### Profiler Reaction

Add profiler for query metrics:

```yaml
reactions:
  - kind: profiler
    id: metrics
    queries: [critical-query-1, critical-query-2]
    window_size: 200
    report_interval_secs: 60
```

### Log Levels

Set log level in configuration:

```yaml
log_level: info  # trace, debug, info, warn, error
```

Or via environment variable:

```bash
RUST_LOG=debug drasi-server --config config/server.yaml
```

### Kubernetes Integration

```yaml
# Deployment
spec:
  containers:
    - name: drasi-server
      livenessProbe:
        httpGet:
          path: /health
          port: 8080
        initialDelaySeconds: 10
        periodSeconds: 30
      readinessProbe:
        httpGet:
          path: /health
          port: 8080
        initialDelaySeconds: 5
        periodSeconds: 10
```

## Troubleshooting

### Common Issues

#### Server Won't Start

1. Check configuration syntax:
   ```bash
   drasi-server validate --config config/server.yaml
   ```

2. Check logs for errors:
   ```bash
   docker logs drasi-server
   ```

3. Verify port availability:
   ```bash
   lsof -i :8080
   ```

#### Source Connection Issues

1. Verify source is reachable:
   ```bash
   # PostgreSQL
   psql -h hostname -U user -d database
   ```

2. Check source status:
   ```bash
   curl http://localhost:8080/api/v1/sources/my-source
   ```

3. Enable debug logging:
   ```yaml
   log_level: debug
   ```

#### Query Not Receiving Data

1. Verify source is running:
   ```bash
   curl http://localhost:8080/api/v1/sources
   ```

2. Check query status:
   ```bash
   curl http://localhost:8080/api/v1/queries/my-query
   ```

3. Check query results:
   ```bash
   curl http://localhost:8080/api/v1/queries/my-query/results
   ```

#### High Memory Usage

1. Reduce bootstrap buffer sizes
2. Limit queue capacities
3. Reduce profiler window sizes
4. Check for query result accumulation

### Debug Logging

Enable verbose logging:

```bash
# All debug logs
RUST_LOG=debug drasi-server --config config/server.yaml

# Specific component
RUST_LOG=drasi_server=trace drasi-server --config config/server.yaml
```

### PostgreSQL Specific

#### Replication Slot Issues

```sql
-- View slots
SELECT * FROM pg_replication_slots;

-- Drop unused slot
SELECT pg_drop_replication_slot('drasi_slot');
```

#### WAL Level

```sql
-- Check level
SHOW wal_level;

-- Must be 'logical'
ALTER SYSTEM SET wal_level = 'logical';
-- Restart required
```

## Configuration Validation

Validate before deployment:

```bash
# Basic validation
drasi-server validate --config config/server.yaml

# Show resolved values
drasi-server validate --config config/server.yaml --show-resolved
```

## System Dependencies

Check required dependencies:

```bash
drasi-server doctor

# Include optional dependencies
drasi-server doctor --all
```

## Backup and Recovery

### State Store Backup

For REDB state store:

```bash
# Stop server first
docker stop drasi-server

# Backup state file
cp ./data/state.redb ./backup/state.redb.$(date +%Y%m%d)

# Start server
docker start drasi-server
```

### Configuration Backup

```bash
cp config/server.yaml config/server.yaml.backup
```

## Scaling Considerations

### Horizontal Scaling

For multiple Drasi Server instances:

1. Use different consumer names for Platform sources
2. Configure separate state stores
3. Use load balancer for API access

### Vertical Scaling

Adjust resources based on:
- Number of queries
- Query complexity
- Event volume
- Bootstrap data size

## Security

### Environment Variables for Secrets

```yaml
sources:
  - kind: postgres
    id: db
    password: ${DB_PASSWORD}
```

### Network Security

- Run behind reverse proxy/load balancer
- Use TLS for production
- Restrict API access

### Database Credentials

- Use read-only accounts where possible
- Grant minimal required permissions
- Rotate credentials regularly

## Next Steps

- [Installation](/drasi-server/how-to-guides/installation/) - Deployment options
- [Configuration Reference](/drasi-server/reference/configuration/) - All configuration options
