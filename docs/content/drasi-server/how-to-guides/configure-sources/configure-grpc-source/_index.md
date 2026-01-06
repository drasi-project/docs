---
type: "docs"
title: "Configure gRPC Source"
linkTitle: "gRPC"
weight: 30
description: "Receive events via gRPC streaming"
---

The gRPC source creates a gRPC endpoint that receives streaming events. It's ideal for high-performance, low-latency event streaming from applications that support gRPC.

## Basic Configuration

```yaml
sources:
  - kind: grpc
    id: grpc-events
    auto_start: true
    host: 0.0.0.0
    port: 50051
    timeout_ms: 5000
```

## Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `kind` | string | Required | Must be `grpc` |
| `id` | string | Required | Unique source identifier |
| `auto_start` | boolean | `true` | Start source automatically |
| `host` | string | `0.0.0.0` | Listen address |
| `port` | integer | `50051` | Listen port |
| `endpoint` | string | Auto-generated | Custom endpoint path |
| `timeout_ms` | integer | `5000` | Connection timeout in milliseconds |

## gRPC Service Definition

The gRPC source implements a streaming service. Clients connect and stream events to Drasi Server.

### Protocol Buffer Definition

```protobuf
syntax = "proto3";

package drasi;

service EventSource {
  rpc StreamEvents(stream Event) returns (stream Ack);
}

message Event {
  string op = 1;          // "insert", "update", "delete"
  string label = 2;       // Node label
  string id = 3;          // Node ID
  map<string, Value> properties = 4;
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

## Event Format

Events sent via gRPC follow the same structure as HTTP events:

| Field | Type | Description |
|-------|------|-------------|
| `op` | string | Operation: `insert`, `update`, `delete` |
| `label` | string | Node label |
| `id` | string | Node identifier |
| `properties` | map | Node properties |

## Use Cases

### High-Throughput Event Streaming

gRPC is ideal for high-volume event streams:

```yaml
sources:
  - kind: grpc
    id: telemetry-stream
    host: 0.0.0.0
    port: 50051
    timeout_ms: 30000
```

### Microservice Integration

Connect microservices that already use gRPC:

```yaml
sources:
  - kind: grpc
    id: order-service
    host: 0.0.0.0
    port: 50052

  - kind: grpc
    id: inventory-service
    host: 0.0.0.0
    port: 50053
```

### IoT Device Data

Stream data from IoT gateways:

```yaml
sources:
  - kind: grpc
    id: iot-gateway
    host: 0.0.0.0
    port: 50051
    timeout_ms: 10000
```

## Docker Configuration

When running in Docker, map the gRPC ports:

```yaml
# docker-compose.yml
services:
  drasi-server:
    image: ghcr.io/drasi-project/drasi-server:latest
    ports:
      - "8080:8080"     # REST API
      - "50051:50051"   # gRPC source
```

## Complete Example

```yaml
host: 0.0.0.0
port: 8080
log_level: info

sources:
  - kind: grpc
    id: event-stream
    auto_start: true
    host: 0.0.0.0
    port: 50051
    timeout_ms: 5000

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

## Client Implementation Example

### Go Client

```go
package main

import (
    "context"
    "log"

    pb "your-project/drasi"
    "google.golang.org/grpc"
)

func main() {
    conn, err := grpc.Dial("localhost:50051", grpc.WithInsecure())
    if err != nil {
        log.Fatalf("Failed to connect: %v", err)
    }
    defer conn.Close()

    client := pb.NewEventSourceClient(conn)
    stream, err := client.StreamEvents(context.Background())
    if err != nil {
        log.Fatalf("Failed to create stream: %v", err)
    }

    // Send event
    event := &pb.Event{
        Op:    "insert",
        Label: "Sensor",
        Id:    "sensor-1",
        Properties: map[string]*pb.Value{
            "temperature": {Kind: &pb.Value_DoubleValue{DoubleValue: 72.5}},
        },
    }

    if err := stream.Send(event); err != nil {
        log.Fatalf("Failed to send: %v", err)
    }

    // Receive acknowledgment
    ack, err := stream.Recv()
    if err != nil {
        log.Fatalf("Failed to receive: %v", err)
    }
    log.Printf("Ack: %v", ack)
}
```

### Python Client

```python
import grpc
import drasi_pb2
import drasi_pb2_grpc

def stream_events():
    channel = grpc.insecure_channel('localhost:50051')
    stub = drasi_pb2_grpc.EventSourceStub(channel)

    def event_generator():
        event = drasi_pb2.Event(
            op="insert",
            label="Sensor",
            id="sensor-1",
            properties={
                "temperature": drasi_pb2.Value(double_value=72.5)
            }
        )
        yield event

    responses = stub.StreamEvents(event_generator())
    for ack in responses:
        print(f"Ack: {ack}")

if __name__ == '__main__':
    stream_events()
```

## Performance Tuning

### Connection Timeout

Adjust timeout for slow connections:

```yaml
sources:
  - kind: grpc
    id: remote-source
    host: 0.0.0.0
    port: 50051
    timeout_ms: 30000  # 30 seconds
```

### Multiple gRPC Sources

Run multiple sources for different event types:

```yaml
sources:
  - kind: grpc
    id: orders-stream
    port: 50051

  - kind: grpc
    id: inventory-stream
    port: 50052

  - kind: grpc
    id: analytics-stream
    port: 50053
```

## Troubleshooting

### Connection Timeout

- Increase `timeout_ms` value
- Check network connectivity
- Verify no firewall blocking the port

### Stream Disconnects

- Implement reconnection logic in client
- Check server logs for errors
- Monitor resource usage

### Performance Issues

- Consider batching events on the client side
- Monitor gRPC stream backpressure
- Adjust timeout values appropriately

## gRPC vs HTTP

| Aspect | gRPC | HTTP |
|--------|------|------|
| **Performance** | Higher throughput | Lower throughput |
| **Latency** | Lower | Higher |
| **Protocol** | HTTP/2 | HTTP/1.1 |
| **Streaming** | Native bidirectional | One-way |
| **Integration** | Requires gRPC client | Any HTTP client |
| **Best for** | High-volume, real-time | Webhooks, simple integrations |

## Next Steps

- [Write Continuous Queries](/drasi-server/how-to-guides/write-continuous-queries/) - Query gRPC events
- [Configure HTTP Source](/drasi-server/how-to-guides/configure-sources/configure-http-source/) - Alternative for HTTP events
