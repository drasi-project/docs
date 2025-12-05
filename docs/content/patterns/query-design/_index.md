---
type: "docs"
title: "Query Design Patterns"
linkTitle: "Query Design"
weight: 10
description: >
    Patterns and best practices for writing efficient, maintainable continuous queries
---

Writing effective continuous queries is central to building good Drasi solutions. This guide covers common patterns, optimization techniques, and anti-patterns to help you design queries that are both performant and maintainable.

## Core Principles

### Keep Queries Focused

Each continuous query should have a single, clear purpose. Rather than creating one large query that handles multiple concerns, break down complex requirements into multiple focused queries.

**Recommended approach:**
```cypher
// Query 1: Detect high-value orders
MATCH (o:Order)
WHERE o.total > 1000
RETURN o.id, o.total, o.customerId

// Query 2: Detect orders from VIP customers
MATCH (o:Order)-[:PLACED_BY]->(c:Customer)
WHERE c.tier = 'VIP'
RETURN o.id, c.name
```

**Avoid:** Single queries that try to handle multiple unrelated conditions and return different result shapes based on complex conditionals.

### Use Selective Filters Early

Place the most selective filters (those that eliminate the most data) early in your query. This reduces the amount of data that needs to be processed in subsequent operations.

```cypher
// Good: Filter by specific status first (selective)
MATCH (o:Order)
WHERE o.status = 'PENDING' AND o.region = 'WEST'
RETURN o

// Less optimal: Generic filter first
MATCH (o:Order)
WHERE o.region = 'WEST' AND o.status = 'PENDING'
RETURN o
```

### Minimize Property Access

Only return the properties you actually need. Returning entire nodes with all properties consumes more resources than returning specific values.

```cypher
// Good: Return only needed properties
MATCH (o:Order)-[:CONTAINS]->(p:Product)
RETURN o.id, o.total, p.name

// Avoid: Returning entire nodes
MATCH (o:Order)-[:CONTAINS]->(p:Product)
RETURN o, p
```

## Common Patterns

### Threshold Detection

Detect when a value crosses a threshold. Useful for alerts, SLA monitoring, and capacity management.

```cypher
// Detect when inventory drops below reorder point
MATCH (p:Product)
WHERE p.quantity < p.reorderPoint
RETURN p.sku, p.name, p.quantity, p.reorderPoint
```

### Relationship Change Detection

Monitor when relationships between entities change, such as assignments, ownership, or associations.

```cypher
// Detect when an order changes status
MATCH (o:Order)
WHERE o.status IN ['SHIPPED', 'DELIVERED', 'CANCELLED']
RETURN o.id, o.status, o.updatedAt
```

### Aggregation Patterns

Use aggregation functions to detect patterns across multiple entities.

```cypher
// Detect when a customer has too many pending orders
MATCH (c:Customer)<-[:PLACED_BY]-(o:Order)
WHERE o.status = 'PENDING'
WITH c, count(o) as pendingCount
WHERE pendingCount > 5
RETURN c.id, c.name, pendingCount
```

### Temporal Patterns

Handle time-based conditions using Drasi's temporal functions.

```cypher
// Detect orders pending for more than 24 hours
MATCH (o:Order)
WHERE o.status = 'PENDING'
  AND drasi.trueDuring(datetime() - o.createdAt > duration('PT24H'))
RETURN o.id, o.createdAt
```

### Multi-Source Joins

Join data from multiple sources to create composite views.

```cypher
// Join customer data with order data from different sources
MATCH (c:Customer)-[:PLACED]->(o:Order)
WHERE c.region = o.shippingRegion
RETURN c.name, o.id, o.total
```

## Anti-Patterns to Avoid

### Unbounded Result Sets

Avoid queries that can return unlimited results without pagination or limits.

```cypher
// Anti-pattern: Could return millions of rows
MATCH (o:Order)
RETURN o

// Better: Add meaningful filters
MATCH (o:Order)
WHERE o.createdAt > datetime() - duration('P7D')
RETURN o
```

### Cartesian Products

Be careful with multiple MATCH clauses that create unintended cross-products.

```cypher
// Anti-pattern: Creates cartesian product
MATCH (o:Order)
MATCH (c:Customer)
RETURN o, c

// Better: Use explicit relationships
MATCH (o:Order)-[:PLACED_BY]->(c:Customer)
RETURN o, c
```

### Complex Conditional Logic

Avoid embedding complex business logic directly in queries. Instead, use simpler queries and handle logic in reactions.

```cypher
// Anti-pattern: Complex nested conditionals
MATCH (o:Order)
WHERE (o.type = 'A' AND o.value > 100)
   OR (o.type = 'B' AND o.value > 50 AND o.priority = 'HIGH')
   OR (o.type = 'C' AND o.region IN ['X', 'Y'] AND o.value > 200)
RETURN o

// Better: Separate queries for each condition
// Query 1 for Type A, Query 2 for Type B, etc.
```

## Query Organization

### Naming Conventions

Use clear, descriptive names for your continuous queries that indicate their purpose:

- `detect-low-inventory` - Detects inventory below threshold
- `alert-vip-order-delay` - Monitors VIP order processing time
- `sync-customer-changes` - Tracks customer record changes

### Documentation

Document each query with:
- Purpose and business context
- Expected data volume
- Performance characteristics
- Reaction dependencies

## Performance Considerations

### Index Awareness

Understand which properties in your source databases are indexed and design queries to leverage those indexes.

### Result Set Size

Monitor the size of your query result sets. Large result sets consume more memory and can impact overall system performance.

### Query Complexity

More complex queries (with many joins, aggregations, or conditions) require more computation. Balance query expressiveness with performance requirements.

## Next Steps

- Learn about [Solution Architecture](/patterns/solution-architecture/) patterns
- Review [Performance](/patterns/performance/) optimization guidelines
- Explore the [Query Language Reference](/reference/query-language/)
