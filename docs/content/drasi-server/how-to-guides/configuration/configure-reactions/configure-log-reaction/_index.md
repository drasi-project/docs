---
type: "docs"
title: "Configure Log Reaction"
linkTitle: "Log"
weight: 10
description: "Output query results to console with customizable templates"
related:
  concepts:
    - title: "Reactions"
      url: "/concepts/reactions/"
  howto:
    - title: "Configure HTTP Reaction"
      url: "/drasi-server/how-to-guides/configuration/configure-reactions/configure-http-reaction/"
    - title: "Configure SSE Reaction"
      url: "/drasi-server/how-to-guides/configuration/configure-reactions/configure-sse-reaction/"
  reference:
    - title: "Configuration Reference"
      url: "/drasi-server/reference/configuration/"
---

The Log {{< term "Reaction" >}} outputs query {{< term "Result Change Event" "result changes" >}} to the console. It's useful for development, debugging, and simple monitoring scenarios.

## Basic Configuration

```yaml
reactions:
  - kind: log
    id: console-output
    queries: [my-query]
    auto_start: true
```

## Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `kind` | string | Required | Must be `log` |
| `id` | string | Required | Unique reaction identifier |
| `queries` | array | Required | Query IDs to subscribe to |
| `auto_start` | boolean | `true` | Start reaction automatically |
| `routes` | object | `{}` | Per-query template configurations |
| `default_template` | object | None | Default template for all queries |

## Default Output

Without custom templates, changes are logged as JSON:

```
[INFO] Query 'my-query' added: {"id": "123", "name": "Test", "value": 42}
[INFO] Query 'my-query' updated: {"id": "123", "name": "Test", "value": 50}
[INFO] Query 'my-query' deleted: {"id": "123", "name": "Test", "value": 50}
```

## Custom Templates

Use Handlebars templates for custom output formatting.

### Default Template

Apply to all queries:

```yaml
reactions:
  - kind: log
    id: formatted-log
    queries: [my-query]
    default_template:
      added:
        template: "[NEW] {{after.id}}: {{after.name}} = {{after.value}}"
      updated:
        template: "[UPDATE] {{after.id}}: {{before.value}} -> {{after.value}}"
      deleted:
        template: "[DELETED] {{before.id}}"
```

### Per-Query Templates

Configure templates for specific queries:

```yaml
reactions:
  - kind: log
    id: multi-query-log
    queries: [orders, inventory]
    routes:
      orders:
        added:
          template: "New order #{{after.id}} for ${{after.total}}"
        updated:
          template: "Order #{{after.id}} status: {{before.status}} -> {{after.status}}"
        deleted:
          template: "Order #{{before.id}} cancelled"
      inventory:
        added:
          template: "New product: {{after.name}} ({{after.sku}})"
        updated:
          template: "Stock update: {{after.sku}} now has {{after.quantity}} units"
```

## Template Data

### Available Variables

| Variable | Description | Available In |
|----------|-------------|--------------|
| `{{after}}` | New/current state | `added`, `updated` |
| `{{before}}` | Previous state | `updated`, `deleted` |
| `{{after.property}}` | Access specific property | `added`, `updated` |
| `{{before.property}}` | Access previous property | `updated`, `deleted` |

### JSON Helper

Output entire object as JSON:

```yaml
default_template:
  added:
    template: "New item: {{json after}}"
```

## Examples

### Simple Debug Logging

```yaml
reactions:
  - kind: log
    id: debug
    queries: [my-query]
```

### Formatted Alert Logging

```yaml
reactions:
  - kind: log
    id: alerts
    queries: [high-priority-alerts]
    default_template:
      added:
        template: |
          ⚠️  ALERT: {{after.type}}
          ID: {{after.id}}
          Message: {{after.message}}
          Severity: {{after.severity}}
```

### Multi-Query Logging

```yaml
reactions:
  - kind: log
    id: audit-log
    queries: [user-changes, order-changes, inventory-changes]
    routes:
      user-changes:
        added:
          template: "[AUDIT] User created: {{after.email}}"
        updated:
          template: "[AUDIT] User updated: {{after.email}}"
        deleted:
          template: "[AUDIT] User deleted: {{before.email}}"
      order-changes:
        added:
          template: "[AUDIT] Order created: #{{after.id}} (${{after.total}})"
        updated:
          template: "[AUDIT] Order #{{after.id}} status: {{after.status}}"
      inventory-changes:
        updated:
          template: "[AUDIT] Stock change: {{after.sku}} qty={{after.quantity}}"
```

### JSON Output for Processing

```yaml
reactions:
  - kind: log
    id: json-log
    queries: [events]
    default_template:
      added:
        template: '{"event":"added","data":{{json after}}}'
      updated:
        template: '{"event":"updated","before":{{json before}},"after":{{json after}}}'
      deleted:
        template: '{"event":"deleted","data":{{json before}}}'
```

## Complete Example

```yaml
host: 0.0.0.0
port: 8080
log_level: info

sources:
  - kind: mock
    id: sensors
    data_type: sensor
    interval_ms: 2000

queries:
  - id: all-sensors
    query: "MATCH (s:Sensor) RETURN s.id, s.temperature, s.humidity"
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
    id: sensor-log
    queries: [all-sensors, hot-sensors]
    routes:
      all-sensors:
        added:
          template: "Sensor {{after.id}}: temp={{after.temperature}}°F, humidity={{after.humidity}}%"
        updated:
          template: "Sensor {{after.id}} update: temp={{after.temperature}}°F"
      hot-sensors:
        added:
          template: "🔥 HIGH TEMP ALERT: Sensor {{after.id}} at {{after.temperature}}°F"
```

## Viewing Logs

### Docker

```bash
docker logs -f drasi-server
```

### Direct Execution

Logs appear in stdout when running directly:

```bash
./drasi-server --config config/server.yaml
```

### Log Level

Set log level to see more detail:

```yaml
log_level: debug
```

Or via environment:

```bash
RUST_LOG=debug ./drasi-server --config config/server.yaml
```

## Use Cases

### Development

Quick feedback during development:

```yaml
reactions:
  - kind: log
    id: dev-log
    queries: [test-query]
```

### Debugging

Detailed output for troubleshooting:

```yaml
reactions:
  - kind: log
    id: debug-log
    queries: [problematic-query]
    default_template:
      added:
        template: "[DEBUG] Added: {{json after}}"
      updated:
        template: "[DEBUG] Updated - Before: {{json before}} After: {{json after}}"
      deleted:
        template: "[DEBUG] Deleted: {{json before}}"
```

### Simple Monitoring

Basic alerting without external integrations:

```yaml
reactions:
  - kind: log
    id: monitor
    queries: [error-events, warning-events]
    routes:
      error-events:
        added:
          template: "❌ ERROR: {{after.message}}"
      warning-events:
        added:
          template: "⚠️  WARNING: {{after.message}}"
```

## Combining with Other Reactions

Use log reaction alongside other reactions for debugging:

```yaml
reactions:
  # Debug logging
  - kind: log
    id: debug-log
    queries: [orders]

  # Production webhook
  - kind: http
    id: order-webhook
    queries: [orders]
    base_url: https://api.example.com
    routes:
      orders:
        added:
          url: /orders
          method: POST
```

## Next Steps

- [Configure HTTP Reaction](/drasi-server/how-to-guides/configure-reactions/configure-http-reaction/) - Send webhooks
- [Configure SSE Reaction](/drasi-server/how-to-guides/configure-reactions/configure-sse-reaction/) - Stream to browsers
