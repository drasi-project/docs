---
type: "docs"
title: "Connect to PostgreSQL"
linkTitle: "Connect to PostgreSQL"
weight: 50
no_list: true
description: >
    Learn how to configure a PostgreSQL Source to connect to a PostgreSQL database
---

The PostgreSQL Source enables Drasi connectivity to PostgreSQL databases. It 
calls the PostgreSQL server to retrieve data required to bootstrap Continuous Queries when they are created, and uses the PostgreSQL replication log as the source of database change events to keep the Continuous Queries that subscribe to it perpetually accurate.

{{< figure src="postgresql-source.png" alt="PostgreSQL Source" width="65%" >}}

## Data Model
PostgreSQL is a relational database. The PostgreSQL Source translates the relational data from change events to more closely resemble property graph data change events so that they can be processed by subscribed Continuous Queries. To achieve this, the PostgreSQL Source treats each table row as a graph node, as follows:
- Each change to a table row gets represented as a change to a node with the table columns represented as properties of the node.
- Each node is assigned a unique **id** the is a composite of the **table name** and the row's **primary key**. This **id** is part of the node's metadata, not a property of the node.
- The node is assigned a **label** name the same as the **name of the table** that the row is contained in.

The PostgreSQL Source **does not** interpret foreign keys or joins from the PostgreSQL database as graph relations or edges. Continuous Queries instead rely on their Source Join feature to mimic graph-style relations between nodes based on the values of specified properties. See the [Source Joins](/concepts/continuous-queries/#sources) topic in the [Continuous Queries](/concepts/continuous-queries/) page for details. 

## Requirements
To create and manage Sources using the steps described in this guide, you need the [Drasi CLI](/reference/command-line-interface/) installed on your computer.

The PostgreSQL database you connect to must be running at least PostgreSQL v10 and have `LOGICAL` replication enabled. See the page [Setup PostgreSQL Replication](setup-postgresql-replication) for assistance.

You must configure your PostgreSQL Source with PostgreSQL database credentials that have at least the LOGIN, REPLICATION and CREATE permissions on the PostgreSQL database and SELECT permissions on the set of tables you want the Source to provide access to.
 
## Creating the Source
To create a PostgreSQL Source, execute the `drasi apply` command as follows:

```text
drasi apply -f my-source.yaml -n drasi-namespace
```

The `drasi apply` command is how you create all new Drasi resources (in this case a Source). The `-f` flag specifies that the definition of the new Source is contained in the referenced YAML file `my-source.yaml` and the `-n` flag specifies the Drasi namespace in which to create the Source (Drasi must already be installed in that namespace).

## Source Definitions
The YAML file passed to `drasi apply` can contain one or more Source definitions. Here is an example of a PostgreSQL Source definition:

```yaml {#retail-ops-postgresql-source}
apiVersion: v1
kind: Source
name: retail-ops
spec:
  kind: PostgreSQL
  properties:
    host: retail.postgres.database.azure.com
    port: 5432
    user: postgres@retail-operations
    password: secret-password
    database: retail-operations
    ssl: true
    tables:
      - public.Customer
      - public.Sale
```

In this definition: 
- the **apiVersion** must be **v1**.
- the **kind** property tells Drasi to create a **Source** resource.
- the **spec.kind** property tells Drasi the kind of Source to create, in this case a **PostgreSQL** Source. 
- the **name** property tells Drasi the identity of the Source and must be unique within the scope of Sources within the target Drasi environment. This **name** is used in Continuous Query definitions to identify which Sources the Continuous Query subscribes to for data. In the above example, the **name** of the Source is **retail-ops**.

This table describes the other settings in the **spec.properties** section of the Source definition:
|Property|Description|
|-|-|
|host|The **host name** of the PostgreSQL database server.|
|port|The **port** number used to communicate with the PostgreSQL database server.|
|user|The **user id** to use for authentication against the PostgreSQL database server.|
|password|The **password** for the user account specified in the **user** property.|
|database|The **name** of the PostgreSQL database.|
|ssl|Whether the PostgreSQL server requires a secure connection, valid values are **true** or **false**.|
|tables| An array of **table names** that the Source should process changes for. Tables must be prefixed with their schema name (**public** in this example).|

The example Source definition above contains plain text values for the **user** and **password** properties. This may be acceptable for its convenience during development or testing but must be avoided if the credentials need to remain secure. Instead of providing plain text values, you can configure them to use a securely stored Kubernetes Secrets as shown in the following alternate definition for the above Source:

```yaml {#retail-ops-postgresql-source-with-secrets}
apiVersion: v1
kind: Source
name: retail-ops
spec:
  kind: PostgreSQL
  properties:
    host: retail.postgres.database.azure.com
    port: 5432
    user:
      kind: Secret
      name: pg-creds
      key: user
    password:
      kind: Secret
      name: pg-creds
      key: password
    database: retail-operations
    ssl: true
    tables:
      - public.Customer
      - public.Sale
```

To create the Kubernetes Secrets used above, you would run the command:

```kubectl
kubectl create secret generic pg-creds \
  --from-literal=user=postgres@retail-operations \
  --from-literal=password=secret-password
```

## Inspecting the Source
Currently, a Source must be fully functional with an `available` status of `true` before Continuous Queries can subscribe to it. If you create Continuous Queries that use a Source before the Source is `available` they will either fail, or be in an unknown state.

You can check the status of the Source using the `drasi list` command:

```text
drasi list source
```

Or including a target namespace:

```text
drasi list source -n drasi-namespace
```

This will return a simple list of all Sources in the default (or specified) namespace and their overall status. For example:

```
       ID      | AVAILABLE
---------------+------------
  retail-ops   | true
  physical-ops | false
```

In this case, the `retail-ops` Source is ready for use (AVAILABLE = true), but the `physical-ops` Source is not yet ready (AVAILABLE = false).

Given how important it is for Sources to be ready before you start Continuous Queries that use them, the Drasi CLI supports the ability to wait for a Source to be ready using the [drasi wait](/reference/command-line-interface#drasi-wait) command:

```text
drasi wait source physical-ops -t 120
```

The `drasi wait` command waits for one or more resources to become operational, or for a timeout interval `-t` to be reached (in seconds).

If an error has occurred during the creation or operation of a Source, the `AVAILABLE` column will contain the error text.

For more details about a Source you can use the [drasi describe](/reference/command-line-interface#drasi-describe) command:

```text
drasi describe source retail-ops
```

This will return the full definition used to create the Source along with more detailed status information.

## Modifying the Source
Currently, Drasi does not support the modification of existing Sources. You must [Delete the Source](#deleting-the-source), make changes to the Source definition file, and [Create the Source](#creating-the-source) again. This process will leave all Continuous Queries that subscribe to that Source in an unknown state, so they should also be deleted and re-created once the updated Source is ready.

## Deleting the Source
To delete a Source you use the `drasi delete` command. There are two ways to do this. 

Firstly, you can specify the type of resource (Source) and its name, for example:

```text
drasi delete source retail-ops
```

Secondly, you can refer to the YAML file(s) that contain the definitions used to create the Source(s):

```text
drasi delete -f my-source.yaml <file2.yaml> <file3.yaml> <...>
```

This is a convenience, especially if a single YAML file contains multiple Source definitions. 

If the Source is not in the default Drasi namespace, you should specific the target namespace using the `-n` flag as usual:

```text
drasi delete -f my-source.yaml -n drasi-namespace
```

Drasi does not currently verify or protect dependencies between Sources and the Continuous Queries that subscribe to them. It is possible to delete a Source that is actively used by one or more Continuous Queries. This will break the Continuous Queries or leave them in an unknown state.
