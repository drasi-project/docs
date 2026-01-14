---
type: "docs"
title: "Configure Reactions"
linkTitle: "Configure Reactions"
weight: 40
no_list: true
description: "Set up actions triggered by data changes"
---

# Configure Reactions

Reactions process query result changes and perform actions. Drasi Server supports several reaction types for different output needs.

## Available Reaction Types

<div class="card-grid">
  <a href="configure-log-reaction/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-terminal"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Log</h3>
        <p class="unified-card-summary">Output query results to console with templates</p>
      </div>
    </div>
  </a>
  <a href="configure-http-reaction/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-globe"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">HTTP</h3>
        <p class="unified-card-summary">Send webhooks and HTTP requests on changes</p>
      </div>
    </div>
  </a>
  <a href="configure-grpc-reaction/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-network-wired"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">gRPC</h3>
        <p class="unified-card-summary">Stream results via gRPC</p>
      </div>
    </div>
  </a>
  <a href="configure-sse-reaction/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-broadcast-tower"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">SSE</h3>
        <p class="unified-card-summary">Stream results via Server-Sent Events</p>
      </div>
    </div>
  </a>
  <a href="configure-platform-reaction/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-stream"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Platform</h3>
        <p class="unified-card-summary">Publish to Redis Streams</p>
      </div>
    </div>
  </a>
  <a href="configure-profiler-reaction/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-chart-line"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Profiler</h3>
        <p class="unified-card-summary">Collect performance metrics</p>
      </div>
    </div>
  </a>
</div>

## Choosing a Reaction Type

| Reaction Type | Best For | Output Type |
|---------------|----------|-------------|
| **Log** | Development, debugging | Console output |
| **HTTP** | Webhooks, API integrations | HTTP requests |
| **gRPC** | High-performance streaming | gRPC stream |
| **SSE** | Browser clients, dashboards | Server-Sent Events |
| **Platform** | Redis/Drasi Platform integration | Redis Streams |
| **Profiler** | Performance monitoring | Metrics |

## Common Reaction Configuration

All reactions share these common fields:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `kind` | string | Required | Reaction type |
| `id` | string | Required | Unique reaction identifier |
| `queries` | array | Required | Query IDs to subscribe to |
| `auto_start` | boolean | `true` | Start reaction automatically |

### Basic Example

```yaml
reactions:
  - kind: log
    id: my-reaction
    queries: [query-1, query-2]
    auto_start: true
```

## Change Types

Reactions receive three types of changes:

| Change Type | Description | Data Available |
|-------------|-------------|----------------|
| `added` | New item in query results | `after` |
| `updated` | Existing item changed | `before`, `after` |
| `deleted` | Item removed from results | `before` |

### Template Data

In templates, access change data using:

- `{{after}}` - New/current state of the data
- `{{before}}` - Previous state (for `updated` and `deleted`)
- `{{after.property}}` - Access specific property

## Reaction Lifecycle

### Auto-Start Behavior

When `auto_start: true` (default), reactions start automatically when the server starts.

When `auto_start: false`, start reactions manually:

```bash
curl -X POST http://localhost:8080/api/v1/reactions/my-reaction/start
```

### Checking Reaction Status

List all reactions:

```bash
curl http://localhost:8080/api/v1/reactions
```

Get specific reaction details:

```bash
curl http://localhost:8080/api/v1/reactions/my-reaction
```

### Stopping a Reaction

```bash
curl -X POST http://localhost:8080/api/v1/reactions/my-reaction/stop
```

### Deleting a Reaction

```bash
curl -X DELETE http://localhost:8080/api/v1/reactions/my-reaction
```

## Creating Reactions via API

Create reactions dynamically:

```bash
curl -X POST http://localhost:8080/api/v1/reactions \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "log",
    "id": "dynamic-reaction",
    "queries": ["my-query"],
    "auto_start": true
  }'
```

## Multiple Reactions

Subscribe multiple reactions to the same query:

```yaml
queries:
  - id: high-value-orders
    query: "MATCH (o:Order) WHERE o.total > 1000 RETURN o"
    sources:
      - source_id: orders-db

reactions:
  # Log for debugging
  - kind: log
    id: order-log
    queries: [high-value-orders]

  # Webhook for alerts
  - kind: http
    id: order-webhook
    queries: [high-value-orders]
    base_url: https://alerts.example.com
    routes:
      high-value-orders:
        added:
          url: /new-order
          method: POST

  # SSE for dashboard
  - kind: sse
    id: order-stream
    queries: [high-value-orders]
    port: 8081
```

## Environment Variables

All reaction configuration values support environment variable interpolation:

```yaml
reactions:
  - kind: http
    id: webhook
    queries: [my-query]
    base_url: ${WEBHOOK_URL}
    token: ${WEBHOOK_TOKEN}
```

## Per-Query Configuration

Most reactions support per-query configuration:

```yaml
reactions:
  - kind: http
    id: multi-query-webhook
    queries: [orders, inventory]
    base_url: https://api.example.com
    routes:
      orders:
        added:
          url: /orders
          method: POST
      inventory:
        added:
          url: /inventory
          method: POST
```

## Next Steps

- Choose a reaction type from the guides above
- [Write Continuous Queries](/drasi-server/how-to-guides/write-continuous-queries/) - Define what changes to detect
- [Configure Sources](/drasi-server/how-to-guides/configure-sources/) - Connect to data
