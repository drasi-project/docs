---
type: "docs"
title: "Configuration Reference"
linkTitle: "Configuration"
weight: 30
description: "Authoritative reference for Drasi Server configuration (server + instance settings)"
related:
  concepts:
    - title: "Sources"
      url: "/concepts/sources/"
    - title: "Continuous Queries"
      url: "/concepts/continuous-queries/"
    - title: "Reactions"
      url: "/concepts/reactions/"
  howto:
    - title: "Configure Drasi Server"
      url: "/drasi-server/how-to-guides/configuration/configure-drasi-server/"
    - title: "Configure Sources"
      url: "/drasi-server/how-to-guides/configuration/configure-sources/"
    - title: "Configure Reactions"
      url: "/drasi-server/how-to-guides/configuration/configure-reactions/"
    - title: "Configure Bootstrap Providers"
      url: "/drasi-server/how-to-guides/configuration/configure-bootstrap-providers/"
  reference:
    - title: "CLI Reference"
      url: "/drasi-server/reference/cli/"
---

# Configuration Reference

This page is the authoritative reference for the **Drasi Server configuration file** itself.

It covers:

- **Server-level settings** (host/port/logging/persistence)
- **Instance settings** for the embedded DrasiLib runtime (single instance or `instances:` multi-instance mode)

It does **not** document the per-component configuration for Sources, Queries, Reactions, or Bootstrap Providers (those have dedicated pages).

## Quick Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | string | UUID | Server/instance identifier |
| `host` | string | `0.0.0.0` | API bind address |
| `port` | integer | `8080` | API port |
| `logLevel` | string | `info` | `trace`, `debug`, `info`, `warn`, `error` |
| `persistConfig` | boolean | `true` | Save API changes to config file |
| `persistIndex` | boolean | `false` | Use persistent RocksDB indexes |
| `stateStore` | object | None | Plugin state persistence |
| `defaultPriorityQueueCapacity` | integer | None | Default queue size |
| `defaultDispatchBufferCapacity` | integer | None | Default buffer size |
| `sources` | array | `[]` | Source configurations |
| `queries` | array | `[]` | Query configurations |
| `reactions` | array | `[]` | Reaction configurations |
| `instances` | array | `[]` | Multi-instance configurations |

## Key rules

- Config is **YAML or JSON**.
- Keys are **strictly camelCase** and **unknown fields are rejected**.
- Many scalar values support **environment variable interpolation** (see below).

## File location

Default path: `config/server.yaml`

Override with:

```bash
drasi-server --config /path/to/server.yaml
```

{{< alert title="Port override" color="info" >}}
You can override the configured port at runtime with `--port`. The config file still remains the source of truth for the persisted configuration.
{{< /alert >}}

## Minimal Configuration

```yaml
# Smallest useful config - mock source with log output
host: 0.0.0.0
port: 8080

sources:
  - kind: mock
    id: test
    dataType: sensor_reading

queries:
  - id: all-data
    query: "MATCH (n) RETURN n"
    sources:
      - sourceId: test
    autoStart: true

reactions:
  - kind: log
    id: console
    queries: [all-data]
    autoStart: true
```

## Full Configuration Example

```yaml
# Complete production-ready configuration
id: production-server
host: 0.0.0.0
port: ${PORT:-8080}
logLevel: ${LOG_LEVEL:-info}

persistConfig: true
persistIndex: true

stateStore:
  kind: redb
  path: ${DATA_DIR:-./data}/state.redb

defaultPriorityQueueCapacity: 50000
defaultDispatchBufferCapacity: 5000

sources:
  - kind: postgres
    id: orders-db
    autoStart: true
    host: ${DB_HOST}
    port: ${DB_PORT:-5432}
    database: ${DB_NAME}
    user: ${DB_USER}
    password: ${DB_PASSWORD}
    tables:
      - public.orders
      - public.customers
    bootstrapProvider:
      kind: postgres

queries:
  - id: pending-orders
    autoStart: true
    query: |
      MATCH (o:orders)
      WHERE o.status = 'pending'
      RETURN o.id, o.total, o.customer_id
    sources:
      - sourceId: orders-db

reactions:
  - kind: http
    id: webhook
    queries: [pending-orders]
    autoStart: true
    baseUrl: ${WEBHOOK_URL}
    token: ${WEBHOOK_TOKEN}
    routes:
      pending-orders:
        added:
          url: /orders/new
          method: POST
```

## Top-level schema (overview)

```yaml
# Server identity (also used as the default instance id in single-instance mode)
id: my-server

# Server HTTP API binding
host: 0.0.0.0
port: 8080

# Logging
logLevel: info

# Persist API changes back to the config file (if the file is writable)
persistConfig: true

# Single-instance mode instance settings (used when instances: [] is empty)
persistIndex: false
stateStore: null

defaultPriorityQueueCapacity: null
defaultDispatchBufferCapacity: null

# Component lists (structure documented on their dedicated pages)
sources: []
queries: []
reactions: []

# Multi-instance mode (when non-empty, the single-instance fields above are ignored)
instances: []
```

## Server settings (always top-level)

These settings apply to the Drasi Server process itself.

| Field | Type | Default | Description |
|---|---:|---:|---|
| `id` | string | Auto-generated UUID | Unique server identifier. In **single-instance mode**, this is also used as the DrasiLib instance id. |
| `host` | string | `0.0.0.0` | Bind address for the Drasi Server HTTP API. Must be a valid hostname or IP address. |
| `port` | integer | `8080` | HTTP API port (must be 1–65535). |
| `logLevel` | string | `info` | Log level: `trace`, `debug`, `info`, `warn`, `error`. |
| `persistConfig` | boolean | `true` | When `true` and the config file is writable, API changes are persisted back to the config file. |

### Notes

- **Read-only mode**: If the config file is not writable, Drasi Server runs the API in read-only mode (regardless of `persistConfig`).
- `persistConfig: false` means API changes are allowed but **won’t be saved** across restarts.

## Instance settings (single-instance mode)

When `instances` is empty (the default), Drasi Server runs **one** DrasiLib instance, using the following top-level fields.

| Field | Type | Default | Description |
|---|---:|---:|---|
| `persistIndex` | boolean | `false` | When `true`, RocksDB-backed persistent indexes become the default backend for all queries in the instance (stored under `./data/<instanceId>/index`); when `false`, queries use in-memory indexes. Individual queries can override this via `storageBackend` (see: [Configure Queries](/drasi-server/how-to-guides/configuration/configure-queries/#storage-backend-configuration)). |
| `stateStore` | object | none | Optional state store for plugin runtime state persistence (see below). |
| `defaultPriorityQueueCapacity` | integer | none | If set, overrides the DrasiLib default priority queue capacity for queries/reactions. |
| `defaultDispatchBufferCapacity` | integer | none | If set, overrides the DrasiLib default dispatch buffer capacity for sources/queries. |
| `sources` | array | `[]` | Source plugin instances (see: Configure Sources). |
| `queries` | array | `[]` | Continuous queries. |
| `reactions` | array | `[]` | Reactions to query result change events (see: Configure Reactions). |

## State store configuration

The state store allows plugins (Sources, Bootstrap Providers, Reactions) to persist **runtime state** that survives restarts.

If `stateStore` is omitted, an in-memory state store is used and plugin state is lost on restart.

### redb (file-based)

```yaml
stateStore:
  kind: redb
  path: ./data/state.redb
```

| Field | Type | Required | Description |
|---|---:|:---:|---|
| `kind` | string | Yes | Must be `redb`. |
| `path` | string | Yes | Path to the REDB file. Supports env interpolation (e.g. `${STATE_STORE_PATH:-./data/state.redb}`). |

## Multi-instance mode (instances)

When `instances` is **non-empty**, Drasi Server runs **one DrasiLib instance per entry** and uses **per-instance** component lists and instance settings.

{{< alert title="Important" color="warning" >}}
When `instances` is set, the following **top-level** fields are ignored for runtime behavior: `persistIndex`, `stateStore`, `defaultPriorityQueueCapacity`, `defaultDispatchBufferCapacity`, `sources`, `queries`, `reactions`.
{{< /alert >}}

### Instance fields

| Field | Type | Default | Description |
|---|---:|---:|---|
| `id` | string | Auto-generated UUID | Unique instance id (used in API routes and for persistence paths). |
| `persistIndex` | boolean | `false` | Enable persistent indexing for this instance. |
| `stateStore` | object | none | Optional per-instance state store. |
| `defaultPriorityQueueCapacity` | integer | none | Optional per-instance default. |
| `defaultDispatchBufferCapacity` | integer | none | Optional per-instance default. |
| `sources` | array | `[]` | Sources for this instance. |
| `queries` | array | `[]` | Queries for this instance. |
| `reactions` | array | `[]` | Reactions for this instance. |

### Example

```yaml
host: 0.0.0.0
port: 8080
logLevel: info
persistConfig: true

instances:
  - id: analytics
    persistIndex: true
    stateStore:
      kind: redb
      path: ./data/analytics.redb
    sources: []
    queries: []
    reactions: []

  - id: monitoring
    persistIndex: false
    sources: []
    queries: []
    reactions: []
```

## Environment variable interpolation

Many scalar config values support POSIX-style interpolation:

| Pattern | Behavior |
|---|---|
| `${VAR}` | Required. Loading fails if `VAR` is not set. |
| `${VAR:-default}` | Optional with default fallback. |

Example:

```yaml
host: ${SERVER_HOST:-0.0.0.0}
port: ${SERVER_PORT:-8080}
logLevel: ${DRASI_LOG_LEVEL:-info}
stateStore:
  kind: redb
  path: ${STATE_STORE_PATH:-./data/state.redb}
```

When running `drasi-server`, it will also attempt to load a `.env` file from the **same directory as the config file**.

## Common Validation Errors

| Error Message | Cause | Solution |
|---------------|-------|----------|
| `unknown field 'field_name'` | Using an unrecognized field name | Check spelling and use camelCase (e.g., `autoStart` not `auto_start`) |
| `missing field 'id'` | Required field not provided | Add the missing `id` field to the component |
| `invalid type: expected string` | Wrong data type | Check that the value type matches the schema (string, integer, boolean) |
| `Environment variable 'VAR' not set` | Required env var missing | Set the variable or use `${VAR:-default}` syntax |
| `invalid port: out of range` | Port number invalid | Use a port between 1 and 65535 |
| `duplicate id` | Two components share the same id | Ensure all source, query, and reaction IDs are unique |
| `unknown source 'sourceId'` | Query references non-existent source | Check the `sourceId` in query sources matches a defined source |
| `source 'id' already subscribed by 'query'` | Source used by multiple queries | Each source can only be subscribed to by one query |

## Validating configuration

Use the CLI to validate a configuration file without starting the server:

```bash
drasi-server validate --config config/server.yaml
```

To print resolved **server settings** (host/port/log level) after env expansion:

```bash
drasi-server validate --config config/server.yaml --show-resolved
```
