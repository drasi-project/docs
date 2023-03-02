
---
type: "docs"
title: "Query Container"
linkTitle: "Query Container"
weight: 30
description: >
    Query Container
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
  properties:
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
|spec.properties|Name/value pairs used to customize the Container.  These are documented below.

The following table provides a summary of the properties:

|Name|Description|
|-|-|
|MONGO_URI|The MongoDB connection string to use, example: mongodb://rg-mongo:27017|
|GARNET_URI|The Garnet/Redis connection to use, example: redis://rg-redis:6379|
|ELEMENT_FEATURE_INDEX|Which storage engine to use for the element feature index. Options are `MONGO` or `GARNET`. Default is `MONGO`|
|RESULT_GROUP_INDEX_AGG|Which storage engine to use for the result group solution index of aggregating queries. Options are `MONGO` or `GARNET`. Default is `MONGO`|
|RESULT_GROUP_INDEX_NON_AGG|Which storage engine to use for the result group solution index of non-aggregating queries. Options are `MONGO` or `GARNET`. Default is `MONGO`|
|MONGO_RESULT_STORE_DB_NAME|The DB name to use for the Mongo result store|
|MONGO_RESULT_STORE_COLL_NAME|The collection name to use for the Mongo result store|
|MONGO_ELEMENT_FEATURE_INDEX_DB_NAME|The DB name to use for the Mongo element feature index. Default is `ReactiveGraph`|
|MONGO_ELEMENT_FEATURE_INDEX_COLL_NAME|The collection name to use for the Mongo element feature index. Default is `ElementFeatureIndex`|
|MONGO_RESULT_GROUP_SOLUTION_INDEX_DB_NAME|The DB name to use for the Mongo result group solution index. Default is `ReactiveGraph`|
|MONGO_RESULT_GROUP_SOLUTION_INDEX_COLL_NAME|The collection name to use for the Mongo result group solution index. Default is `ResultGroupSolutionIndex`|
