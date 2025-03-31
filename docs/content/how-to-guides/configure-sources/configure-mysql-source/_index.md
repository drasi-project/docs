---
type: "docs"
title: "Connect to MySQL"
linkTitle: "Connect to MySQL"
weight: 60
description: >
    Learn how to configure a MySQL Source to connect to a MySQL database
---

The MySQL Source enables Drasi connectivity to MySQL databases.

{{< figure src="mysql-source.png" alt="MySQL Source" width="65%" >}}

## Data Model
The MySQL Source translates the relational data from change events to more closely resemble property graph data change events so that they can be processed by subscribed Continuous Queries. To achieve this, it represents table rows as graph Nodes, as follows:
- Each row gets represented as a Node with the table columns as properties of the Node.
- The Node is assigned an id that is a composite of the table name and the row's primary key. This is Node metadata, not a property of the Node.
- The name of the table is assigned as a **Label** of the Node.

The MySQL Source **does not** interpret foreign keys or joins from the relational source, instead relying on the Source Join feature provided by Continuous Queries to mimic graph-style Relations between Nodes based on the values of specified properties. See the [Source Joins](/concepts/continuous-queries/#sources) topic in the [Continuous Queries](/concepts/continuous-queries) section for details.

## Requirements
To create and manage Sources using the steps described in this guide, you need the [Drasi CLI](/reference/command-line-interface/) installed on your computer.

The MySQL database you connect to must have binary logging enabled.

You must configure your MySQL Source with MySQL database credentials that have the necessary permissions to access the database and tables you want the Source to provide access to. Specifically, the user needs at least `SELECT` and `REPLICATION SLAVE` and `REPLICATION CLIENT` privileges.

See the page [Setup MySQL for Drasi](setup-mysql) for assistance.

## Creating the Source
To create a MySQL Source, execute the `drasi apply` command as follows:

```sh
drasi apply -f my-source.yaml
```

The `drasi apply` command is how you create all new Drasi resources (in this case a Source).
The `-f` flag specifies that the definition of the new Source is contained in the referenced YAML file `my-source.yaml`.

## Source Definitions
The YAML file passed to `drasi apply` can contain one or more Source definitions. Here is an example of a MySQL Source definition:

```yaml {#retail-ops-mysql-source}
apiVersion: v1
kind: Source
name: retail-ops
spec:
  kind: MySQL
  properties:
    host: mysql.default.svc.cluster.local
    port: 3306
    user: mysqluser
    password: secret-password
    database: retail-operations
    tables:
      - retail-operations.Customer
      - retail-operations.Sale
```

In this definition: 
- the **apiVersion** must be **v1**.
- the **kind** property tells Drasi to create a **Source** resource.
- the **spec.kind** property tells Drasi the kind of Source to create, in this case a **MySQL** Source. 
- the **name** property tells Drasi the identity of the Source and must be unique within the scope of Sources within the target Drasi environment. This **name** is used in Continuous Query definitions to identify which Sources the Continuous Query subscribes to for data. In the above example, the **name** of the Source is **retail-ops**.

This table describes the other settings in the **spec.properties** section of the Source definition:

|Property|Description|
|-|-|
|host|The **host name** of the MySQL database server.|
|port|The **port** number used to communicate with the MySQL database server.|
|user|The **user id** to use for authentication against the MySQL database server.|
|password|The **password** for the user account specified in the **user** property.|
|database|The **name** of the MySQL database.|
|tables| An array of **table names** that the Source should process changes for. |

The example Source definition above contains plain text values for the **user** and **password** properties. This may be acceptable for its convenience during development or testing but must be avoided if the credentials need to remain secure. Instead of providing plain text values, you can configure them to use a securely stored Kubernetes Secrets as shown in the following alternate definition for the above Source:

```yaml {#retail-ops-mysql-source-with-secrets}
apiVersion: v1
kind: Source
name: retail-ops
spec:
  kind: MySQL
  properties:
    host: retail.mysql.database.azure.com
    port: 3306
    user:
      kind: Secret
      name: mysql-creds
      key: user
    password:
      kind: Secret
      name: mysql-creds
      key: password
    database: retail-operations
    tables:
      - retail-operations.Customer
      - retail-operations.Sale
```

To create the Kubernetes Secrets used above, you would run the command:

```kubectl
kubectl create secret generic mysql-creds \
  --from-literal=user=mysqluser \
  --from-literal=password=secret-password
```

## Inspecting the Source
Currently, a Source must be fully functional with an `available` status of `true` before Continuous Queries can subscribe to it. If you create Continuous Queries that use a Source before the Source is `available` they will either fail, or be in an unknown state.

You can check the status of the Source using the `drasi list` command:

```sh
drasi list source
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

```sh
drasi wait source physical-ops -t 120
```

The `drasi wait` command waits for one or more resources to become operational, or for a timeout interval `-t` to be reached (in seconds).

If an error has occurred during the creation or operation of a Source, the `AVAILABLE` column will contain the error text.

For more details about a Source you can use the [drasi describe](/reference/command-line-interface#drasi-describe) command:

```sh
drasi describe source retail-ops
```

This will return the full definition used to create the Source along with more detailed status information.

## Modifying the Source
To modify the Source, you can simply use the `drasi apply` command again with the same source name that you used before.

## Deleting the Source
To delete a Source you use the `drasi delete` command. There are two ways to do this. 

Firstly, you can specify the type of resource (Source) and its name, for example:

```sh
drasi delete source retail-ops
```

Secondly, you can refer to the YAML file(s) that contain the definitions used to create the Source(s):

```sh
drasi delete -f my-source.yaml <file2.yaml> <file3.yaml> <...>
```

This is a convenience, especially if a single YAML file contains multiple Source definitions. 

If the Source is not in the default Drasi namespace, you should specific the target namespace using the `-n` flag as usual:

```sh
drasi delete -f my-source.yaml -n drasi-namespace
```

**Note:**
Drasi does not currently verify or protect dependencies between Sources and the Continuous Queries that subscribe to them.
It is possible to delete a Source that is actively used by one or more Continuous Queries.
This will break the Continuous Queries or leave them in an unknown state.