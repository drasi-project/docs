---
type: "docs"
title: "Configure MySQL Source"
linkTitle: "MySQL"
weight: 55
description: "Stream changes from MySQL using binlog replication"
related:
  concepts:
    - title: "Sources"
      url: "/concepts/sources/"
  howto:
    - title: "Configure Bootstrap Providers"
      url: "/drasi-server/how-to-guides/configuration/configure-bootstrap-providers/"
  reference:
    - title: "Configuration Reference"
      url: "/drasi-server/reference/configuration/"
---

The MySQL {{< term "Source" >}} streams row-level changes from a MySQL database using **binary log (binlog) replication**.

## When to use the MySQL source

- Keep Drasi queries continuously updated from a system-of-record MySQL database.
- Drive reactions from database changes (alerts, notifications, downstream sync, cache/materialized-view updates).
- Build reactive services that need transactional ordering of changes.

## Prerequisites

- MySQL **8.0+**.
- Binary logging enabled with row-based format:
  - `binlog_format = ROW`
  - `binlog_row_image = FULL`
  - `binlog_row_metadata = FULL`
- A database user with **REPLICATION SLAVE**, **REPLICATION CLIENT**, and **SELECT** permissions.

## How it connects

This source **connects outbound** from Drasi Server to MySQL over the MySQL protocol; it does not open an inbound port.

## Quick example (Drasi Server config)

Drasi Server source configuration uses **camelCase** keys.

```yaml
sources:
  - kind: mysql
    id: orders-db
    autoStart: true

    host: ${MYSQL_HOST:-localhost}
    port: ${MYSQL_PORT:-3306}
    database: ${MYSQL_DATABASE:-mydb}
    user: ${MYSQL_USER:-drasi_user}
    password: ${MYSQL_PASSWORD}

    # Tables to monitor
    tables:
      - orders
      - customers

    # Optional: override key columns for tables without primary keys
    tableKeys:
      - table: order_items
        keyColumns: [order_id, product_id]

    # Optional: where to start reading the binlog
    startPosition: from_end

    # Optional: preload initial state for newly-subscribed queries
    bootstrapProvider:
      kind: mysql
```

## Configure MySQL

### 1) Enable binary logging with row format

Add to your MySQL configuration (`my.cnf` or `my.ini`) and restart MySQL:

```ini
[mysqld]
log-bin = mysql-bin
binlog_format = ROW
binlog_row_image = FULL
binlog_row_metadata = FULL
server-id = 1
```

### 2) Create a replication user

```sql
CREATE USER 'drasi_user'@'%' IDENTIFIED BY 'your-password';
GRANT REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'drasi_user'@'%';
GRANT SELECT ON mydb.* TO 'drasi_user'@'%';
FLUSH PRIVILEGES;
```

### 3) (Recommended) Ensure tables have primary keys

For reliable change tracking, tables should have primary keys.
If replicating tables without primary keys, configure `tableKeys` (below).

## Data mapping

- Each changed row becomes a Drasi graph {{< term "Node" >}}.
- **Label**: table name (for example `orders`).
- **Properties**: columns become node properties.
- **Element ID**: `table:key` (for example `orders:123`).

If no key columns can be resolved for a row, the source logs a warning and falls back to a generated UUID: `table:uuid`.

## Configuration reference (Drasi Server)

| Field | Type | Default | Description |
|---|---:|---:|---|
| `kind` | string | required | Must be `mysql`. |
| `id` | string | required | Unique source identifier. |
| `autoStart` | boolean | `true` | Whether Drasi Server starts the source on startup. |
| `bootstrapProvider` | object | none | Optional bootstrap provider for initial state. For MySQL bootstrap, use `{ kind: mysql }`. |
| `host` | string | `localhost` | MySQL host. |
| `port` | integer | `3306` | MySQL port. |
| `database` | string | required | Database name. |
| `user` | string | required | Database user (must have replication permission). |
| `password` | string | `""` | Password. |
| `tables` | string[] | `[]` | List of tables to monitor for changes. |
| `sslMode` | string | `disabled` | SSL mode: `disabled`, `if_available`, `require`, `require_verify_ca`, `require_verify_full`. |
| `tableKeys` | array | `[]` | Override key columns per table (see below). |
| `startPosition` | string | `from_end` | Where to start the binlog stream: `from_start`, `from_end`, `from_position`, `from_gtid`. |
| `serverId` | integer | auto-generated | MySQL server ID for the replication connection. Auto-generated from source instance ID if not specified. |
| `heartbeatIntervalSeconds` | integer | `30` | Heartbeat interval in seconds for the replication connection. |

Fields support Drasi Server config references like `${ENV_VAR}` / `${ENV_VAR:-default}`.

### tableKeys

Use `tableKeys` to define key columns for element ID generation when primary keys are missing or not suitable.

```yaml
tableKeys:
  - table: order_items
    keyColumns: [order_id, product_id]
```

Notes:
- Key columns are joined with `_` in the element ID (for example `order_items:1001_5`).

### startPosition

Controls where binlog replication begins when the source starts for the first time.

| Value | Description |
|---|---|
| `from_end` | Start from the current end of the binlog (default). Only captures new changes. |
| `from_start` | Replay the binlog from the beginning. |
| `from_position` | Start from a specific binlog file and position. |
| `from_gtid` | Start from a specific GTID set. |

## Performance tuning notes

- Only list the tables you need in `tables`; this reduces processing overhead.
- The `heartbeatIntervalSeconds` prevents idle connection timeouts and allows the source to detect disconnections faster.
- Monitor binlog retention to ensure the source can reconnect after brief outages.

## Verifying it works

After starting Drasi Server with your MySQL source, verify the connection:

### 1. Check source status

```bash
curl http://localhost:8080/api/v1/sources/orders-db
```

Expected response includes `"status": "running"`.

### 2. Make a test change in MySQL

```sql
INSERT INTO orders (id, customer_id, total, status)
VALUES (999, 1, 100.00, 'pending');
```

### 3. Verify the change was captured

If you have a log reaction configured:

```
[console-output] Query 'my-query' (1 items):
[console-output]   [ADD] {"id":"999","customer_id":"1","total":"100.00","status":"pending"}
```

Or query results via API:

```bash
curl http://localhost:8080/api/v1/queries/my-query/results
```

### 4. Check binlog status in MySQL

```sql
SHOW MASTER STATUS;
```

## Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| `binlog_format must be ROW` | Binlog format not set to ROW | Set `binlog_format = ROW` in `my.cnf` and restart |
| `Access denied; you need the REPLICATION SLAVE privilege` | Missing permission | `GRANT REPLICATION SLAVE ON *.* TO 'drasi_user'@'%';` |
| `Can't connect to MySQL server` | Wrong host/port | Verify `host` and `port` values, check firewall |
| No changes captured | Table not in `tables` list | Add the table to the `tables` configuration |
| Unstable element IDs | No primary key | Add primary key or configure `tableKeys` |
| `binlog_row_image must be FULL` | Row image not complete | Set `binlog_row_image = FULL` in `my.cnf` and restart |

### MySQL Permissions Checklist

Your database user needs:

```sql
-- Required permissions
GRANT REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'drasi_user'@'%';
GRANT SELECT ON mydb.* TO 'drasi_user'@'%';
FLUSH PRIVILEGES;
```

## Known limitations

- Packets larger than 16 MB are not supported.
- Schema changes (migrations, column additions/removals) during streaming may require a source restart.

## Documentation resources

<div class="card-grid card-grid--2">
  <a href="https://github.com/drasi-project/drasi-core/blob/main/components/sources/mysql/README.md" target="_blank" rel="noopener">
    <div class="unified-card unified-card--tutorials">
      <div class="unified-card-icon"><i class="fab fa-github"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">MySQL Source README</h3>
        <p class="unified-card-summary">Implementation notes, prerequisites, and behavior details</p>
      </div>
    </div>
  </a>
  <a href="https://crates.io/crates/drasi-source-mysql" target="_blank" rel="noopener">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-box"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">drasi-source-mysql on crates.io</h3>
        <p class="unified-card-summary">Package info and release history</p>
      </div>
    </div>
  </a>
</div>
