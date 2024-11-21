---
type: "docs"
title: "Configure a Gremlin Command Reaction"
linkTitle: "Configure a Gremlin Command Reaction"
weight: 70
description: >
    Learn how to configure a Gremlin Command Reaction
---

The Drasi Gremlin Command Reaction allows you to use the Continuous Query results as parameters to commands that run against a Gremlin database. You can specify a Gremlin Command for each type of query result (Added, Updated or Deleted). The Gremlin Reaction is compatible with [Azure Cosmos DB for Gremlin](https://learn.microsoft.com/en-us/azure/cosmos-db/gremlin/introduction), [Apache TinkerPop Gremlin Servers](https://tinkerpop.apache.org/docs/3.4.4/reference/#gremlin-server), and [JanusGraph](https://janusgraph.org/).

## Requirements
On the computer from where you will create the Drasi Gremlin Command Reaction, you need to install the following software:
- [Drasi CLI](/reference/command-line-interface/) 

## Supported Gremlin Servers
- [Azure Cosmos DB for Gremlin](https://learn.microsoft.com/en-us/azure/cosmos-db/gremlin/introduction) 
- [Apache TinkerPop Gremlin Servers](https://tinkerpop.apache.org/docs/3.4.4/reference/#gremlin-server)
- [JanusGraph](https://janusgraph.org/)

## Creating the Reaction
To create a Reaction, execute the `drasi apply` command as follows:

```text
drasi apply -f my-reaction.yaml
```

The `drasi apply` command is how you create all new Drasi resources (in this case a Reaction). The `-f` flag specifies that the definition of the new Reaction is contained in the referenced YAML file `my-reaction.yaml` and the `-n` flag specifies the Drasi namespace in which to create the Reaction (Drasi must already be installed in that namespace).

## Reaction Definitions
The YAML file passed to `drasi apply` can contain one or more Reaction definitions. Here is an example of a Drasi Gremlin Command Reaction definition:
```yaml
kind: Reaction
apiVersion: v1
name: gremlin-reaction
spec:
  kind: Gremlin
  queries:
    query1:
  properties: 
    addedResultCommand: g.addV('Hello-world-from').property('MessageId', @MessageId).property('name',@MessageFrom)
    updatedResultCommand: g.V()
    deletedResultCommand: g.V().has('MessageId', @MessageId).drop()
    gremlinHost: <hostname>
    gremlinPassword: <password>
    gremlinUsername: <username>
    gremlinPort: <port>
```

In this definition: 
- the **apiVersion** must be **v1**.
- the **kind** property tells Drasi to create a **Reaction** resource.
- the **spec.kind** property tells Drasi the kind of Reaction to create, in this case a **Gremlin** Reaction. 
- the **name** property tells Drasi the identity of the Reaction and must be unique within the scope of Reactions within the target Drasi environment. In the above example, the **name** of the Reaction is **gremlin-reaction**.

This table describes the other settings in the **spec** section of the Reaction definition:
| Property | Description |
|-|-|
| addedResultCommand | The Gremlin command to execute when the Reaction receives an `addedResult` |
| updatedResultCommand | The Gremlin command to execute when the Reaction receives an `updatedResult` |
| deletedResultCommand | The Gremlin command to execute when the Reaction receives a `deletedResult` |
| gremlinHost | Hostname of the gremlin server (required) |
| gremlinPort | Port of the gremlin server (required) |
| gremlinPassword | Password for connecting to the gremlin server |
| gremlinUsername | Username for connecting to the gremlin server |

Note: When defining the Gremlin commands, add @ before any parameter name to use a query’s return value as the parameter.

#### Secret Configuration
It is best practice to store private credentials for your database in a Kubernetes secret, which can be created using `kubectl`. The example below creates a Secret with the name `gremlin-creds`, containing one key called `password` in the `drasi-system` namespace.

```bash
kubectl create secret generic gremlin-creds --from-literal=password=<db-password> -n drasi-system
```

You can then reference the secret when you create a Gremlin Reaction as follows:
```yaml
kind: Reaction
apiVersion: v1
name: gremlin-reaction
spec:
  kind: Gremlin
  queries:
    query1:
  properties: 
    addedResultCommand: g.addV('Hello-world-from').property('MessageId', @MessageId).property('name',@MessageFrom) # Replace with the actual Gremlin command
    updatedResultCommand: g.V()  # Replace with the actual Gremlin command
    deletedResultCommand: g.V().has('MessageId', @MessageId).drop()   # Replace with the actual Gremlin command
    gremlinHost: <hostname>
    gremlinPassword: 
        kind: Secret
        name: gremlin-creds
        key: password
    gremlinUsername: <username>
    gremlinPort: <port>
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
        ID               |    AVAILABLE
-------------------------+-----------------
    gremlin-reaction     |      true
```

If an error has occurred during the creation or operation of a Reaction, the `AVAILABLE` column will contain the error text instead of `true` or `false`.

For more details about the Reaction you can use the [drasi describe](/reference/command-line-interface#drasi-describe) command:

```text
drasi describe reaction gremlin-reaction
```

This will return the full definition used to create the Reaction along with more detailed status information.


## Modifying the Reaction
If you want to modify an existing reaction, you can use the `drasi apply` command to apply the updated YAML file. Ensure that the name of the reaction remains consistent.

## Deleting the Reaction
To delete a Reaction you use the `drasi delete` command. There are two ways to do this. 

Firstly, you can specify the type of resource (Reaction) and its name, for example:

```text
drasi delete reaction gremlin-reaction
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