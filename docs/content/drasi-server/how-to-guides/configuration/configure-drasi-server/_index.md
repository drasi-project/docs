---
type: "docs"
title: "Configure Drasi Server"
linkTitle: "Configure Drasi Server"
weight: 10
description: "Understanding the Drasi Server YAML configuration file structure"
related:
  tutorials:
    - title: "Getting Started"
      url: "/drasi-server/getting-started/"
  concepts:
    - title: "Sources"
      url: "/concepts/sources/"
    - title: "Continuous Queries"
      url: "/concepts/continuous-queries/"
    - title: "Reactions"
      url: "/concepts/reactions/"
  howto:
    - title: "Configure Sources"
      url: "/drasi-server/how-to-guides/configuration/configure-sources/"
    - title: "Configure Reactions"
      url: "/drasi-server/how-to-guides/configuration/configure-reactions/"
    - title: "Configure Bootstrap Providers"
      url: "/drasi-server/how-to-guides/configuration/configure-bootstrap-providers/"
    - title: "Install with Docker"
      url: "/drasi-server/how-to-guides/installation/install-with-docker/"
  reference:
    - title: "Configuration Reference"
      url: "/drasi-server/reference/configuration/"
---

{{< term "Drasi Server" >}} uses a single configuration file (YAML or JSON) to define server settings, {{< term "Source" "sources" >}}, {{< term "Continuous Query" "queries" >}}, and {{< term "Reaction" "reactions" >}}.

If a Source requires initial state, you can attach a **Bootstrap Provider** to that Source in the same file. Bootstrap provider configuration is documented separately; this page focuses on the overall shape and server-level settings.

## Important: strict camelCase keys

Drasi Server configuration is **strictly validated**: keys must use **camelCase** (for example, `logLevel`, not `log_level`). Unknown fields are rejected to catch typos early.

Use [`drasi-server validate`](#validating-configuration) to confirm a config file is accepted before starting the server.

## Configuration File Location

By default, Drasi Server looks for configuration at `config/server.yaml`. Override with the `--config` flag:

```bash
drasi-server --config /path/to/my-config.yaml
```

## Quick start (minimal)

This is the smallest practical config to get Drasi Server running end-to-end (a Source, a query, and a Reaction). Use it as a starting point, then replace the `mock` Source with a real Source and add your own queries/reactions.

```yaml
host: 0.0.0.0
port: 8080
logLevel: info

sources:
  - kind: mock
    id: demo
    autoStart: true
    dataType: generic
    intervalMs: 1000

queries:
  - id: all
    queryLanguage: GQL
    query: "MATCH (n) RETURN n"
    sources:
      - sourceId: demo

reactions:
  - kind: log
    id: console
    autoStart: true
    queries: [all]
```

## Basic Structure

A complete configuration file has this structure (component-specific fields are omitted here):

```yaml
# Server identification
id: my-server

# Server settings
host: 0.0.0.0
port: 8080
logLevel: info

# Persistence settings
persistConfig: true
persistIndex: false

# State store for plugin state (optional)
stateStore:
  kind: redb
  path: ./data/state.redb

# Performance tuning (optional)
# (if omitted, DrasiLib defaults are used)
defaultPriorityQueueCapacity: 10000
defaultDispatchBufferCapacity: 1000

# Sources (see: Configure Sources)
sources:
  - kind: postgres
    id: db
    autoStart: true
    # optional per-source bootstrap
    bootstrapProvider:
      kind: postgres
    # ... source-specific configuration

# Queries
queries:
  - id: example
    queryLanguage: GQL
    query: "MATCH (n) RETURN n"
    sources:
      - sourceId: db

# Reactions (see: Configure Reactions)
reactions:
  - kind: log
    id: console
    queries: [example]
    autoStart: true

# Multi-instance configuration (optional)
instances: []
```

## Server Settings

Top-level settings in `server.yaml`:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | string | Auto-generated UUID | Unique server identifier (also used as the default instance id when `instances` is empty) |
| `host` | string | `0.0.0.0` | Server bind address |
| `port` | integer | `8080` | REST API port |
| `logLevel` | string | `info` | Log level: `trace`, `debug`, `info`, `warn`, `error` |
| `persistConfig` | boolean | `true` | Persist API changes back to the config file (if writable) |
| `persistIndex` | boolean | `false` | When `true`, RocksDB-backed persistent indexes become the default backend for all queries in the instance (stored under `./data/<instanceId>/index`); when `false`, queries use in-memory indexes |
| `stateStore` | object | None | Persist plugin state across restarts (see below) |
| `defaultPriorityQueueCapacity` | integer | None | Default event queue capacity for queries/reactions (if set, overrides DrasiLib defaults) |
| `defaultDispatchBufferCapacity` | integer | None | Default dispatch buffer capacity for sources/queries (if set, overrides DrasiLib defaults) |
| `sources` | array | `[]` | Source plugin instances (see: Configure Sources) |
| `queries` | array | `[]` | Continuous queries |
| `reactions` | array | `[]` | Reactions to query changes (see: Configure Reactions) |
| `instances` | array | `[]` | Optional multi-instance mode (see below) |

### Example

```yaml
id: production-server
host: 0.0.0.0
port: 8080
logLevel: info
persistConfig: true
persistIndex: true
```

## State Store Configuration

The state store persists plugin state across server restarts.

This is used by plugins (Sources, Bootstrap Providers, and Reactions) that need durable runtime state (for example, checkpoints / offsets / cursors), independent of whether you enable `persistIndex` (query indexing).

### REDB State Store

File-based persistent storage:

```yaml
stateStore:
  kind: redb
  path: ./data/state.redb
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `kind` | string | Yes | Must be `redb` |
| `path` | string | Yes | Path to database file |

### In-Memory (Default)

If `stateStore` is not configured, an in-memory store is used and plugin state is lost on restart.

## Performance Tuning

These settings control queue/buffer sizing in DrasiLib. They are most useful for high-throughput workloads or when you want to set consistent defaults across multiple queries/sources.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `defaultPriorityQueueCapacity` | integer | None | Default event priority queue capacity for queries/reactions (if set, overrides DrasiLib defaults) |
| `defaultDispatchBufferCapacity` | integer | None | Default dispatch buffer capacity for sources/queries (if set, overrides DrasiLib defaults) |

```yaml
defaultPriorityQueueCapacity: 50000
defaultDispatchBufferCapacity: 5000
```

These can be overridden per-query:

```yaml
queries:
  - id: high-volume-query
    query: "MATCH (n) RETURN n"
    sources:
      - sourceId: my-source
    priorityQueueCapacity: 100000
    dispatchBufferCapacity: 10000
```

## Queries (overview)

Query configuration lives under `queries:`.

This page covers the **common fields** shared by all queries; see the query language docs for authoring queries, and the component pages for details about Sources, Bootstrap Providers, and Reactions.

### Common query fields

| Field | Type | Default | Notes |
|------|------|---------|------|
| `id` | string | (required) | Query identifier referenced by Reactions |
| `autoStart` | boolean | `false` | Start the query automatically on server start |
| `queryLanguage` | string | `GQL` | One of `GQL` or `Cypher` |
| `query` | string | (required) | The query text |
| `sources` | array | `[]` | Subscribed sources; entries include `sourceId` and optional filters |
| `enableBootstrap` | boolean | `true` | Whether to request bootstrap data for this query |
| `bootstrapBufferSize` | integer | `10000` | Buffer size used during bootstrap replay |
| `joins` | array/object | None | Join configuration (advanced; structure depends on the join config used) |
| `priorityQueueCapacity` | integer | None | Per-query override for the event priority queue capacity |
| `dispatchBufferCapacity` | integer | None | Per-query override for the dispatch buffer capacity |
| `dispatchMode` | string | None | Advanced; currently only `Channel` is accepted when set |
| `storageBackend` | string or object | Instance default | Per-query index backend override: a registered provider name (`rocksdb`, requires `persistIndex: true`), or an inline object (`kind: memory`). See [Configure Queries](/drasi-server/how-to-guides/configuration/configure-queries/#storage-backend-configuration) |
| `middleware` | array | `[]` | Reserved for future use (currently ignored) |

## Environment Variable Interpolation

Many scalar configuration values support environment variable substitution.

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

Drasi Server loads a `.env` file **from the same directory as your config file** (if present). This is primarily for local development.

```bash
# config/.env
DB_HOST=postgres.example.com
DB_PASSWORD=secretpassword
```

## Creating Configuration Interactively

Use the `init` command to create a configuration file interactively:

```bash
drasi-server init --output config/server.yaml
```

The wizard guides you through:
- **Server settings** — Host, port, log level, persistence options
- **Sources** — Database connections with table selection and primary key configuration
- **Reactions** — Output destinations for query results

Options:
- `--output`, `-o`: Output path (default: `config/server.yaml`)
- `--force`: Overwrite existing file

## Validating Configuration

Validate before starting the server:

```bash
# Basic validation
drasi-server validate --config config/server.yaml

# Show resolved server settings (host/port/logLevel)
drasi-server validate --config config/server.yaml --show-resolved
```

## Multi-Instance Configuration

For advanced use cases, configure multiple isolated DrasiLib instances.

When `instances` is set (non-empty), Drasi Server uses the per-instance `sources`, `queries`, and `reactions` lists (the top-level lists are ignored).

```yaml
host: 0.0.0.0
port: 8080
logLevel: info

instances:
  - id: analytics
    persistIndex: true
    stateStore:
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
          - sourceId: analytics-db
    reactions:
      - kind: log
        id: analytics-log
        queries: [analytics-query]

  - id: monitoring
    persistIndex: false
    sources:
      - kind: http
        id: metrics-api
        host: 0.0.0.0
        port: 9001
    queries:
      - id: alert-threshold
        query: "MATCH (m:Metric) WHERE m.value > m.threshold RETURN m"
        sources:
          - sourceId: metrics-api
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

For convenience, the **first** configured instance is also available via shortened routes under `/api/v1/` (for example, `/api/v1/sources`, `/api/v1/queries`, `/api/v1/reactions`).

## Complete Example

This example shows a complete single-instance configuration using Sources, a query, and a few Reactions. For the full set of settings supported by each component, follow the links in [Next Steps](#next-steps).

```yaml
# Server identification and settings
id: drasi-production
host: 0.0.0.0
port: 8080
logLevel: info

# Enable persistence
persistConfig: true
persistIndex: true

# State store
stateStore:
  kind: redb
  path: ${DATA_PATH:-./data}/state.redb

# Performance settings
# (optional; if omitted, DrasiLib defaults are used)
defaultPriorityQueueCapacity: ${PRIORITY_QUEUE_CAPACITY:-10000}
defaultDispatchBufferCapacity: ${DISPATCH_BUFFER_CAPACITY:-1000}

# Sources
sources:
  - kind: postgres
    id: orders-db
    autoStart: true
    host: ${DB_HOST}
    port: ${DB_PORT:-5432}
    database: ${DB_NAME}
    user: ${DB_USER}
    password: ${DB_PASSWORD}
    sslMode: prefer
    tables:
      - public.orders
      - public.customers
    slotName: drasi_slot
    publicationName: drasi_publication
    tableKeys:
      - table: public.orders
        keyColumns: [id]
    bootstrapProvider:
      kind: postgres

  - kind: http
    id: webhook-receiver
    autoStart: true
    host: 0.0.0.0
    port: 9000
    timeoutMs: 10000

# Queries
queries:
  - id: high-value-orders
    autoStart: true
    queryLanguage: GQL
    query: |
      MATCH (o:orders)
      WHERE o.total > 1000
      RETURN o.id, o.customer_id, o.total, o.status
    sources:
      - sourceId: orders-db
    enableBootstrap: true

  - id: pending-orders
    autoStart: true
    queryLanguage: GQL
    query: |
      MATCH (o:orders)-[:CUSTOMER]->(c:customers)
      WHERE o.status = 'pending'
      RETURN o.id, c.name, c.email, o.total
    sources:
      - sourceId: orders-db
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
    autoStart: true
    defaultTemplate:
      added:
        template: "[NEW] Order {{after.id}}: ${{after.total}}"
      updated:
        template: "[UPDATE] Order {{after.id}}: ${{before.total}} -> ${{after.total}}"
      deleted:
        template: "[DELETED] Order {{before.id}}"

  - kind: http
    id: webhook-notification
    queries: [high-value-orders]
    autoStart: true
    baseUrl: ${WEBHOOK_URL}
    token: ${WEBHOOK_TOKEN}
    timeoutMs: 5000
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
    autoStart: true
    host: 0.0.0.0
    port: 8081
    ssePath: /events
    heartbeatIntervalMs: 30000
```

## Configuration File Formats

Drasi Server supports both YAML and JSON configuration files. It tries to parse the file as YAML first and falls back to JSON if YAML parsing fails.

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

## Configuration Patterns

### Managing Secrets with Environment Variables

Never store secrets directly in configuration files. Use environment variables:

```yaml
sources:
  - kind: postgres
    id: production-db
    host: ${DB_HOST}
    database: ${DB_NAME}
    user: ${DB_USER}
    password: ${DB_PASSWORD}   # Required - no default
```

Create a `.env` file in the same directory as your config (for development only):

```bash
# config/.env - DO NOT COMMIT TO VERSION CONTROL
DB_HOST=localhost
DB_NAME=myapp
DB_USER=drasi
DB_PASSWORD=secret123
```

For production, set environment variables through your deployment platform (Docker, systemd, etc.).

### Separating Concerns with Multiple Config Files

For complex deployments, consider organizing configs by environment:

```
config/
├── base.yaml          # Shared settings
├── development.yaml   # Dev overrides
└── production.yaml    # Prod settings
```

Currently Drasi Server loads a single config file, so you'd use a tool like `yq` to merge them:

```bash
# Merge base + production
yq eval-all 'select(fileIndex == 0) * select(fileIndex == 1)' \
  config/base.yaml config/production.yaml > config/merged.yaml

drasi-server --config config/merged.yaml
```

### Validating Before Deployment

Always validate configuration before deploying:

```bash
# Basic validation
drasi-server validate --config config/server.yaml

# Show resolved values (with env vars expanded)
drasi-server validate --config config/server.yaml --show-resolved

# Use in CI/CD pipelines
drasi-server validate --config config/server.yaml || exit 1
```

### Development vs Production Configuration

**Development** — Prioritize fast iteration and visibility:

```yaml
logLevel: debug
persistConfig: false      # Don't save API changes
persistIndex: false       # In-memory indexes (faster startup)

sources:
  - kind: mock
    id: test-data
    dataType: sensor_reading
    intervalMs: 1000      # Fast data generation
```

**Production** — Prioritize reliability and persistence:

```yaml
logLevel: info
persistConfig: true       # Save API changes
persistIndex: true        # Persistent indexes survive restart

stateStore:
  kind: redb
  path: /var/lib/drasi/state.redb

sources:
  - kind: postgres
    id: orders-db
    host: ${DB_HOST}
    # ... full connection config
```

## Troubleshooting Configuration

### Common Errors

| Error Message | Cause | Solution |
|---------------|-------|----------|
| `unknown field 'log_level'` | Snake_case key used | Use camelCase: `logLevel` |
| `missing field 'kind'` | Source/reaction missing `kind` | Add `kind: postgres` (or appropriate type) |
| `unknown source kind 'postgresql'` | Typo in kind value | Use exact spelling: `postgres` |
| `Required environment variable not set` | `${VAR}` syntax with unset var | Set the variable or use `${VAR:-default}` |
| `Invalid host '...'` | Bad hostname format | Use valid hostname or IP address |
| `Invalid port 0` | Port out of range | Use port 1-65535 |

### Debugging Tips

1. **Start with minimal config** — Get the basics working before adding complexity
2. **Use `--show-resolved`** — See what values Drasi Server actually receives
3. **Check logs** — Set `logLevel: debug` for detailed startup information
4. **Validate incrementally** — Add one source/query/reaction at a time
```
