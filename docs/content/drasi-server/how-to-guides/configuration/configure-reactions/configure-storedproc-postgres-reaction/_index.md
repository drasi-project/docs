---
type: "docs"
title: "Configure PostgreSQL Stored Procedure Reaction"
linkTitle: "PostgreSQL Stored Procedure"
weight: 35
description: "Invoke PostgreSQL stored procedures when query results change"
related:
  concepts:
    - title: "Reactions"
      url: "/concepts/reactions/"
  howto:
    - title: "Configure HTTP Reaction"
      url: "/drasi-server/how-to-guides/configuration/configure-reactions/configure-http-reaction/"
    - title: "Configure AWS SQS Reaction"
      url: "/drasi-server/how-to-guides/configuration/configure-reactions/configure-aws-sqs-reaction/"
  reference:
    - title: "Configuration Reference"
      url: "/drasi-server/reference/configuration/"
---

The PostgreSQL Stored Procedure {{< term "Reaction" >}} invokes PostgreSQL stored procedures when query {{< term "Result Change Event" "results change" >}}. Use it to synchronize query result changes into a PostgreSQL database by calling a different, configurable stored procedure for `added`, `updated`, and `deleted` changes.

Row data is bound as safe positional SQL parameters, so untrusted values can never alter the command structure. The reaction supports per-query template overrides, a shared default template, SSL, a configurable command timeout, and automatic retries with exponential backoff.

## Basic Configuration

```yaml
reactions:
  - kind: storedproc-postgres
    id: user-sync
    queries: [user-changes]
    hostname: localhost
    port: 5432
    database: mydb
    user: postgres
    password: ${DB_PASSWORD}
    defaultTemplate:
      added:
        template: "CALL add_user({{param after.id}}, {{param after.name}}, {{param after.email}})"
      updated:
        template: "CALL update_user({{param after.id}}, {{param after.name}}, {{param after.email}})"
      deleted:
        template: "CALL delete_user({{param before.id}})"
```

## Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `kind` | string | Required | Must be `storedproc-postgres` |
| `id` | string | Required | Unique reaction identifier |
| `queries` | array | Required | Query IDs to subscribe to |
| `autoStart` | boolean | `true` | Start reaction automatically |
| `hostname` | string | `localhost` | Database hostname or IP address |
| `port` | integer | `5432` | Database port |
| `user` | string | Required | Database user |
| `password` | string | Required | Database password |
| `database` | string | Required | Database name |
| `ssl` | boolean | `false` | Enable SSL/TLS |
| `defaultTemplate` | object | None | Fallback templates applied to all queries |
| `routes` | object | `{}` | Per-query template overrides |
| `commandTimeoutMs` | integer | `30000` | Command timeout in milliseconds |
| `retryAttempts` | integer | `3` | Number of retries on failure |

## Template Configuration

A template configuration (`defaultTemplate` or a `routes` entry) supplies a stored-procedure command for each change type:

| Change Type | When Triggered | Data Available |
|-------------|----------------|----------------|
| `added` | New item in results | `after` |
| `updated` | Item changed | `before`, `after` |
| `deleted` | Item removed | `before` |

Each change type accepts a template spec:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `template` | string | Yes | Handlebars template for the stored procedure command |

If no template is configured for an operation, the event for that operation is skipped.

## Command Templates

Stored-procedure commands are [Handlebars](https://handlebarsjs.com/) templates. Every template is compiled when the reaction starts, so an invalid template fails fast rather than at runtime.

### Template Context

Each template is rendered against a context with these keys:

| Key | Description | Available On |
|-----|-------------|--------------|
| `after` | The post-change row | `added`, `updated` |
| `before` | The pre-change row | `updated`, `deleted` |
| `data` | The raw data payload of an update diff | `updated` |
| `query_id` | The ID of the query that produced the result | all |
| `query_name` | Alias of `query_id` (same value; provided for symmetry with other reactions) | all |
| `operation` | `ADD`, `UPDATE`, or `DELETE` | all |
| `timestamp` | RFC3339 result timestamp | all |
| `metadata` | Result metadata map | all |

### Binding Values with `{{param}}`

Reference a field with the `{{param <expr>}}` helper. Instead of inlining the value into the SQL text, the helper appends the resolved value to the command's positional bind parameters and emits a `$N` placeholder. Untrusted row data therefore can never alter the command structure — it is always sent to PostgreSQL as a bound parameter.

For example, with this template:

```yaml
template: "CALL add_user({{param after.id}}, {{param after.name}}, {{param after.email}})"
```

and this `added` result row:

```json
{
  "id": 1,
  "name": "Alice",
  "email": "alice@example.com"
}
```

the reaction executes the SQL:

```sql
CALL add_user($1, $2, $3)
```

with `$1 = 1`, `$2 = "Alice"`, and `$3 = "alice@example.com"` bound as parameters.

### Nested Field Access

Access nested fields using dot notation:

```yaml
template: "CALL add_address({{param after.user.id}}, {{param after.address.city}})"
```

### Binding a Whole Object as JSONB

To pass an entire object to a `jsonb` argument, reference it with `{{param}}` directly. The object is bound as a single positional JSONB parameter, so it is safe even for untrusted row data:

```yaml
template: "CALL ingest_record({{param after}})"
```

{{< alert title="SQL Safety" color="info" >}}
Only `{{param <expr>}}` may emit a value into the rendered SQL. Bare (`{{expr}}`) and raw (`{{{expr}}}`) interpolation, as well as other helpers, are rejected when the reaction is built, so row data can never be inlined into the SQL text. Write the procedure name and any other structure as literal text in the template.
{{< /alert >}}

### Render Failures

If a template references a missing field, or otherwise fails to render, the reaction logs the error and skips that event rather than executing partial or unsafe SQL.

## Template Resolution Order

For each `(query_id, operation)` the reaction resolves the command template in this order:

1. A `routes` entry keyed by the full query ID.
2. A `routes` entry keyed by the query ID's last dotted segment (so `source.my_query` can be routed via a `my_query` key).
3. The shared `defaultTemplate`.

If none of these supplies a template for the operation, the event is skipped. Every `routes` key must match a subscribed query ID (or its last dotted segment); an unmatched key is rejected when the reaction is built.

## Examples

### Basic Single-Query Sync

Keep a `users_sync` table in step with a continuous query by calling a stored procedure for each change type:

```yaml
reactions:
  - kind: storedproc-postgres
    id: user-sync
    queries: [user-changes]
    hostname: localhost
    port: 5432
    database: mydb
    user: postgres
    password: ${DB_PASSWORD}
    ssl: true
    commandTimeoutMs: 30000
    retryAttempts: 3
    defaultTemplate:
      added:
        template: "CALL add_user({{param after.id}}, {{param after.name}}, {{param after.email}})"
      updated:
        template: "CALL update_user({{param after.id}}, {{param after.name}}, {{param after.email}})"
      deleted:
        template: "CALL delete_user({{param before.id}})"
```

### Multi-Query with Per-Query Route Overrides

Subscribe to multiple queries, apply a shared `defaultTemplate` to most of them, and override only the `product-changes` query with custom procedures. Because the `product-changes` route omits `deleted`, delete events for that query fall back to the default template.

```yaml
reactions:
  - kind: storedproc-postgres
    id: multi-query-sync
    queries: [user-changes, product-changes, order-changes]
    hostname: localhost
    port: 5432
    database: mydb
    user: postgres
    password: ${DB_PASSWORD}
    commandTimeoutMs: 5000
    retryAttempts: 3
    defaultTemplate:
      added:
        template: "CALL log_entity_added({{param after.id}}, {{param after.type}})"
      updated:
        template: "CALL log_entity_updated({{param after.id}}, {{param after.type}})"
      deleted:
        template: "CALL log_entity_deleted({{param before.id}}, {{param before.type}})"
    routes:
      product-changes:
        added:
          template: "CALL sync_product_added({{param after.product_id}}, {{param after.name}}, {{param after.price}}, {{param after.inventory}})"
        updated:
          template: "CALL sync_product_updated({{param after.product_id}}, {{param after.price}}, {{param after.inventory}})"
```

How this resolves:

- **`user-changes`** and **`order-changes`** → use the `defaultTemplate` for all operations.
- **`product-changes`** →
  - `added`: `CALL sync_product_added(...)` (custom route)
  - `updated`: `CALL sync_product_updated(...)` (custom route)
  - `deleted`: `CALL log_entity_deleted(...)` (falls back to the default template)

## Error Handling

The reaction retries failed procedure calls automatically with exponential backoff:

- Initial retry: 100ms delay
- Subsequent retries: 200ms, 400ms, 800ms, and so on
- Max retries: configurable with `retryAttempts` (default `3`)
- Timeout: configurable per command with `commandTimeoutMs` (default `30000`)

Enable debug logging for troubleshooting:

```yaml
logLevel: debug
```

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
  - kind: storedproc-postgres
    id: order-sync
    queries: [high-value-orders]
    hostname: ${SYNC_DB_HOST}
    port: 5432
    database: reporting
    user: ${SYNC_DB_USER}
    password: ${SYNC_DB_PASSWORD}
    ssl: true
    commandTimeoutMs: 10000
    retryAttempts: 3
    defaultTemplate:
      added:
        template: "CALL add_high_value_order({{param after.id}}, {{param after.customer_id}}, {{param after.total}}, {{param after.status}})"
      updated:
        template: "CALL update_order_status({{param after.id}}, {{param after.status}})"
      deleted:
        template: "CALL remove_high_value_order({{param before.id}})"
```

## Documentation Resources

- [PostgreSQL Stored Procedure Reaction README](https://github.com/drasi-project/drasi-core/blob/main/components/reactions/storedproc-postgres/README.md)
- [Source implementation (crate)](https://github.com/drasi-project/drasi-core/tree/main/components/reactions/storedproc-postgres)
