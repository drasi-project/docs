---
type: "docs"
title: "Configure HTTP Source"
linkTitle: "HTTP"
weight: 20
description: "Receive change events via HTTP or webhooks"
related:
  concepts:
    - title: "Sources"
      url: "/concepts/sources/"
  howto:
    - title: "Configure Bootstrap Providers"
      url: "/drasi-server/how-to-guides/configuration/configure-bootstrap-providers/"
    - title: "Configure Reactions"
      url: "/drasi-server/how-to-guides/configuration/configure-reactions/"
  reference:
    - title: "Configuration Reference"
      url: "/drasi-server/reference/configuration/"
---

The HTTP {{< term "Source" >}} exposes HTTP endpoints that external applications can use to **push change events** (insert/update/delete) into {{< term "Drasi Server" >}}. It supports two mutually exclusive modes:

- **Standard Mode** — structured event endpoints for applications that produce Drasi change events directly.
- **Webhook Mode** — configurable routes with template-based payload transformation for receiving arbitrary payloads from external services like GitHub, Shopify, or custom applications.

## When to use the HTTP source

- Accept change events from systems that can't use gRPC (simple HTTP clients, webhooks).
- Build a lightweight ingestion endpoint for custom apps and scripts.
- Feed Drasi from an event bridge that transforms external events into Drasi's change-event schema.
- Receive webhooks from external services (GitHub, Shopify, Stripe, etc.) and transform them into graph events.
- Connect third-party REST APIs to Drasi continuous queries.

## Prerequisites

- Your producer can reach the HTTP endpoint (`host:port`).
- For Standard Mode: you can generate JSON payloads matching the event schema below.
- For Webhook Mode: you know the payload format of the external service sending webhooks.

## Modes

The HTTP source operates in one of two mutually exclusive modes:

| Mode | When Active | Endpoints Available |
|------|-------------|---------------------|
| **Standard Mode** | No `webhooks` config present | `/sources/{id}/events`, `/sources/{id}/events/batch`, `/health` |
| **Webhook Mode** | `webhooks` config present | Custom routes defined in config + `/health` |

{{< alert title="Mutually exclusive" color="warning" >}}
When Webhook Mode is active (i.e., the `webhooks` key is present in your config), Standard Mode endpoints return 404. The modes cannot be combined.
{{< /alert >}}

---

## Standard Mode

### Quick example

Drasi Server source configuration uses **camelCase** keys.

```yaml
sources:
  - kind: http
    id: events-api
    autoStart: true

    host: 0.0.0.0
    port: 9000

    # Optional
    endpoint: null
    timeoutMs: 10000
```

If you run Drasi Server in Docker, remember to publish the HTTP source port:

```yaml
# docker-compose.yml (snippet)
services:
  drasi-server:
    image: ghcr.io/drasi-project/drasi-server:latest
    ports:
      - "8080:8080"   # Drasi Server REST API
      - "9000:9000"   # HTTP source
```

### Endpoints

The HTTP source exposes:

- `GET /health` — health check (returns service status and enabled features)
- `POST /sources/{sourceId}/events` — submit a single event
- `POST /sources/{sourceId}/events/batch` — submit multiple events

`{sourceId}` must match the source `id` from your Drasi Server config (otherwise requests are rejected).

### Event schema

Events are JSON objects with a tagged-union `operation` field:

- `operation: "insert" | "update"` uses an `element` (a `node` or `relation`).
- `operation: "delete"` uses `id` (and optionally `labels`).

{{< alert title="Timestamps" color="info" >}}
If provided, `timestamp` is **nanoseconds** since Unix epoch. The HTTP source converts it to milliseconds internally.
If omitted, the source uses the current system time.
{{< /alert >}}

#### Insert/update: node

```json
{
  "operation": "insert",
  "element": {
    "type": "node",
    "id": "user-123",
    "labels": ["User"],
    "properties": {
      "email": "alice@example.com",
      "age": 30,
      "active": true
    }
  },
  "timestamp": 1738650000000000000
}
```

#### Insert/update: relation

```json
{
  "operation": "insert",
  "element": {
    "type": "relation",
    "id": "follows-1",
    "labels": ["FOLLOWS"],
    "from": "user-123",
    "to": "user-456",
    "properties": {
      "since": "2024-01-01"
    }
  }
}
```

Relationship direction semantics are:

`(from)-[relation]->(to)`

#### Delete

```json
{
  "operation": "delete",
  "id": "user-123",
  "labels": ["User"],
  "timestamp": 1738650001000000000
}
```

### Response format

**Success:**

```json
{
  "success": true,
  "message": "All 2 events processed successfully",
  "error": null
}
```

**Partial success (batch):**

```json
{
  "success": true,
  "message": "Processed 8 events successfully, 2 failed",
  "error": "Invalid element type"
}
```

**Error:**

```json
{
  "success": false,
  "message": "All 1 events failed",
  "error": "Source name mismatch"
}
```

### curl examples

Single event:

```bash
curl -X POST http://localhost:9000/sources/events-api/events \
  -H 'Content-Type: application/json' \
  -d '{
    "operation":"insert",
    "element":{
      "type":"node",
      "id":"test-1",
      "labels":["Test"],
      "properties": {"message":"hello"}
    }
  }'
```

Batch:

```bash
curl -X POST http://localhost:9000/sources/events-api/events/batch \
  -H 'Content-Type: application/json' \
  -d '{
    "events": [
      {"operation":"insert","element":{"type":"node","id":"1","labels":["Test"],"properties":{}}},
      {"operation":"update","element":{"type":"node","id":"1","labels":["Test"],"properties":{"status":"updated"}}}
    ]
  }'
```

Health check:

```bash
curl http://localhost:9000/health
```

---

## Webhook Mode

Webhook Mode enables the HTTP source to receive arbitrary payloads from external services and transform them into graph events using [Handlebars](https://handlebarsjs.com/) templates.

### Quick example

```yaml
sources:
  - kind: http
    id: webhook-source
    autoStart: true

    host: 0.0.0.0
    port: 9000

    webhooks:
      errorBehavior: acceptAndLog
      routes:
        - path: "/github/events"
          methods: ["POST"]
          auth:
            signature:
              type: hmac-sha256
              secretEnv: GITHUB_WEBHOOK_SECRET
              header: X-Hub-Signature-256
              prefix: "sha256="
          mappings:
            - when:
                header: X-GitHub-Event
                equals: push
              operation: insert
              elementType: node
              effectiveFrom: "{{payload.head_commit.timestamp}}"
              template:
                id: "commit-{{payload.head_commit.id}}"
                labels: ["Commit", "GitHubPush"]
                properties:
                  message: "{{payload.head_commit.message}}"
                  author: "{{payload.head_commit.author.name}}"
                  branch: "{{payload.ref}}"
```

### Webhook configuration options

#### Top-level settings

| Field | Type | Values | Default |
|-------|------|--------|---------|
| `errorBehavior` | string | `reject`, `acceptAndLog`, `acceptSilent` | `reject` |
| `cors` | object | CORS configuration (see below) | None (CORS disabled) |
| `routes` | array | Array of route configurations | **Required** |

#### CORS configuration

Enable CORS (Cross-Origin Resource Sharing) for browser-based clients:

```yaml
webhooks:
  cors:
    enabled: true
    allowOrigins: ["*"]
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allowHeaders: ["Content-Type", "Authorization"]
    exposeHeaders: []
    allowCredentials: false
    maxAge: 3600
  routes:
    # ...
```

| Field | Type | Default |
|-------|------|---------|
| `enabled` | boolean | `true` |
| `allowOrigins` | string[] | `["*"]` |
| `allowMethods` | string[] | `["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]` |
| `allowHeaders` | string[] | `["Content-Type", "Authorization", "X-Requested-With"]` |
| `exposeHeaders` | string[] | `[]` |
| `allowCredentials` | boolean | `false` |
| `maxAge` | integer | `3600` |

#### Route settings

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | string | Yes | URL path pattern (supports `:param` syntax for path parameters) |
| `methods` | string[] | No | HTTP methods to accept (defaults to all) |
| `auth` | object | No | Authentication configuration |
| `errorBehavior` | string | No | Override the global error behavior for this route |
| `mappings` | array | Yes | Array of payload-to-event mappings |

### Authentication

#### HMAC signature verification

Used by services like GitHub and Shopify that sign webhook payloads:

```yaml
auth:
  signature:
    type: hmac-sha256      # or hmac-sha1
    secretEnv: SECRET_VAR  # Environment variable containing the shared secret
    header: X-Hub-Signature-256
    prefix: "sha256="      # Optional prefix to strip before verifying
    encoding: hex          # hex (default) or base64
```

#### Bearer token

```yaml
auth:
  bearer:
    tokenEnv: API_TOKEN    # Environment variable containing the expected token
```

{{< alert title="Combining auth methods" color="info" >}}
When both `signature` and `bearer` auth are configured on a route, **both** must pass for the request to be accepted.
{{< /alert >}}

### Mapping settings

Each mapping transforms a matched request into a graph event.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `when` | object | No | Condition for this mapping to apply |
| `operation` | string | No | Graph operation: `insert`, `update`, `delete` |
| `operationFrom` | string | No | Path to operation value in payload (e.g., `payload.action`) |
| `elementType` | string | Yes | `node` or `relation` |
| `effectiveFrom` | string | No | Handlebars template for timestamp |
| `template` | object | Yes | Element template |

#### Conditions (`when`)

Conditions currently support matching against `header` (HTTP headers) and `field` (payload fields). Path parameters and query parameters are available in templates via `{{route.param}}` and `{{query.param}}`, but cannot be used in `when` conditions.

```yaml
# Match an HTTP header value
when:
  header: X-GitHub-Event
  equals: push

# Match a payload field (dot notation for nested fields)
when:
  field: event.type
  equals: order.created

# Match with contains
when:
  header: Content-Type
  contains: json

# Match with regex
when:
  field: action
  regex: "^(created|updated)$"
```

### Template structure

#### Node template

```yaml
template:
  id: "{{payload.id}}"
  labels: ["Order", "{{payload.type}}"]
  properties:
    customer: "{{payload.customer.name}}"
    total: "{{payload.total}}"
    items: "{{payload.line_items}}"
```

#### Relation template

```yaml
template:
  id: "rel-{{payload.id}}"
  labels: ["PURCHASED"]
  from: "customer-{{payload.customer_id}}"
  to: "product-{{payload.product_id}}"
  properties:
    quantity: "{{payload.quantity}}"
```

#### Spread entire payload as properties

Use a template string instead of an object to spread all fields from the incoming payload as node/relation properties:

```yaml
template:
  id: "event-{{payload.id}}"
  labels: ["Event"]
  properties: "{{payload}}"
```

With this configuration, an incoming payload like `{"id": "123", "name": "Test", "status": "active"}` creates a node with properties `id`, `name`, and `status`.

You can also spread a nested object:

```yaml
template:
  id: "{{payload.id}}"
  labels: ["Event"]
  properties: "{{payload.data}}"
```

### Template context variables

Templates have access to these variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `payload` | Parsed request body | `{{payload.user.name}}` |
| `headers` | HTTP headers (lowercase keys) | `{{headers.x-request-id}}` |
| `route` | Path parameters from route | `{{route.id}}` |
| `query` | Query string parameters | `{{query.filter}}` |
| `method` | HTTP method | `{{method}}` |
| `path` | Request path | `{{path}}` |

> **Note**: Header names are lowercase in the `headers` context. Access `Content-Type` via `{{headers.content-type}}`.

### Template helpers

| Helper | Description | Example |
|--------|-------------|---------|
| `lowercase` | Convert to lowercase | `{{lowercase payload.name}}` |
| `uppercase` | Convert to uppercase | `{{uppercase payload.status}}` |
| `now` | Current timestamp (ms) | `{{now}}` |
| `concat` | Concatenate strings | `{{concat "prefix-" payload.id}}` |
| `default` | Fallback value | `{{default payload.name "Unknown"}}` |
| `json` | Serialize to JSON string | `{{json payload.metadata}}` |

### Property value types

Template values preserve their original types from the payload:

| Payload Type | Result Type |
|--------------|-------------|
| String | String |
| Number | Integer or Float |
| Boolean | Bool |
| Array | List |
| Object | Object |
| Null | Null |

To force a value to a JSON string, use the `json` helper:

```yaml
metadata: "{{json payload.complex_object}}"
```

### Timestamp handling (`effectiveFrom`)

The `effectiveFrom` field sets the element's effective timestamp in **milliseconds since Unix epoch**. It auto-detects format:

| Input | Detection | Conversion |
|-------|-----------|------------|
| `1699900000` | Unix seconds | × 1,000 (to milliseconds) |
| `1699900000000` | Unix milliseconds | Used directly |
| `1699900000000000000` | Unix nanoseconds | ÷ 1,000,000 (to milliseconds) |
| `2024-01-15T10:30:00Z` | ISO 8601 | Parsed to milliseconds |
| `2024-01-15T10:30:00.123Z` | ISO 8601 with ms | Parsed to milliseconds |

### Error behavior

Controls how mapping errors are handled:

| Value | Behavior |
|-------|----------|
| `reject` | Return HTTP 400/500 error |
| `acceptAndLog` | Return HTTP 200, log error |
| `acceptSilent` | Return HTTP 200, ignore silently |

Set globally in `webhooks.errorBehavior` or override per-route with `routes[].errorBehavior`.

### Multi-format payload support

The webhook mode parses request bodies based on `Content-Type`:

| Content-Type | Parsing |
|---|---|
| `application/json` | JSON |
| `application/xml`, `text/xml` | XML |
| `application/x-yaml`, `text/yaml` | YAML |
| `text/plain` | Plain text (available as `{{payload}}`) |

### Example: GitHub webhooks

```yaml
webhooks:
  routes:
    - path: "/github/events"
      methods: ["POST"]
      auth:
        signature:
          type: hmac-sha256
          secretEnv: GITHUB_WEBHOOK_SECRET
          header: X-Hub-Signature-256
          prefix: "sha256="
      mappings:
        # Push events
        - when:
            header: X-GitHub-Event
            equals: push
          operation: insert
          elementType: node
          effectiveFrom: "{{payload.head_commit.timestamp}}"
          template:
            id: "commit-{{payload.head_commit.id}}"
            labels: ["Commit"]
            properties:
              message: "{{payload.head_commit.message}}"
              author: "{{payload.head_commit.author.name}}"
              repo: "{{payload.repository.full_name}}"
              branch: "{{payload.ref}}"

        # Issue events
        - when:
            header: X-GitHub-Event
            equals: issues
          operationFrom: payload.action
          elementType: node
          template:
            id: "issue-{{payload.issue.id}}"
            labels: ["Issue"]
            properties:
              title: "{{payload.issue.title}}"
              state: "{{payload.issue.state}}"
              author: "{{payload.issue.user.login}}"
```

### Example: Shopify webhooks

```yaml
webhooks:
  routes:
    - path: "/shopify/orders"
      methods: ["POST"]
      auth:
        signature:
          type: hmac-sha256
          secretEnv: SHOPIFY_WEBHOOK_SECRET
          header: X-Shopify-Hmac-SHA256
          encoding: base64
      mappings:
        - when:
            header: X-Shopify-Topic
            equals: orders/create
          operation: insert
          elementType: node
          template:
            id: "order-{{payload.id}}"
            labels: ["Order"]
            properties:
              order_number: "{{payload.order_number}}"
              total: "{{payload.total_price}}"
              currency: "{{payload.currency}}"
              customer_email: "{{payload.email}}"
              line_items: "{{payload.line_items}}"
```

### Example: Generic REST API with path parameters

```yaml
webhooks:
  routes:
    - path: "/api/:resource/:id"
      methods: ["POST", "PUT", "DELETE"]
      auth:
        bearer:
          tokenEnv: API_SECRET_TOKEN
      mappings:
        - when:
            field: resource_type
            equals: users
          operation: insert
          elementType: node
          template:
            id: "user-{{route.id}}"
            labels: ["User"]
            properties:
              name: "{{payload.name}}"
              email: "{{payload.email}}"
```

---

## Configuration reference (Drasi Server)

### Core settings

| Field | Type | Default | Description |
|---|---:|---:|---|
| `kind` | string | required | Must be `http`. |
| `id` | string | required | Unique source identifier. Used as `{sourceId}` in Standard Mode request URLs. |
| `autoStart` | boolean | `true` | Whether Drasi Server starts the source on startup. |
| `host` | string | required | Address to bind the HTTP server to. |
| `port` | integer | `8080` | Port to listen on. |
| `endpoint` | string | none | Optional custom endpoint path. |
| `timeoutMs` | integer | `10000` | Request timeout in milliseconds. |
| `bootstrapProvider` | object | none | Optional bootstrap provider to preload initial state. See [Configure Bootstrap Providers](/drasi-server/how-to-guides/configuration/configure-bootstrap-providers/). |

### Adaptive batching settings

| Field | Type | Default | Description |
|---|---:|---:|---|
| `adaptiveEnabled` | boolean | `true` | Enable/disable adaptive parameter adjustment. |
| `adaptiveMaxBatchSize` | integer | `1000` | Maximum events per batch. |
| `adaptiveMinBatchSize` | integer | `10` | Minimum batch size used by the adaptive batcher. |
| `adaptiveMaxWaitMs` | integer | `100` | Maximum time (ms) to wait before dispatching a batch. |
| `adaptiveMinWaitMs` | integer | `1` | Minimum wait time (ms) between batches (helps coalesce messages). |
| `adaptiveWindowSecs` | integer | `5` | Throughput measurement window (seconds). |

### Webhook settings

When the `webhooks` key is present, [Webhook Mode](#webhook-mode) is activated and Standard Mode endpoints are disabled.

#### `webhooks` (top-level)

| Field | Type | Default | Description |
|---|---|---|---|
| `errorBehavior` | string | `reject` | Default error handling for all routes. Values: `reject`, `acceptAndLog`, `acceptSilent`. |
| `cors` | object | none | CORS configuration. When absent, CORS is disabled. |
| `routes` | array | **required** | Array of route definitions (at least one required). |

#### `webhooks.cors`

| Field | Type | Default | Description |
|---|---|---|---|
| `enabled` | boolean | `true` | Enable/disable CORS. |
| `allowOrigins` | string[] | `["*"]` | Allowed origins. Use `["*"]` for any. |
| `allowMethods` | string[] | `["GET","POST","PUT","PATCH","DELETE","OPTIONS"]` | Allowed HTTP methods. |
| `allowHeaders` | string[] | `["Content-Type","Authorization","X-Requested-With"]` | Allowed request headers. |
| `exposeHeaders` | string[] | `[]` | Headers to expose to the browser. |
| `allowCredentials` | boolean | `false` | Whether to allow cookies/auth headers. |
| `maxAge` | integer | `3600` | Preflight cache duration in seconds. |

#### `webhooks.routes[]`

| Field | Type | Default | Description |
|---|---|---|---|
| `path` | string | **required** | URL path pattern. Supports `:param` syntax for path parameters (e.g., `/api/:resource/:id`). |
| `methods` | string[] | all methods | HTTP methods to accept. |
| `auth` | object | none | Authentication configuration for this route. |
| `errorBehavior` | string | inherits global | Override global error behavior for this route. |
| `mappings` | array | **required** | Array of payload-to-event mapping definitions. |

#### `webhooks.routes[].auth.signature` (HMAC)

| Field | Type | Default | Description |
|---|---|---|---|
| `type` | string | **required** | Algorithm: `hmac-sha256` or `hmac-sha1`. |
| `secretEnv` | string | **required** | Name of the environment variable containing the shared secret. |
| `header` | string | **required** | HTTP header containing the signature (e.g., `X-Hub-Signature-256`). |
| `prefix` | string | `""` | Prefix to strip from the header value before verification (e.g., `sha256=`). |
| `encoding` | string | `hex` | Signature encoding: `hex` or `base64`. |

#### `webhooks.routes[].auth.bearer`

| Field | Type | Default | Description |
|---|---|---|---|
| `tokenEnv` | string | **required** | Name of the environment variable containing the expected bearer token. |

#### `webhooks.routes[].mappings[]`

| Field | Type | Default | Description |
|---|---|---|---|
| `when` | object | none | Condition that must match for this mapping to apply. If omitted, the mapping always applies. |
| `operation` | string | none | Static graph operation: `insert`, `update`, or `delete`. |
| `operationFrom` | string | none | Dot-path to derive the operation from the payload (e.g., `payload.action`). Mutually exclusive with `operation`. |
| `elementType` | string | **required** | Graph element type: `node` or `relation`. |
| `effectiveFrom` | string | none | Handlebars template resolving to a timestamp. Auto-detects seconds/ms/ns/ISO 8601 format. |
| `template` | object | **required** | Element template defining the graph element shape. |

#### `webhooks.routes[].mappings[].when` (condition)

| Field | Type | Description |
|---|---|---|
| `header` | string | Match against an HTTP header value (mutually exclusive with `field`). |
| `field` | string | Match against a payload field using dot notation (mutually exclusive with `header`). |
| `equals` | string | Exact match. |
| `contains` | string | Substring match. |
| `regex` | string | Regular expression match. |

Only one of `equals`, `contains`, or `regex` should be specified per condition.

#### `webhooks.routes[].mappings[].template` (element template)

**Node template:**

| Field | Type | Description |
|---|---|---|
| `id` | string | **Required.** Handlebars template for the node ID. |
| `labels` | string[] | **Required.** Array of label strings (may contain Handlebars expressions). |
| `properties` | object or string | Key-value map of properties (values may be Handlebars templates), or a single Handlebars expression string to spread an object as properties. |

**Relation template:**

| Field | Type | Description |
|---|---|---|
| `id` | string | **Required.** Handlebars template for the relation ID. |
| `labels` | string[] | **Required.** Array of label strings (may contain Handlebars expressions). |
| `from` | string | **Required.** Handlebars template for the source node ID. |
| `to` | string | **Required.** Handlebars template for the target node ID. |
| `properties` | object or string | Key-value map of properties, or a single Handlebars expression string to spread an object. |

{{< alert title="Builder-only settings" color="info" >}}
The upstream HTTP source plugin also supports `dispatch_mode` (Channel/Broadcast) and `dispatch_buffer_capacity` settings via its Rust builder API. These are not currently exposed through Drasi Server YAML configuration.
{{< /alert >}}

## Adaptive batching

The HTTP source includes intelligent batching that automatically adjusts based on throughput:

| Throughput Level | Messages/Second | Batch Size | Wait Time |
|-------|----------------|------------|-----------|
| Idle | < 1 | Minimum | 1 ms |
| Low | 1–100 | Small (2× min) | 1 ms |
| Medium | 100–1,000 | Moderate (25% of max) | 10 ms |
| High | 1,000–10,000 | Large (50% of max) | 25 ms |
| Burst | > 10,000 | Maximum | 50 ms |

### Tuning guidelines

- **Low latency** (real-time dashboards): set `adaptiveMaxWaitMs: 10` and `adaptiveMinBatchSize: 1`.
- **High throughput** (bulk ingestion): set `adaptiveMaxBatchSize: 5000` and `adaptiveMaxWaitMs: 500`.
- **Disable adaptive batching**: set `adaptiveEnabled: false`.

## Performance tuning notes

- Use the `/events/batch` endpoint when you can; it reduces HTTP overhead.
- For bursty workloads, increase `adaptiveMaxBatchSize` (note: internal buffering scales with this).
- For lower latency, reduce `adaptiveMaxWaitMs`.
- If you want stable behavior (no adaptive adjustment), set `adaptiveEnabled: false`.
- Monitor the `/health` endpoint for production deployments.

## Troubleshooting

**Connection refused**
- Ensure the source is started (`autoStart: true` or started via the server API).
- Verify Docker port publishing and firewall rules.

**400 "Source name mismatch"** (Standard Mode)
- The `{sourceId}` path segment must match the configured `id`.

**404 on standard endpoints**
- You have `webhooks` configured, which activates Webhook Mode and disables standard endpoints. Remove the `webhooks` key to use Standard Mode.

**Invalid event format** (Standard Mode)
- Ensure JSON is valid.
- Ensure `operation` is one of `insert`, `update`, `delete`.
- For insert/update, include `element.type`, `element.id`, and `element.labels`.
- For relations, include `from` and `to`.

**Authentication failures** (Webhook Mode)
- Verify the environment variable referenced by `secretEnv` / `tokenEnv` is set and correct.
- For HMAC signatures, ensure the `prefix` and `encoding` match what the external service sends.

**Template rendering errors** (Webhook Mode)
- Ensure Handlebars expressions reference valid paths in the payload.
- Use `{{default payload.field "fallback"}}` to handle optional fields.

## Known limitations

- Standard Mode does not provide built-in authentication/TLS; use a gateway/reverse-proxy if you need them.
- Webhook Mode provides HMAC and Bearer token auth, but not TLS; use a reverse proxy for TLS termination.
- Standard Mode and Webhook Mode are mutually exclusive.

## Producer examples

### Python

```python
import requests
import json
from datetime import datetime

DRASI_URL = "http://localhost:9000"
SOURCE_ID = "events-api"

def send_event(operation, element=None, element_id=None, labels=None):
    """Send a change event to Drasi HTTP source."""
    url = f"{DRASI_URL}/sources/{SOURCE_ID}/events"
    
    if operation in ("insert", "update"):
        payload = {
            "operation": operation,
            "element": element
        }
    else:  # delete
        payload = {
            "operation": "delete",
            "id": element_id,
            "labels": labels or []
        }
    
    response = requests.post(url, json=payload)
    response.raise_for_status()
    return response.json()

# Insert a new user
send_event("insert", element={
    "type": "node",
    "id": "user-123",
    "labels": ["User"],
    "properties": {
        "name": "Alice",
        "email": "alice@example.com",
        "created_at": datetime.now().isoformat()
    }
})

# Update the user
send_event("update", element={
    "type": "node",
    "id": "user-123",
    "labels": ["User"],
    "properties": {
        "name": "Alice Smith",
        "email": "alice.smith@example.com"
    }
})

# Delete the user
send_event("delete", element_id="user-123", labels=["User"])
```

### Node.js

```javascript
const axios = require('axios');

const DRASI_URL = 'http://localhost:9000';
const SOURCE_ID = 'events-api';

async function sendEvent(event) {
  const url = `${DRASI_URL}/sources/${SOURCE_ID}/events`;
  const response = await axios.post(url, event);
  return response.data;
}

// Insert a node
await sendEvent({
  operation: 'insert',
  element: {
    type: 'node',
    id: 'order-456',
    labels: ['Order'],
    properties: {
      customer_id: 'user-123',
      total: 99.99,
      status: 'pending'
    }
  }
});

// Send batch of events
const batchUrl = `${DRASI_URL}/sources/${SOURCE_ID}/events/batch`;
await axios.post(batchUrl, {
  events: [
    { operation: 'insert', element: { type: 'node', id: 'item-1', labels: ['Item'], properties: { name: 'Widget' }}},
    { operation: 'insert', element: { type: 'node', id: 'item-2', labels: ['Item'], properties: { name: 'Gadget' }}}
  ]
});
```

## Documentation resources

<div class="card-grid card-grid--2">
  <a href="https://github.com/drasi-project/drasi-core/blob/main/components/sources/http/README.md" target="_blank" rel="noopener">
    <div class="unified-card unified-card--tutorials">
      <div class="unified-card-icon"><i class="fab fa-github"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">HTTP Source README</h3>
        <p class="unified-card-summary">Protocol details, JSON schema, and usage examples</p>
      </div>
    </div>
  </a>
  <a href="https://crates.io/crates/drasi-source-http" target="_blank" rel="noopener">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-box"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">drasi-source-http on crates.io</h3>
        <p class="unified-card-summary">Package info and release history</p>
      </div>
    </div>
  </a>
</div>
