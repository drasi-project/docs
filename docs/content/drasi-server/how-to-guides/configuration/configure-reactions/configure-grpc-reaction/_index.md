---
type: "docs"
title: "Configure gRPC Reaction"
linkTitle: "gRPC"
weight: 30
description: "Stream query results via gRPC"
---

The gRPC reaction streams query result changes to gRPC clients. It's ideal for high-performance, low-latency applications that need real-time updates.

## Basic Configuration

```yaml
reactions:
  - kind: grpc
    id: grpc-stream
    queries: [my-query]
    endpoint: grpc://localhost:50052
```

## Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `kind` | string | Required | Must be `grpc` |
| `id` | string | Required | Unique reaction identifier |
| `queries` | array | Required | Query IDs to subscribe to |
| `auto_start` | boolean | `true` | Start reaction automatically |
| `endpoint` | string | `grpc://localhost:50052` | gRPC server endpoint |
| `timeout_ms` | integer | `5000` | Connection timeout in milliseconds |
| `batch_size` | integer | `100` | Events per batch |
| `batch_flush_timeout_ms` | integer | `1000` | Batch flush timeout |
| `max_retries` | integer | `3` | Maximum retry attempts |
| `connection_retry_attempts` | integer | `5` | Connection retry attempts |
| `initial_connection_timeout_ms` | integer | `10000` | Initial connection timeout |
| `metadata` | object | `{}` | gRPC metadata headers |

## Batching Configuration

Batch events for improved throughput:

```yaml
reactions:
  - kind: grpc
    id: batched-stream
    queries: [high-volume-query]
    endpoint: grpc://processor:50052
    batch_size: 500
    batch_flush_timeout_ms: 2000
```

| Setting | Low Latency | High Throughput |
|---------|-------------|-----------------|
| `batch_size` | 1-10 | 100-1000 |
| `batch_flush_timeout_ms` | 100-500 | 1000-5000 |

## Retry Configuration

Handle connection failures gracefully:

```yaml
reactions:
  - kind: grpc
    id: reliable-stream
    queries: [critical-events]
    endpoint: grpc://processor:50052
    max_retries: 5
    connection_retry_attempts: 10
    initial_connection_timeout_ms: 30000
```

## Metadata Headers

Add custom metadata to gRPC calls:

```yaml
reactions:
  - kind: grpc
    id: authenticated-stream
    queries: [events]
    endpoint: grpc://processor:50052
    metadata:
      authorization: Bearer ${API_TOKEN}
      x-client-id: drasi-server
      x-environment: production
```

## gRPC Adaptive Reaction

For variable-rate event streams, use the adaptive variant:

```yaml
reactions:
  - kind: grpc-adaptive
    id: adaptive-stream
    queries: [events]
    endpoint: grpc://processor:50052
    adaptive_min_batch_size: 1
    adaptive_max_batch_size: 1000
    adaptive_window_size: 100
    adaptive_batch_timeout_ms: 1000
```

### Adaptive Configuration

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `adaptive_min_batch_size` | integer | `1` | Minimum events per batch |
| `adaptive_max_batch_size` | integer | `1000` | Maximum events per batch |
| `adaptive_window_size` | integer | `100` | Window for adaptive calculations |
| `adaptive_batch_timeout_ms` | integer | `1000` | Max wait time for batch |

## Protocol Definition

The gRPC reaction connects to a service implementing this interface:

```protobuf
syntax = "proto3";

package drasi;

service EventReceiver {
  rpc ReceiveEvents(stream EventBatch) returns (stream Ack);
}

message EventBatch {
  string query_id = 1;
  repeated ChangeEvent events = 2;
}

message ChangeEvent {
  string op = 1;          // "added", "updated", "deleted"
  string id = 2;
  map<string, Value> before = 3;
  map<string, Value> after = 4;
}

message Value {
  oneof kind {
    string string_value = 1;
    int64 int_value = 2;
    double double_value = 3;
    bool bool_value = 4;
  }
}

message Ack {
  bool success = 1;
  string message = 2;
}
```

## Use Cases

### Real-Time Processing

Stream events to a processing service:

```yaml
reactions:
  - kind: grpc
    id: event-processor
    queries: [transactions, alerts]
    endpoint: grpc://processor.service:50052
    batch_size: 100
    timeout_ms: 5000
```

### Microservice Integration

Connect to downstream microservices:

```yaml
reactions:
  - kind: grpc
    id: order-service
    queries: [new-orders]
    endpoint: grpc://order-service:50052
    metadata:
      x-service-name: drasi-server

  - kind: grpc
    id: inventory-service
    queries: [stock-changes]
    endpoint: grpc://inventory-service:50052
```

### Cross-Datacenter Streaming

Stream to remote datacenters:

```yaml
reactions:
  - kind: grpc
    id: remote-dc
    queries: [replicated-events]
    endpoint: grpc://remote-dc.example.com:50052
    timeout_ms: 30000
    connection_retry_attempts: 10
    metadata:
      x-datacenter: us-west
```

## Docker Compose Example

```yaml
version: '3.8'

services:
  drasi-server:
    image: ghcr.io/drasi-project/drasi-server:latest
    ports:
      - "8080:8080"
    volumes:
      - ./config:/config:ro
    depends_on:
      - event-processor

  event-processor:
    image: your-grpc-processor:latest
    ports:
      - "50052:50052"
```

Configuration:

```yaml
reactions:
  - kind: grpc
    id: processor-stream
    queries: [events]
    endpoint: grpc://event-processor:50052
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
  - kind: grpc
    id: order-processor
    queries: [order-events]
    endpoint: ${GRPC_ENDPOINT:-grpc://localhost:50052}
    timeout_ms: 10000
    batch_size: 50
    batch_flush_timeout_ms: 1000
    max_retries: 5
    metadata:
      authorization: Bearer ${API_TOKEN}
```

## Performance Tuning

### Low Latency

```yaml
reactions:
  - kind: grpc
    id: low-latency
    queries: [events]
    endpoint: grpc://processor:50052
    batch_size: 1
    batch_flush_timeout_ms: 50
    timeout_ms: 1000
```

### High Throughput

```yaml
reactions:
  - kind: grpc-adaptive
    id: high-throughput
    queries: [events]
    endpoint: grpc://processor:50052
    adaptive_min_batch_size: 50
    adaptive_max_batch_size: 2000
    adaptive_batch_timeout_ms: 2000
```

## Troubleshooting

### Connection Timeout

- Increase `initial_connection_timeout_ms`
- Verify endpoint is reachable
- Check firewall rules

### Frequent Disconnects

- Increase `connection_retry_attempts`
- Check network stability
- Monitor processor service health

### High Latency

- Reduce `batch_size`
- Reduce `batch_flush_timeout_ms`
- Check network latency

### Message Backlog

- Increase `batch_size`
- Scale the receiving service
- Consider adaptive batching

## gRPC vs HTTP

| Aspect | gRPC | HTTP |
|--------|------|------|
| **Performance** | Higher throughput | Lower throughput |
| **Latency** | Lower | Higher |
| **Protocol** | HTTP/2 | HTTP/1.1 |
| **Streaming** | Native bidirectional | One-way |
| **Integration** | Requires gRPC service | Standard webhooks |
| **Best for** | High-volume, real-time | API integrations |

## Next Steps

- [Configure HTTP Reaction](/drasi-server/how-to-guides/configure-reactions/configure-http-reaction/) - For webhook integrations
- [Configure SSE Reaction](/drasi-server/how-to-guides/configure-reactions/configure-sse-reaction/) - For browser clients
