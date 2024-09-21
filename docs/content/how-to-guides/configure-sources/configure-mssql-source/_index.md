---
type: "docs"
title: "Configure a MS SQL Source"
linkTitle: "Configure a MS SQL Source"
weight: 40
description: >
    Learn how to configure MS SQL Sources
---

The SQLServer Source enables Drasi connectivity to Microsoft SQL Server databases.

#### Source Requirements

Change data capture must be enabled on the database and each table you wish to observe.  See the documentation on [configuring SQL Server for CDC](/reference/setup-mssql).

{{% alert title="Note" color="warning" %}}
If the schema of your tables change after you have enabled CDC for them, you will need to refresh the capture tables.  Please see the [Debezium documentation](https://debezium.io/documentation/reference/stable/connectors/sqlserver.html#sqlserver-schema-evolution) on this issue.
{{% /alert %}}

#### Configuration Settings
The following is an example of a full resource definition for a SQLServer Source using Kubernetes Secrets to securely store database credentials:

```bash
kubectl create secret generic sql-creds --from-literal=password=my-password
```

```yaml
apiVersion: v1
kind: Source
name: phys-ops
spec:
  kind: SQLServer
  properties:
    host: drasi-sql.database.windows.net
    port: 1433
    user: drasi-user
    password:
      kind: Secret
      name: sql-creds
      key: password
    database: phys-ops
    encrypt: true
    tables:
      - dbo.Vehicle
      - dbo.Zone
```

In the Source resource definition:
- **apiVersion** must be **v1**
- **kind** must be **Source**
- **name** is the **id** of the Source and must be unique. This id is used in a Continuous Query definitions to identify which Sources the Continuous Query subscribes to for change events.
- **spec.kind** must be **SQLServer**

The following table describes the SQL Server specific properties:
|Property|Description|
|-|-|
|host|The **host name** of the database server.|
|port|The **port** number used to communicate with the database server.|
|user|The **user id** to use for authentication against the server.|
|password|The **password** for the user account specified in the **user** property.|
|database|The name of the SQL database.|
|encrypt|Does the server require a secure connection, valid values are "true" or "false".|
|tables| An array of table names that the source should process changes for. Tables must be prefixed with their schema name.|

#### Data Transformation
The SQL Source translates the relational data from change events to more closely resemble property graph data change events so that they can be processed by subscribed Continuous Queries. To achieve this, it represents table rows as graph Nodes, as follows:
- Each row gets represented as a Node with the table columns as properties of the Node.
- The Node is assigned an id the is a composite of the table id and the row's primary key. This is Node metadata, not a property of the Node.
- The name of the table is assigned as a **Label** of the Node.

The SQL Server Source **does not** interpret foreign keys or joins from the relational source, instead relying on the Source Join feature provided by Continuous Queries to mimic graph-style Relations between Nodes based on the values of specified properties. See the [Source Joins](/solution-developer/components/continuous-queries/#source-subscriptions) topic in the [Continuous Queries](/solution-developer/components/continuous-queries) section for details. 

