---
type: "docs"
title: "Setup MySQL"
linkTitle: "Setup MySQL"
weight: 30
toc_hide: true
description: >
    Setup and Configure MySQL for Drasi
related:
  howto:
    - title: "Connect to MySQL"
      url: "/drasi-kubernetes/how-to-guides/configure-sources/configure-mysql-source/"
  concepts:
    - title: "Sources"
      url: "/concepts/sources/"
  reference:
    - title: "CLI Reference"
      url: "/drasi-kubernetes/reference/command-line-interface/"
---

This page describes how to configure your MySQL database to work with the Drasi MySQL {{< term "Source" "source" >}}. This is a summary of the Debezium v2.7 documentation originally published under the Apache 2.0 License. The original documentation can be found at [debezium.io](https://debezium.io/documentation//reference/2.7/connectors/mysql.html#setting-up-mysql). This documentation is licensed under the [Apache 2.0 License](http://www.apache.org/licenses/LICENSE-2.0).

## Overview

The MySQL source is built upon the Debezium MySQL connector, which uses MySQL's binary log (binlog) to capture changes. The binlog records transaction updates in a way that enables replicas to propagate those changes. For the connector to function properly, you need to enable binary logging and configure several other MySQL settings. This is a form of {{< term "Change Data Capture" >}}.

## Creating a User

A Debezium MySQL connector requires a MySQL user account with appropriate permissions on all databases for which it captures changes.

### Prerequisites
- A MySQL server
- Basic knowledge of SQL commands

### Procedure

1. Create the MySQL user:

```sql
CREATE USER 'user'@'localhost' IDENTIFIED BY 'password';
```

2. Grant the replication permissions to the user:

```sql
GRANT REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'user'@'localhost';
```

3. Grant `SELECT` permission to user on the databases you want Drasi to access.

```sql
GRANT SELECT ON <your_database_name>.* TO 'user'@'localhost';
```

4. Finalize the user's permissions:

```sql
FLUSH PRIVILEGES;
```

### Required Permissions Explained

| Permission | Description |
|------------|-------------|
| SELECT | Enables the connector to select rows from tables in databases. Used only when performing a snapshot. |
| REPLICATION SLAVE | Enables the connector to connect to and read the MySQL server binlog. |
| REPLICATION CLIENT | Enables the connector to use statements like SHOW MASTER STATUS, SHOW SLAVE STATUS, and SHOW BINARY LOGS. Always required. |

## Enabling the Binary Log

You must enable binary logging for MySQL replication. The binary logs record transaction updates for replication purposes.

### Prerequisites
- A MySQL server
- Appropriate MySQL user privileges

### Procedure

1. Check whether the log-bin option is enabled:

For MySQL 5.x:
```sql
SELECT variable_value as "BINARY LOGGING STATUS (log-bin) ::" 
FROM information_schema.global_variables WHERE variable_name='log_bin';
```

For MySQL 8.x:
```sql
SELECT variable_value as "BINARY LOGGING STATUS (log-bin) ::" 
FROM performance_schema.global_variables WHERE variable_name='log_bin';
```

2. If the binlog is OFF, add the following properties to the configuration file for your MySQL server:

```
server-id = 223344
log_bin = mysql-bin
binlog_format = ROW
binlog_row_image = FULL
binlog_expire_logs_seconds = 864000
```

3. After making these changes, **restart your MySQL server** and confirm the binlog status again using the same query as in step 1.

**Note:** If you run MySQL on Amazon RDS, you must enable automated backups for your database instance for binary logging to occur.

### Binlog Configuration Properties Explained

| Property | Description |
|----------|-------------|
| server-id | Must be unique for each server and replication client in the MySQL cluster. |
| log_bin | The base name of the sequence of binlog files. |
| binlog_format | Must be set to ROW or row. |
| binlog_row_image | Must be set to FULL or full. |
| binlog_expire_logs_seconds | Number of seconds for automatic binlog file removal. Default is 2592000 (30 days). |

## Enabling GTIDs (Optional)

Global transaction identifiers (GTIDs) uniquely identify transactions that occur on a server within a cluster. Though not required for a Debezium MySQL connector, using GTIDs simplifies replication and enables you to more easily confirm if primary and replica servers are consistent.

### Prerequisites
- A MySQL server (version 5.6.5 or later)
- Basic knowledge of SQL commands
- Access to the MySQL configuration file

### Procedure

1. Enable gtid_mode:

```sql
SET GLOBAL gtid_mode=ON;
```

2. Enable enforce_gtid_consistency:

```sql
SET GLOBAL enforce_gtid_consistency=ON;
```

3. Confirm the changes:

```sql
SHOW GLOBAL VARIABLES LIKE '%GTID%';
```

The result should show:
```
+--------------------------+-------+
| Variable_name            | Value |
+--------------------------+-------+
| enforce_gtid_consistency | ON    |
| gtid_mode                | ON    |
+--------------------------+-------+
```

**Note:** For permanent configuration, add these settings to your MySQL configuration file:
```
gtid_mode=ON
enforce_gtid_consistency=ON
```