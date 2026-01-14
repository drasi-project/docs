---
type: "docs"
title: "PostgreSQL Change Detection"
linkTitle: "PostgreSQL Change Detection"
weight: 20
description: "Monitor a PostgreSQL database and react to data changes in real-time"
related:
  concepts:
    - title: "Sources"
      url: "/concepts/sources/"
    - title: "Continuous Queries"
      url: "/concepts/continuous-queries/"
    - title: "Reactions"
      url: "/concepts/reactions/"
  tutorials:
    - title: "Real-time SSE Dashboard"
      url: "/drasi-server/tutorials/realtime-sse-dashboard/"
    - title: "Local Development"
      url: "/drasi-server/tutorials/local-development/"
  howto:
    - title: "Configure PostgreSQL Source"
      url: "/drasi-server/how-to-guides/configuration/configure-sources/configure-postgresql-source/"
    - title: "Configure Bootstrap Providers"
      url: "/drasi-server/how-to-guides/configuration/configure-bootstrap-providers/"
  reference:
    - title: "Configuration Reference"
      url: "/drasi-server/reference/configuration/"
---

# PostgreSQL Change Detection Tutorial

In this tutorial, you'll set up {{< term "Drasi Server" >}} to monitor a PostgreSQL database and react to data changes in real-time. You'll create a complete change data capture (CDC) pipeline.

## What You'll Build

- PostgreSQL database with sample data
- Drasi Server with PostgreSQL {{< term "Source" >}}
- {{< term "Continuous Query" >}} for change detection
- Log {{< term "Reaction" >}} to see changes

## Prerequisites

- Docker and Docker Compose
- curl (for API testing)

## Step 1: Create Project Structure

Create a directory for the tutorial:

```bash
mkdir drasi-postgres-tutorial
cd drasi-postgres-tutorial
```

## Step 2: Create Docker Compose File

Create `docker-compose.yaml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: tutorial
    ports:
      - "5432:5432"
    volumes:
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    command: >
      postgres
      -c wal_level=logical
      -c max_replication_slots=4
      -c max_wal_senders=4

  drasi-server:
    image: ghcr.io/drasi-project/drasi-server:latest
    ports:
      - "8080:8080"
    volumes:
      - ./config:/config:ro
    depends_on:
      - postgres
    command: ["--config", "/config/server.yaml"]
```

## Step 3: Create Database Schema

Create `init.sql`:

```sql
-- Enable logical replication
ALTER SYSTEM SET wal_level = 'logical';

-- Create orders table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create publication for Drasi
CREATE PUBLICATION drasi_publication FOR ALL TABLES;

-- Insert sample data
INSERT INTO orders (customer_name, total, status) VALUES
    ('Alice Smith', 150.00, 'pending'),
    ('Bob Johnson', 299.99, 'pending'),
    ('Carol White', 75.50, 'shipped');
```

## Step 4: Create Drasi Configuration

Create `config/server.yaml`:

```yaml
id: tutorial-server
host: 0.0.0.0
port: 8080
log_level: info

state_store:
  kind: redb
  path: /data/state.redb

sources:
  - kind: postgres
    id: orders-db
    host: postgres
    port: 5432
    database: tutorial
    user: postgres
    password: postgres
    tables:
      - public.orders
    slot_name: drasi_tutorial_slot
    publication_name: drasi_publication
    bootstrap_provider:
      type: postgres

queries:
  - id: pending-orders
    query: |
      MATCH (o:orders)
      WHERE o.status = 'pending'
      RETURN o.id, o.customer_name, o.total, o.status
    sources:
      - source_id: orders-db
        nodes: [orders]
    auto_start: true

  - id: high-value-orders
    query: |
      MATCH (o:orders)
      WHERE o.total > 200
      RETURN o.id, o.customer_name, o.total
    sources:
      - source_id: orders-db
        nodes: [orders]
    auto_start: true

reactions:
  - kind: log
    id: order-logger
    queries: [pending-orders, high-value-orders]
    routes:
      pending-orders:
        added:
          template: "New pending order: {{after.customer_name}} - ${{after.total}}"
        updated:
          template: "Order updated: {{after.customer_name}} status -> {{after.status}}"
        deleted:
          template: "Order removed: {{before.customer_name}}"
      high-value-orders:
        added:
          template: "HIGH VALUE: {{after.customer_name}} - ${{after.total}}"
```

## Step 5: Start the Environment

```bash
# Create config directory
mkdir -p config

# Start services
docker compose up -d

# Wait for services to start
sleep 10

# Check server health
curl http://localhost:8080/health
```

Expected output:
```json
{"status":"healthy"}
```

## Step 6: Verify Initial Data

Check the query results:

```bash
curl http://localhost:8080/api/v1/queries/pending-orders/results
```

You should see Alice and Bob's pending orders:
```json
{
  "status": "success",
  "data": {
    "results": [
      {"id": 1, "customer_name": "Alice Smith", "total": 150.00, "status": "pending"},
      {"id": 2, "customer_name": "Bob Johnson", "total": 299.99, "status": "pending"}
    ],
    "count": 2
  }
}
```

## Step 7: Watch for Changes

Open a new terminal and watch the Drasi Server logs:

```bash
docker compose logs -f drasi-server
```

## Step 8: Make Database Changes

In another terminal, connect to PostgreSQL and make changes:

```bash
# Connect to PostgreSQL
docker compose exec postgres psql -U postgres -d tutorial
```

Try these changes and watch the logs:

```sql
-- Add a new order (triggers pending-orders)
INSERT INTO orders (customer_name, total, status)
VALUES ('David Brown', 450.00, 'pending');

-- Update an order status (triggers pending-orders removed)
UPDATE orders SET status = 'shipped' WHERE customer_name = 'Alice Smith';

-- Add a high-value order (triggers both queries)
INSERT INTO orders (customer_name, total, status)
VALUES ('Eve Wilson', 599.99, 'pending');

-- Delete an order
DELETE FROM orders WHERE customer_name = 'Bob Johnson';
```

## Step 9: View Query Results via API

Check the current pending orders:

```bash
curl http://localhost:8080/api/v1/queries/pending-orders/results | jq
```

Check high-value orders:

```bash
curl http://localhost:8080/api/v1/queries/high-value-orders/results | jq
```

## Step 10: Add a New Query via API

Create a query at runtime:

```bash
curl -X POST http://localhost:8080/api/v1/queries \
  -H "Content-Type: application/json" \
  -d '{
    "id": "order-totals",
    "query": "MATCH (o:orders) WHERE o.status = '\''pending'\'' RETURN sum(o.total) as total_pending, count(o) as order_count",
    "sources": [{"source_id": "orders-db", "nodes": ["orders"]}],
    "auto_start": true
  }'
```

Check the aggregated results:

```bash
curl http://localhost:8080/api/v1/queries/order-totals/results | jq
```

## Understanding the Results

When you make changes:

1. **INSERT** - The query detects the new row and emits an "added" event
2. **UPDATE** - If the row moves in/out of the query filter, it appears as "added" or "deleted"
3. **DELETE** - The query detects the removal and emits a "deleted" event

The log reaction formats these events using templates you defined.

## Cleanup

```bash
docker compose down -v
```

## Next Steps

- [Real-time SSE Dashboard](../realtime-sse-dashboard/) - Build a live frontend
- [Configure PostgreSQL Source](/drasi-server/how-to-guides/configure-sources/configure-postgresql-source/) - Advanced configuration
- [Write Continuous Queries](/drasi-server/how-to-guides/write-continuous-queries/) - Query patterns

## Troubleshooting

### Connection Refused

If you see connection errors:

```bash
# Check PostgreSQL is ready
docker compose exec postgres pg_isready

# Check replication slot
docker compose exec postgres psql -U postgres -c "SELECT * FROM pg_replication_slots;"
```

### No Changes Detected

Verify:
1. WAL level is set to logical
2. Publication exists
3. Tables are included in publication

```bash
docker compose exec postgres psql -U postgres -d tutorial -c "SHOW wal_level;"
docker compose exec postgres psql -U postgres -d tutorial -c "SELECT * FROM pg_publication;"
```
