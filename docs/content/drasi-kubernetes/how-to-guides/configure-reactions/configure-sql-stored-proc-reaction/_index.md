---
type: "docs"
title: "Configure a Stored Procedure Reaction"
linkTitle: "Configure a Stored Procedure Reaction"
weight: 90
description: >
    Learn how to configure a Stored Procedure Reaction
related:
  tutorials:
    - title: "Getting Started with Drasi"
      url: "/drasi-kubernetes/getting-started/"
  concepts:
    - title: "Reactions"
      url: "/concepts/reactions/"
  howto:
    - title: "Write Continuous Queries"
      url: "/drasi-kubernetes/how-to-guides/write-continuous-queries/"
  reference:
    - title: "CLI Reference"
      url: "/drasi-kubernetes/reference/command-line-interface/"
---

The Drasi Stored Procedure (StoredProc) {{< term "Reaction" >}} allows you invoke pre-created Stored Procedures in your SQL databases based on the results from the {{< term "Continuous Query" >}}. You can designate a specific Stored Procedure for each type of query result (Added, Updated, or Deleted) and use the values from these results as parameters for the Stored Procedure being called.



## Requirements
On the computer from where you will create the Drasi StoredProc Reaction, you need to install the following software:
- [Drasi CLI](/reference/command-line-interface/) 

## Supported Database Clients
The StoredProc Reaction uses [knex](https://knexjs.org/) underneath the hood to call the Stored Procedures. You can specify the type of database that you wish to connect to in the `databaseClient` field in your Reaction YAML file. Currently, we support the following types:
- PostgreSQL (pg)
- MySQL (mysql)
- Microsoft SQL (mssql)


## Creating the Reaction
To create a Reaction, execute the `drasi apply` command as follows:

```text
drasi apply -f my-reaction.yaml -n drasi-namespace
```

The `drasi apply` command is how you create all new Drasi resources (in this case a Reaction). The `-f` flag specifies that the definition of the new Reaction is contained in the referenced YAML file `my-reaction.yaml` and the `-n` flag specifies the Drasi namespace in which to create the Reaction (Drasi must already be installed in that namespace).


## Reaction Definitions
The YAML file passed to `drasi apply` can contain one or more Reaction definitions. Here is an example of a Drasi StoredProc Reaction definition:

```yaml {#stored-proc}
apiVersion: v1
kind: Reaction
name: stored-proc
spec:
  kind: StoredProc
  queries:
    hello-world-from:
  properties:
    addedResultCommand: public.added_command(@MessageId, @MessageFrom)
    updatedResultCommand: public.updated_command(@MessageId, @MessageFrom)
    deletedResultCommand: public.deleted_command(@MessageId, @MessageFrom)
    databaseClient: pg
    databaseHostname: postgres.default.svc.cluster.local
    databasePort: 5432
    databaseUser: test
    databaseDbname: hello-world
    databasePassword: test 
    databaseSsl: false
```

In this definition: 
- the **apiVersion** must be **v1**.
- the **kind** property tells Drasi to create a **Reaction** resource.
- the **spec.kind** property tells Drasi the kind of Reaction to create, in this case a **StoredProc** Reaction. 
- the **name** property tells Drasi the identity of the Reaction and must be unique within the scope of Reactions within the target Drasi environment. In the above example, the **name** of the Reaction is **stored-proc**.

This table describes the other settings in the **spec** section of the Reaction definition:
|Property|Description|
|-|-|
|queries|Specifies the set of **names** of the Continuous Queries the Reaction will subscribe to.|
|properties.addedResultCommand|Specifies the Stored Procedure to invoke and its parameters when an **Added** result is received.
|properties.updatedResultCommand|Specifies the Stored Procedure to invoke and its parameters when an **Updated** result is received.
|properties.deletedResultCommand|Specifies the Stored Procedure to invoke and its parameters when a **Deleted** result is received.
|databaseClient|Specifies the type of database where the Stored Procedure lives in. Valid options: pg, mysql, mssql|
|databaseHostname|The host name of the database server|
|databasePort|The port number used to communicate with the database server|
|databaseUser|The user id to use for authentication against the database server|
|databaseDbname|The name of the database|
|databasePassword|The password for the user account specified in the user property|
|databaseSsl|Whether the database server requires a secure connection, valid values are true or false (default is set to false)|

**Note**: When defining the commands, **add** @ before any parameter name to use a query's return value as the stored procedure parameter.

#### Secret Configuration
It is best practice to store private credentials for your database in a Kubernetes secret, which can be created using `kubectl`. The example below creates a Secret with the name `storedproc-creds`, containing one key called `password` in the `drasi-system` namespace.

```bash
kubectl create secret generic storedproc-creds --from-literal=password=<db-password> -n drasi-system
```

You can then reference the secret when you create a StoredProc Reaction as follows:
```yaml {#stored-proc-with-secret}
apiVersion: v1
kind: Reaction
name: stored-proc
spec:
  kind: StoredProc
  queries:
    hello-world-from:
  properties:
    addedResultCommand: public.added_command(@MessageId, @MessageFrom)
    updatedResultCommand: public.updated_command(@MessageId, @MessageFrom)
    deletedResultCommand: public.deleted_command(@MessageId, @MessageFrom)
    databaseClient: pg
    databaseHostname: postgres.default.svc.cluster.local
    databasePort: 5432
    databaseUser: test
    databaseDbname: hello-world
    databasePassword: 
      kind: Secret
      name: storedproc-creds
      key: password
    databaseSsl: false
```


## Inspecting the Reaction
As soon as the Reaction is created it will start running, subscribing to the specified list of Continuous Queries and processing changes to the Continuous Query results.

You can check the status of the Reaction using the `drasi list` command:

```text
drasi list reaction
```

Or including a target namespace:

```text
drasi list reaction -n drasi-namespace
```

This will return a simple list of all Reactions in the default (or specified) namespace and their overall status. For example:

```
        ID          | AVAILABLE
--------------------+------------
    stored-proc     | true
```

If an error has occurred during the creation or operation of a Reaction, the `AVAILABLE` column will contain the error text instead of `true` or `false`.

For more details about the Reaction you can use the [drasi describe](/reference/command-line-interface#drasi-describe) command:

```text
drasi describe reaction stored-proc
```

This will return the full definition used to create the Reaction along with more detailed status information.


## Modifying the Reaction
If you want to modify an existing reaction, you can use the `drasi apply` command to apply the updated YAML file. Ensure that the name of the reaction remains consistent.

## Deleting the Reaction
To delete a Reaction you use the `drasi delete` command. There are two ways to do this. 

Firstly, you can specify the type of resource (Reaction) and its name, for example:

```text
drasi delete reaction stored-proc
```

Secondly, you can refer to the YAML file(s) that contain the definitions used to create the Reaction(s):

```text
drasi delete -f my-reaction.yaml <file2.yaml> <file3.yaml> <...>
```

This is a convenience, especially if a single YAML file contains multiple Reaction definitions. 

If the Reaction is not in the default Drasi namespace, you should specific the target namespace using the `-n` flag as usual:

```text
drasi delete -f my-reaction.yaml -n drasi-namespace
```