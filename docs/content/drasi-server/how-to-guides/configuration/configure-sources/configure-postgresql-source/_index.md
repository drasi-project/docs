---
type: "docs"
title: "Configure PostgreSQL Source"
linkTitle: "PostgreSQL"
weight: 10
description: "Stream changes from PostgreSQL using logical replication"
related:
  concepts:
    - title: "Sources"
      url: "/concepts/sources/"
  tutorials:
    - title: "PostgreSQL Change Detection"
      url: "/drasi-server/tutorials/postgresql-change-detection/"
  howto:
    - title: "Configure Bootstrap Providers"
      url: "/drasi-server/how-to-guides/configuration/configure-bootstrap-providers/"
  reference:
    - title: "Configuration Reference"
      url: "/drasi-server/reference/configuration/"
---

The PostgreSQL {{< term "Source" >}} streams changes from PostgreSQL databases using logical replication (WAL). It monitors specified tables and converts row changes into graph {{< term "Node" >}} events for {{< term "Continuous Query" "continuous queries" >}}.

## Prerequisites

- PostgreSQL 10 or later
- Logical replication enabled (`wal_level = logical`)
- User with LOGIN, REPLICATION, and SELECT permissions

## Basic Configuration

```yaml
sources:
  - kind: postgres
    id: my-postgres
    auto_start: true
    host: localhost
    port: 5432
    database: mydb
    user: postgres
    password: ${DB_PASSWORD}
    tables:
      - public.orders
      - public.customers
```

## Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `kind` | string | Required | Must be `postgres` |
| `id` | string | Required | Unique source identifier |
| `auto_start` | boolean | `true` | Start source automatically |
| `host` | string | `localhost` | Database host |
| `port` | integer | `5432` | Database port |
| `database` | string | Required | Database name |
| `user` | string | Required | Database user |
| `password` | string | `""` | Database password |
| `tables` | array | `[]` | Tables to monitor (schema.table format) |
| `slot_name` | string | `drasi_slot` | Replication slot name |
| `publication_name` | string | `drasi_publication` | Publication name |
| `ssl_mode` | string | `prefer` | SSL mode: `disable`, `prefer`, `require` |
| `table_keys` | array | `[]` | Primary key definitions |
| `bootstrap_provider` | object | None | Bootstrap provider configuration |

## Setting Up PostgreSQL

### 1. Enable Logical Replication

Edit `postgresql.conf`:

```
wal_level = logical
max_replication_slots = 10
max_wal_senders = 10
```

Or set dynamically:

```sql
ALTER SYSTEM SET wal_level = 'logical';
ALTER SYSTEM SET max_replication_slots = 10;
ALTER SYSTEM SET max_wal_senders = 10;
```

Restart PostgreSQL after changes.

### 2. Create a Replication User

```sql
CREATE USER drasi_user WITH REPLICATION LOGIN PASSWORD 'secure_password';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO drasi_user;
```

### 3. Create Publication

The publication defines which tables to replicate:

```sql
-- All tables
CREATE PUBLICATION drasi_publication FOR ALL TABLES;

-- Or specific tables
CREATE PUBLICATION drasi_publication FOR TABLE orders, customers;
```

### 4. Verify Setup

```sql
-- Check wal_level
SHOW wal_level;  -- Should return 'logical'

-- Check publication
SELECT * FROM pg_publication;

-- Check replication slots
SELECT * FROM pg_replication_slots;
```

## Data Model

PostgreSQL tables are converted to graph nodes:

- Each table row becomes a node
- The table name becomes the node label
- Table columns become node properties
- The node ID is composed of `{table_name}:{primary_key}`

Example: A row in `orders` with `id=123` becomes a node with label `orders` and ID `orders:123`.

## Table Key Configuration

If tables don't have explicit primary keys, or you need to specify composite keys:

```yaml
sources:
  - kind: postgres
    id: my-postgres
    # ... other config
    tables:
      - public.orders
      - public.order_items
    table_keys:
      - table: order_items
        key_columns:
          - order_id
          - product_id
```

## Using SSL

### SSL Modes

| Mode | Description |
|------|-------------|
| `disable` | No SSL |
| `prefer` | Try SSL, fall back to non-SSL |
| `require` | Require SSL (don't verify certificate) |

### SSL Configuration

```yaml
sources:
  - kind: postgres
    id: secure-postgres
    host: db.example.com
    database: production
    user: drasi_user
    password: ${DB_PASSWORD}
    ssl_mode: require
```

## Bootstrap Provider

Load initial data from the database before streaming:

```yaml
sources:
  - kind: postgres
    id: orders-db
    host: localhost
    database: myapp
    user: postgres
    password: secret
    tables:
      - public.orders
    bootstrap_provider:
      type: postgres
```

The PostgreSQL bootstrap provider uses the COPY protocol for efficient bulk loading.

## Environment Variables

Use environment variables for sensitive data:

```yaml
sources:
  - kind: postgres
    id: production-db
    host: ${DB_HOST}
    port: ${DB_PORT:-5432}
    database: ${DB_NAME}
    user: ${DB_USER}
    password: ${DB_PASSWORD}
    ssl_mode: ${SSL_MODE:-require}
    tables:
      - public.orders
      - public.customers
```

## Complete Example

```yaml
sources:
  - kind: postgres
    id: ecommerce-db
    auto_start: true
    host: ${DB_HOST:-localhost}
    port: ${DB_PORT:-5432}
    database: ecommerce
    user: ${DB_USER:-postgres}
    password: ${DB_PASSWORD}
    ssl_mode: prefer
    tables:
      - public.orders
      - public.customers
      - public.products
      - public.order_items
    slot_name: drasi_ecommerce_slot
    publication_name: drasi_ecommerce_pub
    table_keys:
      - table: order_items
        key_columns:
          - order_id
          - product_id
    bootstrap_provider:
      type: postgres
```

## Docker Compose Example

```yaml
version: '3.8'

services:
  drasi-server:
    image: ghcr.io/drasi-project/drasi-server:latest
    ports:
      - "8080:8080"
    environment:
      - DB_HOST=postgres
      - DB_PASSWORD=secret
    volumes:
      - ./config:/config:ro
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: myapp
    command:
      - "postgres"
      - "-c"
      - "wal_level=logical"
      - "-c"
      - "max_replication_slots=10"
      - "-c"
      - "max_wal_senders=10"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
```

## Troubleshooting

### Connection Refused

- Verify PostgreSQL is running and accessible
- Check `pg_hba.conf` allows connections from Drasi Server
- Verify firewall rules

### Replication Slot Errors

```sql
-- View existing slots
SELECT * FROM pg_replication_slots;

-- Drop unused slot
SELECT pg_drop_replication_slot('drasi_slot');
```

### Publication Not Found

```sql
-- Create publication
CREATE PUBLICATION drasi_publication FOR TABLE orders, customers;

-- Or for all tables
CREATE PUBLICATION drasi_publication FOR ALL TABLES;
```

### WAL Level Not Logical

```sql
-- Check current level
SHOW wal_level;

-- Must restart PostgreSQL after changing
ALTER SYSTEM SET wal_level = 'logical';
-- Then: systemctl restart postgresql
```

### Permission Denied

```sql
-- Grant necessary permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO drasi_user;
GRANT USAGE ON SCHEMA public TO drasi_user;
ALTER USER drasi_user WITH REPLICATION;
```

## Performance Considerations

1. **Limit monitored tables**: Only include tables needed by queries
2. **Use appropriate slot names**: Different applications should use different slots
3. **Monitor replication lag**: Check `pg_stat_replication` for lag
4. **Clean up unused slots**: Unused slots prevent WAL cleanup

```sql
-- Check replication status
SELECT * FROM pg_stat_replication;

-- Check slot lag
SELECT slot_name,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) as lag
FROM pg_replication_slots;
```

## Next Steps

- [Write Continuous Queries](/drasi-server/how-to-guides/write-continuous-queries/) - Query your PostgreSQL data
- [Configure Bootstrap Providers](/drasi-server/how-to-guides/configure-bootstrap-providers/) - Load initial data
