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

The HTTP {{< term "Reaction" >}} sends HTTP requests when query {{< term "Result Change Event" "results change" >}}. Use it for webhooks, REST API integrations, serverless functions, and other systems that accept HTTP requests.

The reaction supports two delivery modes:

- **Single notifications** (default) - each added, updated, or deleted result row is delivered as its own HTTP request.
- **Adaptive batching** - result changes are coalesced into batches and POSTed to one batch endpoint. Batch size adjusts automatically with incoming load.

## Basic Configuration

With no `outputTemplates` configured, each change is sent as a default JSON envelope to:

```text
POST {baseUrl}/changes/{queryId}
```

```yaml
reactions:
  - kind: http
    id: webhook
    queries: [my-query]
    baseUrl: https://api.example.com
```

To customize routes, methods, headers, or bodies, add `outputTemplates`:

```yaml
reactions:
  - kind: http
    id: webhook
    queries: [my-query]
    baseUrl: https://api.example.com
    outputTemplates:
      routes:
        my-query:
          added:
            url: /events
            method: POST
            template: '{{json after}}'
            headers:
              Content-Type: application/json
```

## Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `kind` | string | Required | Must be `http` |
| `id` | string | Required | Unique reaction identifier |
| `queries` | array | Required | Query IDs to subscribe to |
| `autoStart` | boolean | `true` | Start reaction automatically |
| `baseUrl` | string | `http://localhost` | Base URL for HTTP requests. Must be `http` or `https`, include a host, and not include a query string or fragment. |
| `token` | string | None | Bearer token sent on every request |
| `timeoutMs` | integer | `5000` | Per-request timeout in milliseconds. Must be greater than `0`. |
| `priorityQueueCapacity` | integer | `10000` | Capacity of the inbound queue that buffers query results before processing. Must be greater than `0` when set. |
| `outputTemplates` | object | None | Default and per-query templates for single notifications and batch items |
| `adaptive` | object | None | Enables adaptive batching when set. Requires `batchEndpoint`. |
| `batchEndpoint` | string | None | Absolute path appended to `baseUrl` for adaptive batch POSTs. Requires `adaptive`. |
| `recoveryPolicy` | string | `strict` | Sustained delivery failure policy: `strict` or `auto_skip_gap`. |

## Output Templates and Routing

`outputTemplates` controls how changes are rendered. It contains:

| Field | Type | Description |
|-------|------|-------------|
| `routes` | object | Per-query overrides keyed by query ID or by the query ID's last dotted segment |
| `defaultTemplate` | object | Fallback used when no matching `routes` entry exists |

For each query, configure one or more change types:

| Change Type | When Triggered | Data Available |
|-------------|----------------|----------------|
| `added` | New item in results | `{{after}}` |
| `updated` | Item changed | `{{before}}`, `{{after}}`, `{{data}}` |
| `deleted` | Item removed | `{{before}}` |

For each change type, use an HTTP call spec:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `template` | string | Empty | Handlebars template for the request body. When empty, the default change notification envelope is sent. |
| `url` | string | Empty | Handlebars template for the URL. Relative paths are appended to `baseUrl`. Absolute `http(s)` URLs are allowed only when their scheme, host, and port match `baseUrl`. |
| `method` | string | `POST` | HTTP method: `GET`, `POST`, `PUT`, `PATCH`, or `DELETE` (case-insensitive). |
| `headers` | object | `{}` | Additional HTTP headers. Header values support Handlebars templates. |

The reaction resolves a template for each result in this order:

1. `outputTemplates.routes[<queryId>]`
2. `outputTemplates.routes[<last dotted segment>]` - for example, `routes.orders` can match `source.orders`
3. `outputTemplates.defaultTemplate`
4. Built-in default: `POST {baseUrl}/changes/{queryId}` with the default change notification envelope

Route keys are validated against the subscribed `queries`.

```yaml
reactions:
  - kind: http
    id: rest-sync
    queries: [orders, inventory.stock]
    baseUrl: https://inventory.example.com/api
    outputTemplates:
      routes:
        orders:
          added:
            url: /orders
            method: POST
            template: '{{json after}}'
          updated:
            url: /orders/{{after.id}}
            method: PUT
            template: '{{json after}}'
          deleted:
            url: /orders/{{before.id}}
            method: DELETE
        stock:
          updated:
            url: /stock/{{after.sku}}
            method: PATCH
            template: '{"quantity": {{after.quantity}}}'
      defaultTemplate:
        added:
          url: /events
          method: POST
          template: |
            {
              "query": "{{query_id}}",
              "operation": "{{operation}}",
              "row": {{json after}}
            }
```

## Handlebars Templates

The HTTP reaction uses Handlebars templates for request bodies, URLs, and header values.

| Variable | Available On | Description |
|----------|--------------|-------------|
| `{{after}}` | `added`, `updated` | The new/current result row |
| `{{after.property}}` | `added`, `updated` | A property from the new/current row |
| `{{before}}` | `updated`, `deleted` | The previous result row |
| `{{before.property}}` | `updated`, `deleted` | A property from the previous row |
| `{{data}}` | `updated` | Raw update payload |
| `{{query_id}}` | All | Query ID that produced the change |
| `{{query_name}}` | All | Alias of `query_id` |
| `{{operation}}` | All | Operation value: `ADD`, `UPDATE`, or `DELETE` |
| `{{timestamp}}` | All | RFC 3339 timestamp of the query emission |
| `{{metadata}}` | All | Query result metadata object, or an empty object |
| `{{json value}}` | All | JSON-serializes `value` for embedding in JSON bodies |

Example:

```yaml
template: |
  {
    "query": "{{query_name}}",
    "operation": "{{operation}}",
    "order": {{json after}},
    "metadata": {{json metadata}}
  }
```

## Default Output Payload

When no body `template` applies, the reaction sends a `DefaultChangeNotification` JSON object.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `operation` | string | Yes | `ADD`, `UPDATE`, or `DELETE` |
| `queryId` | string | Yes | Query that produced the change |
| `sequenceId` | integer | Yes | Monotonic per-query sequence number identifying this emission |
| `timestamp` | string | Yes | RFC 3339 timestamp of the query emission |
| `before` | object | No | Row state before the change. Omitted for `ADD` and for the first emission of an aggregation group. |
| `after` | object | No | Row state after the change. Omitted for `DELETE`. |
| `metadata` | object | No | Source/query metadata. Omitted when empty. |

Diffs are mapped as follows:

| Result diff | `operation` | `before` | `after` | HTTP request |
|-------------|-------------|----------|---------|--------------|
| Add | `ADD` | Omitted | Added row | Yes |
| Update | `UPDATE` | Previous row | Current row | Yes |
| Delete | `DELETE` | Deleted row | Omitted | Yes |
| Aggregation | `UPDATE` | Previous aggregate, omitted on first emission | Current aggregate | Yes |
| Noop | N/A | N/A | N/A | No request |

Example default request:

```http
POST /changes/orders HTTP/1.1
Content-Type: application/json

{
  "operation": "ADD",
  "queryId": "orders",
  "sequenceId": 42,
  "timestamp": "2026-01-01T00:00:00+00:00",
  "after": {
    "id": 1,
    "total": 125.5
  }
}
```

## Adaptive Batching

Set `adaptive` and `batchEndpoint` to enable batched delivery. In batch mode, the reaction groups result changes and sends each batch as one `POST` request to `{baseUrl}{batchEndpoint}`.

```yaml
reactions:
  - kind: http
    id: batched-webhook
    queries: [orders, shipments]
    baseUrl: https://api.example.com
    adaptive:
      adaptiveMinBatchSize: 50
      adaptiveMaxBatchSize: 2000
      adaptiveWindowSize: 100
      adaptiveBatchTimeoutMs: 500
    batchEndpoint: /events/batch
```

### Adaptive Settings

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `adaptiveMinBatchSize` | integer | `1` | Lower bound on batch size, used during idle or low traffic. Must be greater than `0`. |
| `adaptiveMaxBatchSize` | integer | `100` | Upper bound on batch size, used during bursts. Must be greater than `0` and at least `adaptiveMinBatchSize`. |
| `adaptiveWindowSize` | integer | `10` | Throughput sample window in 100 ms units. `10` is 1 second, `50` is 5 seconds, and `100` is 10 seconds. Must be between `1` and `255`. |
| `adaptiveBatchTimeoutMs` | integer | `1000` | Maximum time to wait before flushing a partial batch. Must be greater than `0`. |

### Batch Endpoint

`batchEndpoint` must be an absolute path that starts with a single `/`, for example `/events/batch`. It cannot be an absolute URL and cannot contain Handlebars templates.

Each batch is sent as a `BatchEnvelope`:

```json
{
  "batch": [
    {
      "operation": "ADD",
      "queryId": "orders",
      "sequenceId": 100,
      "timestamp": "2026-01-01T00:00:00+00:00",
      "after": { "id": 1 }
    },
    {
      "operation": "UPDATE",
      "queryId": "shipments",
      "sequenceId": 101,
      "timestamp": "2026-01-01T00:00:01+00:00",
      "before": { "id": 2, "status": "pending" },
      "after": { "id": 2, "status": "shipped" }
    }
  ]
}
```

In adaptive mode:

- Per-query body `template` values still apply to each item in `batch`.
- Per-item `url`, `method`, and `headers` do not apply, because the whole batch is one `POST` to `batchEndpoint`.
- If a body template is not configured, fails to render, or renders invalid JSON, that batch item falls back to the default change notification envelope.
- A batch may contain items from multiple subscribed queries.

Example with custom batch items:

```yaml
reactions:
  - kind: http
    id: batched-events
    queries: [orders]
    baseUrl: https://events.example.com
    adaptive:
      adaptiveMinBatchSize: 25
      adaptiveMaxBatchSize: 500
      adaptiveWindowSize: 50
      adaptiveBatchTimeoutMs: 1000
    batchEndpoint: /bulk
    outputTemplates:
      routes:
        orders:
          added:
            template: |
              {
                "type": "order_created",
                "order": {{json after}}
              }
          updated:
            template: |
              {
                "type": "order_updated",
                "before": {{json before}},
                "after": {{json after}}
              }
```

## Authentication and Headers

Set `token` to send a bearer token on every request:

```yaml
reactions:
  - kind: http
    id: api-webhook
    queries: [events]
    baseUrl: https://api.example.com
    token: ${API_TOKEN}
```

Use `headers` on individual output templates for additional headers:

```yaml
reactions:
  - kind: http
    id: custom-auth
    queries: [events]
    baseUrl: https://api.example.com
    outputTemplates:
      routes:
        events:
          added:
            url: /webhook
            method: POST
            template: '{{json after}}'
            headers:
              X-API-Key: ${API_KEY}
              X-Query: "{{query_id}}"
              X-Operation: "{{operation}}"
              Content-Type: application/json
```

## Failure Handling and Recovery

The HTTP reaction retries transient delivery failures up to three times with exponential backoff. Transient failures include network send errors, HTTP 5xx responses, and HTTP `408`, `409`, `425`, and `429` responses.

After the retry budget is exhausted, the configured `recoveryPolicy` is applied:

| Policy | Behavior |
|--------|----------|
| `strict` | Fail-stops the reaction without advancing the checkpoint. Unacknowledged work can replay from the query outbox after restart. |
| `auto_skip_gap` | Skips the failed item or batch, advances past it, and keeps the reaction running. |

Authentication and permission rejections (`401`, `403`, `407`) are treated as sustained failures and use the recovery policy. They are not silently dropped, because refreshing credentials may allow replay to succeed.

Permanent failures that cannot succeed on replay are dropped and the checkpoint advances past them. Examples include most other 4xx responses, invalid HTTP methods, invalid auth-token header values, and rejected rendered URLs.

Template render failures do not drop a change:

- URL render failures fall back to `/changes/{queryId}`.
- Body render failures fall back to the default change notification envelope.
- Header render failures or invalid rendered header values drop only that header.

## Validation Rules

The reaction validates configuration at startup:

- `baseUrl` must be a valid `http` or `https` URL with a host and no query string or fragment.
- `timeoutMs` and `priorityQueueCapacity` must be greater than `0` when set.
- `batchEndpoint` and `adaptive` must be configured together.
- `batchEndpoint` must be a path such as `/events/batch`, not an absolute URL, and cannot contain templates.
- `adaptiveMinBatchSize` must be less than or equal to `adaptiveMaxBatchSize`.
- `adaptiveWindowSize` must be in the range `1` to `255`.
- Body, URL, and header templates must compile as valid Handlebars templates.
- Route keys must match a subscribed query ID or the query ID's last dotted segment.

## Examples

### GitHub Integration

Create GitHub issues from alert results:

```yaml
reactions:
  - kind: http
    id: github-issues
    queries: [critical-alerts]
    baseUrl: https://api.github.com
    token: ${GITHUB_TOKEN}
    outputTemplates:
      routes:
        critical-alerts:
          added:
            url: /repos/{{after.repo}}/issues
            method: POST
            template: |
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
    baseUrl: https://hooks.slack.com
    outputTemplates:
      routes:
        important-events:
          added:
            url: /services/XXX/YYY/ZZZ
            method: POST
            template: |
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

### High-Throughput Event Ingestion

```yaml
reactions:
  - kind: http
    id: event-ingestion
    queries: [orders, inventory, customers]
    baseUrl: https://events.example.com
    token: ${EVENT_TOKEN}
    timeoutMs: 10000
    priorityQueueCapacity: 50000
    recoveryPolicy: strict
    adaptive:
      adaptiveMinBatchSize: 100
      adaptiveMaxBatchSize: 1000
      adaptiveWindowSize: 100
      adaptiveBatchTimeoutMs: 2000
    batchEndpoint: /events/batch
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
    baseUrl: https://webhook.site
    outputTemplates:
      routes:
        my-query:
          added:
            url: /your-unique-id
            method: POST
            template: '{{json after}}'
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
    baseUrl: http://localhost:9999
```

The local test above sends default notifications to `http://localhost:9999/changes/my-query`.

## Complete Example

```yaml
host: 0.0.0.0
port: 8080
logLevel: info

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
      - sourceId: orders-db

reactions:
  - kind: http
    id: order-notifications
    queries: [high-value-orders]
    baseUrl: ${WEBHOOK_URL}
    token: ${WEBHOOK_TOKEN}
    timeoutMs: 10000
    outputTemplates:
      routes:
        high-value-orders:
          added:
            url: /orders/high-value
            method: POST
            template: |
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
            template: |
              {
                "status": "{{after.status}}",
                "previous_status": "{{before.status}}"
              }
            headers:
              Content-Type: application/json
```

## Documentation resources

<div class="card-grid card-grid--2">
  <a href="https://github.com/drasi-project/drasi-core/blob/main/components/reactions/http/README.md" target="_blank" rel="noopener">
    <div class="unified-card unified-card--tutorials">
      <div class="unified-card-icon"><i class="fab fa-github"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">HTTP Reaction README</h3>
        <p class="unified-card-summary">Routing, templates, batching, and payload behavior</p>
      </div>
    </div>
  </a>
  <a href="https://github.com/drasi-project/drasi-core/blob/main/components/reactions/http/schema/output.schema.json" target="_blank" rel="noopener">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-code"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">HTTP Reaction Output Schema</h3>
        <p class="unified-card-summary">JSON schema for default notification and batch payloads</p>
      </div>
    </div>
  </a>
</div>

## Next steps

- [Configure gRPC Reaction](/drasi-server/how-to-guides/configuration/configure-reactions/configure-grpc-reaction/)
- [Configure SSE Reaction](/drasi-server/how-to-guides/configuration/configure-reactions/configure-sse-reaction/)
