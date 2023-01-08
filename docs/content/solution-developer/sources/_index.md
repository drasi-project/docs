---
type: "docs"
title: "Sources"
linkTitle: "Sources"
weight: 10
description: >
    Sources for Solution Developers
---

Sources provide connectivity to the systems that Reactive Graph can observe as sources of change. Sources are the inputs to Continuous Queries.

Reactive Graph currently provides Source implementations for the following source systems:

- [Azure Cosmos DB Gremlin API](#azure-cosmos-db-gremlin-api-source)
- [PostgreSQL](#postgresql-source)

*To create a Source for other sources, see the [Platform Developer Guide](/platform-developer)*

To create a Source instance, you must:

1. Have credentials and endpoint addresses that provide access to the change log of the source system you want to use.
1. Create a file containing the Kubernetes resource definition for the Source. This will include the configuration settings that enable the Source to connect to the source system.
1. Apply the Source resource definition to the Kubernetes cluster where your Reactive Graph environment is deployed.

The Kubernetes resource definition for a Source has the following structure:

```yaml
apiVersion: query.reactive-graph.io/v1
kind: Source
metadata:
  name: <source-id>
spec:
  sourceType: <source-type>
  properties: 
  - name: <property-name>
    value: <property-name>
  - ...
```

The **source-id** must be unique within the scope of the Reactive Graph envionment, and is the ID used in a Continuous Query definition to describe which Sources the Continuous Query uses as input.

The following sections describe the configuration of the Source types currently supported by Reactive Graph.

## Azure Cosmos DB Gremlin API Source

The Azure Cosmos DB Gremlin API Source requires the following properties be set:

|Property|Description|
|-|-|
|sourceType| Must be the value 'CosmosGremlin' |
|SourceAccountEndpoint| |
|SourceConnectionString| |
|SourceDatabaseName| |
|SourceContainerName| |
|SourceContainerPartitionKey| |
|SourceKey| |

The following is an example of a fully configured Azure Cosmos DB Gremlin API Source using Kubernetes Secrets to securely store database credentials:

```yaml
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

## PostgreSQL Source

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

```yaml
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