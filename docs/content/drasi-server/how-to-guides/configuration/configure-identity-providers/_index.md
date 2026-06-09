---
type: "docs"
title: "Configure Identity Providers"
linkTitle: "Configure Identity Providers"
weight: 35
no_list: true
hide_readingtime: true
description: "Declare reusable identity providers and reference them from sources and reactions"
---

**Identity providers** let {{< term "Source" "sources" >}} and {{< term "Reaction" "reactions" >}} authenticate with databases and external services without hardcoding credentials in each component. They are declared once at the top of the Drasi Server config and referenced by `id` from any source or reaction that needs to authenticate.

This page covers how to define identity providers and reference them. Per-provider configuration (auth methods, plugin-specific fields) is documented below.

## Define Identity Providers

Identity providers live in a top-level `identityProviders` array, alongside `sources`, `queries`, and `reactions`:

```yaml
# server.yaml
host: 0.0.0.0
port: 8080

identityProviders:
  - kind: <provider-kind>
    id: <unique-id>
    # ...provider-specific fields...

sources:
  - kind: postgres
    id: orders-db
    # ...
    identityProvider: <unique-id>    # references the entry above

reactions:
  - kind: storedproc-postgres
    id: writer
    # ...
    identityProvider: <unique-id>    # references the entry above
```

In **multi-instance mode**, `identityProviders` can also be declared per-instance under `instances[].identityProviders`. References from a source or reaction resolve against the providers declared on the **same instance** — providers are not shared across instances.

## Supported identity provider kinds

| Kind | Type | Description |
|---|---|---|
| [`password`](#password-provider) | Built-in | Static username/password credentials. No plugin install required. |
| [`azure`](#azure-provider) | Plugin (`identity-azure`) | Azure Entra ID authentication. Supports managed identity, workload identity, and developer-tools credentials. |
| [`aws`](#aws-provider) | Plugin (`identity-aws`) | AWS IAM authentication for RDS/Aurora. Supports role assumption (`roleArn`) and IRSA on EKS. |
| `application` | Programmatic only | Delegates to a host-supplied Rust closure. Not configurable via YAML — only usable when embedding DrasiLib as a library. See [example](https://github.com/drasi-project/drasi-core/tree/main/examples/lib/application-identity-provider). |

### Password Provider

The `password` provider is built into `drasi-lib` and works in every Drasi Server build — no plugin install is needed.

```yaml
identityProviders:
  - kind: password
    id: pg-password
    username: drasi
    password: ${PG_PASSWORD}
```

**Fields:**

| Field | Type | Required | Description |
|---|---|---:|---|
| `username` | string \| ConfigValue | Yes | Username returned as part of the credentials. |
| `password` | string \| ConfigValue | Yes | Password returned as part of the credentials. |

The provider returns the same `UsernamePassword` credentials on every call. Use it for development, testing, and any deployment where short-lived cloud tokens are not required. For production against cloud-managed databases, prefer the [Azure](#azure-provider) or [AWS](#aws-provider) providers, which fetch fresh tokens on every call.

### Azure Provider

The `azure` provider (plugin `identity-azure`) authenticates against Azure Entra ID (formerly Azure AD) and returns short-lived OAuth tokens. It supports four authentication methods, selected via the `authMethod` field. Fresh tokens are acquired on every credential request.

Typical targets: Azure Database for PostgreSQL / MySQL with Entra auth enabled, and other Azure services that accept Entra tokens.

**Common fields:**

| Field | Type | Required | Description |
|---|---|---:|---|
| `authMethod` | enum | No | One of `managed_identity` (default), `managed_identity_user_assigned`, `workload_identity`, `developer_tools`. |
| `identityName` | string \| ConfigValue | Yes | Identity name used for authentication. For database scenarios this must match the PostgreSQL/MySQL role name (for example `my-app-identity` or `user@tenant.onmicrosoft.com`). |
| `clientId` | string \| ConfigValue | Conditional | **Required** when `authMethod` is `managed_identity_user_assigned`. Client ID of the user-assigned managed identity. |
| `scope` | string \| ConfigValue | No | Custom token scope. Defaults to the Azure OSSRDBMS scope (`https://ossrdbms-aad.database.windows.net/.default`). Override for non-PostgreSQL targets (for example `https://graph.microsoft.com/.default`). |

#### `managed_identity` (default)

For Azure VMs, App Service, Functions, or Container Apps with a **system-assigned** managed identity enabled. The token is fetched from the platform's IMDS endpoint; no client ID is needed.

**Needs:** `identityName` matching the database role mapped to this managed identity.

```yaml
identityProviders:
  - kind: azure
    id: aca-identity
    identityName: my-aca-app
    authMethod: managed_identity
```

#### `managed_identity_user_assigned`

For compute resources with a **user-assigned** managed identity attached. The `clientId` selects which identity to use when more than one is available.

**Needs:** `identityName` matching the database role; `clientId` of the user-assigned identity.

```yaml
identityProviders:
  - kind: azure
    id: assigned-identity
    identityName: my-app-identity
    authMethod: managed_identity_user_assigned
    clientId: ${AZURE_CLIENT_ID}
```

#### `workload_identity`

For AKS clusters configured with Entra Workload Identity. The provider reads the federated token from the file path injected by AKS.

**Needs:** `identityName` matching the database role; the following environment variables set by AKS on the pod: `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_FEDERATED_TOKEN_FILE`.

```yaml
identityProviders:
  - kind: azure
    id: aks-workload
    identityName: my-app-identity
    authMethod: workload_identity
```

#### `developer_tools`

Uses the credential chain from `az login`, Visual Studio, or other Azure developer tools. Intended for local development.

**Needs:** `identityName` set to your Entra principal name (typically the email used with `az login`), and a matching database role with an AAD security label.

```yaml
identityProviders:
  - kind: azure
    id: local-dev
    identityName: "user@example.com"
    authMethod: developer_tools
```

For full plugin details (database setup, troubleshooting), see the [`drasi-identity-azure` README](https://github.com/drasi-project/drasi-core/blob/main/components/identity/azure/README.md).

### AWS Provider

The `aws` provider (plugin `identity-aws`) authenticates against AWS IAM and generates IAM auth tokens for RDS/Aurora. It picks up credentials from the standard AWS credential chain (instance metadata, environment variables, shared profiles, IRSA on EKS) and optionally assumes a role via STS before issuing tokens.

The configured "variant" is determined by which optional fields are present.

**Common fields:**

| Field | Type | Required | Description |
|---|---|---:|---|
| `username` | string \| ConfigValue | Yes | IAM-authenticated database user (must be granted `rds_iam` on PostgreSQL / `AWSAuthenticationPlugin` on MySQL). |
| `region` | string \| ConfigValue | No | AWS region (for example `us-west-2`). If omitted, the AWS SDK resolves it from `AWS_REGION` or the shared config. |
| `roleArn` | string \| ConfigValue | No | IAM role ARN to assume via STS before generating tokens (for example `arn:aws:iam::123456789012:role/MyAccessRole`). |
| `sessionName` | string \| ConfigValue | No | STS session name used when assuming `roleArn`. Defaults to `drasi-session`. |

#### Ambient credentials

Uses the AWS credential chain as-is. Works on EC2 / ECS / EKS with an attached role, or locally with `aws sso login` / a configured profile.

**Needs:** ambient AWS credentials reachable by the AWS SDK; an RDS user granted `rds_iam`; the IAM principal must hold `rds-db:connect` on the user resource ARN.

```yaml
identityProviders:
  - kind: aws
    id: rds-iam
    username: drasi_app
    region: us-east-1
```

#### Assumed role (`roleArn`)

Assumes a different IAM role via STS before generating database tokens. Use when the runtime principal must hop into a role that holds the actual `rds-db:connect` permission.

**Needs:** ambient credentials with `sts:AssumeRole` on the target role; the assumed role granted `rds-db:connect`.

```yaml
identityProviders:
  - kind: aws
    id: rds-iam-prod
    username: drasi_app
    region: us-east-1
    roleArn: arn:aws:iam::123456789012:role/DrasiRdsAccess
    sessionName: drasi-prod-session
```

#### IRSA on EKS

IRSA (IAM Roles for Service Accounts) is handled transparently by the AWS SDK — there is no IRSA-specific field. Configure as for ambient credentials; the SDK picks up the projected service-account token automatically.

**Needs:** the EKS service account annotated for IRSA with a role that holds `rds-db:connect`.

```yaml
identityProviders:
  - kind: aws
    id: rds-iam
    username: drasi_app
    region: ${AWS_REGION}
```

For full plugin details, see the [`drasi-identity-aws` source](https://github.com/drasi-project/drasi-core/tree/main/components/identity/aws).

## Validation rules

- `kind` and `id` are required on every entry.
- `id` values must be unique within the `identityProviders` array.
- Every `identityProvider: <id>` reference on a source or reaction must match an entry in `identityProviders`.
- Non-`password` kinds must be registered (installed plugin) before server startup; otherwise startup fails with `Unknown identity provider kind: '<kind>'`.
- The reference field on sources and reactions is `identityProvider` (camelCase). `identity_provider` is rejected.
