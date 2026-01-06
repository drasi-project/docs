---
type: "docs"
title: "Configure HTTP Source"
linkTitle: "HTTP"
weight: 20
description: "Receive events via HTTP endpoints"
---

The HTTP source creates an HTTP endpoint that receives events from external systems. Use it for webhooks, custom integrations, or any system that can send HTTP requests.

## Basic Configuration

```yaml
sources:
  - kind: http
    id: webhook-receiver
    auto_start: true
    host: 0.0.0.0
    port: 9000
    timeout_ms: 10000
```

## Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `kind` | string | Required | Must be `http` |
| `id` | string | Required | Unique source identifier |
| `auto_start` | boolean | `true` | Start source automatically |
| `host` | string | Required | Listen address |
| `port` | integer | Required | Listen port |
| `endpoint` | string | Auto-generated | Custom endpoint path |
| `timeout_ms` | integer | `10000` | Request timeout in milliseconds |

### Adaptive Batching Options

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `adaptive_enabled` | boolean | `false` | Enable adaptive batching |
| `adaptive_min_batch_size` | integer | None | Minimum batch size |
| `adaptive_max_batch_size` | integer | None | Maximum batch size |
| `adaptive_min_wait_ms` | integer | None | Minimum wait time |
| `adaptive_max_wait_ms` | integer | None | Maximum wait time |
| `adaptive_window_secs` | integer | None | Window for adaptive calculations |

## Sending Events

### Event Format

Send events as JSON to the HTTP endpoint:

```bash
curl -X POST http://localhost:9000/source/webhook-receiver \
  -H "Content-Type: application/json" \
  -d '{
    "op": "insert",
    "label": "Order",
    "id": "order-123",
    "properties": {
      "customer_id": "cust-456",
      "total": 99.99,
      "status": "pending"
    }
  }'
```

### Supported Operations

| Operation | Description |
|-----------|-------------|
| `insert` | Add a new node |
| `update` | Update an existing node |
| `delete` | Remove a node |

### Insert Event

```json
{
  "op": "insert",
  "label": "Order",
  "id": "order-123",
  "properties": {
    "customer_id": "cust-456",
    "total": 99.99,
    "status": "pending"
  }
}
```

### Update Event

```json
{
  "op": "update",
  "label": "Order",
  "id": "order-123",
  "properties": {
    "status": "shipped",
    "shipped_at": "2024-01-15T10:30:00Z"
  }
}
```

### Delete Event

```json
{
  "op": "delete",
  "label": "Order",
  "id": "order-123"
}
```

### Batch Events

Send multiple events in a single request:

```bash
curl -X POST http://localhost:9000/source/webhook-receiver \
  -H "Content-Type: application/json" \
  -d '[
    {"op": "insert", "label": "Order", "id": "order-1", "properties": {"total": 50}},
    {"op": "insert", "label": "Order", "id": "order-2", "properties": {"total": 75}},
    {"op": "update", "label": "Order", "id": "order-1", "properties": {"status": "paid"}}
  ]'
```

## Custom Endpoint

Specify a custom endpoint path:

```yaml
sources:
  - kind: http
    id: orders-webhook
    host: 0.0.0.0
    port: 9000
    endpoint: /webhooks/orders
```

Events would be sent to `http://localhost:9000/webhooks/orders`.

## Adaptive Batching

For high-throughput scenarios, enable adaptive batching:

```yaml
sources:
  - kind: http
    id: high-volume-events
    host: 0.0.0.0
    port: 9000
    timeout_ms: 30000
    adaptive_enabled: true
    adaptive_min_batch_size: 10
    adaptive_max_batch_size: 1000
    adaptive_min_wait_ms: 100
    adaptive_max_wait_ms: 5000
    adaptive_window_secs: 60
```

Adaptive batching dynamically adjusts batch sizes based on incoming event volume.

## Multiple HTTP Sources

Run multiple HTTP sources on different ports:

```yaml
sources:
  - kind: http
    id: orders-webhook
    host: 0.0.0.0
    port: 9000

  - kind: http
    id: inventory-webhook
    host: 0.0.0.0
    port: 9001

  - kind: http
    id: customers-webhook
    host: 0.0.0.0
    port: 9002
```

## Docker Port Mapping

When running in Docker, map the HTTP source ports:

```yaml
# docker-compose.yml
services:
  drasi-server:
    image: ghcr.io/drasi-project/drasi-server:latest
    ports:
      - "8080:8080"   # REST API
      - "9000:9000"   # HTTP source
      - "9001:9001"   # Another HTTP source
```

## Use Cases

### Webhook Integration

Receive webhooks from external services:

```yaml
sources:
  - kind: http
    id: github-webhooks
    host: 0.0.0.0
    port: 9000
    timeout_ms: 30000
```

Then configure your external service to send webhooks to `http://your-server:9000/source/github-webhooks`.

### Event Bridge

Bridge events from systems that can't connect directly:

```yaml
sources:
  - kind: http
    id: event-bridge
    host: 0.0.0.0
    port: 9000
```

Use a middleware or adapter to transform external events into the expected format.

### Testing and Development

Create test data programmatically:

```bash
# Generate test events
for i in {1..100}; do
  curl -X POST http://localhost:9000/source/test-source \
    -H "Content-Type: application/json" \
    -d "{\"op\": \"insert\", \"label\": \"Sensor\", \"id\": \"sensor-$i\", \"properties\": {\"value\": $((RANDOM % 100))}}"
done
```

## Complete Example

```yaml
host: 0.0.0.0
port: 8080
log_level: info

sources:
  - kind: http
    id: events-api
    auto_start: true
    host: 0.0.0.0
    port: 9000
    timeout_ms: 10000

queries:
  - id: all-events
    query: "MATCH (n) RETURN n.id, labels(n)[0] as type, n"
    sources:
      - source_id: events-api

reactions:
  - kind: log
    id: event-log
    queries: [all-events]
```

## Testing the Source

### Verify Source is Running

```bash
curl http://localhost:8080/api/v1/sources/events-api
```

### Send Test Event

```bash
curl -X POST http://localhost:9000/source/events-api \
  -H "Content-Type: application/json" \
  -d '{
    "op": "insert",
    "label": "TestNode",
    "id": "test-1",
    "properties": {"message": "Hello, Drasi!"}
  }'
```

### Check Query Results

```bash
curl http://localhost:8080/api/v1/queries/all-events/results
```

## Troubleshooting

### Connection Refused

- Verify the source is started and listening
- Check the port isn't already in use
- Verify firewall rules allow the connection

### Timeout Errors

- Increase `timeout_ms` for slow clients
- Check network latency
- Consider adaptive batching for high volumes

### Invalid Event Format

- Ensure JSON is valid
- Include required fields: `op`, `label`, `id`
- Include `properties` for insert/update operations

## Next Steps

- [Write Continuous Queries](/drasi-server/how-to-guides/write-continuous-queries/) - Query HTTP events
- [Configure Reactions](/drasi-server/how-to-guides/configure-reactions/) - React to events
