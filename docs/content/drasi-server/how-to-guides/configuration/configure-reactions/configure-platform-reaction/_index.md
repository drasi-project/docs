---
type: "docs"
title: "Configure Platform Reaction"
linkTitle: "Platform"
weight: 50
description: "Publish query results to Redis Streams"
related:
  concepts:
    - title: "Reactions"
      url: "/concepts/reactions/"
  howto:
    - title: "Configure Platform Source"
      url: "/drasi-server/how-to-guides/configuration/configure-sources/configure-platform-source/"
    - title: "Configure SSE Reaction"
      url: "/drasi-server/how-to-guides/configuration/configure-reactions/configure-sse-reaction/"
  reference:
    - title: "Configuration Reference"
      url: "/drasi-server/reference/configuration/"
---

The Platform {{< term "Reaction" >}} publishes query {{< term "Result Change Event" "result changes" >}} to Redis Streams in CloudEvent format. It enables integration with {{< term "Drasi for Kubernetes" >}} or any system that consumes from Redis Streams.

## Basic Configuration

```yaml
reactions:
  - kind: platform
    id: redis-publisher
    queries: [my-query]
    redis_url: redis://localhost:6379
```

## Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `kind` | string | Required | Must be `platform` |
| `id` | string | Required | Unique reaction identifier |
| `queries` | array | Required | Query IDs to subscribe to |
| `auto_start` | boolean | `true` | Start reaction automatically |
| `redis_url` | string | Required | Redis connection URL |
| `pubsub_name` | string | Auto-generated | Pub/sub channel name |
| `source_name` | string | Auto-generated | Source identifier in events |
| `max_stream_length` | integer | Unlimited | Maximum stream length |
| `emit_control_events` | boolean | `false` | Emit control events |
| `batch_enabled` | boolean | `false` | Enable batching |
| `batch_max_size` | integer | `100` | Maximum batch size |
| `batch_max_wait_ms` | integer | `100` | Maximum wait time for batch |

## Redis Connection URL

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

## Event Format

Events are published in CloudEvent format:

```json
{
  "specversion": "1.0",
  "type": "drasi.query.result.change",
  "source": "drasi-server/my-query",
  "id": "unique-event-id",
  "time": "2024-01-15T10:30:00Z",
  "data": {
    "op": "added",
    "query_id": "my-query",
    "after": {
      "id": "123",
      "name": "Test"
    }
  }
}
```

## Batching Configuration

For high-throughput scenarios, enable batching:

```yaml
reactions:
  - kind: platform
    id: batched-publisher
    queries: [high-volume-events]
    redis_url: redis://localhost:6379
    batch_enabled: true
    batch_max_size: 500
    batch_max_wait_ms: 200
```

| Setting | Low Latency | High Throughput |
|---------|-------------|-----------------|
| `batch_enabled` | `false` | `true` |
| `batch_max_size` | 1-10 | 100-1000 |
| `batch_max_wait_ms` | 10-50 | 100-500 |

## Stream Length Management

Prevent unbounded stream growth:

```yaml
reactions:
  - kind: platform
    id: bounded-stream
    queries: [events]
    redis_url: redis://localhost:6379
    max_stream_length: 100000
```

When the stream exceeds `max_stream_length`, older entries are automatically trimmed.

## Control Events

Emit control events for stream lifecycle:

```yaml
reactions:
  - kind: platform
    id: with-control
    queries: [events]
    redis_url: redis://localhost:6379
    emit_control_events: true
```

Control events include:
- Stream initialization
- Query status changes
- Error notifications

## Stream Key Naming

By default, streams are named based on the query ID. Customize with `pubsub_name`:

```yaml
reactions:
  - kind: platform
    id: custom-stream
    queries: [orders]
    redis_url: redis://localhost:6379
    pubsub_name: order-events
    source_name: ecommerce-system
```

Events published to stream key: `order-events`

## Use Cases

### Drasi Platform Integration

Connect Drasi Server to the Drasi Platform:

```yaml
reactions:
  - kind: platform
    id: platform-connector
    queries: [all-events]
    redis_url: ${PLATFORM_REDIS_URL}
```

### Event Bus

Use Redis Streams as an event bus:

```yaml
reactions:
  - kind: platform
    id: event-bus
    queries: [orders, inventory, customers]
    redis_url: redis://redis:6379
    batch_enabled: true
    batch_max_size: 100
```

### Cross-Service Communication

Publish events for other services to consume:

```yaml
reactions:
  - kind: platform
    id: service-events
    queries: [order-created, order-updated]
    redis_url: redis://redis:6379
    pubsub_name: order-service-events
    max_stream_length: 50000
```

### Data Replication

Replicate data changes to other systems:

```yaml
reactions:
  - kind: platform
    id: replication
    queries: [all-changes]
    redis_url: redis://replica-redis:6379
    batch_enabled: true
    batch_max_size: 500
    batch_max_wait_ms: 100
```

## Consuming Events

### Using redis-cli

```bash
# Read from stream
redis-cli XREAD STREAMS my-query 0

# Read new events (blocking)
redis-cli XREAD BLOCK 0 STREAMS my-query $

# Consumer group
redis-cli XREADGROUP GROUP my-group consumer-1 STREAMS my-query >
```

### Python Consumer

```python
import redis
import json

r = redis.Redis(host='localhost', port=6379)

# Create consumer group
try:
    r.xgroup_create('my-query', 'my-group', id='0', mkstream=True)
except redis.exceptions.ResponseError:
    pass  # Group already exists

while True:
    events = r.xreadgroup('my-group', 'consumer-1', {'my-query': '>'}, block=5000)
    for stream, messages in events:
        for message_id, data in messages:
            event = json.loads(data[b'data'])
            print(f"Received: {event}")
            r.xack('my-query', 'my-group', message_id)
```

### Node.js Consumer

```javascript
const Redis = require('ioredis');
const redis = new Redis();

async function consume() {
  // Create consumer group
  try {
    await redis.xgroup('CREATE', 'my-query', 'my-group', '0', 'MKSTREAM');
  } catch (e) {
    // Group exists
  }

  while (true) {
    const result = await redis.xreadgroup(
      'GROUP', 'my-group', 'consumer-1',
      'BLOCK', 5000,
      'STREAMS', 'my-query', '>'
    );

    if (result) {
      for (const [stream, messages] of result) {
        for (const [id, fields] of messages) {
          const event = JSON.parse(fields[1]);
          console.log('Received:', event);
          await redis.xack('my-query', 'my-group', id);
        }
      }
    }
  }
}

consume();
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
  - kind: postgres
    id: orders-db
    host: ${DB_HOST}
    database: ecommerce
    user: ${DB_USER}
    password: ${DB_PASSWORD}
    tables:
      - public.orders

queries:
  - id: order-events
    query: "MATCH (o:orders) RETURN o.id, o.status, o.total"
    sources:
      - source_id: orders-db

reactions:
  - kind: platform
    id: order-stream
    queries: [order-events]
    redis_url: ${REDIS_URL:-redis://localhost:6379}
    pubsub_name: ecommerce-orders
    source_name: order-service
    max_stream_length: 100000
    batch_enabled: true
    batch_max_size: 100
    batch_max_wait_ms: 100
```

## Monitoring

### Stream Info

```bash
redis-cli XINFO STREAM my-query
```

### Stream Length

```bash
redis-cli XLEN my-query
```

### Consumer Groups

```bash
redis-cli XINFO GROUPS my-query
```

### Pending Messages

```bash
redis-cli XPENDING my-query my-group
```

## Troubleshooting

### Connection Errors

- Verify Redis is running and accessible
- Check connection URL format
- Verify network connectivity

### Memory Issues

- Set `max_stream_length` to limit growth
- Monitor Redis memory usage
- Configure Redis maxmemory policies

### Message Backlog

- Scale consumers
- Enable batching
- Increase consumer throughput

## Next Steps

- [Configure Platform Source](/drasi-server/how-to-guides/configure-sources/configure-platform-source/) - Consume from Redis Streams
- [Configure SSE Reaction](/drasi-server/how-to-guides/configure-reactions/configure-sse-reaction/) - For browser clients
