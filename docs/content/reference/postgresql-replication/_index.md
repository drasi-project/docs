---
type: "docs"
title: "PostgreSQL Replication"
linkTitle: "PostgreSQL Replication"
weight: 50
description: >
    Configuring Replication on PostgreSQL
---

For PostgreSQL to generate the change feed that Drasi needs, you must configure a PostgreSQL database for replication. The following sections describe how to do this for PostgreSQL in a number of hosting environments.

## Self Hosted PostgreSQL
First set the configuration options in postgresql.conf:

```
wal_level = logical
```

The other required settings have default values that are sufficient for a basic setup.

pg_hba.conf needs to be adjusted to allow replication (the values here depend on your actual network configuration and user you want to use for connecting):

```
host     all     repuser     0.0.0.0/0     md5
```

## Azure Database for PostgreSQL
If you are using **Azure Database for PostgreSQL**, you can configure the replication to `LOGICAL` from the Azure portal on the **Replication** page, or you can use the CLI as follows:

```azurecli
az postgres server configuration set --resource-group mygroup --server-name myserver --name azure.replication_support --value logical

az postgres server restart --resource-group mygroup --name myserver
```