---
type: "docs"
title: "Configuration Reference"
linkTitle: "Configuration"
weight: 30
description: "Complete YAML configuration schema for Drasi Server"
---

# Configuration Reference

Complete reference for Drasi Server YAML configuration.

## Configuration File

Default location: `config/server.yaml`

Override with: `--config <PATH>`

## Server Settings

```yaml
id: my-server
host: 0.0.0.0
port: 8080
log_level: info
persist_config: true
persist_index: false
default_priority_queue_capacity: 10000
default_dispatch_buffer_capacity: 1000
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | string | Auto-generated UUID | Unique server identifier |
| `host` | string | `0.0.0.0` | Server bind address |
| `port` | integer | `8080` | REST API port |
| `log_level` | string | `info` | Log level: `trace`, `debug`, `info`, `warn`, `error` |
| `persist_config` | boolean | `true` | Save API changes to config file |
| `persist_index` | boolean | `false` | Use RocksDB for persistent query indexes |
| `default_priority_queue_capacity` | integer | `10000` | Default queue capacity |
| `default_dispatch_buffer_capacity` | integer | `1000` | Default buffer capacity |

## State Store

```yaml
state_store:
  kind: redb
  path: ./data/state.redb
```

### REDB State Store

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `kind` | string | Yes | Must be `redb` |
| `path` | string | Yes | Path to database file |

## Sources

### Common Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `kind` | string | Required | Source type |
| `id` | string | Required | Unique identifier |
| `auto_start` | boolean | `true` | Start automatically |
| `bootstrap_provider` | object | None | Bootstrap configuration |

### PostgreSQL Source

```yaml
sources:
  - kind: postgres
    id: my-db
    host: localhost
    port: 5432
    database: mydb
    user: postgres
    password: ${DB_PASSWORD}
    tables:
      - public.orders
    slot_name: drasi_slot
    publication_name: drasi_publication
    ssl_mode: prefer
    table_keys:
      - table: order_items
        key_columns: [order_id, product_id]
    bootstrap_provider:
      type: postgres
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `host` | string | `localhost` | Database host |
| `port` | integer | `5432` | Database port |
| `database` | string | Required | Database name |
| `user` | string | Required | Database user |
| `password` | string | `""` | Database password |
| `tables` | array | `[]` | Tables to monitor |
| `slot_name` | string | `drasi_slot` | Replication slot name |
| `publication_name` | string | `drasi_publication` | Publication name |
| `ssl_mode` | string | `prefer` | `disable`, `prefer`, `require` |
| `table_keys` | array | `[]` | Primary key definitions |

### HTTP Source

```yaml
sources:
  - kind: http
    id: webhook
    host: 0.0.0.0
    port: 9000
    endpoint: /events
    timeout_ms: 10000
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `host` | string | Required | Listen address |
| `port` | integer | Required | Listen port |
| `endpoint` | string | Auto-generated | Custom endpoint path |
| `timeout_ms` | integer | `10000` | Request timeout |

### gRPC Source

```yaml
sources:
  - kind: grpc
    id: stream
    host: 0.0.0.0
    port: 50051
    timeout_ms: 5000
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `host` | string | `0.0.0.0` | Listen address |
| `port` | integer | `50051` | Listen port |
| `timeout_ms` | integer | `5000` | Connection timeout |

### Mock Source

```yaml
sources:
  - kind: mock
    id: test
    data_type: sensor
    interval_ms: 5000
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `data_type` | string | `generic` | Type of mock data |
| `interval_ms` | integer | `5000` | Generation interval |

### Platform Source

```yaml
sources:
  - kind: platform
    id: events
    redis_url: redis://localhost:6379
    stream_key: my-stream
    consumer_group: drasi-server
    batch_size: 100
    block_ms: 5000
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `redis_url` | string | Required | Redis connection URL |
| `stream_key` | string | Required | Redis stream key |
| `consumer_group` | string | `drasi-core` | Consumer group name |
| `consumer_name` | string | Auto-generated | Consumer name |
| `batch_size` | integer | `100` | Events per batch |
| `block_ms` | integer | `5000` | Block timeout |

## Queries

```yaml
queries:
  - id: my-query
    query: "MATCH (n:Order) RETURN n"
    queryLanguage: Cypher
    sources:
      - source_id: my-db
        nodes: [Order, Customer]
    joins:
      - id: CUSTOMER
        keys:
          - label: Order
            property: customer_id
          - label: Customer
            property: id
    auto_start: true
    enableBootstrap: true
    bootstrapBufferSize: 10000
    priority_queue_capacity: 10000
    dispatch_buffer_capacity: 1000
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | string | Required | Unique identifier |
| `query` | string | Required | Query string |
| `queryLanguage` | string | `Cypher` | `Cypher` or `GQL` |
| `sources` | array | Required | Source subscriptions |
| `joins` | array | None | Synthetic join definitions |
| `auto_start` | boolean | `true` | Start automatically |
| `enableBootstrap` | boolean | `true` | Process initial data |
| `bootstrapBufferSize` | integer | `10000` | Bootstrap buffer size |
| `priority_queue_capacity` | integer | Global default | Queue capacity |
| `dispatch_buffer_capacity` | integer | Global default | Buffer capacity |

### Source Subscription

| Field | Type | Description |
|-------|------|-------------|
| `source_id` | string | Source identifier |
| `nodes` | array | Node labels to include |
| `relations` | array | Relation types to include |

### Synthetic Join

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Relationship type name |
| `keys` | array | Key mapping |
| `keys[].label` | string | Node label |
| `keys[].property` | string | Property for matching |

## Reactions

### Common Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `kind` | string | Required | Reaction type |
| `id` | string | Required | Unique identifier |
| `queries` | array | Required | Query IDs to subscribe to |
| `auto_start` | boolean | `true` | Start automatically |

### Log Reaction

```yaml
reactions:
  - kind: log
    id: console
    queries: [my-query]
    routes:
      my-query:
        added:
          template: "New: {{json after}}"
    default_template:
      added:
        template: "Added: {{json after}}"
```

### HTTP Reaction

```yaml
reactions:
  - kind: http
    id: webhook
    queries: [my-query]
    base_url: https://api.example.com
    token: ${API_TOKEN}
    timeout_ms: 5000
    routes:
      my-query:
        added:
          url: /events
          method: POST
          body: '{{json after}}'
          headers:
            Content-Type: application/json
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `base_url` | string | `http://localhost` | Base URL |
| `token` | string | None | Bearer token |
| `timeout_ms` | integer | `5000` | Request timeout |
| `routes` | object | `{}` | Per-query configurations |

### gRPC Reaction

```yaml
reactions:
  - kind: grpc
    id: stream
    queries: [my-query]
    endpoint: grpc://localhost:50052
    timeout_ms: 5000
    batch_size: 100
    max_retries: 3
    metadata:
      x-api-key: ${API_KEY}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `endpoint` | string | `grpc://localhost:50052` | gRPC endpoint |
| `timeout_ms` | integer | `5000` | Connection timeout |
| `batch_size` | integer | `100` | Events per batch |
| `batch_flush_timeout_ms` | integer | `1000` | Batch flush timeout |
| `max_retries` | integer | `3` | Max retry attempts |
| `metadata` | object | `{}` | gRPC metadata |

### SSE Reaction

```yaml
reactions:
  - kind: sse
    id: stream
    queries: [my-query]
    host: 0.0.0.0
    port: 8081
    sse_path: /events
    heartbeat_interval_ms: 30000
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `host` | string | `0.0.0.0` | Listen address |
| `port` | integer | `8080` | Listen port |
| `sse_path` | string | `/events` | SSE endpoint path |
| `heartbeat_interval_ms` | integer | `30000` | Heartbeat interval |

### Platform Reaction

```yaml
reactions:
  - kind: platform
    id: redis
    queries: [my-query]
    redis_url: redis://localhost:6379
    pubsub_name: events
    batch_enabled: true
    batch_max_size: 100
    max_stream_length: 100000
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `redis_url` | string | Required | Redis connection URL |
| `pubsub_name` | string | Auto-generated | Stream key |
| `emit_control_events` | boolean | `false` | Emit control events |
| `batch_enabled` | boolean | `false` | Enable batching |
| `batch_max_size` | integer | `100` | Max batch size |
| `batch_max_wait_ms` | integer | `100` | Max wait time |
| `max_stream_length` | integer | Unlimited | Max stream length |

### Profiler Reaction

```yaml
reactions:
  - kind: profiler
    id: metrics
    queries: [my-query]
    window_size: 100
    report_interval_secs: 60
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `window_size` | integer | `100` | Metrics window size |
| `report_interval_secs` | integer | `60` | Report interval |

## Bootstrap Providers

### PostgreSQL

```yaml
bootstrap_provider:
  type: postgres
```

### Scriptfile

```yaml
bootstrap_provider:
  type: scriptfile
  file_paths:
    - /data/initial.jsonl
```

### Platform

```yaml
bootstrap_provider:
  type: platform
  query_api_url: http://remote:8080
  timeout_seconds: 300
```

### No-Op

```yaml
bootstrap_provider:
  type: noop
```

## Multi-Instance

```yaml
instances:
  - id: analytics
    persist_index: true
    state_store:
      kind: redb
      path: ./data/analytics.redb
    sources: [...]
    queries: [...]
    reactions: [...]
```

## Environment Variables

### Syntax

| Pattern | Behavior |
|---------|----------|
| `${VAR}` | Required - fails if not set |
| `${VAR:-default}` | Optional with default |

### Example

```yaml
host: ${SERVER_HOST:-0.0.0.0}
port: ${SERVER_PORT:-8080}
sources:
  - kind: postgres
    host: ${DB_HOST}
    password: ${DB_PASSWORD}
```
