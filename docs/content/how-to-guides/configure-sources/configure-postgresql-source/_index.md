---
type: "docs"
title: "Configure a PostgreSQL Source"
linkTitle: "Configure a PostgreSQL Source"
weight: 50
description: >
    Learn how to configure PostgreSQL Sources
---

The PostgreSQL Source enables Drasi connectivity to PostgreSQL databases. It uses the PostgreSQL replication log as the source of database change events, and calls the SQL API to retrieve data required to bootstrap Continuous Queries at creation.

#### Source Requirements

Your PostgreSQL database must be running at least version 10 and have `LOGICAL` replication enabled. See the notes on [configuring PostgreSQL replication](/reference/postgresql-replication) for assistance.

You also need a PostgreSQL user that has at least the LOGIN, REPLICATION and CREATE permissions on the database and SELECT permissions on the tables you are interested in.

#### Configuration Settings
The following is an example of a full resource definition for a PostgreSQL Source using Kubernetes Secrets to securely store database credentials:

```bash
kubectl create secret generic pg-creds --from-literal=password=my-password
```

```yaml
apiVersion: v1
kind: Source
name: phys-ops
spec:
  kind: PostgreSQL
  properties:
    host: reactive-graph.postgres.database.azure.com
    port: 5432
    user: postgres@reactive-graph
    password:
      kind: Secret
      name: pg-creds
      key: password
    database: phys-ops
    ssl: true
    tables:
      - public.Vehicle
      - public.Zone
```

In the Source resource definition:
- **apiVersion** must be **v1**
- **kind** must be **Source**
- **name** is the **id** of the Source and must be unique. This id is used in a Continuous Query definitions to identify which Sources the Continuous Query subscribes to for change events.
- **spec.kind** must be **PostgreSQL**

The following table describes the PostgrSQL specific properties:
|Property|Description|
|-|-|
|host|The **host name** of the PostgreSQL database server.|
|port|The **port** number used to communicate with the PostgreSQL database server.|
|user|The **user id** to use for authentication against the PostgreSQL database server.|
|password|The **password** for the user account specified in the **user** property.|
|database|The name of the PostgreSQL database.|
|ssl|Does the server require a secure connection, valid values are "true" or "false".|
|tables| An array of table names that the Source should process changes for. Tables must be prefixed with their schema name.|

#### Data Transformation
The PostgreSQL Source translates the relational data from change events to more closely resemble property graph data change events so that they can be processed by subscribed Continuous Queries. To achieve this, the PostgreSQL Source represents table rows as graph Nodes, as follows:
- Each row gets represented as a Node with the table columns as properties of the Node.
- The Node is assigned an id the is a composite of the table id and the row's primary key. This is Node metadata, not a property of the Node.
- The name of the table is assigned as a **Label** of the Node.

The PostgreSQL Source **does not** interpret foreign keys or joins from the relational source, instead relying on the Source Join feature provided by Continuous Queries to mimic graph-style Relations between Nodes based on the values of specified properties. See the [Source Joins](/solution-developer/components/continuous-queries/#source-subscriptions) topic in the [Continuous Queries](/solution-developer/components/continuous-queries) section for details. 


