---
type: "docs"
title: "Configure SQL Server Source"
linkTitle: "SQL Server"
weight: 60
description: "Stream changes from SQL Server using Change Data Capture (CDC)"
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

The SQL Server {{< term "Source" >}} streams row-level changes from a Microsoft SQL Server database using **Change Data Capture (CDC)**.

## When to use the SQL Server source

- Keep Drasi queries continuously updated from a system-of-record SQL Server database.
- Drive reactions from database changes (alerts, notifications, downstream sync, cache/materialized-view updates).
- Build reactive services that need change-driven logic against SQL Server data.

## Prerequisites

- SQL Server **2016+** (or Azure SQL with CDC support).
- Change Data Capture enabled on the database and target tables.
- A database user with **SELECT** permission on CDC tables and the monitored tables.

## How it connects

This source **connects outbound** from Drasi Server to SQL Server over the TDS protocol; it does not open an inbound port.

## Quick example (Drasi Server config)

Drasi Server source configuration uses **camelCase** keys.

```yaml
sources:
  - kind: mssql
    id: orders-db
    autoStart: true

    host: ${MSSQL_HOST:-localhost}
    port: ${MSSQL_PORT:-1433}
    database: ${MSSQL_DATABASE:-MyDatabase}
    user: ${MSSQL_USER:-drasi_user}
    password: ${MSSQL_PASSWORD}

    tables:
      - orders
      - customers

    # Optional settings
    authMode: sqlserver          # sqlserver (default), windows, or azuread
    startPosition: current       # current (default) or beginning
    pollIntervalMs: 1000         # CDC polling interval in milliseconds (default: 1000)
    encryption: notsupported     # off, on, or notsupported (default)
    trustServerCertificate: false

    # Optional: override primary keys for element ID generation
    tableKeys:
      - table: order_items
        keyColumns: [order_id, product_id]

    # Optional: preload initial state for newly-subscribed queries
    bootstrapProvider:
      kind: mssql
```

## Configure SQL Server

### 1) Enable CDC on the database

```sql
USE MyDatabase;
EXEC sys.sp_cdc_enable_db;
```

### 2) Enable CDC on tables

```sql
EXEC sys.sp_cdc_enable_table
    @source_schema = 'dbo',
    @source_name = 'orders',
    @role_name = NULL;

EXEC sys.sp_cdc_enable_table
    @source_schema = 'dbo',
    @source_name = 'customers',
    @role_name = NULL;
```

### 3) Create a user with permissions

```sql
CREATE LOGIN drasi_user WITH PASSWORD = 'your-password';
USE MyDatabase;
CREATE USER drasi_user FOR LOGIN drasi_user;
GRANT SELECT ON SCHEMA::cdc TO drasi_user;
GRANT SELECT ON dbo.orders TO drasi_user;
GRANT SELECT ON dbo.customers TO drasi_user;
```

## Data mapping

- Each changed row becomes a Drasi graph {{< term "Node" >}}.
- **Label**: table name (for example `orders`).
- **Properties**: columns become node properties.
- **Element ID**:
  - **Single PK**: `table:pk_value` (for example `orders:12345`).
  - **Composite PK**: `table:pk1_pk2` (for example `order_items:12345_67890`).
  - **No PK**: `table:uuid` (fallback with warning).

## Start position

The `startPosition` configuration determines what happens when no LSN checkpoint is found in the state store:

- **`current`** (default): Start from the current LSN, ignoring historical changes. Use this when you only want new changes going forward.
- **`beginning`**: Start from the earliest available LSN in CDC retention. Use this to capture all retained historical changes.

{{< alert title="Note" color="info" >}}
Once an LSN is persisted to the state store, it will always be used regardless of the `startPosition` setting. The `startPosition` only applies when no checkpoint exists.
{{< /alert >}}

## Configuration reference (Drasi Server)

| Field | Type | Default | Description |
|---|---:|---:|---|
| `kind` | string | required | Must be `mssql`. |
| `id` | string | required | Unique source identifier. |
| `autoStart` | boolean | `true` | Whether Drasi Server starts the source on startup. |
| `host` | string | `localhost` | SQL Server hostname. |
| `port` | integer | `1433` | SQL Server port. |
| `database` | string | required | Database name. |
| `user` | string | required | Database user. |
| `password` | string | `""` | Password. |
| `authMode` | string | `sqlserver` | Authentication mode: `sqlserver`, `windows`, or `azuread`. |
| `tables` | string[] | `[]` | Tables to monitor for CDC changes. |
| `pollIntervalMs` | integer | `1000` | Interval in milliseconds between CDC polls. |
| `startPosition` | string | `current` | Where to start when no LSN checkpoint exists: `current` or `beginning`. |
| `encryption` | string | `notsupported` | TDS encryption mode: `off`, `on`, or `notsupported`. |
| `trustServerCertificate` | boolean | `false` | Whether to trust the server certificate without validation. |
| `tableKeys` | array | `[]` | Override key columns per table (see below). |
| `bootstrapProvider` | object | none | Optional bootstrap provider for initial state. For SQL Server bootstrap, use `{ kind: mssql }`. |

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

### authMode options

| Value | Description |
|-------|-------------|
| `sqlserver` | SQL Server authentication (username/password) — default |
| `windows` | Windows/integrated authentication |
| `azuread` | Azure Active Directory authentication |

## Verifying It Works

After starting Drasi Server with your SQL Server source, verify the connection:

### 1. Check source status

```bash
curl http://localhost:8080/api/v1/sources/orders-db
```

Expected response includes `"status": "running"`.

### 2. Make a test change in SQL Server

```sql
INSERT INTO dbo.orders (id, customer_id, total, status)
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

### 4. Check CDC is working in SQL Server

```sql
-- Verify CDC is enabled on the database
SELECT name, is_cdc_enabled FROM sys.databases WHERE name = 'MyDatabase';

-- Verify CDC is enabled on your tables
SELECT s.name AS schema_name, t.name AS table_name, t.is_tracked_by_cdc
FROM sys.tables t
JOIN sys.schemas s ON t.schema_id = s.schema_id
WHERE t.is_tracked_by_cdc = 1;
```

## Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| `CDC is not enabled on database` | CDC not enabled | `EXEC sys.sp_cdc_enable_db;` |
| `Could not find CDC table` | CDC not enabled on table | `EXEC sys.sp_cdc_enable_table @source_schema='dbo', @source_name='tablename', @role_name=NULL;` |
| `Login failed for user` | Wrong credentials | Verify `user` and `password` values |
| `Cannot open server` | Wrong host/port | Verify `host` and `port` values, check firewall |
| No changes captured | CDC not enabled on table | Verify table has CDC enabled (see check above) |
| Unstable element IDs | No primary key | Add primary key or configure `tableKeys` |
| Connection timeout | Encryption mismatch | Try setting `encryption: off` or `trustServerCertificate: true` |

### SQL Server Permissions Checklist

Your database user needs:

```sql
-- Required permissions
CREATE LOGIN drasi_user WITH PASSWORD = 'your-password';
CREATE USER drasi_user FOR LOGIN drasi_user;
GRANT SELECT ON SCHEMA::cdc TO drasi_user;
GRANT SELECT ON dbo.your_table TO drasi_user;  -- repeat for each table
```

## Known limitations

- CDC retention period determines how far back `startPosition: beginning` can go. SQL Server's default CDC retention is 3 days.
- CDC cleanup jobs run periodically and remove old change records. Ensure your polling interval is more frequent than the cleanup schedule.

## Documentation resources

<div class="card-grid card-grid--2">
  <a href="https://github.com/drasi-project/drasi-core/blob/main/components/sources/mssql/README.md" target="_blank" rel="noopener">
    <div class="unified-card unified-card--tutorials">
      <div class="unified-card-icon"><i class="fab fa-github"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">SQL Server Source README</h3>
        <p class="unified-card-summary">Implementation notes, prerequisites, and behavior details</p>
      </div>
    </div>
  </a>
  <a href="https://crates.io/crates/drasi-source-mssql" target="_blank" rel="noopener">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-box"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">drasi-source-mssql on crates.io</h3>
        <p class="unified-card-summary">Package info and release history</p>
      </div>
    </div>
  </a>
</div>
