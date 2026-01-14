---
type: "docs"
title: "Configure HTTP Reaction"
linkTitle: "HTTP"
weight: 20
description: "Send webhooks and HTTP requests when query results change"
related:
  concepts:
    - title: "Reactions"
      url: "/concepts/reactions/"
  howto:
    - title: "Configure gRPC Reaction"
      url: "/drasi-server/how-to-guides/configuration/configure-reactions/configure-grpc-reaction/"
    - title: "Configure SSE Reaction"
      url: "/drasi-server/how-to-guides/configuration/configure-reactions/configure-sse-reaction/"
  reference:
    - title: "Configuration Reference"
      url: "/drasi-server/reference/configuration/"
---

The HTTP {{< term "Reaction" >}} sends HTTP requests when query {{< term "Result Change Event" "results change" >}}. Use it for webhooks, API integrations, and triggering external systems.

## Basic Configuration

```yaml
reactions:
  - kind: http
    id: webhook
    queries: [my-query]
    base_url: https://api.example.com
    routes:
      my-query:
        added:
          url: /events
          method: POST
```

## Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `kind` | string | Required | Must be `http` |
| `id` | string | Required | Unique reaction identifier |
| `queries` | array | Required | Query IDs to subscribe to |
| `auto_start` | boolean | `true` | Start reaction automatically |
| `base_url` | string | `http://localhost` | Base URL for requests |
| `token` | string | None | Bearer token for authorization |
| `timeout_ms` | integer | `5000` | Request timeout in milliseconds |
| `routes` | object | `{}` | Per-query endpoint configurations |

## Route Configuration

Each query can have routes for different change types:

| Change Type | When Triggered | Data Available |
|-------------|----------------|----------------|
| `added` | New item in results | `{{after}}` |
| `updated` | Item changed | `{{before}}`, `{{after}}` |
| `deleted` | Item removed | `{{before}}` |

### Route Options

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | Yes | Path to append to base_url |
| `method` | string | Yes | HTTP method (GET, POST, PUT, DELETE, etc.) |
| `body` | string | No | Request body (supports templates) |
| `headers` | object | No | Custom HTTP headers |

## Handlebars Templates

URLs and bodies support Handlebars templating:

```yaml
routes:
  my-query:
    added:
      url: /orders/{{after.id}}
      method: POST
      body: |
        {
          "order_id": "{{after.id}}",
          "total": {{after.total}},
          "customer": "{{after.customer_name}}"
        }
```

### Template Variables

| Variable | Description |
|----------|-------------|
| `{{after}}` | Full after object |
| `{{after.property}}` | Specific property value |
| `{{before}}` | Full before object (update/delete) |
| `{{before.property}}` | Previous property value |
| `{{json after}}` | JSON-serialized object |

## Authentication

### Bearer Token

```yaml
reactions:
  - kind: http
    id: api-webhook
    queries: [events]
    base_url: https://api.example.com
    token: ${API_TOKEN}
```

Adds header: `Authorization: Bearer <token>`

### Custom Headers

```yaml
reactions:
  - kind: http
    id: custom-auth
    queries: [events]
    base_url: https://api.example.com
    routes:
      events:
        added:
          url: /webhook
          method: POST
          headers:
            X-API-Key: ${API_KEY}
            X-Custom-Header: custom-value
            Content-Type: application/json
```

## Examples

### Simple Webhook

```yaml
reactions:
  - kind: http
    id: simple-webhook
    queries: [orders]
    base_url: https://hooks.example.com
    routes:
      orders:
        added:
          url: /new-order
          method: POST
          body: '{{json after}}'
          headers:
            Content-Type: application/json
```

### GitHub Integration

Create GitHub issues on alerts:

```yaml
reactions:
  - kind: http
    id: github-issues
    queries: [critical-alerts]
    base_url: https://api.github.com
    token: ${GITHUB_TOKEN}
    routes:
      critical-alerts:
        added:
          url: /repos/{{after.repo}}/issues
          method: POST
          body: |
            {
              "title": "Alert: {{after.type}}",
              "body": "{{after.message}}\n\nSeverity: {{after.severity}}"
            }
          headers:
            Accept: application/vnd.github+json
            X-GitHub-Api-Version: "2022-11-28"
```

### Slack Notification

```yaml
reactions:
  - kind: http
    id: slack-alerts
    queries: [important-events]
    base_url: https://hooks.slack.com
    routes:
      important-events:
        added:
          url: /services/XXX/YYY/ZZZ
          method: POST
          body: |
            {
              "text": "New event: {{after.title}}",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*{{after.title}}*\n{{after.description}}"
                  }
                }
              ]
            }
          headers:
            Content-Type: application/json
```

### RESTful API Updates

```yaml
reactions:
  - kind: http
    id: sync-api
    queries: [products]
    base_url: https://inventory.example.com/api
    token: ${API_TOKEN}
    timeout_ms: 10000
    routes:
      products:
        added:
          url: /products
          method: POST
          body: '{{json after}}'
          headers:
            Content-Type: application/json
        updated:
          url: /products/{{after.id}}
          method: PUT
          body: '{{json after}}'
          headers:
            Content-Type: application/json
        deleted:
          url: /products/{{before.id}}
          method: DELETE
```

### Multi-Query Webhook

```yaml
reactions:
  - kind: http
    id: event-hub
    queries: [orders, inventory, customers]
    base_url: https://events.example.com
    token: ${EVENT_HUB_TOKEN}
    routes:
      orders:
        added:
          url: /events/order-created
          method: POST
          body: '{"order": {{json after}}}'
        updated:
          url: /events/order-updated
          method: POST
          body: '{"order": {{json after}}, "previous": {{json before}}}'
      inventory:
        updated:
          url: /events/stock-changed
          method: POST
          body: '{"product": "{{after.sku}}", "quantity": {{after.quantity}}}'
      customers:
        added:
          url: /events/customer-registered
          method: POST
          body: '{"customer": {{json after}}}'
```

## HTTP Adaptive Reaction

For high-throughput scenarios, use the adaptive variant:

```yaml
reactions:
  - kind: http-adaptive
    id: high-volume-webhook
    queries: [events]
    base_url: https://api.example.com
    timeout_ms: 5000
    adaptive_min_batch_size: 1
    adaptive_max_batch_size: 1000
    adaptive_window_size: 100
    adaptive_batch_timeout_ms: 1000
    routes:
      events:
        added:
          url: /bulk-events
          method: POST
```

### Adaptive Configuration

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `adaptive_min_batch_size` | integer | `1` | Minimum events per batch |
| `adaptive_max_batch_size` | integer | `1000` | Maximum events per batch |
| `adaptive_window_size` | integer | `100` | Window for adaptive calculations |
| `adaptive_batch_timeout_ms` | integer | `1000` | Max wait time for batch |

## Timeout Configuration

```yaml
reactions:
  - kind: http
    id: slow-api
    queries: [events]
    base_url: https://slow-api.example.com
    timeout_ms: 30000  # 30 seconds
```

## Error Handling

HTTP reactions log errors but continue processing. Monitor logs for:

- Connection timeouts
- HTTP error responses (4xx, 5xx)
- Invalid response formats

Enable debug logging for troubleshooting:

```yaml
log_level: debug
```

## Testing

### Using webhook.site

Test webhooks without a real endpoint:

1. Go to https://webhook.site
2. Copy your unique URL
3. Configure the reaction:

```yaml
reactions:
  - kind: http
    id: test-webhook
    queries: [my-query]
    base_url: https://webhook.site
    routes:
      my-query:
        added:
          url: /your-unique-id
          method: POST
          body: '{{json after}}'
```

### Local Testing

Use a local HTTP server:

```bash
# Python
python -m http.server 9999

# Node.js
npx http-server -p 9999
```

```yaml
reactions:
  - kind: http
    id: local-test
    queries: [my-query]
    base_url: http://localhost:9999
    routes:
      my-query:
        added:
          url: /test
          method: POST
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
  - id: high-value-orders
    query: |
      MATCH (o:orders)
      WHERE o.total > 500
      RETURN o.id, o.customer_id, o.total, o.status
    sources:
      - source_id: orders-db

reactions:
  - kind: http
    id: order-notifications
    queries: [high-value-orders]
    base_url: ${WEBHOOK_URL}
    token: ${WEBHOOK_TOKEN}
    timeout_ms: 10000
    routes:
      high-value-orders:
        added:
          url: /orders/high-value
          method: POST
          body: |
            {
              "event": "high_value_order",
              "order_id": "{{after.id}}",
              "customer_id": "{{after.customer_id}}",
              "total": {{after.total}}
            }
          headers:
            Content-Type: application/json
        updated:
          url: /orders/{{after.id}}/status
          method: PUT
          body: |
            {
              "status": "{{after.status}}",
              "previous_status": "{{before.status}}"
            }
          headers:
            Content-Type: application/json
```

## Next Steps

- [Configure gRPC Reaction](/drasi-server/how-to-guides/configure-reactions/configure-grpc-reaction/) - High-performance streaming
- [Configure SSE Reaction](/drasi-server/how-to-guides/configure-reactions/configure-sse-reaction/) - Browser-friendly streaming
