---
type: "docs"
title: "Configure MySQL Bootstrap Provider"
linkTitle: "MySQL"
weight: 45
description: "Bootstrap queries from a MySQL snapshot"
related:
  howto:
    - title: "Configure Sources"
      url: "/drasi-server/how-to-guides/configuration/configure-sources/"
    - title: "Configure MySQL Source"
      url: "/drasi-server/how-to-guides/configuration/configure-sources/configure-mysql-source/"
    - title: "Configure Bootstrap Providers"
      url: "/drasi-server/how-to-guides/configuration/configure-bootstrap-providers/"
---

The **MySQL bootstrap provider** loads initial state from a MySQL database so queries start with a complete snapshot before streaming begins.

## When to use MySQL bootstrap

- You need historical/current state from MySQL when a query starts.
- Your query depends on existing rows (aggregations, joins, thresholds).
- You want snapshot + binlog streaming from the same database.

## Prerequisites

- Use with a **MySQL source** (`sources[].kind: mysql`).
- The database user must have **SELECT** permission on the configured tables.
- Configure `tables` (and optional `tableKeys`) on the MySQL source.

## Quick example (Drasi Server config)

In Drasi Server config, bootstrap provider keys are **camelCase**, and the discriminator field is `bootstrapProvider.kind`.

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

    tables:
      - orders
      - customers

    bootstrapProvider:
      kind: mysql
```

## Configuration reference

`mysql` accepts **no additional fields**.

| Field | Type | Required | Description |
|---|---|---:|---|
| `kind` | string | Yes | Must be `mysql`. |

## Notes

- Drasi Server only allows `kind: mysql` when the source is also `kind: mysql`.
- Connection and table scope come from the MySQL source configuration (for example `host`, `database`, `tables`, and `tableKeys`).
- The `tables` list acts as a security allow-list — only tables explicitly listed will be bootstrapped.
- Table names must use only letters, numbers, and underscores.

## Documentation resources

<div class="card-grid card-grid--2">
  <a href="https://github.com/drasi-project/drasi-core/blob/main/components/bootstrappers/mysql/README.md" target="_blank" rel="noopener">
    <div class="unified-card unified-card--tutorials">
      <div class="unified-card-icon"><i class="fab fa-github"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">MySQL Bootstrap README</h3>
        <p class="unified-card-summary">Implementation notes and behavior details</p>
      </div>
    </div>
  </a>
  <a href="https://crates.io/crates/drasi-bootstrap-mysql" target="_blank" rel="noopener">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-box"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">drasi-bootstrap-mysql on crates.io</h3>
        <p class="unified-card-summary">Package info and release history</p>
      </div>
    </div>
  </a>
</div>
