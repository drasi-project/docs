---
type: "docs"
title: "Configure Secret Stores"
linkTitle: "Configure Secret Stores"
weight: 60
description: "Resolve passwords and tokens from external secret stores instead of hardcoding them in configuration"
related:
  concepts:
    - title: "Sources"
      url: "/concepts/sources/"
  howto:
    - title: "Configure Drasi Server"
      url: "/drasi-server/how-to-guides/configuration/configure-drasi-server/"
    - title: "Configure Sources"
      url: "/drasi-server/how-to-guides/configuration/configure-sources/"
    - title: "Configure Reactions"
      url: "/drasi-server/how-to-guides/configuration/configure-reactions/"
  reference:
    - title: "Configuration Reference"
      url: "/drasi-server/reference/configuration/"
---

Secret stores let you keep sensitive values (passwords, API keys, tokens) out of your configuration files. Instead of providing a literal value or relying solely on environment variables, you reference a named secret that is resolved at runtime from an external store.

## Why use a secret store?

| Approach | Trade-offs |
|----------|-----------|
| Hardcoded values | Secrets in plaintext on disk — risky if config is committed to version control |
| Environment variables (`${VAR}`) | Better, but still visible in process listings and `.env` files |
| **Secret store** | Secrets stay in a dedicated vault; config files contain only references |

Secret stores are especially useful in production environments where credentials should never appear in plaintext configuration files or environment variable dumps.

## How it works

1. You configure a **secret store provider** at the top level of your server config (or per-instance in multi-instance mode).
2. In any Source or Reaction configuration field that would normally take a string value, you use a **Secret envelope** instead.
3. At startup, Drasi Server resolves each secret reference by calling the configured secret store provider.

### Secret envelope syntax

Anywhere a scalar string value is expected, you can substitute a secret envelope:

```yaml
# Instead of a literal value:
password: my-secret-password

# Use a secret reference:
password:
  kind: Secret
  name: DB_PASSWORD
```

The `name` field identifies the secret in the configured store. Its meaning depends on the provider:
- **File provider:** the JSON key in the secrets file
- **Keyring provider:** the entry name in the OS credential store
- **Azure Key Vault provider:** the Key Vault secret name

## Configuring a secret store

Add a `secretStore` field at the top level of your server configuration:

```yaml
host: 0.0.0.0
port: 8080

secretStore:
  kind: file
  path: ./secrets.json

sources:
  - kind: postgres
    id: my-db
    host: localhost
    password:
      kind: Secret
      name: DB_PASSWORD
    # ...
```

In multi-instance mode, `secretStore` can be set per instance:

```yaml
instances:
  - id: production
    secretStore:
      kind: azure-keyvault
      vaultUrl: https://my-vault.vault.azure.net/
      authMethod: managed_identity
    sources:
      # ...
```

## Available providers

### File

Reads secrets from a flat JSON file on disk. Best for **development and testing**.

```yaml
secretStore:
  kind: file
  path: ./secrets.json
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `kind` | string | Yes | Must be `file` |
| `path` | string | Yes | Path to a JSON file containing key-value secret pairs |

The secrets file is a simple JSON object mapping secret names to string values:

```json
{
  "DB_PASSWORD": "my-secret-password",
  "API_KEY": "sk-abc123"
}
```

### Keyring (OS credential store)

Uses the operating system's native credential manager. Best for **local development** without files on disk.

- **macOS:** Keychain
- **Linux:** Secret Service (GNOME Keyring / KDE Wallet)
- **Windows:** Credential Manager

```yaml
secretStore:
  kind: keyring
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `kind` | string | Yes | Must be `keyring` |

Secret names map directly to keyring entry names. Store secrets using your OS tools:

```bash
# macOS example
security add-generic-password -a drasi -s DB_PASSWORD -w "my-secret"

# Linux example (using secret-tool)
secret-tool store --label="DB_PASSWORD" service drasi username DB_PASSWORD
```

### Azure Key Vault

Resolves secrets from Azure Key Vault using Azure Identity credentials. Best for **production on Azure**.

```yaml
secretStore:
  kind: azure-keyvault
  vaultUrl: https://my-vault.vault.azure.net/
  authMethod: developer_tools
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `kind` | string | Yes | Must be `azure-keyvault` |
| `vaultUrl` | string | Yes | Full URL to your Azure Key Vault (e.g., `https://my-vault.vault.azure.net/`) |
| `authMethod` | string | Yes | Authentication method (see table below) |
| `clientId` | string | Conditional | Required for `managed_identity_user_assigned` and `client_secret` |
| `tenantId` | string | Conditional | Required for `client_secret` |
| `clientSecret` | string | Conditional | Required for `client_secret` |

#### Authentication methods

| `authMethod` | Use case | Requirements |
|---|---|---|
| `developer_tools` | Local development | `az login` session, VS Code Azure extension, or IntelliJ Azure toolkit |
| `managed_identity` | Azure VMs, App Service, ACI | System-assigned managed identity attached to compute resource |
| `managed_identity_user_assigned` | Shared identity across resources | `clientId` field with the user-assigned identity's client ID |
| `workload_identity` | AKS with federated identity | `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_FEDERATED_TOKEN_FILE` env vars (set by AKS) |
| `client_secret` | Service principals (CI/CD, non-Azure hosts) | `tenantId`, `clientId`, `clientSecret` fields |

#### Azure Key Vault example

```yaml
secretStore:
  kind: azure-keyvault
  vaultUrl: https://drasi-prod-kv.vault.azure.net/
  authMethod: managed_identity

sources:
  - kind: postgres
    id: orders-db
    host: orders-db.postgres.database.azure.com
    user: drasi_user
    password:
      kind: Secret
      name: ORDERS-DB-PASSWORD    # Key Vault secret name (hyphens, not underscores)
    database: orders
    # ...
```

{{% alert title="Key Vault naming" color="info" %}}
Azure Key Vault secret names can only contain alphanumeric characters and hyphens. Use hyphens instead of underscores (e.g., `DB-PASSWORD` not `DB_PASSWORD`).
{{% /alert %}}

## Bootstrap constraint

A secret store's own configuration **cannot** use secret references. This avoids a circular dependency — the secret store must be initialized before it can resolve secrets for other components.

Use literal values or environment variables for the secret store's own config:

```yaml
# ✅ Correct — env var for the secret store's own config
secretStore:
  kind: azure-keyvault
  vaultUrl: ${VAULT_URL}
  authMethod: client_secret
  tenantId: ${AZURE_TENANT_ID}
  clientId: ${AZURE_CLIENT_ID}
  clientSecret: ${AZURE_CLIENT_SECRET}

# ❌ Incorrect — cannot use Secret envelope in secretStore config
secretStore:
  kind: azure-keyvault
  vaultUrl: https://my-vault.vault.azure.net/
  authMethod: client_secret
  clientSecret:
    kind: Secret          # This won't work!
    name: my-client-secret
```

## Complete example

This example shows a PostgreSQL source with the file-based secret store resolving the database password:

```yaml
id: postgres-secrets-demo
host: 0.0.0.0
port: 8080
logLevel: info

# Secret store: read secrets from a JSON file
secretStore:
  kind: file
  path: ./secrets.json

# PostgreSQL source with secret reference for password
sources:
  - kind: postgres
    id: pg-sensors
    autoStart: true
    host: localhost
    port: 5432
    user: postgres
    password:
      kind: Secret
      name: DB_PASSWORD
    database: drasi_demo
    slotName: drasi_slot
    publicationName: drasi_pub
    tables:
      - sensors
    bootstrapProvider:
      kind: postgres

# Query
queries:
  - id: high-temp
    query: |
      MATCH (s:Sensor)
      WHERE s.temperature > 75
      RETURN s.id, s.name, s.location, s.temperature
    queryLanguage: Cypher
    sources:
      - sourceId: pg-sensors
    autoStart: true

# Reaction
reactions:
  - kind: log
    id: log-temps
    queries: [high-temp]
    autoStart: true
```

With `secrets.json`:

```json
{
  "DB_PASSWORD": "Drasi@Pass123"
}
```

## Secret store vs environment variables

You can mix both approaches. Environment variables still work for non-sensitive configuration, and secret stores handle credentials:

```yaml
sources:
  - kind: postgres
    id: orders-db
    host: ${DB_HOST:-localhost}           # env var for host (not sensitive)
    port: ${DB_PORT:-5432}               # env var for port (not sensitive)
    user: ${DB_USER:-drasi}              # env var for user (low sensitivity)
    password:
      kind: Secret
      name: DB_PASSWORD                  # secret store for password (high sensitivity)
    database: ${DB_NAME:-orders}
```

## Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| Secret store plugin not found | Plugin `.so`/`.dylib` not in `plugins/` directory | Build the secret store plugin and copy it to the server's plugin directory |
| Secret 'X' not found | Named secret doesn't exist in the store | Verify the secret name matches exactly (case-sensitive) |
| Azure auth failed | Invalid credentials or insufficient permissions | Check auth method config; ensure identity has "Key Vault Secrets User" role |
| Circular dependency error | Secret envelope used in `secretStore` config | Use literal values or env vars for the secret store's own configuration |
