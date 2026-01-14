---
type: "docs"
title: "Configure Drasi Server"
linkTitle: "Configure Drasi Server"
weight: 10
description: "Understanding the Drasi Server YAML configuration file structure"
---

Drasi Server uses YAML configuration files to define sources, queries, reactions, and server settings. This guide explains the configuration structure and options.

## Configuration File Location

By default, Drasi Server looks for configuration at `config/server.yaml`. Override with the `--config` flag:

```bash
drasi-server --config /path/to/my-config.yaml
```

## Basic Structure

A complete configuration file has this structure:

```yaml
# Server identification
id: my-server-instance

# Server settings
host: 0.0.0.0
port: 8080
log_level: info

# Persistence settings
persist_config: true
persist_index: false

# State store for plugin data
state_store:
  kind: redb
  path: ./data/state.redb

# Performance tuning
default_priority_queue_capacity: 10000
default_dispatch_buffer_capacity: 1000

# Data sources
sources:
  - kind: postgres
    id: my-source
    # ... source configuration

# Continuous queries
queries:
  - id: my-query
    query: "MATCH (n) RETURN n"
    sources:
      - source_id: my-source

# Reactions to query changes
reactions:
  - kind: log
    id: my-reaction
    queries: [my-query]

# Multi-instance configuration (optional)
instances: []
```

## Server Settings

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | string | Auto-generated UUID | Unique server identifier |
| `host` | string | `0.0.0.0` | Server bind address |
| `port` | integer | `8080` | REST API port |
| `log_level` | string | `info` | Log level: `trace`, `debug`, `info`, `warn`, `error` |
| `persist_config` | boolean | `true` | Save API changes to config file |
| `persist_index` | boolean | `false` | Use RocksDB for persistent query indexes |

### Example

```yaml
id: production-server
host: 0.0.0.0
port: 8080
log_level: info
persist_config: true
persist_index: true
```

## State Store Configuration

The state store persists plugin state across server restarts.

### REDB State Store

File-based persistent storage:

```yaml
state_store:
  kind: redb
  path: ./data/state.redb
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `kind` | string | Yes | Must be `redb` |
| `path` | string | Yes | Path to database file |

### In-Memory (Default)

If `state_store` is not configured, an in-memory store is used. State is lost on restart.

## Performance Tuning

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `default_priority_queue_capacity` | integer | `10000` | Event queue capacity for queries/reactions |
| `default_dispatch_buffer_capacity` | integer | `1000` | Buffer capacity for event dispatching |

```yaml
default_priority_queue_capacity: 50000
default_dispatch_buffer_capacity: 5000
```

These can be overridden per-query:

```yaml
queries:
  - id: high-volume-query
    query: "MATCH (n) RETURN n"
    sources:
      - source_id: my-source
    priority_queue_capacity: 100000
    dispatch_buffer_capacity: 10000
```

## Environment Variable Interpolation

All configuration values support environment variable substitution.

### Syntax

| Pattern | Behavior |
|---------|----------|
| `${VAR}` | Required - fails if not set |
| `${VAR:-default}` | Optional with default value |

### Examples

```yaml
host: ${SERVER_HOST:-0.0.0.0}
port: ${SERVER_PORT:-8080}

sources:
  - kind: postgres
    id: production-db
    host: ${DB_HOST}           # Required
    port: ${DB_PORT:-5432}     # Optional with default
    password: ${DB_PASSWORD}   # Required
```

### Using .env Files

Drasi Server automatically loads `.env` files in the current directory:

```bash
# .env file
DB_HOST=postgres.example.com
DB_PASSWORD=secretpassword
```

## Creating Configuration Interactively

Use the `init` command to create a configuration file interactively:

```bash
drasi-server init --output config/server.yaml
```

Options:
- `--output`, `-o`: Output path (default: `config/server.yaml`)
- `--force`: Overwrite existing file

## Validating Configuration

Validate before starting the server:

```bash
# Basic validation
drasi-server validate --config config/server.yaml

# Show resolved environment variables
drasi-server validate --config config/server.yaml --show-resolved
```

## Multi-Instance Configuration

For advanced use cases, configure multiple isolated DrasiLib instances:

```yaml
host: 0.0.0.0
port: 8080
log_level: info

instances:
  - id: analytics
    persist_index: true
    state_store:
      kind: redb
      path: ./data/analytics-state.redb
    sources:
      - kind: postgres
        id: analytics-db
        host: analytics-db.example.com
        # ...
    queries:
      - id: analytics-query
        query: "MATCH (n:Order) WHERE n.total > 1000 RETURN n"
        sources:
          - source_id: analytics-db
    reactions:
      - kind: log
        id: analytics-log
        queries: [analytics-query]

  - id: monitoring
    persist_index: false
    sources:
      - kind: http
        id: metrics-api
        host: 0.0.0.0
        port: 9001
    queries:
      - id: alert-threshold
        query: "MATCH (m:Metric) WHERE m.value > m.threshold RETURN m"
        sources:
          - source_id: metrics-api
    reactions:
      - kind: sse
        id: alert-stream
        queries: [alert-threshold]
        port: 8082
```

Each instance has:
- Isolated namespace for sources, queries, reactions
- Optional separate state store
- API access via `/api/v1/instances/{instanceId}/...`

## Complete Example

```yaml
# Server identification and settings
id: drasi-production
host: 0.0.0.0
port: 8080
log_level: info

# Enable persistence
persist_config: true
persist_index: true

# State store
state_store:
  kind: redb
  path: ${DATA_PATH:-./data}/state.redb

# Performance settings
default_priority_queue_capacity: 10000
default_dispatch_buffer_capacity: 1000

# Sources
sources:
  - kind: postgres
    id: orders-db
    auto_start: true
    host: ${DB_HOST}
    port: ${DB_PORT:-5432}
    database: ${DB_NAME}
    user: ${DB_USER}
    password: ${DB_PASSWORD}
    ssl: true
    tables:
      - public.orders
      - public.customers
    slot_name: drasi_slot
    publication_name: drasi_pub
    bootstrap_provider:
      type: postgres

  - kind: http
    id: webhook-receiver
    auto_start: true
    host: 0.0.0.0
    port: 9000
    timeout_ms: 10000

# Queries
queries:
  - id: high-value-orders
    query: |
      MATCH (o:orders)
      WHERE o.total > 1000
      RETURN o.id, o.customer_id, o.total, o.status
    sources:
      - source_id: orders-db
    auto_start: true
    enableBootstrap: true

  - id: pending-orders
    query: |
      MATCH (o:orders)-[:CUSTOMER]->(c:customers)
      WHERE o.status = 'pending'
      RETURN o.id, c.name, c.email, o.total
    sources:
      - source_id: orders-db
    joins:
      - id: CUSTOMER
        keys:
          - label: orders
            property: customer_id
          - label: customers
            property: id

# Reactions
reactions:
  - kind: log
    id: console-output
    queries: [high-value-orders, pending-orders]
    auto_start: true
    default_template:
      added:
        template: "[NEW] Order {{after.id}}: ${{after.total}}"
      updated:
        template: "[UPDATE] Order {{after.id}}: ${{before.total}} -> ${{after.total}}"
      deleted:
        template: "[DELETED] Order {{before.id}}"

  - kind: http
    id: webhook-notification
    queries: [high-value-orders]
    auto_start: true
    base_url: ${WEBHOOK_URL}
    token: ${WEBHOOK_TOKEN}
    timeout_ms: 5000
    routes:
      high-value-orders:
        added:
          url: /orders/high-value
          method: POST
          body: |
            {
              "order_id": "{{after.id}}",
              "total": {{after.total}},
              "customer_id": "{{after.customer_id}}"
            }
          headers:
            Content-Type: application/json

  - kind: sse
    id: live-updates
    queries: [pending-orders]
    auto_start: true
    host: 0.0.0.0
    port: 8081
    sse_path: /events
    heartbeat_interval_ms: 30000
```

## Configuration File Formats

Drasi Server supports both YAML and JSON configuration files. The format is auto-detected based on content.

### YAML (Recommended)

```yaml
host: 0.0.0.0
port: 8080
sources:
  - kind: mock
    id: test
```

### JSON

```json
{
  "host": "0.0.0.0",
  "port": 8080,
  "sources": [
    {
      "kind": "mock",
      "id": "test"
    }
  ]
}
```

## Next Steps

- [Configure Sources](/drasi-server/how-to-guides/configure-sources/) - Connect to data sources
- [Configure Reactions](/drasi-server/how-to-guides/configure-reactions/) - Define what happens on changes
- [Configuration Reference](/drasi-server/reference/configuration/) - Complete configuration schema
