---
type: "docs"
title: "Configure Platform Source"
linkTitle: "Platform"
weight: 50
description: "Consume events from Redis Streams for Drasi Platform integration"
related:
  concepts:
    - title: "Sources"
      url: "/concepts/sources/"
  howto:
    - title: "Configure Platform Reaction"
      url: "/drasi-server/how-to-guides/configuration/configure-reactions/configure-platform-reaction/"
    - title: "Configure Bootstrap Providers"
      url: "/drasi-server/how-to-guides/configuration/configure-bootstrap-providers/"
  reference:
    - title: "Configuration Reference"
      url: "/drasi-server/reference/configuration/"
---

The Platform {{< term "Source" >}} consumes events from Redis Streams, enabling integration with {{< term "Drasi for Kubernetes" >}} or other systems that publish to Redis Streams.

## Basic Configuration

```yaml
sources:
  - kind: platform
    id: platform-events
    auto_start: true
    redis_url: redis://localhost:6379
    stream_key: my-events
    consumer_group: drasi-server
```

## Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `kind` | string | Required | Must be `platform` |
| `id` | string | Required | Unique source identifier |
| `auto_start` | boolean | `true` | Start source automatically |
| `redis_url` | string | Required | Redis connection URL |
| `stream_key` | string | Required | Redis stream key to consume |
| `consumer_group` | string | `drasi-core` | Consumer group name |
| `consumer_name` | string | Auto-generated | Consumer name within group |
| `batch_size` | integer | `100` | Events to read per batch |
| `block_ms` | integer | `5000` | Block timeout in milliseconds |

## Redis Connection URL

The Redis URL supports various connection formats:

```yaml
# Local Redis
redis_url: redis://localhost:6379

# With password
redis_url: redis://:password@localhost:6379

# With username and password
redis_url: redis://user:password@localhost:6379

# With database selection
redis_url: redis://localhost:6379/1

# TLS connection
redis_url: rediss://localhost:6379
```

## Consumer Groups

Consumer groups enable multiple Drasi Server instances to share stream processing:

```yaml
sources:
  - kind: platform
    id: events
    redis_url: redis://localhost:6379
    stream_key: drasi-events
    consumer_group: drasi-processors
    consumer_name: server-1
```

### Multiple Consumers

For horizontal scaling:

```yaml
# Server 1
sources:
  - kind: platform
    id: events
    redis_url: redis://localhost:6379
    stream_key: drasi-events
    consumer_group: drasi-cluster
    consumer_name: server-1

# Server 2
sources:
  - kind: platform
    id: events
    redis_url: redis://localhost:6379
    stream_key: drasi-events
    consumer_group: drasi-cluster
    consumer_name: server-2
```

## Batch Processing

Control how events are read from the stream:

```yaml
sources:
  - kind: platform
    id: high-volume-events
    redis_url: redis://localhost:6379
    stream_key: events
    batch_size: 500      # Read up to 500 events per batch
    block_ms: 10000      # Wait up to 10 seconds for new events
```

| Setting | Low Volume | High Volume |
|---------|------------|-------------|
| `batch_size` | 10-50 | 100-1000 |
| `block_ms` | 5000-10000 | 1000-5000 |

## Event Format

Events in the Redis Stream should follow this structure:

```json
{
  "op": "insert",
  "label": "Order",
  "id": "order-123",
  "properties": {
    "customer_id": "cust-456",
    "total": 99.99
  }
}
```

### Publishing Events to Redis

Using `redis-cli`:

```bash
redis-cli XADD my-events '*' data '{"op":"insert","label":"Order","id":"order-1","properties":{"total":100}}'
```

Using Python:

```python
import redis
import json

r = redis.Redis(host='localhost', port=6379)

event = {
    "op": "insert",
    "label": "Order",
    "id": "order-123",
    "properties": {
        "customer_id": "cust-456",
        "total": 99.99
    }
}

r.xadd('my-events', {'data': json.dumps(event)})
```

## Bootstrap Provider

Load initial data from a remote Drasi API:

```yaml
sources:
  - kind: platform
    id: platform-events
    redis_url: redis://localhost:6379
    stream_key: events
    bootstrap_provider:
      type: platform
      query_api_url: http://remote-drasi:8080
      timeout_seconds: 300
```

## Use Cases

### Drasi Platform Integration

Connect Drasi Server to the Drasi Platform:

```yaml
sources:
  - kind: platform
    id: platform-source
    redis_url: ${REDIS_URL}
    stream_key: drasi-query-results
    consumer_group: drasi-server
```

### Event Bus Integration

Use Redis Streams as an event bus:

```yaml
sources:
  - kind: platform
    id: order-events
    redis_url: redis://redis:6379
    stream_key: orders
    consumer_group: drasi-orders

  - kind: platform
    id: inventory-events
    redis_url: redis://redis:6379
    stream_key: inventory
    consumer_group: drasi-inventory
```

### Cross-Region Replication

Consume events from a replicated Redis stream:

```yaml
sources:
  - kind: platform
    id: replicated-events
    redis_url: rediss://replica.region.redis.cloud:6379
    stream_key: global-events
    consumer_group: region-us-east
```

## Docker Compose Setup

```yaml
version: '3.8'

services:
  drasi-server:
    image: ghcr.io/drasi-project/drasi-server:latest
    ports:
      - "8080:8080"
    environment:
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./config:/config:ro
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes

volumes:
  redis-data:
```

## Complete Example

```yaml
host: 0.0.0.0
port: 8080
log_level: info

sources:
  - kind: platform
    id: event-stream
    auto_start: true
    redis_url: ${REDIS_URL:-redis://localhost:6379}
    stream_key: application-events
    consumer_group: drasi-server
    batch_size: 100
    block_ms: 5000

queries:
  - id: all-events
    query: "MATCH (n) RETURN n.id, labels(n)[0] as type"
    sources:
      - source_id: event-stream

reactions:
  - kind: log
    id: event-log
    queries: [all-events]
```

## Monitoring

### Check Stream Info

```bash
redis-cli XINFO STREAM my-events
```

### Check Consumer Groups

```bash
redis-cli XINFO GROUPS my-events
```

### Check Pending Messages

```bash
redis-cli XPENDING my-events drasi-server
```

## Troubleshooting

### Connection Failed

- Verify Redis is running and accessible
- Check the Redis URL format
- Verify network connectivity and firewall rules

### Consumer Group Errors

Create the consumer group if it doesn't exist:

```bash
redis-cli XGROUP CREATE my-events drasi-server $ MKSTREAM
```

### Message Backlog

If messages are accumulating:

1. Check consumer status: `XINFO CONSUMERS stream-key group-name`
2. Increase `batch_size`
3. Add more consumers
4. Check for processing errors in logs

### Memory Issues

Redis Streams can grow large. Set a maximum length:

```bash
# Trim stream to approximately 10000 entries
redis-cli XTRIM my-events MAXLEN ~ 10000
```

Or configure automatic trimming when adding:

```bash
redis-cli XADD my-events MAXLEN ~ 10000 '*' data '...'
```

## Performance Tuning

### High Throughput

```yaml
sources:
  - kind: platform
    id: high-throughput
    redis_url: redis://localhost:6379
    stream_key: events
    batch_size: 1000
    block_ms: 1000
```

### Low Latency

```yaml
sources:
  - kind: platform
    id: low-latency
    redis_url: redis://localhost:6379
    stream_key: events
    batch_size: 10
    block_ms: 100
```

## Next Steps

- [Configure Platform Reaction](/drasi-server/how-to-guides/configure-reactions/configure-platform-reaction/) - Publish to Redis Streams
- [Write Continuous Queries](/drasi-server/how-to-guides/write-continuous-queries/) - Query platform events
