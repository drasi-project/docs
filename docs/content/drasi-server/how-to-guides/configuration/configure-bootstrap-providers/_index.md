---
type: "docs"
title: "Configure Bootstrap Providers"
linkTitle: "Configure Bootstrap Providers"
weight: 30
no_list: true
description: "Load initial data before streaming begins"
---

# Configure Bootstrap Providers

Bootstrap providers load initial data into queries before streaming begins. This ensures queries have complete state from the start, not just changes that occur after startup.

## Why Bootstrap?

Without bootstrap:
- Queries start with empty state
- Only see changes that occur after startup
- Miss existing data in source systems

With bootstrap:
- Queries start with current state
- Query results immediately reflect existing data
- Changes are detected relative to initial state

## Available Bootstrap Providers

| Provider | Description | Best For |
|----------|-------------|----------|
| **postgres** | Load from PostgreSQL using COPY | PostgreSQL sources |
| **scriptfile** | Load from JSONL files | Static data, testing |
| **platform** | Load from remote Drasi API | Distributed deployments |
| **noop** | No initial data | Event-only sources |

## PostgreSQL Bootstrap

Load initial data from the same PostgreSQL database:

```yaml
sources:
  - kind: postgres
    id: orders-db
    host: localhost
    database: myapp
    user: postgres
    password: ${DB_PASSWORD}
    tables:
      - public.orders
      - public.customers
    bootstrap_provider:
      type: postgres
```

The PostgreSQL bootstrap provider:
- Uses the COPY protocol for efficient bulk loading
- Inherits connection settings from the source
- Loads all monitored tables

## Scriptfile Bootstrap

Load initial data from JSONL files:

```yaml
sources:
  - kind: http
    id: events-api
    host: 0.0.0.0
    port: 9000
    bootstrap_provider:
      type: scriptfile
      file_paths:
        - /data/initial-nodes.jsonl
        - /data/initial-relations.jsonl
```

### JSONL Format

Each line is a JSON object representing a node:

```jsonl
{"op": "insert", "label": "Order", "id": "order-1", "properties": {"total": 100, "status": "pending"}}
{"op": "insert", "label": "Order", "id": "order-2", "properties": {"total": 250, "status": "shipped"}}
{"op": "insert", "label": "Customer", "id": "cust-1", "properties": {"name": "John Doe"}}
```

### Use Cases

- Testing with known data
- Static reference data
- Data from external systems

## Platform Bootstrap

Load initial data from a remote Drasi Query API:

```yaml
sources:
  - kind: platform
    id: events
    redis_url: redis://localhost:6379
    stream_key: events
    bootstrap_provider:
      type: platform
      query_api_url: http://remote-drasi:8080
      timeout_seconds: 300
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `query_api_url` | string | Required | Remote Drasi server URL |
| `timeout_seconds` | integer | `300` | Timeout for bootstrap operation |

### Use Cases

- Distributed deployments
- Cross-region replication
- Failover scenarios

## No-Op Bootstrap

Explicitly skip bootstrapping:

```yaml
sources:
  - kind: http
    id: webhook
    host: 0.0.0.0
    port: 9000
    bootstrap_provider:
      type: noop
```

### Use Cases

- Event-only sources (no initial state needed)
- Testing streaming behavior
- Sources where data is ephemeral

## Configuration by Source Type

### PostgreSQL Sources

Best bootstrap: `postgres`

```yaml
sources:
  - kind: postgres
    id: db
    # ... connection config
    bootstrap_provider:
      type: postgres
```

### HTTP/gRPC Sources

Options: `scriptfile`, `noop`, or `platform`

```yaml
sources:
  - kind: http
    id: webhook
    host: 0.0.0.0
    port: 9000
    bootstrap_provider:
      type: scriptfile
      file_paths:
        - /data/initial-state.jsonl
```

### Mock Sources

Typically no bootstrap needed:

```yaml
sources:
  - kind: mock
    id: test
    # No bootstrap_provider - mock generates its own data
```

### Platform Sources

Options: `platform`, `scriptfile`, or `noop`

```yaml
sources:
  - kind: platform
    id: events
    redis_url: redis://localhost:6379
    stream_key: events
    bootstrap_provider:
      type: platform
      query_api_url: http://main-drasi:8080
```

## Query Bootstrap Settings

Queries can control bootstrap behavior:

```yaml
queries:
  - id: my-query
    query: "MATCH (n) RETURN n"
    sources:
      - source_id: my-source
    enableBootstrap: true        # Enable bootstrap (default: true)
    bootstrapBufferSize: 10000   # Buffer size during bootstrap
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enableBootstrap` | boolean | `true` | Process initial data from sources |
| `bootstrapBufferSize` | integer | `10000` | Event buffer size during bootstrap |

### Disabling Bootstrap

For queries that only need changes:

```yaml
queries:
  - id: changes-only
    query: "MATCH (n) RETURN n"
    sources:
      - source_id: my-source
    enableBootstrap: false
```

## Complete Example

```yaml
host: 0.0.0.0
port: 8080
log_level: info

sources:
  # PostgreSQL with native bootstrap
  - kind: postgres
    id: orders-db
    host: ${DB_HOST}
    database: ecommerce
    user: ${DB_USER}
    password: ${DB_PASSWORD}
    tables:
      - public.orders
      - public.customers
    bootstrap_provider:
      type: postgres

  # HTTP source with file bootstrap
  - kind: http
    id: external-events
    host: 0.0.0.0
    port: 9000
    bootstrap_provider:
      type: scriptfile
      file_paths:
        - /data/reference-data.jsonl

  # Mock source (no bootstrap)
  - kind: mock
    id: test-data
    data_type: sensor
    interval_ms: 5000

queries:
  # Full bootstrap
  - id: all-orders
    query: "MATCH (o:orders) RETURN o"
    sources:
      - source_id: orders-db
    enableBootstrap: true

  # Changes only (no bootstrap)
  - id: new-orders
    query: "MATCH (o:orders) WHERE o.status = 'new' RETURN o"
    sources:
      - source_id: orders-db
    enableBootstrap: false
```

## Performance Considerations

### Large Datasets

For large initial datasets:

1. Increase `bootstrapBufferSize`:
   ```yaml
   queries:
     - id: large-dataset
       bootstrapBufferSize: 50000
   ```

2. Consider pagination or filtering at source level

3. Monitor memory usage during bootstrap

### Bootstrap Timeout

For slow bootstraps with platform provider:

```yaml
bootstrap_provider:
  type: platform
  query_api_url: http://remote:8080
  timeout_seconds: 600  # 10 minutes
```

## Troubleshooting

### Bootstrap Takes Too Long

- Reduce data scope (filter tables)
- Increase timeout settings
- Check network latency
- Monitor source database performance

### Out of Memory During Bootstrap

- Reduce `bootstrapBufferSize`
- Limit tables being bootstrapped
- Increase server memory

### Bootstrap Data Missing

- Verify source connection
- Check table permissions
- Review bootstrap provider configuration
- Check logs for errors

## Next Steps

- [Configure Sources](/drasi-server/how-to-guides/configure-sources/) - Source configuration
- [Write Continuous Queries](/drasi-server/how-to-guides/write-continuous-queries/) - Query configuration
