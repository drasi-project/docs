---
type: "docs"
title: "Setup PostgreSQL Replication"
linkTitle: "Setup PostgreSQL Replication"
weight: 20
toc_hide: true
description: >
    Learn how to configure PostgreSQL to work as a Drasi Source
---

This page describes how to configure your PostgreSQL database so it will work with the PostgreSQL Source.  This is a summary of the Debezium documentation originally published under the Apache 2.0 License. The original documentation can be found at [debezium.io](https://debezium.io/documentation/reference/stable/connectors/postgresql.html#setting-up-postgresql). This documentation is licensed under the [Apache 2.0 License](http://www.apache.org/licenses/LICENSE-2.0).

## Overview
The PostgreSQL Source is built upon the Debezium PostgreSQL connector, which relies on the replication functionality of PostgreSQL to achieve change data capture.

## PostgreSQL in the Cloud
### PostgreSQL on Amazon RDS
Set the instance parameter `rds.logical_replication` to 1.

Verify that the `wal_level` parameter is set to `logical` by running the query `SHOW wal_level` as the database RDS master user. This might not be the case in multi-zone replication setups. You cannot set this option manually. It is automatically changed when the rds.logical_replication parameter is set to 1. If the wal_level is not set to logical after you make the preceding change, it is probably because the instance has to be restarted after the parameter group change. Restarts occur during your maintenance window, or you can initiate a restart manually.

Initiate logical replication from an AWS account that has the `rds_replication` role. The role grants permissions to manage logical slots and to stream data using logical slots. By default, only the master user account on AWS has the `rds_replication` role on Amazon RDS. To enable a user account other than the master account to initiate logical replication, you must grant the account the `rds_replication` role. For example, `grant rds_replication to <my_user>`. You must have superuser access to grant the rds_replication role to a user. To enable accounts other than the master account to create an initial snapshot, you must grant SELECT permission to the accounts on the tables to be captured. For more information about security for PostgreSQL logical replication, see the PostgreSQL documentation.

### PostgreSQL on Azure
Set the Azure replication support to logical. You can use the Azure CLI or the Azure Portal to configure this. For example, to use the Azure CLI, here are the az postgres server commands that you need to execute:

```sh
az postgres server configuration set --resource-group mygroup --server-name myserver --name azure.replication_support --value logical

az postgres server restart --resource-group mygroup --name myserver
```

## Configuring the PostgreSQL server

Add the following to the `postgresql.conf` file:

```
# REPLICATION
wal_level = logical             
```
Depending on your requirements, you may have to set other PostgreSQL streaming replication parameters when using Debezium. Examples include max_wal_senders and max_replication_slots for increasing the number of connectors that can access the sending server concurrently, and wal_keep_size for limiting the maximum WAL size which a replication slot will retain. For more information about configuring streaming replication, see the PostgreSQL documentation.

Reading and understanding PostgreSQL documentation about the mechanics and configuration of the PostgreSQL write-ahead log is strongly recommended.

### Setting up permissions
Setting up a PostgreSQL server to run a Debezium connector requires a database user that can perform replications. Replication can be performed only by a database user that has appropriate permissions and only for a configured number of hosts.

Although, by default, superusers have the necessary `REPLICATION` and `LOGIN` roles, as mentioned in Security, it is best not to provide the Debezium replication user with elevated privileges. Instead, create a Debezium user that has the minimum required privileges.

#### Prerequisites
PostgreSQL administrative permissions.

#### Procedure
To provide a user with replication permissions, define a PostgreSQL role that has at least the `REPLICATION` and `LOGIN` permissions, and then grant that role to the user. For example:

```sql
CREATE ROLE <name> REPLICATION LOGIN;
```

Debezium streams change events for PostgreSQL source tables from publications that are created for the tables. Publications contain a filtered set of change events that are generated from one or more tables. The data in each publication is filtered based on the publication specification. The specification can be created by the PostgreSQL database administrator or by the Debezium connector. To permit the Debezium PostgreSQL connector to create publications and specify the data to replicate to them, the connector must operate with specific privileges in the database:

- Replication privileges in the database to add the table to a publication.
- CREATE privileges on the database to add publications.
- SELECT privileges on the tables to copy the initial table data. Table owners automatically have SELECT permission for the table.

To add tables to a publication, the user must be an owner of the table. But because the source table already exists, you need a mechanism to share ownership with the original owner. To enable shared ownership, you create a PostgreSQL replication group, and then add the existing table owner and the replication user to the group.

#### Procedure
Create a replication group.

```sql
CREATE ROLE <replication_group>;
```
Add the original owner of the table to the group.

```sql
GRANT REPLICATION_GROUP TO <original_owner>;
```
Add the Debezium replication user to the group.

```sql
GRANT REPLICATION_GROUP TO <replication_user>;
```
Transfer ownership of the table to <replication_group>.

```sql
ALTER TABLE <table_name> OWNER TO REPLICATION_GROUP;
```

### Configuring PostgreSQL to allow replication with the Debezium connector host
To enable Debezium to replicate PostgreSQL data, you must configure the database to permit replication with the host that runs the PostgreSQL connector. To specify the clients that are permitted to replicate with the database, add entries to the PostgreSQL host-based authentication file, `pg_hba.conf`. For more information about the pg_hba.conf file, see the PostgreSQL documentation.

#### Procedure
Add entries to the `pg_hba.conf` file to specify the Debezium connector hosts that can replicate with the database host. For example,

pg_hba.conf file example:
```
local   replication     <youruser>                          trust   
host    replication     <youruser>  127.0.0.1/32            trust   
host    replication     <youruser>  ::1/128                 trust   
```

For more information about network masks, see the PostgreSQL documentation.

### Supported PostgreSQL topologies
The PostgreSQL connector can be used with a standalone PostgreSQL server or with a cluster of PostgreSQL servers.

As mentioned in the beginning, PostgreSQL (for all versions ⇐ 12) supports logical replication slots on only primary servers. This means that a replica in a PostgreSQL cluster cannot be configured for logical replication, and consequently that the Debezium PostgreSQL connector can connect and communicate with only the primary server. Should this server fail, the connector stops. When the cluster is repaired, if the original primary server is once again promoted to primary, you can restart the connector. However, if a different PostgreSQL server with the plug-in and proper configuration is promoted to primary, you must change the connector configuration to point to the new primary server and then you can restart the connector.