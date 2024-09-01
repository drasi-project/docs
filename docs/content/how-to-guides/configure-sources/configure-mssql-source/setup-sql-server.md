---
type: "docs"
title: "Setup SQL Server"
linkTitle: "Setup SQL Server"
weight: 50
description: >
    Setup and Configure SQL Server for Drasi
---

This page describes how to configure your SQL Server database to work with the Drasi SQL Server source.  This is a summary of the Debezium documentation originally published under the Apache 2.0 License. The original documentation can be found at [debezium.io](https://debezium.io/documentation/reference/stable/connectors/sqlserver.html#setting-up-sqlserver). This documentation is licensed under the [Apache 2.0 License](http://www.apache.org/licenses/LICENSE-2.0).

## Overview

The SQL Server source is built upon the Debezium SQL Server connector, which is based on the change data capture feature that is available in SQL Server 2016 Service Pack 1 (SP1) and later Standard edition or Enterprise edition.

To enable the Debezium SQL Server connector to capture change event records for database operations, you must first enable change data capture on the SQL Server database. CDC must be enabled on both the database and on each table that you want to capture. After you set up CDC on the source database, the connector can capture row-level INSERT, UPDATE, and DELETE operations that occur in the database.

### Enabling CDC on the SQL Server database

Before you can enable CDC for a table, you must enable it for the SQL Server database. A SQL Server administrator enables CDC by running a system stored procedure.

#### Prerequisites
- You are a member of the sysadmin fixed server role for the SQL Server.
- You are a db_owner of the database.
- The SQL Server Agent is running.


#### Procedure 

Run the stored procedure sys.sp_cdc_enable_db to enable the database for CDC.

After the database is enabled for CDC, a schema with the name cdc is created, along with a CDC user, metadata tables, and other system objects.

The following example shows how to enable CDC for the database MyDB:

```sql
USE MyDB
GO
EXEC sys.sp_cdc_enable_db
GO
```

### Enabling CDC on a SQL Server table
A SQL Server administrator must enable change data capture on the source tables that you want to Debezium to capture. The database must already be enabled for CDC. To enable CDC on a table, a SQL Server administrator runs the stored procedure sys.sp_cdc_enable_table for the table. SQL Server CDC must be enabled for every table that you want to capture.

#### Prerequisites
- CDC is enabled on the SQL Server database.
- The SQL Server Agent is running.
- You are a member of the db_owner fixed database role for the database.

Run the stored procedure `sys.sp_cdc_enable_table`.

The following example shows how to enable CDC for the table MyTable:

```sql
USE MyDB
GO

EXEC sys.sp_cdc_enable_table
@source_schema = N'dbo',
@source_name   = N'MyTable',
@role_name     = N'MyRole',
@filegroup_name = N'MyDB_CT',  
@supports_net_changes = 0
GO
```

`source_name`:
Specifies the name of the table that you want to capture.

`role_name`:
Specifies a role MyRole to which you can add users to whom you want to grant SELECT permission on the captured columns of the source table. Users in the sysadmin or db_owner role also have access to the specified change tables. Set the value of @role_name to NULL, to allow only members in the sysadmin or db_owner to have full access to captured information.

`filegroup_name`:
Specifies the filegroup where SQL Server places the change table for the captured table. The named filegroup must already exist. It is best not to locate change tables in the same filegroup that you use for source tables. For testing purposes this can be set to NULL.

### Verifying that the user has access to the CDC table
A SQL Server administrator can run a system stored procedure to query a database or table to retrieve its CDC configuration information. The stored procedures can be run by using SQL Server Management Studio, or by using Transact-SQL.

Run the sys.sp_cdc_help_change_data_capture stored procedure to query the table.

Queries should not return empty results.

The following example runs the stored procedure sys.sp_cdc_help_change_data_capture on the database MyDB:

```sql
USE MyDB;
GO
EXEC sys.sp_cdc_help_change_data_capture
GO
```
The query returns configuration information for each table in the database that is enabled for CDC and that contains change data that the caller is authorized to access. If the result is empty, verify that the user has privileges to access both the capture instance and the CDC tables.

