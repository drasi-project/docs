---
type: "docs"
title: "Local Development Environment"
linkTitle: "Local Development"
weight: 10
description: "Set up a complete development environment with Docker"
related:
  concepts:
    - title: "Sources"
      url: "/concepts/sources/"
    - title: "Continuous Queries"
      url: "/concepts/continuous-queries/"
    - title: "Reactions"
      url: "/concepts/reactions/"
  tutorials:
    - title: "PostgreSQL Change Detection"
      url: "/drasi-server/tutorials/postgresql-change-detection/"
    - title: "Real-time SSE Dashboard"
      url: "/drasi-server/tutorials/realtime-sse-dashboard/"
  howto:
    - title: "Configure Sources"
      url: "/drasi-server/how-to-guides/configuration/configure-sources/"
    - title: "Configure Reactions"
      url: "/drasi-server/how-to-guides/configuration/configure-reactions/"
  reference:
    - title: "Configuration Reference"
      url: "/drasi-server/reference/configuration/"
---

# Local Development Environment Tutorial

This tutorial guides you through setting up a complete local development environment for working with {{< term "Drasi Server" >}}. You'll learn how to configure, debug, and test your Drasi applications.

## What You'll Build

- Complete Docker-based development environment
- Multiple test databases
- Debugging configuration
- Testing workflow

## Prerequisites

- Docker and Docker Compose
- curl (for API testing)
- A code editor (VS Code recommended)

## Step 1: Create Project Structure

```bash
mkdir drasi-dev-environment
cd drasi-dev-environment

# Create directory structure
mkdir -p config data scripts
```

## Step 2: Create Development Docker Compose

Create `docker-compose.yaml`:

```yaml
version: '3.8'

services:
  # PostgreSQL for testing
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: devdb
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./scripts/init-postgres.sql:/docker-entrypoint-initdb.d/init.sql
    command: >
      postgres
      -c wal_level=logical
      -c max_replication_slots=10
      -c max_wal_senders=10
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Redis for Platform source/reaction testing
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Drasi Server
  drasi-server:
    image: ghcr.io/drasi-project/drasi-server:latest
    ports:
      - "8080:8080"
      - "8081:8081"
      - "9000:9000"
    volumes:
      - ./config:/config:ro
      - ./data:/data
    environment:
      - RUST_LOG=info,drasi_server=debug
      - DB_PASSWORD=postgres
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: ["--config", "/config/server.yaml"]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres-data:
  redis-data:
```

## Step 3: Create Database Initialization

Create `scripts/init-postgres.sql`:

```sql
-- Enable logical replication
ALTER SYSTEM SET wal_level = 'logical';

-- Create development schema
CREATE SCHEMA IF NOT EXISTS dev;

-- Users table
CREATE TABLE dev.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE dev.orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES dev.users(id),
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE dev.products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER DEFAULT 0,
    min_quantity INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE dev.order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES dev.orders(id),
    product_id INTEGER REFERENCES dev.products(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL
);

-- Create publication for all tables
CREATE PUBLICATION drasi_publication FOR ALL TABLES;

-- Insert sample data
INSERT INTO dev.users (username, email, status) VALUES
    ('alice', 'alice@example.com', 'active'),
    ('bob', 'bob@example.com', 'active'),
    ('carol', 'carol@example.com', 'inactive');

INSERT INTO dev.products (name, price, quantity, min_quantity) VALUES
    ('Widget A', 29.99, 100, 20),
    ('Widget B', 49.99, 50, 15),
    ('Gadget X', 99.99, 25, 10),
    ('Gadget Y', 149.99, 8, 10);

INSERT INTO dev.orders (user_id, total, status) VALUES
    (1, 79.98, 'pending'),
    (2, 149.99, 'shipped'),
    (1, 299.97, 'pending');

INSERT INTO dev.order_items (order_id, product_id, quantity, price) VALUES
    (1, 1, 2, 29.99),
    (1, 2, 1, 49.99),
    (2, 3, 1, 99.99),
    (3, 4, 2, 149.99);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON dev.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER orders_updated_at
    BEFORE UPDATE ON dev.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

## Step 4: Create Drasi Configuration

Create `config/server.yaml`:

```yaml
id: dev-server
host: 0.0.0.0
port: 8080
log_level: debug

# Persistent state for development
state_store:
  kind: redb
  path: /data/state.redb

# Allow API changes to persist
persist_config: true

sources:
  # PostgreSQL source
  - kind: postgres
    id: dev-db
    host: postgres
    port: 5432
    database: devdb
    user: postgres
    password: ${DB_PASSWORD}
    tables:
      - dev.users
      - dev.orders
      - dev.products
      - dev.order_items
    slot_name: drasi_dev_slot
    publication_name: drasi_publication
    bootstrap_provider:
      type: postgres
    table_keys:
      - table: order_items
        key_columns: [id]

  # HTTP source for webhook testing
  - kind: http
    id: webhooks
    host: 0.0.0.0
    port: 9000
    endpoint: /events
    timeout_ms: 30000

  # Platform source for Redis testing
  - kind: platform
    id: redis-events
    redis_url: redis://redis:6379
    stream_key: dev-events
    consumer_group: drasi-dev
    batch_size: 100
    auto_start: false

queries:
  # Active users query
  - id: active-users
    query: |
      MATCH (u:users)
      WHERE u.status = 'active'
      RETURN u.id, u.username, u.email
    sources:
      - source_id: dev-db
        nodes: [users]

  # Pending orders with user info
  - id: pending-orders
    query: |
      MATCH (o:orders)-[:USER]->(u:users)
      WHERE o.status = 'pending'
      RETURN o.id, o.total, o.status, u.username
    sources:
      - source_id: dev-db
        nodes: [orders, users]
    joins:
      - id: USER
        keys:
          - label: orders
            property: user_id
          - label: users
            property: id

  # Low inventory alert
  - id: low-inventory
    query: |
      MATCH (p:products)
      WHERE p.quantity <= p.min_quantity
      RETURN p.id, p.name, p.quantity, p.min_quantity
    sources:
      - source_id: dev-db
        nodes: [products]

  # Order totals by status
  - id: order-summary
    query: |
      MATCH (o:orders)
      RETURN o.status, sum(o.total) as total, count(o) as count
    sources:
      - source_id: dev-db
        nodes: [orders]

reactions:
  # Console logging for debugging
  - kind: log
    id: debug-log
    queries: [active-users, pending-orders, low-inventory]
    routes:
      active-users:
        added:
          template: "[USER] Added: {{after.username}}"
        deleted:
          template: "[USER] Removed: {{before.username}}"
      pending-orders:
        added:
          template: "[ORDER] New pending: {{after.username}} - ${{after.total}}"
        deleted:
          template: "[ORDER] Completed: {{before.username}}"
      low-inventory:
        added:
          template: "[INVENTORY] Low stock: {{after.name}} ({{after.quantity}}/{{after.min_quantity}})"

  # SSE for dashboard testing
  - kind: sse
    id: dev-stream
    queries: [active-users, pending-orders, low-inventory, order-summary]
    host: 0.0.0.0
    port: 8081
    sse_path: /events

  # Profiler for performance testing
  - kind: profiler
    id: perf-metrics
    queries: [pending-orders, low-inventory]
    window_size: 100
    report_interval_secs: 30
```

## Step 5: Create Helper Scripts

Create `scripts/start.sh`:

```bash
#!/bin/bash
set -e

echo "Starting development environment..."
docker compose up -d

echo "Waiting for services..."
sleep 5

# Wait for Drasi Server
until curl -s http://localhost:8080/health > /dev/null; do
    echo "Waiting for Drasi Server..."
    sleep 2
done

echo ""
echo "Development environment ready!"
echo ""
echo "Services:"
echo "  - Drasi Server: http://localhost:8080"
echo "  - SSE Stream:   http://localhost:8081/events"
echo "  - Webhooks:     http://localhost:9000/events"
echo "  - PostgreSQL:   localhost:5432"
echo "  - Redis:        localhost:6379"
echo ""
echo "Useful commands:"
echo "  docker compose logs -f drasi-server  # View logs"
echo "  docker compose exec postgres psql -U postgres -d devdb  # Connect to DB"
echo ""
```

Create `scripts/test-queries.sh`:

```bash
#!/bin/bash

echo "=== Query Status ==="
echo ""

echo "Active Users:"
curl -s http://localhost:8080/api/v1/queries/active-users/results | jq '.data.results'
echo ""

echo "Pending Orders:"
curl -s http://localhost:8080/api/v1/queries/pending-orders/results | jq '.data.results'
echo ""

echo "Low Inventory:"
curl -s http://localhost:8080/api/v1/queries/low-inventory/results | jq '.data.results'
echo ""

echo "Order Summary:"
curl -s http://localhost:8080/api/v1/queries/order-summary/results | jq '.data.results'
```

Create `scripts/send-webhook.sh`:

```bash
#!/bin/bash

# Send test event to HTTP source
curl -X POST http://localhost:9000/events \
  -H "Content-Type: application/json" \
  -d '{
    "op": "i",
    "label": "events",
    "payload": {
      "after": {
        "id": "'$(date +%s)'",
        "type": "test",
        "message": "Hello from webhook"
      }
    }
  }'
```

Make scripts executable:

```bash
chmod +x scripts/*.sh
```

## Step 6: Start the Environment

```bash
./scripts/start.sh
```

## Step 7: Test Your Queries

```bash
./scripts/test-queries.sh
```

## Step 8: Development Workflow

### Watch Logs

In one terminal:
```bash
docker compose logs -f drasi-server
```

### Make Database Changes

In another terminal:
```bash
docker compose exec postgres psql -U postgres -d devdb
```

```sql
-- Add a new user
INSERT INTO dev.users (username, email) VALUES ('dave', 'dave@example.com');

-- Update product quantity (trigger low inventory)
UPDATE dev.products SET quantity = 5 WHERE name = 'Widget A';

-- Complete an order
UPDATE dev.orders SET status = 'completed' WHERE id = 1;

-- Create a new order
INSERT INTO dev.orders (user_id, total, status) VALUES (3, 199.99, 'pending');
```

### Test SSE Stream

```bash
curl -N http://localhost:8081/events
```

### Test Webhook Source

```bash
./scripts/send-webhook.sh
```

### Create Dynamic Queries

```bash
curl -X POST http://localhost:8080/api/v1/queries \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-query",
    "query": "MATCH (u:users) RETURN count(u) as total_users",
    "sources": [{"source_id": "dev-db", "nodes": ["users"]}],
    "auto_start": true
  }'

# Check results
curl http://localhost:8080/api/v1/queries/test-query/results | jq
```

## Step 9: Debug Configuration

### Enable Trace Logging

Update `docker-compose.yaml`:

```yaml
drasi-server:
  environment:
    - RUST_LOG=trace
```

Then restart:
```bash
docker compose up -d drasi-server
```

### Validate Configuration

```bash
docker compose exec drasi-server drasi-server validate --config /config/server.yaml --show-resolved
```

### Check Source Status

```bash
curl http://localhost:8080/api/v1/sources | jq
```

### Check Query Status

```bash
curl http://localhost:8080/api/v1/queries | jq
```

## Step 10: Reset Environment

### Clear Data and Restart

```bash
docker compose down -v
docker compose up -d
```

### Reset PostgreSQL Only

```bash
docker compose exec postgres psql -U postgres -d devdb -c "
  TRUNCATE dev.order_items, dev.orders, dev.products, dev.users RESTART IDENTITY CASCADE;
"
# Re-run init script manually or restart postgres container
```

### Drop and Recreate Replication Slot

```bash
docker compose exec postgres psql -U postgres -c "
  SELECT pg_drop_replication_slot('drasi_dev_slot');
"
docker compose restart drasi-server
```

## Project Structure Summary

```
drasi-dev-environment/
├── docker-compose.yaml     # Service definitions
├── config/
│   └── server.yaml         # Drasi configuration
├── scripts/
│   ├── init-postgres.sql   # Database schema
│   ├── start.sh            # Start environment
│   ├── test-queries.sh     # Test all queries
│   └── send-webhook.sh     # Test HTTP source
└── data/                   # Persistent state (gitignored)
```

## Tips for Development

### 1. Use persist_config

With `persist_config: true`, API changes are saved to the config file. This lets you experiment via API and keep changes.

### 2. Profile Your Queries

The profiler reaction shows query performance:
```bash
docker compose logs drasi-server | grep -i profiler
```

### 3. Test Bootstrap Behavior

Restart Drasi Server to test bootstrap:
```bash
docker compose restart drasi-server
```

### 4. Isolate Issues

Start sources individually to isolate problems:
```yaml
sources:
  - kind: postgres
    id: dev-db
    auto_start: false  # Start manually via API
```

## Cleanup

```bash
docker compose down -v
```

## Next Steps

- [PostgreSQL Change Detection](../postgresql-change-detection/) - Detailed CDC tutorial
- [Real-time SSE Dashboard](../realtime-sse-dashboard/) - Build a live UI
- [Operations](/drasi-server/how-to-guides/operations/) - Production considerations
