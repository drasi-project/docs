---
type: "docs"
title: "Maintenance"
linkTitle: "Maintenance"
weight: 50
description: >
    Best practices for upgrades, backups, and ongoing maintenance
---

Regular maintenance keeps your Drasi deployment healthy and secure. This guide covers upgrade procedures, backup strategies, and routine maintenance tasks.

## Upgrade Procedures

### Planning an Upgrade

Before upgrading:

1. **Review release notes** for breaking changes
2. **Test in non-production** environment first
3. **Schedule maintenance window** if needed
4. **Notify stakeholders** of potential disruption
5. **Prepare rollback plan**

### Upgrading Drasi

Use the Drasi CLI to upgrade:

```bash
# Check current version
drasi version

# Upgrade to latest version
drasi upgrade

# Upgrade to specific version
drasi upgrade --version v0.2.0
```

### Rolling Upgrades

For minimal disruption, Drasi supports rolling upgrades:

1. Components upgrade one at a time
2. Health checks ensure new pods are ready
3. Traffic shifts gradually to new versions

Monitor during upgrade:
```bash
kubectl get pods -n drasi-system -w
```

### Rollback

If issues occur after upgrade:

```bash
# Rollback to previous version
drasi rollback

# Or reinstall specific version
drasi uninstall
drasi init --version v0.1.0
```

## Backup and Recovery

### What to Backup

Critical data to preserve:

| Component | Data | Backup Method |
|-----------|------|---------------|
| Sources | Configuration | `kubectl get sources -o yaml` |
| Queries | Definitions | `kubectl get continuousqueries -o yaml` |
| Reactions | Configuration | `kubectl get reactions -o yaml` |
| Secrets | Credentials | `kubectl get secrets -o yaml` |

### Backup Script

Create a comprehensive backup:

```bash
#!/bin/bash
BACKUP_DIR="drasi-backup-$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# Backup all Drasi resources
kubectl get sources -n drasi-system -o yaml > $BACKUP_DIR/sources.yaml
kubectl get continuousqueries -n drasi-system -o yaml > $BACKUP_DIR/queries.yaml
kubectl get reactions -n drasi-system -o yaml > $BACKUP_DIR/reactions.yaml
kubectl get secrets -n drasi-system -o yaml > $BACKUP_DIR/secrets.yaml
kubectl get configmaps -n drasi-system -o yaml > $BACKUP_DIR/configmaps.yaml

# Archive
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR
echo "Backup saved to $BACKUP_DIR.tar.gz"
```

### Restore Procedure

To restore from backup:

```bash
# Extract backup
tar -xzf drasi-backup-20240115.tar.gz

# Apply resources
kubectl apply -f drasi-backup-20240115/secrets.yaml
kubectl apply -f drasi-backup-20240115/sources.yaml
kubectl apply -f drasi-backup-20240115/queries.yaml
kubectl apply -f drasi-backup-20240115/reactions.yaml
```

## Routine Maintenance

### Daily Tasks

- Review monitoring dashboards for anomalies
- Check alert history for overnight issues
- Verify change processing is current (no lag)

### Weekly Tasks

- Review resource utilization trends
- Check for pending security updates
- Verify backups completed successfully
- Review error logs for patterns

### Monthly Tasks

- Audit access permissions
- Review and update alert thresholds
- Test backup restoration
- Review capacity planning

## Log Management

### Log Retention

Configure log retention to balance storage costs and troubleshooting needs:

```yaml
# For Kubernetes logging
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluent-bit-config
data:
  retention.conf: |
    [OUTPUT]
        Name  es
        Logstash_Prefix drasi
        Logstash_Prefix_Separator -
        Logstash_DateFormat %Y.%m
        # Retain 30 days of logs
```

### Log Aggregation

Aggregate logs from all components for easier analysis:

- Use centralized logging (ELK, Loki, CloudWatch)
- Add structured logging fields
- Create log-based alerts

## Credential Rotation

### Planning Rotation

Create a rotation schedule:

| Credential | Rotation Frequency | Procedure |
|------------|-------------------|-----------|
| Database passwords | 90 days | Update secret, restart source |
| API keys | 90 days | Update secret, restart reaction |
| TLS certificates | Before expiry | Update secret, restart components |

### Rotation Procedure

1. **Create new credential** in external system
2. **Update Kubernetes secret**:
```bash
kubectl create secret generic new-db-creds \
  --from-literal=username=user \
  --from-literal=password=newpassword \
  -n drasi-system
```
3. **Update source/reaction configuration** to reference new secret
4. **Verify connectivity** with new credentials
5. **Delete old credential** after confirmation

## Capacity Planning

### Monitoring Growth

Track these metrics over time:

- Change rate from sources
- Query result volume
- Storage utilization
- Resource consumption

### Planning Ahead

- Review growth trends quarterly
- Plan scaling 2-3 months ahead
- Budget for resource increases
- Test scaling in non-production

## Health Checks

### Manual Health Check

Periodic manual verification:

```bash
# Check all components are running
kubectl get pods -n drasi-system

# Verify sources are connected
kubectl get sources -n drasi-system

# Check queries are running
kubectl get continuousqueries -n drasi-system

# Verify reactions are healthy
kubectl get reactions -n drasi-system
```

### Automated Health Checks

Set up automated health checks:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: drasi-health-check
spec:
  schedule: "*/5 * * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: health-check
            image: bitnami/kubectl
            command:
            - /bin/sh
            - -c
            - |
              if kubectl get pods -n drasi-system | grep -v Running; then
                echo "ALERT: Some pods are not running"
                # Send alert
              fi
          restartPolicy: OnFailure
```

## Documentation

### Maintaining Runbooks

Keep runbooks updated with:

- Current configuration
- Common issues and resolutions
- Contact information
- Escalation procedures

### Change Documentation

Document all changes:

- What changed
- Why it changed
- Who made the change
- Rollback procedure

## Next Steps

- Set up [Monitoring](/how-to-guides/operations/monitoring/)
- Configure [Scaling](/how-to-guides/operations/scaling/) for growth
- Review [Security patterns](/patterns/security/)
