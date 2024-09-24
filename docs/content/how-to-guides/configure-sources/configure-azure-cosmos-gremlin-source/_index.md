---
type: "docs"
title: "Connect to Azure Cosmos Gremlin API"
linkTitle: "Connect to Azure Cosmos Gremlin API"
weight: 10
description: >
    Learn how to configure a Cosmos Gremlin Source to connect to an Azure Cosmos Gremlin API database
---

The Cosmos Gremlin Source enables Drasi connectivity to Azure Cosmos DB Gremlin API databases. It 
calls the Azure Cosmos Gremlin API to retrieve data required to bootstrap Continuous Queries when they are created, and uses the Cosmos DB Change Feed as the source of database change events to keep the Continuous Queries that subscribe to it perpetually accurate.

{{< figure src="cosmos-gremlin-source.png" alt="Cosmos Gremlin Source" width="65%" >}}

## Data Model
Azure Cosmos DB Gremlin API uses a property graph data model similar to the graph data model used by the openCypher-based query language used to write Continuous Queries. This makes it easier to configure Continuous Queries that use a Cosmos Gremlin Source than those that depend on relational Sources. The only thing to note is the terminology differences between Gremlin and Drasi summarized in this table:

|Gremlin Name|Drasi Name|
|-|-|
|Vertex|Node|
|Edge|Relation|

## Requirements
To create and manage Sources using the steps described in this guide, you need the [Drasi CLI](/reference/command-line-interface/) installed on your computer.

For the Cosmos Gremlin Source to function, your Cosmos Change Feed must be configured to use [all versions and deletes mode](https://learn.microsoft.com/en-us/azure/cosmos-db/nosql/change-feed-modes?tabs=latest-version#all-versions-and-deletes-change-feed-mode-preview), which is in preview at the time of writing (9/23/2024). To enable this mode you must [enroll in the preview](https://learn.microsoft.com/en-us/azure/cosmos-db/nosql/change-feed-modes?tabs=all-versions-and-deletes#get-started) on the [preview features page](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/preview-features?tabs=azure-portal) of your Azure subscription.

 
## Creating the Source
To create a Cosmos Gremlin Source, execute the `drasi apply` command as follows:

```
drasi apply -f my-source.yaml -n my-namespace
```

The `drasi apply` command is how you create all new Drasi resources (in this case a Source). The `-f` flag specifies that the definition of the new Source is contained in the referenced YAML file `my-source.yaml` and the `-n` flag specifies the Drasi namespace in which to create the Source (Drasi must already be installed in that namespace).

## Source Definitions
The YAML file passed to `drasi apply` can contain one or more Source definitions. Here is an example of a Cosmos Gremlin Source definition:

```
apiVersion: v1
kind: Source
name: retail-ops
spec:
  kind: CosmosGremlin
  properties:
    accountEndpoint: AccountEndpoint=https://...
    database: Contoso
    container: RetailOperations
    partitionKey: name
```

In this definition: 
- the **apiVersion** must be **v1**.
- the **kind** property tells Drasi to create a **Source** resource.
- the **spec.kind** property tells Drasi the kind of Source to create, in this case a **CosmosGremlin** Source. 
- the **name** property tells Drasi the identity of the Source and must be unique within the scope of Sources within the target Drasi environment. This **name** is used in Continuous Query definitions to identify which Sources the Continuous Query subscribes to for data. In the above example, the **name** of the Source is **retail-ops**.

This table describes the other settings in the **spec.properties** section of the Source definition:
|Property|Description|
|-|-|
|accountEndpoint|The **PRIMARY CONNECTION STRING** or **SECONDARY CONNECTION STRING** values from the **Settings/Keys** page of the Azure Cosmos DB Account page of the Azure Portal.|
|database|**Database Id** from the Cosmos DB account. Visible in the table of graphs on the **Overview** page of the Azure Cosmos DB Account page of the Azure Portal.|
|container|**Graph Id** from the Cosmos DB Database. Visible in the table of graphs on the **Overview** page of the Azure Cosmos DB Account page of the Azure Portal.|
|partitionKey|The **Partition Key** configured on the Graph. Visible in the **Settings** page of the specified graph.|

The example Source definition above contains a plain text value for the **accountEndpoint** property. This may be acceptable for its convenience during development or testing but must be avoided if the credentials need to remain secure. Instead of providing a plain text value for the **accountEndpoint** property, you can configure it to use a securely stored Kubernetes Secret as shown in the following alternate definition for the above Source:


```
apiVersion: v1
kind: Source
name: retail-ops
spec:
  kind: CosmosGremlin
  properties:
    accountEndpoint: 
      kind: Secret
      name: creds
      key: account-endpoint    
    database: Contoso
    container: RetailOperations
    partitionKey: name
```

To create the Kubernetes Secret used above, you would run the command:

```bash
kubectl create secret generic creds --from-literal=account-endpoint=AccountEndpoint=https://...
```

## Inspecting the Source
Currently, a Source must be fully functional with a `ready` status before Continuous Queries can subscribe to it. If you create Continuous Queries that use a Source before the Source is `ready` they will either fail, or be in an unknown state.

You can check the status of the Source using the `drasi list` command:

```
drasi list source
```

Or including a target namespace:

```
drasi list source -n my-namespace
```

This will return a simple list of all Sources in the default (or specified) namespace and their overall status. For example:

```
    ID       | AVAILABLE
-------------+------------
  retail-ops | true
```

If an error has occurred during the creation or operation of a Source, the `AVAILABLE` column will contain the error text instead of `ready`.

For more details about a Source you can use the `drasi describe` command:

```
drasi describe source retail-ops
```

This will return the full definition used to create the Source along with more detailed status information.

## Modifying the Source
Currently, Drasi does not support the modification of existing Sources. You must [Delete the Source](#deleting-a-source), make changes to the Source definition file, and [Create the Source](#creating-a-source) again. This process will leave all Continuous Queries that subscribe to that Source in an unknown state, so they should also be deleted and re-created once the updated Source is ready.

## Deleting the Source
To delete a Source you use the `drasi delete` command. There are two ways to do this. 

Firstly, you can specify the type of resource (Source) and its name, for example:

```
drasi delete source retail-ops
```

Secondly, you can refer to the YAML file(s) that contain the definitions used to create the Source(s):

```
drasi delete -f my-source.yaml <file2.yaml> <file3.yaml> <...>
```

This is a convenience, especially if a single YAML file contains multiple Source definitions. 

If the Source is not in the default Drasi namespace, you should specific the target namespace using the `-n` flag as usual:

```
drasi delete -f my-source.yaml -n my-namespace
```

Drasi does not currently verify or protect dependencies between Sources and the Continuous Queries that subscribe to them. It is possible to delete a Source that is actively used by one or more Continuous Queries. This will break the Continuous Queries or leave them in an unknown state.