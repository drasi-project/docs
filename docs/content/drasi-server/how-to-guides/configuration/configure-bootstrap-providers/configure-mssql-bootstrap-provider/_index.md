---
type: "docs"
title: "Configure SQL Server Bootstrap Provider"
linkTitle: "SQL Server"
weight: 50
description: "Bootstrap queries from a SQL Server snapshot"
related:
  howto:
    - title: "Configure Sources"
      url: "/drasi-server/how-to-guides/configuration/configure-sources/"
    - title: "Configure SQL Server Source"
      url: "/drasi-server/how-to-guides/configuration/configure-sources/configure-mssql-source/"
    - title: "Configure Bootstrap Providers"
      url: "/drasi-server/how-to-guides/configuration/configure-bootstrap-providers/"
---

The **SQL Server bootstrap provider** loads initial state from a Microsoft SQL Server database so queries start with a complete snapshot before streaming begins.

## When to use SQL Server bootstrap

- You need historical/current state from SQL Server when a query starts.
- Your query depends on existing rows (aggregations, joins, thresholds).
- You want snapshot + CDC streaming from the same database.

## Prerequisites

- Use with a **SQL Server source** (`sources[].kind: mssql`).
- The configured user must have SELECT permission on the monitored tables.

## Quick example (Drasi Server config)

In Drasi Server config, bootstrap provider keys are **camelCase**, and the discriminator field is `bootstrapProvider.kind`.

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

    bootstrapProvider:
      kind: mssql
```

When `bootstrapProvider.kind` is `mssql` with no additional fields, the bootstrap provider inherits the connection details from the parent source configuration.

You can also override the connection details if the bootstrap should connect to a different server or use different credentials:

```yaml
    bootstrapProvider:
      kind: mssql
      host: ${BOOTSTRAP_HOST:-localhost}
      port: 1433
      database: ${BOOTSTRAP_DB:-MyDatabase}
      user: ${BOOTSTRAP_USER:-drasi_reader}
      password: ${BOOTSTRAP_PASSWORD}
      authMode: sqlserver
      encryption: notsupported
      trustServerCertificate: false
      tables:
        - orders
        - customers
      tableKeys:
        - table: order_items
          keyColumns: [order_id, product_id]
```

## Configuration reference

| Field | Type | Default | Description |
|---|---:|---:|---|
| `kind` | string | required | Must be `mssql`. |
| `host` | string | from source | SQL Server hostname. |
| `port` | integer | from source | SQL Server port. |
| `database` | string | from source | Database name. |
| `user` | string | from source | Database user. |
| `password` | string | from source | Password. |
| `authMode` | string | from source | Authentication mode: `sqlserver`, `windows`, or `azuread`. |
| `tables` | string[] | from source | Tables to bootstrap. |
| `encryption` | string | from source | TDS encryption mode: `off`, `on`, or `notsupported`. |
| `trustServerCertificate` | boolean | from source | Whether to trust the server certificate without validation. |
| `tableKeys` | array | from source | Override key columns per table for element ID generation. |

Fields support Drasi Server config references like `${ENV_VAR}` / `${ENV_VAR:-default}`.

## Notes

- Drasi Server only allows `kind: mssql` when the source is also `kind: mssql`.
- When no additional fields are provided, connection details are inherited from the parent source configuration.
- The bootstrap reads current table state via `SELECT` queries—it does not use CDC.

## Documentation resources

<div class="card-grid card-grid--2">
  <a href="https://github.com/drasi-project/drasi-core/tree/main/components/bootstrappers/mssql" target="_blank" rel="noopener">
    <div class="unified-card unified-card--tutorials">
      <div class="unified-card-icon"><i class="fab fa-github"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">SQL Server Bootstrap Source</h3>
        <p class="unified-card-summary">Implementation notes and behavior details</p>
      </div>
    </div>
  </a>
  <a href="https://crates.io/crates/drasi-bootstrap-mssql" target="_blank" rel="noopener">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-box"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">drasi-bootstrap-mssql on crates.io</h3>
        <p class="unified-card-summary">Package info and release history</p>
      </div>
    </div>
  </a>
</div>
