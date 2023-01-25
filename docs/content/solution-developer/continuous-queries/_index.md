---
type: "docs"
title: "Continuous Queries"
linkTitle: "Continuous Queries"
weight: 20
description: >
    How to Use Continuous Queries
---

## Introduction
Continuous Queries, as the name implies, are queries that run continuously. To understand what is unique about them, it is useful to contrast them with a the kind of **instantaneous queries** developers are accustomed to running against databases, such as SQL queries against a SQL server. 

When you issue an instantaneous query, you are running the query against the database at a point in time. The database calculates the results to the query and returns them. While you work with those results, you are working with a static snapshot of the data and are unaware of any changes that may have happened to the data after you ran the query. If you run the same instantaneous query periodically and changes are being made to the database, the query results might be different each time, depending on how the changes overlap with the query. 

If you want to detect changes in a database and the only tool you have is instantaneous queries, you must run a query periodically and compare the most recent with the previous query results to determine what has changed. This can be complex, inefficient, and imprecise.

Continuous Queries, once started, continue to run until you stop them. While running, Continuous Queries maintain a perpetually accurate query result, incorporating any changes made to the source database as they occur. Not only do Continuous Queries allow you to request the query result at any point in time after they were started, but as changes occur, the Continuous Query determines exactly which result elements have been added, updated, and deleted, and distributes a precise description of the changes to all Reactions that have subscribed to the Continuous Query.

 ![Continuous Queries](end_to_end.png)

Continuous Queries are implemented as graph queries written in the [Cypher Query Language](https://neo4j.com/developer/cypher/). The use of a declarative graph query language means you can easily express rich query logic that takes into consideration both the properties of the data you are querying and the relationships between data. Also, you can express which changes you are interested in detecting and how you want notifications of those changes to be described in a single expression.

These concepts are best understood using an example...

Imagine an Incident Alerting Service which notifies managers if any of the employees in their team are at risk due to dangerous incidents happening in their location (e.g. fires, storms, protests, etc). Using Drasi, the following Cypher query could be used to do this.

```
MATCH
  (e:Employee)-[:ASSIGNED_TO]->(t:Team),
  (m:Employee)-[:MANAGES]->(t:Team),
  (e:Employee)-[:LOCATED_IN]->(:Building)-[:LOCATED_IN]->(r:Region),
  (i:Incident {type:'environmental'})-[:OCCURS_IN]->(r:Region) 
WHERE
  elementId(e) <> elementId(m) AND i.severity IN [‘critical’, ‘extreme’] AND i.endTimeMs IS NULL
RETURN 
  m.name AS ManagerName, m.email AS ManagerEmail, 
  e.name AS EmployeeName, e.email AS EmployeeEmail,
  r.name AS RegionName, 
  elementId(i) AS IncidentId, i.severity AS IncidentSeverity, i.description AS IncidentDescription
```

The `MATCH` and `WHERE` clauses of the query identifies all **Employees** located in **Buildings** within **Regions** where there are active **Incidents** of **type** 'environmental' that have a **severity** level of ‘critical’ or ‘extreme’. This means that any combination of correctly connected nodes with the required property values should be included in the result.

The `RETURN` clause of the query generates output containing the name and email address of the at risk employee and their manager, as well as details about the incident and the region in which it is located. This defines the schema results coming out of the Continuous Query will have.

If run as an instantaneous query against a graph database (that has a suitable schema), this query might return an array of results like this:

```
[
  { “ManagerName”: “Allen”, “ManagerEmail”: “allen@contoso.com”, “EmployeeName”: “Bob”, “EmployeeEmail”: “bob@contoso.com”, “RegionName”: “Southern California”, “IncidentId”: “in1000”, “IncidentSeverity”: “extreme”, “IncidentDescription”: “Forest Fire” },
  { “ManagerName”: “Allen”, “ManagerEmail”: “allen@contoso.com”, “EmployeeName”: “Claire”, “EmployeeEmail”: “claire@contoso.com”, “RegionName”: “Southern California”, “IncidentId”: “in1000”, “IncidentSeverity”: “extreme”, “IncidentDescription”: “Forest Fire” }
]
```

Drasi, instead of returning a result when the Continuous Query is run, executes the query as a long-lived process and maintains a consistently up-to-date query result based on all the relevant changes that have occurred in the source system. 

For example, when the above Continuous Query is first run, there might be no results that satisfy the query. But as soon as an extreme severity Forest Fire **Incident** in Southern California is added to the database, the query might generate the following output showing that two records (for employees Bob and Claire) now meet the query criteria and have been **added** to the query result:

```
{
 “added”: [
  { “ManagerName”: “Allen”, “ManagerEmail”: “allen@contoso.com”, “EmployeeName”: “Bob”, “EmployeeEmail”: “bob@contoso.com”, “RegionName”: “Southern California”, “IncidentId”: “in1000”, “IncidentSeverity”: “extreme”, “IncidentDescription”: “Forest Fire” },
  { “ManagerName”: “Allen”, “ManagerEmail”: “allen@contoso.com”, “EmployeeName”: “Claire”, “EmployeeEmail”: “claire@contoso.com”, “RegionName”: “Southern California”, “IncidentId”: “in1000”, “IncidentSeverity”: “extreme”, “IncidentDescription”: “Forest Fire” }
 ],
 “updated”: [],
 “deleted”: []
}
```

If Bob's subsequently location changed, removing him from the Southern Californian Region while the Forest Fire was still active, the Continuous Query would generate the following output, showing that Bob’s record had been **deleted** from the query result:

```
{
 “added”: [],
 “updated”: [],
 “deleted”: [
  { “ManagerName”: “Allen”, “ManagerEmail”: “allen@contoso.com”, “EmployeeName”: “Bob”, “EmployeeEmail”: “bob@contoso.com”, “RegionName”: “Southern California”, “IncidentId”: “in1000”, “IncidentSeverity”: “extreme”, “IncidentDescription”: “Forest Fire” }
 ]
}
```

Finally, if the severity of the Forest Fire changed from 'extreme' to 'critical', the Continuous Query would spontaneously generate the following output showing a that the result for Employee Claire been updated. The update includes what the result was both **before** and **after** the change:

```
{
 “added”: [],
 “updated”: [
  { 
   “before”: { “ManagerName”: “Allen”, “ManagerEmail”: “allen@contoso.com”, “EmployeeName”: “Bob”, “EmployeeEmail”: “bob@contoso.com”, “RegionName”: “Southern California”, “IncidentId”: “in1000”, “IncidentSeverity”: “extreme”, “IncidentDescription”: “Forest Fire” },
   “after”: { “ManagerName”: “Allen”, “ManagerEmail”: “allen@contoso.com”, “EmployeeName”: “Bob”, “EmployeeEmail”: “bob@contoso.com”, “RegionName”: “Southern California”, “IncidentId”: “in1000”, “IncidentSeverity”: “critical”, “IncidentDescription”: “Forest Fire” }
 ],
 “deleted”: []
}
```

## Cypher Language
Drasi Continuous Queries are written using the Cypher Graph Query Language. If you are new to Cypher, here are some useful references:
- [Getting Started](https://neo4j.com/developer/cypher/)
- [Language Reference](https://neo4j.com/docs/cypher-manual/current/)
- [Cheat Sheet](https://neo4j.com/docs/cypher-cheat-sheet/current/)

Drasi Continuous Queries currently support the following subset of Cypher:
- MATCH, WHERE, and RETURN clauses
  - Property and Label patterns on MATCH clause elements
  - Aliases on RETURN values
  - Only fixed length MATCH paths with non-anonymous nodes and relations
- Mathematical operators: +, -, *, /
- Comparison operators: =, !=, >, >=, <, <=, IS NULL, IS NOT NULL
- Arithmetic functions: floor, ceil, round, abs 
- Logic operators : AND, OR, NOT
- List operators: IN
- Scalar functions: elementId
- Aggregating functions: count, sum, avg, min, max
- CASE expression

We will continue to expand the Cypher support provided by Drasi, but even with a reduced language, it is possible to create powerful queries. Below are some examples:

## Creation
Continuous Queries are custom Kubernetes resources that you can create and manage using `Kubectl`. 

The easiest way to create a Continuous Query, and the way you will often create one as part of a broader software solution, is to:

1. Create a YAML file containing the Continuous Query Resource Definition
1. Run Kubectl to apply the YAML file, creating the Continuous Query

As soon as the Continuous Query is created it will start running, monitoring its sources for changes and generating results in response to changes.

Here is an example of YAML describing the Incident Alerting Continuous Query described above:

```
apiVersion: query.reactive-graph.io/v1
kind: ContinuousQuery
metadata:
  name: manager-incident-alert
spec:
  sources:    
    subscriptions:
      - id: human-resources
  query: > 
    MATCH
      (e:Employee)-[:ASSIGNED_TO]->(t:Team),
      (m:Employee)-[:MANAGES]->(t:Team),
      (e:Employee)-[:LOCATED_IN]->(:Building)-[:LOCATED_IN]->(r:Region),
      (i:Incident {type:'environmental'})-[:OCCURS_IN]->(r:Region) 
    WHERE
      elementId(e) <> elementId(m) AND i.severity IN [‘critical’, ‘extreme’] AND i.endTimeMs IS NULL
    RETURN 
      m.name AS ManagerName, m.email AS ManagerEmail, 
      e.name AS EmployeeName, e.email AS EmployeeEmail,
      r.name AS RegionName, 
      elementId(i) AS IncidentId, i.severity AS IncidentSeverity, i.description AS IncidentDescription
```

In this simple example, the `spec.sources.subscriptions` property identifies the Source with the id `human-resources` as the source of data for the Continuous Query. The `spec.query` property contains the text of the Cypher query. Full details of the Continuous Query configuration options are described in the following section.

If this Continuous Query resource definition was contained in a file called `query.yaml`, to create this query on a Drasi environment that was the current Kubectl context, you would run the command:

```
kubectl apply -f query.yaml
```

You can then use the standard Kubectl commands to query the existence and status of the Continuous Query resource. For example, to see a list of the active Continuous Queries, run the following command:

```
kubectl get continuousqueries
```

## Configuration
In addition to the Cypher query, there are a number of configuration settings that are required when creating a Continuous Query, as well as some optional settings that allow you to control how Drasi processes the query, what data is cached, and what data is generated. The following table provides a summary of these configuration settings:

|Name|Description|
|-|-|
|apiVersion|Must have the value **query.reactive-graph.io/v1**|
|kind|Must have the value **ContinuousQuery**|
|metadata.name|The **id** of the Continuous Query. Must be unique. Is used to manage the Continuous Query through Kubectl and as the name from Reactions to subscribe to the Continuous Query.|
|spec.mode|Can have the value **query** (default) or **filter**. If a Continuous Query is running in **filter** mode, it does not maintain a query result and as such does not generate detailed change notifications in response to Source changes. Instead, any Source change that when evaluated results in a result that satisfies the query causes the Continuous Query to output the result.|
|spec.indexType|Can have the value **persisted** (default) or **memory**. This settings controls whether Drasi caches the Continuous Query element and solution indexes to a persistent store, or keeps them in memory. using memory-based indexes is good for testing and is also OK for Continuos Queries that to not require significant bootstrapping when they start.|
|spec.sources.subscriptions|Describes the Sources the Continuous Query will subscribe to for data and optionally maps the Source Labels/Types to the Label names used in the Cypher Query. Explained in detail below.|
|spec.sources.joins|Describes the way the Continuous Query connects elements from multiple sources to enable you to write graph queries across the unified data. Explained in detail below.|
|query|The Cypher query that defines what the change the Continuous Query is detecting and the output it generates.|

## Deletion
To delete an active Continuous Query, run the following command:

```
kubectl delete continuousqueries <query-id>
```

For example, if the Continuous Query id from the `metadata.name` property of the resource definition is `manager-incident-alert`, you would run,

```
kubectl delete continuousqueries manager-incident-alert
```

## Examples

### Single Source Queries


```
apiVersion: query.reactive-graph.io/v1
kind: ContinuousQuery
metadata:
  name: room-comfort-level-calc
spec:
  mode: query
  sources:    
    subscriptions:
      - id: facilities
  query: > 
    MATCH 
      (r:Room) 
    RETURN 
      r.id As RoomId, 
      floor( 50 + (r.temp - 72) + (r.humidity - 42) + CASE WHEN r.co2 > 500 THEN (r.co2 - 500) / 25 ELSE 0 END ) AS ComfortLevel
```

### Multi Source Queries

```
apiVersion: query.reactive-graph.io/v1
kind: ContinuousQuery
metadata:
  name: orders-matched-vehicle
spec:
  mode: query
  sources:    
    subscriptions:
      - id: phys-ops
        nodes:
          - sourceLabel: Vehicle
          - sourceLabel: Zone
      - id: retail-ops
        nodes:
          - sourceLabel: Driver
          - sourceLabel: Order
          - sourceLabel: OrderPickup
        relations:
          - sourceLabel: PICKUP_DRIVER
          - sourceLabel: PICKUP_ORDER
    joins:
      - id: LOCATED_IN
        keys:
          - label: Vehicle
            property: ZoneId
          - label: Zone
            property: ZoneId
      - id: VEHICLE_TO_DRIVER
        keys:
          - label: Vehicle
            property: Plate
          - label: Driver
            property: plate
  query: > 
    MATCH 
      (o:Order {status:'ready'})<-[:PICKUP_ORDER]-(:OrderPickup)-[:PICKUP_DRIVER]->(d:Driver)-[:VEHICLE_TO_DRIVER]-(v:Vehicle)-[:LOCATED_IN]->(:Zone {type:'Curbside Queue'}) 
    RETURN o.id AS OrderNumber, d.name AS DriverName, v.Plate AS LicensePlate
```

### Aggregating Queries

```
apiVersion: query.reactive-graph.io/v1
kind: ContinuousQuery
metadata:
  name: floor-comfort-level-calc
spec:
  mode: query
  sources:    
    subscriptions:
      - id: facilities
  query: > 
    MATCH 
      (r:Room)-[:PART_OF]->(f:Floor) 
    RETURN 
      f.id As FloorId, avg(r.comfortLevel) AS ComfortLevel
```







