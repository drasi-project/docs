---
type: "docs"
title: "Write Continuous Queries"
linkTitle: "Write Continuous Queries"
weight: 40
description: "Define queries that react to data changes"
---

# Write Continuous Queries

This guide covers how to write and manage continuous queries in Drasi Server. Queries define what data changes to detect and how to transform them.

## Prerequisites

- Drasi Server running
- At least one configured source

## Basic Query Structure

Define queries in your configuration file:

```yaml
queries:
  - id: my-query
    query: "MATCH (n:Order) RETURN n.id, n.total, n.status"
    queryLanguage: Cypher
    sources:
      - source_id: my-source
        nodes: [Order]
    auto_start: true
```

## Query Configuration Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | string | Required | Unique query identifier |
| `query` | string | Required | Cypher query string |
| `queryLanguage` | string | `Cypher` | `Cypher` or `GQL` |
| `sources` | array | Required | Source subscriptions |
| `joins` | array | None | Synthetic join definitions |
| `auto_start` | boolean | `true` | Start automatically |
| `enableBootstrap` | boolean | `true` | Process existing data on start |
| `bootstrapBufferSize` | integer | `10000` | Bootstrap processing buffer |
| `priority_queue_capacity` | integer | Global default | Event queue capacity |
| `dispatch_buffer_capacity` | integer | Global default | Dispatch buffer capacity |

## Writing Cypher Queries

### Basic Node Matching

Match all nodes of a specific label:

```yaml
queries:
  - id: all-orders
    query: "MATCH (o:Order) RETURN o.id, o.total, o.status"
    sources:
      - source_id: orders-db
        nodes: [Order]
```

### Filtering Results

Add WHERE clauses to filter:

```yaml
queries:
  - id: high-value-orders
    query: |
      MATCH (o:Order)
      WHERE o.total > 1000
      RETURN o.id, o.total, o.customer_id
    sources:
      - source_id: orders-db
        nodes: [Order]
```

### Aggregations

Compute aggregates across matching nodes:

```yaml
queries:
  - id: order-totals
    query: |
      MATCH (o:Order)
      WHERE o.status = 'pending'
      RETURN sum(o.total) as pending_total, count(o) as pending_count
    sources:
      - source_id: orders-db
        nodes: [Order]
```

### Multiple Node Types

Query multiple node types from a source:

```yaml
queries:
  - id: inventory-status
    query: |
      MATCH (p:Product)
      WHERE p.quantity < p.reorder_level
      RETURN p.id, p.name, p.quantity, p.reorder_level
    sources:
      - source_id: inventory-db
        nodes: [Product, Warehouse]
```

## Source Subscriptions

Each query subscribes to one or more sources:

```yaml
queries:
  - id: multi-source-query
    query: "MATCH (o:Order) RETURN o"
    sources:
      - source_id: primary-db
        nodes: [Order, Customer]
      - source_id: secondary-db
        nodes: [Inventory]
```

### Subscription Fields

| Field | Type | Description |
|-------|------|-------------|
| `source_id` | string | Source identifier to subscribe to |
| `nodes` | array | Node labels to include from this source |
| `relations` | array | Relation types to include (for graph sources) |

## Synthetic Joins

Create relationships between nodes from different tables or sources:

```yaml
queries:
  - id: order-with-customer
    query: |
      MATCH (o:orders)-[:CUSTOMER]->(c:customers)
      WHERE o.status = 'pending'
      RETURN o.id, o.total, c.name, c.email
    sources:
      - source_id: ecommerce-db
        nodes: [orders, customers]
    joins:
      - id: CUSTOMER
        keys:
          - label: orders
            property: customer_id
          - label: customers
            property: id
```

### Join Configuration

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Relationship type name used in MATCH |
| `keys` | array | Key mappings between nodes |
| `keys[].label` | string | Node label |
| `keys[].property` | string | Property to match on |

### Multi-Table Joins

Join multiple tables with multiple relationships:

```yaml
queries:
  - id: order-details
    query: |
      MATCH (o:orders)-[:CUSTOMER]->(c:customers),
            (o)-[:LINE_ITEMS]->(li:order_items)-[:PRODUCT]->(p:products)
      RETURN o.id, c.name, li.quantity, p.name, p.price
    sources:
      - source_id: ecommerce-db
        nodes: [orders, customers, order_items, products]
    joins:
      - id: CUSTOMER
        keys:
          - label: orders
            property: customer_id
          - label: customers
            property: id
      - id: LINE_ITEMS
        keys:
          - label: orders
            property: id
          - label: order_items
            property: order_id
      - id: PRODUCT
        keys:
          - label: order_items
            property: product_id
          - label: products
            property: id
```

## Bootstrap Configuration

Control how queries process existing data on startup:

```yaml
queries:
  - id: bootstrapped-query
    query: "MATCH (o:Order) RETURN o"
    sources:
      - source_id: orders-db
        nodes: [Order]
    enableBootstrap: true
    bootstrapBufferSize: 50000
```

### Bootstrap Options

| Option | Default | Description |
|--------|---------|-------------|
| `enableBootstrap` | `true` | Process existing data when query starts |
| `bootstrapBufferSize` | `10000` | Buffer size for bootstrap processing |

Disable bootstrap for queries that should only react to new changes:

```yaml
queries:
  - id: new-orders-only
    query: "MATCH (o:Order) WHERE o.status = 'new' RETURN o"
    sources:
      - source_id: orders-db
        nodes: [Order]
    enableBootstrap: false
```

## Performance Tuning

### Queue Capacities

Adjust queue sizes for high-volume queries:

```yaml
queries:
  - id: high-volume-query
    query: "MATCH (e:Event) RETURN e"
    sources:
      - source_id: events-source
        nodes: [Event]
    priority_queue_capacity: 50000
    dispatch_buffer_capacity: 5000
```

### Global Defaults

Set global defaults in server configuration:

```yaml
default_priority_queue_capacity: 20000
default_dispatch_buffer_capacity: 2000

queries:
  - id: uses-defaults
    query: "MATCH (n:Node) RETURN n"
    sources:
      - source_id: my-source
        nodes: [Node]
```

## Managing Queries via API

### Create Query

```bash
curl -X POST http://localhost:8080/api/v1/queries \
  -H "Content-Type: application/json" \
  -d '{
    "id": "api-query",
    "query": "MATCH (o:Order) RETURN o.id, o.total",
    "sources": [{"source_id": "orders-db", "nodes": ["Order"]}],
    "auto_start": true
  }'
```

### Get Query Results

```bash
curl http://localhost:8080/api/v1/queries/api-query/results
```

Response:
```json
{
  "status": "success",
  "data": {
    "results": [
      {"id": "1", "total": 100},
      {"id": "2", "total": 250}
    ],
    "count": 2
  }
}
```

### Start/Stop Query

```bash
# Stop query
curl -X POST http://localhost:8080/api/v1/queries/api-query/stop

# Start query
curl -X POST http://localhost:8080/api/v1/queries/api-query/start
```

### Delete Query

```bash
curl -X DELETE http://localhost:8080/api/v1/queries/api-query
```

## Query Language Reference

Drasi Server uses the same query language as other Drasi products. For complete syntax reference:

- [Query Language Reference](/reference/query-language/) - Full Cypher syntax
- [Drasi Functions](/reference/query-language/functions/) - Built-in functions

## Common Patterns

### Time-Based Filtering

Filter by time windows:

```yaml
queries:
  - id: recent-orders
    query: |
      MATCH (o:Order)
      WHERE o.created_at > datetime() - duration('PT1H')
      RETURN o.id, o.total
    sources:
      - source_id: orders-db
        nodes: [Order]
```

### Status Transitions

Detect specific status changes:

```yaml
queries:
  - id: shipped-orders
    query: |
      MATCH (o:Order)
      WHERE o.status = 'shipped'
      RETURN o.id, o.shipped_at, o.tracking_number
    sources:
      - source_id: orders-db
        nodes: [Order]
```

### Threshold Alerts

Monitor for threshold violations:

```yaml
queries:
  - id: low-inventory-alert
    query: |
      MATCH (p:Product)
      WHERE p.quantity <= p.min_quantity
      RETURN p.id, p.name, p.quantity, p.min_quantity
    sources:
      - source_id: inventory-db
        nodes: [Product]
```

## Troubleshooting

### Query Not Receiving Data

1. Verify source is running:
   ```bash
   curl http://localhost:8080/api/v1/sources/my-source
   ```

2. Check node labels match source data
3. Enable debug logging:
   ```bash
   RUST_LOG=debug drasi-server --config config/server.yaml
   ```

### Slow Query Performance

1. Reduce `bootstrapBufferSize` if memory is constrained
2. Add filters to reduce result set size
3. Use specific node subscriptions instead of wildcards

### Join Not Working

1. Verify join `id` matches relationship type in query
2. Check property names match between labels
3. Ensure both node types are in the source subscription

## Next Steps

- [Configure Reactions](/drasi-server/how-to-guides/configure-reactions/) - React to query results
- [Query Language Reference](/reference/query-language/) - Full syntax reference
- [Operations](/drasi-server/how-to-guides/operations/) - Monitor and troubleshoot
