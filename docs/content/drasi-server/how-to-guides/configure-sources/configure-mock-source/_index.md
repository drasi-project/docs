---
type: "docs"
title: "Configure Mock Source"
linkTitle: "Mock"
weight: 40
description: "Generate test data for development and testing"
---

The Mock source generates synthetic data for development and testing. It creates nodes at configurable intervals, making it easy to test queries and reactions without connecting to real data sources.

## Basic Configuration

```yaml
sources:
  - kind: mock
    id: test-source
    auto_start: true
    data_type: sensor
    interval_ms: 5000
```

## Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `kind` | string | Required | Must be `mock` |
| `id` | string | Required | Unique source identifier |
| `auto_start` | boolean | `true` | Start source automatically |
| `data_type` | string | `generic` | Type of mock data to generate |
| `interval_ms` | integer | `5000` | Data generation interval in milliseconds |

## Data Types

### Generic Data

The default data type generates simple nodes:

```yaml
sources:
  - kind: mock
    id: generic-source
    data_type: generic
    interval_ms: 3000
```

Generates nodes like:

```json
{
  "label": "Node",
  "id": "node-1",
  "properties": {
    "value": 42,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Sensor Data

Generates IoT-style sensor readings:

```yaml
sources:
  - kind: mock
    id: sensor-source
    data_type: sensor
    interval_ms: 2000
```

Generates nodes like:

```json
{
  "label": "Sensor",
  "id": "sensor-1",
  "properties": {
    "temperature": 72.5,
    "humidity": 45.2,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## Use Cases

### Development Testing

Quickly test queries without setting up databases:

```yaml
host: 0.0.0.0
port: 8080
log_level: debug

sources:
  - kind: mock
    id: test-source
    data_type: sensor
    interval_ms: 1000

queries:
  - id: high-temp
    query: |
      MATCH (s:Sensor)
      WHERE s.temperature > 75
      RETURN s.id, s.temperature
    sources:
      - source_id: test-source

reactions:
  - kind: log
    id: temp-alerts
    queries: [high-temp]
```

### Reaction Testing

Test reaction configurations:

```yaml
sources:
  - kind: mock
    id: mock-orders
    data_type: generic
    interval_ms: 5000

reactions:
  - kind: http
    id: test-webhook
    queries: [order-alerts]
    base_url: https://webhook.site/your-id
    routes:
      order-alerts:
        added:
          url: /
          method: POST
          body: |
            {"event": "new_order", "data": {{json after}}}
```

### Load Testing

Generate high-frequency events for performance testing:

```yaml
sources:
  - kind: mock
    id: load-test
    data_type: generic
    interval_ms: 100  # 10 events per second
```

### Demo Environments

Create reproducible demo setups:

```yaml
sources:
  - kind: mock
    id: demo-sensors
    data_type: sensor
    interval_ms: 3000

queries:
  - id: all-sensors
    query: "MATCH (s:Sensor) RETURN s"
    sources:
      - source_id: demo-sensors

reactions:
  - kind: sse
    id: demo-stream
    queries: [all-sensors]
    port: 8081
```

## Generation Interval

Control how often data is generated:

```yaml
# Slow generation (every 10 seconds)
sources:
  - kind: mock
    id: slow-source
    interval_ms: 10000

# Fast generation (every 100ms)
sources:
  - kind: mock
    id: fast-source
    interval_ms: 100
```

## Multiple Mock Sources

Simulate multiple data sources:

```yaml
sources:
  - kind: mock
    id: temperature-sensors
    data_type: sensor
    interval_ms: 2000

  - kind: mock
    id: inventory-updates
    data_type: generic
    interval_ms: 5000

  - kind: mock
    id: user-events
    data_type: generic
    interval_ms: 3000
```

## Complete Example

A full development configuration:

```yaml
host: 0.0.0.0
port: 8080
log_level: info

sources:
  - kind: mock
    id: sensors
    auto_start: true
    data_type: sensor
    interval_ms: 2000

queries:
  - id: all-readings
    query: |
      MATCH (s:Sensor)
      RETURN s.id, s.temperature, s.humidity, s.timestamp
    sources:
      - source_id: sensors

  - id: hot-sensors
    query: |
      MATCH (s:Sensor)
      WHERE s.temperature > 80
      RETURN s.id, s.temperature
    sources:
      - source_id: sensors

reactions:
  - kind: log
    id: console
    queries: [all-readings, hot-sensors]

  - kind: sse
    id: live-stream
    queries: [all-readings]
    port: 8081
```

## Watching Mock Data

### View Console Output

Run the server and watch the logs:

```bash
drasi-server --config config/mock-test.yaml
```

You'll see:

```
[INFO] Mock source 'sensors' generated new data
[INFO] Query 'all-readings' result changed: Added 1 items
```

### Query Current Results

```bash
curl http://localhost:8080/api/v1/queries/all-readings/results
```

### Connect to SSE Stream

```bash
curl http://localhost:8081/events
```

## Transitioning to Real Sources

Mock sources are designed for easy replacement with real sources:

### Mock Configuration

```yaml
sources:
  - kind: mock
    id: orders
    data_type: generic
    interval_ms: 5000
```

### Production Configuration

```yaml
sources:
  - kind: postgres
    id: orders
    host: ${DB_HOST}
    database: orders_db
    tables:
      - public.orders
```

The query configuration remains the same because the source ID (`orders`) is unchanged.

## Limitations

- Mock sources don't support bootstrap providers
- Generated data is random and not persisted
- Cannot simulate complex data relationships
- Update and delete operations are not generated

For more realistic testing, consider:
- Using a test database with the PostgreSQL source
- Using the HTTP source with scripted test data
- Creating a test harness that sends events programmatically

## Next Steps

- [Configure PostgreSQL Source](/drasi-server/how-to-guides/configure-sources/configure-postgresql-source/) - Connect to real databases
- [Write Continuous Queries](/drasi-server/how-to-guides/write-continuous-queries/) - Query mock data
