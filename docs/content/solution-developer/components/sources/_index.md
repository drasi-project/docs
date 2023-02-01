---
type: "docs"
title: "Sources"
linkTitle: "Sources"
weight: 40
description: >
    What are Sources and How to Use Them
---

Sources provide connectivity to the systems that Drasi can observe as sources of change. Sources provide change events as inputs to Continuous Queries.

 ![End to End](simple-end-to-end.png)

Sources perform three important functions within Drasi:
- Process the change log/feed generated by the source system and push those changes as change events to each Continuous Query that uses that Source as input.
- Translate source change data into a consistent property graph data model so that subscribed Continuous Queries can use that data as if it where a graph of Nodes and Relations. For graph sources, such as Gremlin, no translation is necessary. But for non-graph sources, such as PostgreSQL and Kubernetes, the Source transforms the data (more detail is provided in the individual Sources sections below).
- Provide a way for Continuous Queries to query the source system to get the initial data required to initialize the state of the Continuous Query cache.

Drasi currently provides Sources for the following source systems:

- [Azure Cosmos DB Gremlin API](#azure-cosmos-db-gremlin-api-source)
- [PostgreSQL](#postgresql-source)
- [Kubernetes](#kubernetes-source) (experimental)

## Creation
Sources are custom Kubernetes resources that you can create and manage using `Kubectl`. 

The easiest way to create a Source, and the way you will often create one as part of a broader software solution, is to:

1. Collect credentials and endpoint addresses that provide access to the change log and query API of the source system you want to get data from.
1. Create a YAML file containing the Source resource definition. This will include the configuration settings that enable the Source to connect to the source system. This file can be stored in your solution repo and versioned along with all the other solution code / resources.
1. Run Kubectl to apply the Source resource definition to the Kubernetes cluster where your Drasi environment is deployed.

As soon as the Source is created it will start running, monitoring its source system for changes and pushing them to subscribed Continuous Queries.

The Kubernetes resource definition for a Source has the following structure:

```
apiVersion: query.reactive-graph.io/v1
kind: Source
metadata:
  name: <id>
spec:
  sourceType: <type>
  properties: 
  - name: <property-name>
    value: <property-value>
  - ...
```
The following table describes these configuration settings:

|Name|Description|
|-|-|
|apiVersion|Must have the value **query.reactive-graph.io/v1**|
|kind|Must have the value **Source**|
|metadata.name|The **id** of the Source. Must be unique. The Source id is used to manage the Source through Kubectl and in a Continuous Query definitions to identify which Sources the Continuous Query subscribes to for change events.|
|spec.sourceType|The name of the Source type to create. Currently, must be one of **CosmosGremlin**, **PostgreSQL** or **Kubernetes**
|spec.properties|The configuration settings passed to the Source as name-value pairs. Possible settings differ depending on the Source type (**spec.sourceType**) being created. See the individual Source sections below for the properties required by each Source.|

Once configured, to create a Source defined in a file called `source.yaml`, you would run the command:

```
kubectl apply -f source.yaml
```

You can then use the standard Kubectl commands to query the existence and status of the Source resource. For example, to see a list of the active Sources, run the following command:

```
kubectl get sources
```


## Deletion
To delete an active Source, run the following command:

```
kubectl delete source <id>
```

For example, if the Source id is `human-resources`, you would run,

```
kubectl delete source human-resources
```

## Configuring Sources
The following sections describe the configuration of the Source types currently supported by Drasi.

- [Azure Cosmos DB Gremlin API](#azure-cosmos-db-gremlin-api-source)
- [PostgreSQL](#postgresql-source)
- [Kubernetes](#kubernetes-source) (experimental)

### Azure Cosmos DB Gremlin API Source

The Azure Cosmos DB Gremlin API Source requires the following properties be set:

|Property|Description|
|-|-|
|sourceType| Must be the value **CosmosGremlin** |
|SourceAccountEndpoint| |
|SourceConnectionString| |
|SourceDatabaseName| |
|SourceContainerName| |
|SourceContainerPartitionKey| |
|SourceKey| |

The following is an example of a fully configured Azure Cosmos DB Gremlin API Source using Kubernetes Secrets to securely store database credentials:

```
apiVersion: v1
kind: Secret
metadata:
  name: comfy-creds
type: Opaque
stringData:
  SourceAccountEndpoint: AccountEndpoint=https://xx.xx:443/;AccountKey=xx;ApiKind=Gremlin;
  SourceKey: xxxxxx
---
apiVersion: query.reactive-graph.io/v1
kind: Source
metadata:
  name: facilities
spec:
  sourceType: CosmosGremlin
  properties: 
  - name: SourceAccountEndpoint
    valueFrom:
      secretKeyRef:
        name: comfy-creds
        key: SourceAccountEndpoint
  - name: SourceConnectionString
    value: wss://xxxxxx.xxxxxx.xxxxxx:443/
  - name: SourceDatabaseName
    value: Contoso
  - name: SourceContainerName
    value: Facilities
  - name: SourceContainerPartitionKey
    value: name
  - name: SourceKey
    valueFrom:
      secretKeyRef:
        name: comfy-creds
        key: SourceKey
```

### PostgreSQL Source

The PostgreSQL Source requires the following properties be set:

|Property|Description|
|-|-|
|sourceType| Must be the value 'PostgreSQL' |
|database.hostname| |
|database.port| |
|database.user| |
|database.password| |
|database.dbname| |
|tables| |

The following is an example of a fully configured PostgreSQL Source using Kubernetes Secrets to securely store database credentials:

```
apiVersion: v1
kind: Secret
metadata:
  name: pg-creds
type: Opaque
stringData:
  password: xxxxxx
---
apiVersion: query.reactive-graph.io/v1
kind: Source
metadata:
  name: phys-ops
spec:
  sourceType: PostgreSQL
  properties: 
  - name: database.hostname
    value: reactive-graph.postgres.database.azure.com
  - name: database.port
    value: "5432"
  - name: database.user
    value: postgres@reactive-graph
  - name: database.password
    valueFrom:
      secretKeyRef:
        name: pg-creds
        key: password
  - name: database.dbname
    value: phys-ops
  - name: tables
    value: public.Vehicle,public.Zone
```

### Kubernetes Source