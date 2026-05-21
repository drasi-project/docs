---
type: "docs"
title: "Configure Queries"
linkTitle: "Configure Queries"
weight: 25
description: "Define continuous queries to detect and react to data changes"
related:
  concepts:
    - title: "Continuous Queries"
      url: "/concepts/continuous-queries/"
  howto:
    - title: "Configure Sources"
      url: "/drasi-server/how-to-guides/configuration/configure-sources/"
    - title: "Configure Reactions"
      url: "/drasi-server/how-to-guides/configuration/configure-reactions/"
  reference:
    - title: "Configuration Reference"
      url: "/drasi-server/reference/configuration/"
---

{{< term "Continuous Query" "Continuous Queries" >}} are the heart of Drasi. They define what data changes you want to detect and react to.

## Quick Start

A minimal query that matches all nodes from a source:

```yaml
queries:
  - id: all-orders
    query: "MATCH (o:Order) RETURN o"
    sources:
      - sourceId: my-source
```

## Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | string | Required | Unique query identifier (referenced by reactions) |
| `query` | string | Required | The Cypher/GQL query text |
| `queryLanguage` | string | `GQL` | Query language: `GQL` or `Cypher` |
| `sources` | array | `[]` | Source subscriptions (see below) |
| `autoStart` | boolean | `false` | Start query automatically on server startup |
| `enableBootstrap` | boolean | `true` | Request bootstrap data for initial state |
| `bootstrapBufferSize` | integer | `10000` | Buffer size during bootstrap replay |
| `joins` | array | None | Join configuration for multi-label queries |
| `priorityQueueCapacity` | integer | None | Override default event queue capacity |
| `dispatchBufferCapacity` | integer | None | Override default dispatch buffer capacity |
| `storageBackend` | string or object | None | Storage backend for query indexes (see [Storage Backend](#storage-backend-configuration)) |

## Source Subscriptions

Each query subscribes to one or more sources:

```yaml
queries:
  - id: my-query
    query: "MATCH (o:Order) RETURN o"
    sources:
      - sourceId: orders-db        # Required: which source
        nodes: []                   # Optional: filter node labels
        relations: []               # Optional: filter relation labels
        pipeline: []                # Optional: processing pipeline
```

### Filtering by Label

Limit which data the query receives:

```yaml
sources:
  - sourceId: orders-db
    nodes: [Order, Customer]       # Only receive Order and Customer nodes
    relations: [PLACED_BY]         # Only receive PLACED_BY relations
```

## Query Language

Drasi supports two query languages:

### GQL (Default)

Graph Query Language - the emerging ISO standard:

```yaml
queries:
  - id: high-value-orders
    queryLanguage: GQL
    query: |
      MATCH (o:Order)
      WHERE o.total > 1000
      RETURN o.id, o.customer_id, o.total
```

### Cypher

Neo4j's query language (widely adopted):

```yaml
queries:
  - id: high-value-orders
    queryLanguage: Cypher
    query: |
      MATCH (o:Order)
      WHERE o.total > 1000
      RETURN o.id, o.customer_id, o.total
```

Both languages are functionally similar for most use cases.

## Common Query Patterns

### Simple Node Query

Match all nodes of a type:

```yaml
queries:
  - id: all-products
    query: "MATCH (p:Product) RETURN p.id, p.name, p.price"
    sources:
      - sourceId: inventory-db
```

### Filtered Query

Match nodes meeting a condition:

```yaml
queries:
  - id: low-stock
    query: |
      MATCH (p:Product)
      WHERE p.stock < p.reorder_point
      RETURN p.id, p.name, p.stock, p.reorder_point
    sources:
      - sourceId: inventory-db
```

### Aggregation Query

Compute aggregates that update in real-time:

```yaml
queries:
  - id: order-summary
    query: |
      MATCH (o:Order)
      RETURN count(o) AS total_orders, 
             sum(o.total) AS revenue,
             avg(o.total) AS avg_order_value
    sources:
      - sourceId: orders-db
```

### Relationship Query with Joins

Query across related entities (requires join configuration):

```yaml
queries:
  - id: orders-with-customers
    query: |
      MATCH (o:Order)-[:PLACED_BY]->(c:Customer)
      WHERE o.status = 'pending'
      RETURN o.id, o.total, c.name, c.email
    sources:
      - sourceId: orders-db
    joins:
      - id: PLACED_BY
        keys:
          - label: Order
            property: customer_id
          - label: Customer
            property: id
```

## Join Configuration

Joins connect nodes that don't have explicit relationships in the source data. This is common when working with relational databases where foreign keys define relationships.

### Basic Join

```yaml
joins:
  - id: PLACED_BY              # Relationship label used in query
    keys:
      - label: Order            # First node label
        property: customer_id   # Foreign key property
      - label: Customer         # Second node label  
        property: id            # Primary key property
```

This creates a virtual `PLACED_BY` relationship from `Order` to `Customer` where `Order.customer_id = Customer.id`.

### Multiple Joins

```yaml
queries:
  - id: order-details
    query: |
      MATCH (o:Order)-[:PLACED_BY]->(c:Customer),
            (o)-[:CONTAINS]->(i:OrderItem)
      RETURN o.id, c.name, i.product_name, i.quantity
    sources:
      - sourceId: orders-db
    joins:
      - id: PLACED_BY
        keys:
          - label: Order
            property: customer_id
          - label: Customer
            property: id
      - id: CONTAINS
        keys:
          - label: Order
            property: id
          - label: OrderItem
            property: order_id
```

## Bootstrap Configuration

Bootstrap loads initial data when a query starts, so results reflect existing state (not just new changes).

### Enable/Disable Bootstrap

```yaml
queries:
  - id: streaming-only
    query: "MATCH (e:Event) RETURN e"
    enableBootstrap: false      # Only process new events
    sources:
      - sourceId: event-stream
```

### Bootstrap Buffer Size

For large datasets, increase the buffer:

```yaml
queries:
  - id: large-dataset
    query: "MATCH (p:Product) RETURN p"
    enableBootstrap: true
    bootstrapBufferSize: 50000  # Default is 10000
    sources:
      - sourceId: catalog-db
```

## Performance Tuning

### Queue Capacity

For high-volume queries, increase queue capacity:

```yaml
queries:
  - id: high-volume
    query: "MATCH (e:Event) RETURN e"
    priorityQueueCapacity: 100000    # Events waiting to be processed
    dispatchBufferCapacity: 10000    # Events waiting to be dispatched
    sources:
      - sourceId: event-stream
```

### Multiple Sources

A query can subscribe to multiple sources:

```yaml
queries:
  - id: unified-view
    query: "MATCH (p:Product) RETURN p.id, p.name, p.source"
    sources:
      - sourceId: warehouse-a
      - sourceId: warehouse-b
```

## Storage Backend Configuration

By default, query indexes are held **in memory** — fast, but volatile (data is lost on restart and must be re-bootstrapped). For production workloads or large datasets, configure a persistent storage backend so query state survives restarts.

The `storageBackend` field accepts either:

- A **string** — referencing a named backend defined in the top-level `storageBackends` array
- An **inline object** — specifying the backend type and its configuration directly

### Backend Types

| `backend_type` | Persistence | Description |
|----------------|-------------|-------------|
| `memory` | No (volatile) | In-memory storage. Fast, but state is lost on restart. |
| `rocksdb` | Yes (local disk) | RocksDB-backed persistent storage. Production-ready for single-node deployments. |
| `redis` | Yes (network) | Redis/Garnet-backed storage. Persistent and distributed. |

### Memory Backend

In-memory storage is the default when `storageBackend` is not set. You can also specify it explicitly to enable the archive feature:

```yaml
queries:
  - id: time-travel-query
    query: "MATCH (s:Sensor) RETURN s"
    sources:
      - sourceId: sensors
    storageBackend:
      backend_type: memory
      enable_archive: true
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `backend_type` | string | — | Must be `memory` |
| `enable_archive` | boolean | `false` | Enable archive index for `drasi.past()` time-travel queries |

### RocksDB Backend

Persistent local storage using RocksDB. Query indexes survive restarts without re-bootstrapping:

```yaml
queries:
  - id: persistent-query
    query: "MATCH (o:Order) RETURN o"
    sources:
      - sourceId: orders-db
    storageBackend:
      backend_type: rocksdb
      path: /data/drasi/indexes
      enable_archive: false
      direct_io: false
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `backend_type` | string | — | Must be `rocksdb` |
| `path` | string | Required | Absolute path for RocksDB data files |
| `enable_archive` | boolean | `false` | Enable archive index for `drasi.past()` time-travel queries |
| `direct_io` | boolean | `false` | Use direct I/O (bypasses OS page cache) |

{{< alert title="Note" color="info" >}}
The `path` must be an absolute path (e.g., `/data/drasi/indexes`). Relative paths are rejected.
{{< /alert >}}

### Redis Backend

Persistent distributed storage using Redis or Garnet:

```yaml
queries:
  - id: distributed-query
    query: "MATCH (e:Event) RETURN e"
    sources:
      - sourceId: events
    storageBackend:
      backend_type: redis
      connection_string: "redis://redis-host:6379"
      cache_size: 10000
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `backend_type` | string | — | Must be `redis` |
| `connection_string` | string | Required | Redis URL (must start with `redis://` or `rediss://`) |
| `cache_size` | integer | None | Optional local LRU cache size (number of elements) |

### Named Storage Backends

Instead of repeating backend configuration on every query, you can define named backends at the top level and reference them by name:

```yaml
storageBackends:
  - id: rocks-persistent
    backend_type: rocksdb
    path: /data/drasi/indexes
    enable_archive: false

  - id: fast-memory
    backend_type: memory
    enable_archive: true

queries:
  - id: orders-query
    query: "MATCH (o:Order) RETURN o"
    sources:
      - sourceId: orders-db
    storageBackend: rocks-persistent    # Reference by name

  - id: analytics-query
    query: "MATCH (m:Metric) RETURN m"
    sources:
      - sourceId: metrics
    storageBackend: fast-memory         # Reference by name
```

Named backends are validated at startup — referencing an undefined backend name will produce a configuration error.

## Complete Example

```yaml
host: 0.0.0.0
port: 8080

sources:
  - kind: postgres
    id: orders-db
    host: ${DB_HOST}
    database: ecommerce
    user: ${DB_USER}
    password: ${DB_PASSWORD}
    tables:
      - public.orders
      - public.customers
      - public.order_items
    bootstrapProvider:
      kind: postgres

# Named storage backends (referenced by queries below)
storageBackends:
  - id: persistent
    backend_type: rocksdb
    path: /data/drasi/indexes

queries:
  # Simple: All pending orders (persistent storage)
  - id: pending-orders
    autoStart: true
    query: |
      MATCH (o:orders)
      WHERE o.status = 'pending'
      RETURN o.id, o.customer_id, o.total, o.created_at
    sources:
      - sourceId: orders-db
    storageBackend: persistent          # Named reference

  # Aggregation: Order statistics  
  - id: order-stats
    autoStart: true
    query: |
      MATCH (o:orders)
      RETURN o.status AS status,
             count(o) AS count,
             sum(o.total) AS total_value
    sources:
      - sourceId: orders-db

  # Join: Orders with customer details (inline storage backend)
  - id: orders-with-customers
    autoStart: true
    query: |
      MATCH (o:orders)-[:CUSTOMER]->(c:customers)
      WHERE o.total > 100
      RETURN o.id, o.total, c.name, c.email
    sources:
      - sourceId: orders-db
    storageBackend:                      # Inline configuration
      backend_type: redis
      connection_string: "redis://redis:6379"
    joins:
      - id: CUSTOMER
        keys:
          - label: orders
            property: customer_id
          - label: customers
            property: id

reactions:
  - kind: log
    id: console
    queries: [pending-orders, order-stats, orders-with-customers]
    autoStart: true
```

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Query returns no results | Labels don't match source data | Check label names match exactly (case-sensitive) |
| Join not working | Keys don't match | Verify join key properties exist and values match |
| Bootstrap timeout | Large dataset | Increase `bootstrapBufferSize` |
| Query not starting | `autoStart: false` | Set `autoStart: true` or start via API |
| Missing data | Wrong source subscription | Verify `sourceId` matches your source's `id` |
| Storage backend error on startup | Invalid backend reference | Ensure the named backend exists in `storageBackends` |
| RocksDB path rejected | Relative path used | Use an absolute path (e.g., `/data/drasi/indexes`) |
| Redis connection failed | Invalid connection string | Must start with `redis://` or `rediss://` |

### Verifying Query Results

Check current results via API:

```bash
curl http://localhost:8080/api/v1/queries/my-query/results
```

Check query status:

```bash
curl http://localhost:8080/api/v1/queries/my-query
```
