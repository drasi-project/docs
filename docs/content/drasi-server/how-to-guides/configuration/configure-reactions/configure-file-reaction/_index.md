---
type: "docs"
title: "Configure File Reaction"
linkTitle: "File"
weight: 25
description: "Write query result diffs to local or mounted filesystem paths"
related:
  concepts:
    - title: "Reactions"
      url: "/concepts/reactions/"
  howto:
    - title: "Configure Log Reaction"
      url: "/drasi-server/how-to-guides/configuration/configure-reactions/configure-log-reaction/"
    - title: "Configure HTTP Reaction"
      url: "/drasi-server/how-to-guides/configuration/configure-reactions/configure-http-reaction/"
  reference:
    - title: "Configuration Reference"
      url: "/drasi-server/reference/configuration/"
---

The File {{< term "Reaction" >}} writes query {{< term "Result Change Event" "result changes" >}} to local or mounted filesystem paths. Each diff can be formatted with Handlebars templates and persisted with append, overwrite, or per-change behavior.

## Basic Configuration

```yaml
reactions:
  - kind: file
    id: output-diffs
    queries: [my-query]
    outputPath: /data/drasi-out
    writeMode: append
```

## Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `kind` | string | Required | Must be `file` |
| `id` | string | Required | Unique reaction identifier |
| `queries` | array | Required | Query IDs to subscribe to |
| `autoStart` | boolean | `true` | Start reaction automatically |
| `outputPath` | string | Required | Base directory for output files |
| `writeMode` | string | Required | File persistence strategy: `append`, `overwrite`, or `per_change` |
| `filenameTemplate` | string | See below | Handlebars template for output filenames |
| `routes` | object | `{}` | Per-query template configurations |
| `defaultTemplate` | object | None | Fallback templates when no route matches |

## Write Modes

| Mode | Description |
|------|-------------|
| `append` | Append each rendered diff to a file. Default filename: `{{query_name}}.log` |
| `overwrite` | Rewrite the file with the latest rendered diff. Default filename: `{{query_name}}.json` |
| `per_change` | Write each rendered diff to a unique file. Default filename: `{{query_name}}_{{operation}}_{{uuid}}.json` |

## Handlebars Templates

Use templates to control the content written for each change type.

### Per-Query Templates

```yaml
reactions:
  - kind: file
    id: order-log
    queries: [orders-query]
    outputPath: /data/drasi-out
    writeMode: append
    filenameTemplate: "{{query_name}}.ndjson"
    routes:
      orders-query:
        added:
          template: '{"op":"add","order":{{json after}}}'
        updated:
          template: '{"op":"update","before":{{json before}},"after":{{json after}}}'
        deleted:
          template: '{"op":"delete","order":{{json before}}}'
```

### Default Template

Apply a fallback template to all queries that don't have a specific route:

```yaml
reactions:
  - kind: file
    id: default-log
    queries: [query-a, query-b]
    outputPath: /data/output
    writeMode: append
    defaultTemplate:
      added:
        template: '{"op":"add","data":{{json after}}}'
      updated:
        template: '{"op":"update","before":{{json before}},"after":{{json after}}}'
      deleted:
        template: '{"op":"delete","data":{{json before}}}'
```

### Raw JSON Fallback

When no templates are configured, each diff is serialized as a JSON object containing `operation`, `query_name`, `timestamp`, and the relevant data fields.

## Template Variables

| Variable | ADD | UPDATE | DELETE | Description |
|----------|-----|--------|--------|-------------|
| `after` | ✅ | ✅ | ❌ | New/current state |
| `before` | ❌ | ✅ | ✅ | Previous state |
| `data` | ✅ | ✅ | ✅ | Alias: `after` for ADD/UPDATE, `before` for DELETE |
| `operation` | ✅ | ✅ | ✅ | `ADD`, `UPDATE`, or `DELETE` |
| `query_name` | ✅ | ✅ | ✅ | Name of the query that produced the result |
| `timestamp` | ✅ | ✅ | ✅ | Event timestamp |
| `uuid` | ✅ | ✅ | ✅ | Unique identifier for this change |

### JSON Helper

Use `{{json value}}` to serialize any value as JSON:

```yaml
defaultTemplate:
  added:
    template: '{"item":{{json after}}}'
```

### Aggregation Diffs

Aggregation diffs use the `updated` template and populate `before`, `after`, and `data` (equivalent to `after`). The `operation` variable is set to `"AGGREGATION"`.

## Filename Templating

The `filenameTemplate` field supports Handlebars, including payload fields:

```yaml
filenameTemplate: "item_{{after.id}}.json"
```

### Filename Safety

Rendered filenames are sanitized before write. The following characters are replaced with `_`:

`/ \ : * ? " < > |` and null bytes

This allows payload-derived filenames while preventing invalid or unsafe file names.

## Examples

### NDJSON Append Log

Write all changes as newline-delimited JSON to a single file per query:

```yaml
reactions:
  - kind: file
    id: ndjson-log
    queries: [orders, inventory]
    outputPath: /data/logs
    writeMode: append
    filenameTemplate: "{{query_name}}.ndjson"
    routes:
      orders:
        added:
          template: '{"event":"order_created","order":{{json after}}}'
        updated:
          template: '{"event":"order_updated","before":{{json before}},"after":{{json after}}}'
        deleted:
          template: '{"event":"order_cancelled","order":{{json before}}}'
      inventory:
        updated:
          template: '{"event":"stock_changed","sku":"{{after.sku}}","qty":{{after.quantity}}}'
```

### Overwrite Latest State

Keep only the most recent state in a single file:

```yaml
reactions:
  - kind: file
    id: latest-state
    queries: [dashboard-query]
    outputPath: /data/state
    writeMode: overwrite
    filenameTemplate: "dashboard.json"
    defaultTemplate:
      added:
        template: '{{json after}}'
      updated:
        template: '{{json after}}'
```

### Per-Change Unique Files

Create a separate file for each change with a payload-derived filename:

```yaml
reactions:
  - kind: file
    id: change-files
    queries: [events]
    outputPath: /data/events
    writeMode: per_change
    filenameTemplate: "{{query_name}}_{{operation}}_{{uuid}}.json"
    defaultTemplate:
      added:
        template: '{{json after}}'
      updated:
        template: '{"before":{{json before}},"after":{{json after}}}'
      deleted:
        template: '{{json before}}'
```

### Payload-Derived Filenames

Use fields from the result data in filenames:

```yaml
reactions:
  - kind: file
    id: item-files
    queries: [products]
    outputPath: /data/products
    writeMode: overwrite
    filenameTemplate: "product_{{after.id}}.json"
    defaultTemplate:
      added:
        template: '{{json after}}'
      updated:
        template: '{{json after}}'
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
  - id: all-orders
    query: |
      MATCH (o:orders)
      RETURN o.id, o.customer, o.total, o.status
    sources:
      - sourceId: orders-db

reactions:
  - kind: file
    id: order-audit
    queries: [all-orders]
    outputPath: /data/audit
    writeMode: append
    filenameTemplate: "orders.ndjson"
    routes:
      all-orders:
        added:
          template: '{"ts":"{{timestamp}}","op":"add","id":"{{after.id}}","customer":"{{after.customer}}","total":{{after.total}}}'
        updated:
          template: '{"ts":"{{timestamp}}","op":"update","id":"{{after.id}}","status":"{{before.status}}->{{after.status}}"}'
        deleted:
          template: '{"ts":"{{timestamp}}","op":"delete","id":"{{before.id}}"}'
```

## Documentation resources

<div class="card-grid card-grid--2">
  <a href="https://github.com/drasi-project/drasi-core/blob/main/components/reactions/file/README.md" target="_blank" rel="noopener">
    <div class="unified-card unified-card--tutorials">
      <div class="unified-card-icon"><i class="fab fa-github"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">File Reaction README</h3>
        <p class="unified-card-summary">Write modes, templates, and filename behavior</p>
      </div>
    </div>
  </a>
  <a href="https://crates.io/crates/drasi-reaction-file" target="_blank" rel="noopener">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-box"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">drasi-reaction-file on crates.io</h3>
        <p class="unified-card-summary">Package info and release history</p>
      </div>
    </div>
  </a>
</div>

## Next steps

- [Configure Log Reaction](/drasi-server/how-to-guides/configuration/configure-reactions/configure-log-reaction/)
- [Configure HTTP Reaction](/drasi-server/how-to-guides/configuration/configure-reactions/configure-http-reaction/)
- [Configure gRPC Reaction](/drasi-server/how-to-guides/configuration/configure-reactions/configure-grpc-reaction/)
