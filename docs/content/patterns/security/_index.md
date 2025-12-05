---
type: "docs"
title: "Security Patterns"
linkTitle: "Security"
weight: 40
description: >
    Best practices for securing your Drasi deployment and protecting sensitive data
---

Security is essential for any data processing system. This guide covers best practices for securing your Drasi deployment, protecting credentials, and ensuring data privacy.

## Security Principles

### Defense in Depth

Apply multiple layers of security:
- Network segmentation
- Authentication and authorization
- Encryption in transit and at rest
- Audit logging

### Least Privilege

Grant only the minimum permissions needed:
- Database accounts with read-only access where possible
- Service accounts with scoped permissions
- Kubernetes RBAC for component access

### Data Minimization

Process only the data you need:
- Query only required columns
- Filter sensitive data at the source
- Avoid logging sensitive values

## Credential Management

### Using Kubernetes Secrets

Store credentials in Kubernetes secrets rather than in configuration files:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
type: Opaque
data:
  username: <base64-encoded-username>
  password: <base64-encoded-password>
```

Reference secrets in your source configuration:

```yaml
apiVersion: v1
kind: Source
metadata:
  name: my-database
spec:
  kind: PostgreSQL
  properties:
    host: db.example.com
    port: 5432
    database: mydb
    user:
      secretKeyRef:
        name: db-credentials
        key: username
    password:
      secretKeyRef:
        name: db-credentials
        key: password
```

### External Secret Stores

For enhanced security, integrate with external secret management:

- Azure Key Vault
- AWS Secrets Manager
- HashiCorp Vault

Use Kubernetes External Secrets or similar operators to sync secrets.

### Credential Rotation

Plan for credential rotation:
- Use secrets that support rotation
- Test rotation procedures
- Automate where possible

## Network Security

### Network Policies

Restrict network traffic using Kubernetes Network Policies:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: drasi-source-policy
spec:
  podSelector:
    matchLabels:
      app: drasi-source
  policyTypes:
  - Egress
  egress:
  - to:
    - ipBlock:
        cidr: 10.0.0.0/8  # Internal database network
    ports:
    - protocol: TCP
      port: 5432
```

### TLS Encryption

Enable TLS for all connections:

**Database connections:**
```yaml
spec:
  properties:
    ssl: true
    sslMode: verify-full
    sslRootCert:
      secretKeyRef:
        name: db-certs
        key: ca.crt
```

**Reaction endpoints:**
```yaml
spec:
  properties:
    endpoint: https://api.example.com
    tls:
      enabled: true
```

### Private Endpoints

Use private endpoints for cloud resources where available:
- Azure Private Link
- AWS PrivateLink
- GCP Private Service Connect

## Data Protection

### Sensitive Data in Queries

Be careful with sensitive data in query results:

```cypher
// Avoid: Returning full PII
MATCH (c:Customer)
WHERE c.status = 'VIP'
RETURN c.name, c.ssn, c.creditCard

// Better: Return only necessary identifiers
MATCH (c:Customer)
WHERE c.status = 'VIP'
RETURN c.id, c.tier
```

### Query Result Filtering

Consider implementing data masking in reactions rather than exposing sensitive data in query results.

### Audit Logging

Enable audit logging to track:
- Configuration changes
- Query modifications
- Access patterns

## Kubernetes Security

### RBAC Configuration

Configure appropriate RBAC for Drasi components:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: drasi-operator
rules:
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get"]
- apiGroups: ["drasi.io"]
  resources: ["sources", "queries", "reactions"]
  verbs: ["get", "list", "watch", "create", "update", "delete"]
```

### Pod Security

Apply pod security standards:
- Run as non-root
- Use read-only file systems where possible
- Drop unnecessary capabilities

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  readOnlyRootFilesystem: true
  capabilities:
    drop:
    - ALL
```

### Image Security

- Use images from trusted registries
- Scan images for vulnerabilities
- Pin image versions (avoid `latest` tag)

## Operational Security

### Access Control

Implement access control for:
- Kubernetes cluster access
- Configuration management
- Monitoring and logging systems

### Change Management

Follow change management practices:
- Review configuration changes
- Test in non-production environments
- Maintain audit trail of changes

### Incident Response

Prepare for security incidents:
- Define escalation procedures
- Document response playbooks
- Practice incident response

## Compliance Considerations

### Data Residency

Consider data residency requirements:
- Deploy Drasi in appropriate regions
- Understand data flow paths
- Document data processing locations

### Retention Policies

Implement appropriate data retention:
- Configure log retention
- Manage query state lifecycle
- Document retention policies

### Regulatory Requirements

Consider relevant regulations:
- GDPR for personal data
- HIPAA for health information
- PCI DSS for payment data

## Security Checklist

Use this checklist when deploying Drasi:

- [ ] Credentials stored in secrets (not config files)
- [ ] TLS enabled for all connections
- [ ] Network policies configured
- [ ] RBAC properly configured
- [ ] Pod security contexts applied
- [ ] Audit logging enabled
- [ ] Sensitive data filtered from query results
- [ ] Access control implemented
- [ ] Monitoring and alerting configured
- [ ] Incident response procedures documented

## Next Steps

- Review [Performance](/patterns/performance/) patterns
- Learn about [Solution Architecture](/patterns/solution-architecture/)
- Explore [Operations](/how-to-guides/operations/) guides
