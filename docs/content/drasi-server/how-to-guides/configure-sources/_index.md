---
type: "docs"
title: "Configure Sources"
linkTitle: "Configure Sources"
weight: 20
description: "Connect Drasi Server to databases, APIs, and data streams"
---

# Configure Sources

Sources connect Drasi Server to your data systems and stream changes to queries. Drasi Server supports several source types for different data systems and use cases.

## Available Source Types

<div class="card-grid">
  <a href="configure-postgresql-source/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-database"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">PostgreSQL</h3>
        <p class="unified-card-summary">Stream changes from PostgreSQL using logical replication (WAL)</p>
      </div>
    </div>
  </a>
  <a href="configure-http-source/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-globe"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">HTTP</h3>
        <p class="unified-card-summary">Receive events via HTTP endpoints</p>
      </div>
    </div>
  </a>
  <a href="configure-grpc-source/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-network-wired"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">gRPC</h3>
        <p class="unified-card-summary">Receive events via gRPC streaming</p>
      </div>
    </div>
  </a>
  <a href="configure-mock-source/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-flask"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Mock</h3>
        <p class="unified-card-summary">Generate test data for development</p>
      </div>
    </div>
  </a>
  <a href="configure-platform-source/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-stream"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Platform</h3>
        <p class="unified-card-summary">Consume from Redis Streams for Drasi Platform integration</p>
      </div>
    </div>
  </a>
</div>

## Choosing a Source Type

| Source Type | Best For | Data Flow |
|-------------|----------|-----------|
| **PostgreSQL** | Database change detection | Pull (WAL replication) |
| **HTTP** | Webhooks, external events | Push (HTTP POST) |
| **gRPC** | High-performance streaming | Push (gRPC stream) |
| **Mock** | Development, testing | Generated data |
| **Platform** | Drasi Platform integration | Pull (Redis Streams) |

## Common Source Configuration

All sources share these common fields:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `kind` | string | Required | Source type: `postgres`, `http`, `grpc`, `mock`, `platform` |
| `id` | string | Required | Unique source identifier |
| `auto_start` | boolean | `true` | Start source automatically on server startup |
| `bootstrap_provider` | object | None | Bootstrap provider configuration |

### Basic Example

```yaml
sources:
  - kind: postgres
    id: my-database
    auto_start: true
    # ... source-specific configuration
    bootstrap_provider:
      type: postgres
```

## Source Lifecycle

### Auto-Start Behavior

When `auto_start: true` (default), sources start automatically when the server starts.

When `auto_start: false`, you must start sources manually via the API:

```bash
curl -X POST http://localhost:8080/api/v1/sources/my-source/start
```

### Checking Source Status

List all sources:

```bash
curl http://localhost:8080/api/v1/sources
```

Get specific source details:

```bash
curl http://localhost:8080/api/v1/sources/my-source
```

### Stopping a Source

```bash
curl -X POST http://localhost:8080/api/v1/sources/my-source/stop
```

### Deleting a Source

```bash
curl -X DELETE http://localhost:8080/api/v1/sources/my-source
```

## Creating Sources via API

In addition to configuration files, you can create sources dynamically via the REST API:

```bash
curl -X POST http://localhost:8080/api/v1/sources \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "mock",
    "id": "dynamic-source",
    "auto_start": true,
    "data_type": "sensor",
    "interval_ms": 5000
  }'
```

## Bootstrap Providers

Bootstrap providers load initial data before streaming begins. See [Configure Bootstrap Providers](/drasi-server/how-to-guides/configure-bootstrap-providers/) for details.

Available bootstrap providers:

| Provider | Description |
|----------|-------------|
| `postgres` | Load initial data from PostgreSQL using COPY |
| `scriptfile` | Load from JSONL files |
| `platform` | Load from remote Drasi Query API |
| `noop` | No initial data |

Example:

```yaml
sources:
  - kind: postgres
    id: orders-db
    # ... connection config
    bootstrap_provider:
      type: postgres
```

## Environment Variables

All source configuration values support environment variable interpolation:

```yaml
sources:
  - kind: postgres
    id: production-db
    host: ${DB_HOST}
    password: ${DB_PASSWORD}
```

See [Configuration File](/drasi-server/how-to-guides/installation/configuration-file/) for details.

## Next Steps

- Choose a source type from the guides above
- [Configure Bootstrap Providers](/drasi-server/how-to-guides/configure-bootstrap-providers/) - Load initial data
- [Write Continuous Queries](/drasi-server/how-to-guides/write-continuous-queries/) - Query your sources
