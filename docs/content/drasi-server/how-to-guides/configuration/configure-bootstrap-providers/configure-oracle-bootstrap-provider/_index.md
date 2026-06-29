---
type: "docs"
title: "Configure Oracle Bootstrap Provider"
linkTitle: "Oracle"
weight: 50
description: "Bootstrap queries from an Oracle Database snapshot"
related:
  howto:
    - title: "Configure Sources"
      url: "/drasi-server/how-to-guides/configuration/configure-sources/"
    - title: "Configure Oracle Source"
      url: "/drasi-server/how-to-guides/configuration/configure-sources/configure-oracle-source/"
    - title: "Configure Bootstrap Providers"
      url: "/drasi-server/how-to-guides/configuration/configure-bootstrap-providers/"
---

The **Oracle bootstrap provider** loads initial state from an Oracle Database so queries start with a complete snapshot before LogMiner streaming begins.

## When to use Oracle bootstrap

- You need historical/current state from Oracle when a query starts.
- Your query depends on existing rows (aggregations, joins, thresholds).
- You want a consistent snapshot + LogMiner streaming from the same database.

## Prerequisites

- Use with an **Oracle source** (`sources[].kind: oracle`).
- Oracle Instant Client libraries must be available at runtime (see the [Oracle source prerequisites](/drasi-server/how-to-guides/configuration/configure-sources/configure-oracle-source/#oracle-instant-client)).
- The configured user must have `SELECT` access on the tables to be bootstrapped.

## Quick example (Drasi Server config)

In Drasi Server config, bootstrap provider keys are **camelCase**, and the discriminator field is `bootstrapProvider.kind`.

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

## Configuration reference

The Oracle bootstrap provider has its own connection fields (it does not inherit from the parent source).

| Field | Type | Default | Description |
|---|---:|---:|---|
| `kind` | string | required | Must be `oracle`. |
| `host` | string | `localhost` | Oracle server hostname. |
| `port` | integer | `1521` | Oracle listener port. |
| `service` | string | `FREEPDB1` | Oracle service name. |
| `user` | string | required | Database username with SELECT access on target tables. |
| `password` | string | `""` | Database password. |
| `tables` | string[] | `[]` | Tables to bootstrap. Use `SCHEMA.TABLE` format (for example `HR.EMPLOYEES`). |
| `sslMode` | string | `disable` | SSL mode: `disable` or `require`. |
| `tableKeys` | array | `[]` | Override key columns per table (see below). |

Fields support Drasi Server config references like `${ENV_VAR}` / `${ENV_VAR:-default}`.

### tableKeys

Use `tableKeys` to override primary key discovery for element ID generation:

```yaml
bootstrapProvider:
  kind: oracle
  # ... connection fields ...
  tableKeys:
    - table: HR.EMPLOYEES
      keyColumns: [EMPLOYEE_ID]
    - table: HR.ORDER_ITEMS
      keyColumns: [ORDER_ID, PRODUCT_ID]
```

## Behavior

- When the Oracle source supplies a **bootstrap SCN**, snapshots are read with `AS OF SCN` so the bootstrap and streaming start from the same Oracle snapshot boundary — no gaps, no duplicates.
- Element IDs are generated from discovered primary keys or configured `tableKeys` overrides, using the same format as the Oracle source (`schema:table:pk1:pk2`).
- Unqualified table names default to the configured Oracle user schema.
- Cypher node labels match the Oracle table name portion of each configured table.

## Notes

- Unlike the PostgreSQL bootstrap provider, the Oracle bootstrap provider requires its own connection configuration (host, port, service, user, password) because Oracle bootstrap connections may use different credentials or connect to a standby.
- The `tables` list in the bootstrap provider controls which tables are bootstrapped; it does not need to match the source `tables` list exactly, though typically they are the same.

## Documentation resources

<div class="card-grid card-grid--2">
  <a href="https://github.com/drasi-project/drasi-core/blob/main/components/bootstrappers/oracle/README.md" target="_blank" rel="noopener">
    <div class="unified-card unified-card--tutorials">
      <div class="unified-card-icon"><i class="fab fa-github"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Oracle Bootstrap README</h3>
        <p class="unified-card-summary">Implementation notes and behavior details</p>
      </div>
    </div>
  </a>
  <a href="https://crates.io/crates/drasi-bootstrap-oracle" target="_blank" rel="noopener">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-box"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">drasi-bootstrap-oracle on crates.io</h3>
        <p class="unified-card-summary">Package info and release history</p>
      </div>
    </div>
  </a>
</div>
