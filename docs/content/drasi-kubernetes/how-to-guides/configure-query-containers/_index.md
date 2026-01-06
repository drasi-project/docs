
---
type: "docs"
title: "Configure Query Containers"
linkTitle: "Configure Query Containers"
weight: 40
toc_hide: true
hide_summary: true
description: >
    Configuring Query Containers
---

When you create a continuous query, you can specify which query container should host that query.  This enables you to isolate groups of queries to use a specific set of resources.  A new installation of Drasi will include a `default` query container but you can also create your own.

## Query Container Configuration

The Kubernetes resource definition for a Query Container has the following structure:

```yaml
apiVersion: query.reactive-graph.io/v1
kind: QueryContainer
metadata:
  name: default
spec:
  queryHostCount: <query host count>
  defaultStore: <profile name>
  storage:
    <profile name>: 
      kind: <type>
      property1: <value1>
      property2: <value2>
    <profile name>: 
      kind: <type>
      property1: <value1>
      property2: <value2>
  results:
  - name: <property_1_name>
    value: <property_1_value>
  - name: <property_2_name>
    value: <property_2_value>
```

The following table provides a summary of these configuration settings:

|Name|Description|
|-|-|
|apiVersion|Must have the value **query.reactive-graph.io/v1**|
|kind|Must have the value **QueryContainer**|
|metadata.name|The **id** of the Query Container. Must be unique. The  **id** is used to manage the QueryContainer through Kubectl.|
|spec.queryHostCount|The number of query host instances to run for this query container.  The queries within this container will be distributed across a number of query host instances.  Scale this up to support a larger number of queries.|
|spec.defaultStore|The default storage profile for queries that do not request a specific one.|
|spec.storage|This section specifies the storage profiles that this container will support|
|spec.storage.(profile name)|The name of a storage profile identified by queries|
|spec.storage.(profile name).kind|The type of the storage profile.  Valid values are `memory`, `redis` and `rocksDb`|
|spec.storage.(profile name).(property)|Specific config values for each storage type|
|spec.results|Name/value pairs used to configure the results store.  These are documented below.

The following table provides a summary of the properties:

|Name|Description|
|-|-|
|MONGO_URI|The MongoDB connection string to use, example: mongodb://rg-mongo:27017|
|MONGO_RESULT_STORE_DB_NAME|The DB name to use for the Mongo result store|
|MONGO_RESULT_STORE_COLL_NAME|The collection name to use for the Mongo result store|


Example

```yaml
apiVersion: query.reactive-graph.io/v1
kind: QueryContainer
metadata:
  name: default
spec:
  queryHostCount: 3
  defaultStore: rocks
  storage:
    memory:
      kind: memory
      enableArchive: false
    redis:
      kind: redis
      connectionString: redis://rg-redis:6379
    rocks:
      kind: rocksDb
      storageClass: azurefile-csi-premium
      enableArchive: false
      directIo: false
  results:
    MONGO_URI: mongodb://rg-mongo:27017
    MONGO_RESULT_STORE_DB_NAME: ReactiveGraph
    MONGO_RESULT_STORE_COLL_NAME: Results
```

### In Memory storage options

|Name|Description|
|-|-|
|enableArchive|Enable the archive feature that supports time travel functions|

### Redis storage options

|Name|Description|
|-|-|
|connectionString|The Redis connection string, eg. redis://rg-redis:6379|
|cacheSize (optional)| Use an in-memory LRU cache|


### RocksDb storage options

|Name|Description|
|-|-|
|storageClass (optional)|The storage class to provision the underlying volume.  Must support `ReadWriteMany` access. (default :`azurefile-csi-premium`)|
|directIo (optional)|Enable direct IO for RocksDb (default: `false`)|
|enableArchive (optional)|Enable the archive feature that supports time travel functions (default: `false`)|