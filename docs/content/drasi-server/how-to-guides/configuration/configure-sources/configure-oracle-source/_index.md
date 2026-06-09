---
type: "docs"
title: "Configure Oracle Source"
linkTitle: "Oracle"
weight: 60
description: "Stream changes from Oracle Database using LogMiner"
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

The Oracle {{< term "Source" >}} streams row-level changes from an Oracle Database by polling **Oracle LogMiner** over SCN (System Change Number) windows.

## When to use the Oracle source

- Keep Drasi queries continuously updated from an Oracle system-of-record database.
- Drive reactions from Oracle DML changes (INSERT, UPDATE, DELETE).
- Build reactive services against Oracle databases with transactional ordering.

## Prerequisites

### Oracle Instant Client

This source requires Oracle Instant Client libraries at **runtime**. Install the Basic or Basic Light package for your platform:

| Platform | Library | Install |
|----------|---------|---------|
| **macOS** | `libclntsh.dylib` | Download the DMG from [Oracle Instant Client](https://www.oracle.com/database/technologies/instant-client.html), mount it, and copy to a directory. Set `DYLD_LIBRARY_PATH` to that directory. |
| **Linux** | `libclntsh.so` | Install the `.rpm` / `.zip` from the same page or use Oracle's yum/apt repos. Set `LD_LIBRARY_PATH` to the install directory. You may also need `libaio` and `libnsl`. |
| **Windows** | `OCI.dll` | Install the Instant Client `.zip` and add its directory to `PATH`. |

If the client libraries are missing at runtime, the source will fail to start with an `ORA-DPI-1047` error.

### Oracle Database Requirements

- Oracle must be in **ARCHIVELOG** mode.
- Database-level **supplemental logging** must be enabled.
- Each monitored table must have `SUPPLEMENTAL LOG DATA (ALL) COLUMNS` enabled.

### Required Grants

The Drasi user needs the following Oracle privileges:

```sql
GRANT CREATE SESSION TO drasi;
GRANT LOGMINING TO drasi;
GRANT SELECT ON V_$LOGMNR_CONTENTS TO drasi;
GRANT SELECT ON V_$DATABASE TO drasi;
GRANT SELECT ON V_$ARCHIVED_LOG TO drasi;
GRANT EXECUTE ON DBMS_LOGMNR TO drasi;
```

## How it connects

This source **connects outbound** from Drasi Server to Oracle over the Oracle Net protocol; it does not open an inbound port.

## Quick example (Drasi Server config)

Drasi Server source configuration uses **camelCase** keys.

```yaml
sources:
  - kind: oracle
    id: hr-db
    autoStart: true

    host: ${ORACLE_HOST:-localhost}
    port: ${ORACLE_PORT:-1521}
    service: ${ORACLE_SERVICE:-FREEPDB1}
    user: ${ORACLE_USER:-drasi}
    password: ${ORACLE_PASSWORD}

    tables:
      - HR.EMPLOYEES
      - HR.DEPARTMENTS

    # Optional
    pollIntervalMs: 1000
    startPosition: current
    sslMode: disable

    # Optional: override primary key discovery
    tableKeys:
      - table: HR.EMPLOYEES
        keyColumns: [EMPLOYEE_ID]

    # Optional: preload initial state
    bootstrapProvider:
      kind: oracle
      host: ${ORACLE_HOST:-localhost}
      port: ${ORACLE_PORT:-1521}
      service: ${ORACLE_SERVICE:-FREEPDB1}
      user: ${ORACLE_USER:-drasi}
      password: ${ORACLE_PASSWORD}
      tables:
        - HR.EMPLOYEES
        - HR.DEPARTMENTS
```

## Configure Oracle Database

### 1) Enable ARCHIVELOG mode

Connect as SYSDBA and run:

```sql
SHUTDOWN IMMEDIATE;
STARTUP MOUNT;
ALTER DATABASE ARCHIVELOG;
ALTER DATABASE OPEN;
```

Verify:

```sql
SELECT LOG_MODE FROM V$DATABASE;
-- Expected: ARCHIVELOG
```

### 2) Enable supplemental logging

```sql
ALTER DATABASE ADD SUPPLEMENTAL LOG DATA;
```

### 3) Enable supplemental logging on each table

```sql
ALTER TABLE HR.EMPLOYEES ADD SUPPLEMENTAL LOG DATA (ALL) COLUMNS;
ALTER TABLE HR.DEPARTMENTS ADD SUPPLEMENTAL LOG DATA (ALL) COLUMNS;
```

### 4) Create a Drasi user with required grants

```sql
CREATE USER drasi IDENTIFIED BY "your-password";

GRANT CREATE SESSION TO drasi;
GRANT LOGMINING TO drasi;
GRANT SELECT ON V_$LOGMNR_CONTENTS TO drasi;
GRANT SELECT ON V_$DATABASE TO drasi;
GRANT SELECT ON V_$ARCHIVED_LOG TO drasi;
GRANT EXECUTE ON DBMS_LOGMNR TO drasi;

-- SELECT on monitored tables (for bootstrap and ROWID lookups)
GRANT SELECT ON HR.EMPLOYEES TO drasi;
GRANT SELECT ON HR.DEPARTMENTS TO drasi;
```

## Data mapping

- Each changed row becomes a Drasi graph {{< term "Node" >}}.
- **Label**: table name (for example `EMPLOYEES`).
- **Properties**: columns become node properties.
- **Element ID**: `schema:table:pk1:pk2` (for example `HR:EMPLOYEES:100`).
  - Composite keys are joined with `:`.
  - Unqualified table names default to the configured Oracle user schema.

If no key columns can be resolved for a row, the source logs a warning and falls back to a generated UUID.

## Configuration reference (Drasi Server)

| Field | Type | Default | Description |
|---|---:|---:|---|
| `kind` | string | required | Must be `oracle`. |
| `id` | string | required | Unique source identifier. |
| `autoStart` | boolean | `true` | Whether Drasi Server starts the source on startup. |
| `bootstrapProvider` | object | none | Optional bootstrap provider for initial state. For Oracle bootstrap, use `{ kind: oracle, ... }` with its own connection fields. |
| `host` | string | `localhost` | Oracle server hostname. |
| `port` | integer | `1521` | Oracle listener port. |
| `service` | string | `FREEPDB1` | Oracle service name used in the connection string. |
| `user` | string | required | Database username. |
| `password` | string | `""` | Database password. |
| `tables` | string[] | `[]` | Tables to monitor. Use `SCHEMA.TABLE` format (for example `HR.EMPLOYEES`). |
| `pollIntervalMs` | integer | `1000` | LogMiner polling interval in milliseconds. |
| `startPosition` | string | `current` | Where to begin reading changes: `current` (default) or `beginning` (earliest archived log). |
| `sslMode` | string | `disable` | SSL mode: `disable` or `require` (uses `tcps://` protocol). |
| `tableKeys` | array | `[]` | Override key columns per table (see below). |

Fields support Drasi Server config references like `${ENV_VAR}` / `${ENV_VAR:-default}`.

### tableKeys

Use `tableKeys` to define key columns for element ID generation when primary keys are missing or not suitable.

```yaml
tableKeys:
  - table: HR.EMPLOYEES
    keyColumns: [EMPLOYEE_ID]
  - table: HR.ORDER_ITEMS
    keyColumns: [ORDER_ID, PRODUCT_ID]
```

Notes:
- Use `SCHEMA.TABLE` format in `tableKeys.table`.
- Composite key columns are joined with `:` in the element ID (for example `HR:ORDER_ITEMS:1001:5`).

## Behavior details

- The source validates Oracle connectivity, ARCHIVELOG mode, and primary-key discovery before reporting `Running`.
- INSERT and UPDATE rows are materialized by fetching the final row image via `ROWID` after collapsing multiple changes for the same row within a poll window.
- DELETE rows are materialized from LogMiner `SQL_UNDO`.
- The last processed `COMMIT_SCN` is persisted in the configured Drasi state store so the source can resume after restarts.
- `startPosition: beginning` attempts to use the earliest archived log SCN available to the Oracle user.

## Performance tuning notes

- Adjust `pollIntervalMs` based on your change frequency — lower values reduce latency, higher values reduce CPU usage.
- Only include the tables you need in `tables` to minimize LogMiner decode overhead.
- Ensure adequate Oracle archived log retention for your polling frequency.
- Monitor LogMiner sessions to avoid excessive redo log consumption.

## Verifying It Works

After starting Drasi Server with your Oracle source, verify the connection:

### 1. Check source status

```bash
curl http://localhost:8080/api/v1/sources/hr-db
```

Expected response includes `"status": "running"`.

### 2. Make a test change in Oracle

```sql
INSERT INTO HR.EMPLOYEES (EMPLOYEE_ID, FIRST_NAME, LAST_NAME, EMAIL)
VALUES (999, 'Test', 'User', 'test@example.com');
COMMIT;
```

### 3. Verify the change was captured

If you have a log reaction configured:

```
[console-output] Query 'my-query' (1 items):
[console-output]   [ADD] {"EMPLOYEE_ID":"999","FIRST_NAME":"Test","LAST_NAME":"User","EMAIL":"test@example.com"}
```

Or query results via API:

```bash
curl http://localhost:8080/api/v1/queries/my-query/results
```

## Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| `ORA-DPI-1047` | Oracle Instant Client not found | Install Oracle Instant Client and set `LD_LIBRARY_PATH` / `DYLD_LIBRARY_PATH` |
| `ORA-01031: insufficient privileges` | Missing grants | Run the required GRANT statements for the Drasi user |
| `ORA-01291: missing logfile` | ARCHIVELOG not enabled | Enable ARCHIVELOG mode (see above) |
| `ORA-25228: timeout or end-of-fetch` | LogMiner has no data in SCN range | Normal during idle periods; source will retry on next poll |
| No changes captured | Table not configured or supplemental logging missing | Verify table is in `tables` list and has supplemental logging enabled |
| Unstable element IDs | No primary key discovered | Add primary key constraint or configure `tableKeys` |
| `could not connect to server` | Wrong host/port/service | Verify `host`, `port`, and `service` values; check Oracle listener status |
| `ORA-12514: TNS:listener does not currently know of service` | Wrong service name | Check `service` matches the Oracle service name (use `lsnrctl status` to verify) |

### Oracle Permissions Checklist

```sql
-- Verify the Drasi user has the required grants
SELECT * FROM DBA_SYS_PRIVS WHERE GRANTEE = 'DRASI';
SELECT * FROM DBA_TAB_PRIVS WHERE GRANTEE = 'DRASI';

-- Verify ARCHIVELOG mode
SELECT LOG_MODE FROM V$DATABASE;

-- Verify supplemental logging
SELECT SUPPLEMENTAL_LOG_DATA_MIN FROM V$DATABASE;

-- Verify table-level supplemental logging
SELECT * FROM ALL_LOG_GROUPS WHERE TABLE_NAME = 'EMPLOYEES';
```

## Known limitations

- Only DML changes (INSERT, UPDATE, DELETE) are captured; DDL changes are not streamed.
- Tables without primary keys require explicit `tableKeys` configuration for stable element IDs.
- The source requires Oracle Instant Client libraries on the runtime host.
- Very large transactions may increase memory usage during the poll window.

## Documentation resources

<div class="card-grid card-grid--2">
  <a href="https://github.com/drasi-project/drasi-core/blob/main/components/sources/oracle/README.md" target="_blank" rel="noopener">
    <div class="unified-card unified-card--tutorials">
      <div class="unified-card-icon"><i class="fab fa-github"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Oracle Source README</h3>
        <p class="unified-card-summary">Implementation notes, prerequisites, and behavior details</p>
      </div>
    </div>
  </a>
  <a href="https://crates.io/crates/drasi-source-oracle" target="_blank" rel="noopener">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-box"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">drasi-source-oracle on crates.io</h3>
        <p class="unified-card-summary">Package info and release history</p>
      </div>
    </div>
  </a>
</div>
