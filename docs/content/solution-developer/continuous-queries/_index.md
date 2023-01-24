---
type: "docs"
title: "Continuous Queries"
linkTitle: "Continuous Queries"
weight: 20
description: >
    Continuous Queries for Solution Developers
---

Continuous Queries, as the name implies, are queries that run continuously. To understand this, it is useful to contrast them with a the kind of **instantaneous queries** people are accustomed to running against databases, such as SQL queries against a SQL server. 

When you issue an instantaneous query, you are running the query against the database at a point in time. The database calculates the results to the query and returns them. While you work with those results, you are working with a static snapshot of the data and are unaware of any changes that may have happened to the data after you ran the query.

If you run the same instantaneous query periodically, the results will be different each time if changes have been made to the database. If you need to use instantaneous queries periodically to detect change, you must compare the most recent and previous query results to determine what has changed. This can be complex, inefficient, and imprecise.

Continuous Queries, once started, continue to run until they are stopped. While running, Continuous Queries maintain a perpetually accurate query result, incorporating any changes made to the source database as they occur. Not only do Continuous Queries allow you to request the current query result at any point in time, but as changes occur, the Continuous Query determines exactly which result elements have been added, updated, and deleted, and distributes the precise changes description to all Reactions that have subscribed to the Continuous Query.

 ![Continuous Queries](queries.png)

Continuous Queries are implemented as graph queries written in [Cypher Query Language](https://neo4j.com/developer/cypher/). The use of a declarative graph query language means you can easily express rich query logic that takes into consideration both the properties of the data you are querying and the relationships between data. Continuous Queries also enable you to create queries that span data across multiple Sources, even when there is no natural connection between data in the Source systems.

## An Example
First, Reactive Graph enables developers to use declarative graph query syntax, like the Cypher query shown here, to simultaneously define what changes are of interest (using the Match and Where clauses of the query) as well as what data to use to describe those changes when they occur (using the RETURN clause of the query).

This query identifies all Employees located in Buildings within Regions where there are active Incidents that have a severity of ‘critical’ or ‘extreme’. The query generates output containing the name and email address of the employee and their manager, as well as details about the incident and where it is. If run against a graph database, this query might return an array of results like this:

```
[
  { “ManagerName”: “Allen”, “ManagerEmail”: “allen@contoso.com”, “EmployeeName”: “Bob”, “EmployeeEmail”: “bob@contoso.com”, “RegionName”: “Southern California”, “IncidentId”: “in1000”, “IncidentSeverity”: “extreme”, “IncidentDescription”: “Forest Fire” },
  { “ManagerName”: “Allen”, “ManagerEmail”: “allen@contoso.com”, “EmployeeName”: “Claire”, “EmployeeEmail”: “claire@contoso.com”, “RegionName”: “Southern California”, “IncidentId”: “in1000”, “IncidentSeverity”: “extreme”, “IncidentDescription”: “Forest Fire” }
]
```

Reactive Graph, instead of returning a result when the query is run, executes the query as a long-lived process and maintains a consistently up-to-date query result based on all the relevant changes that have occurred in the source system. When source changes occur that cause the query result to change, Reactive Graph generates notifications describing the effect on the query result, including exactly which elements were added, updated, or deleted. These incremental query results are then distributed to consumers for them to process.

For example, when the above Continuous Query is first run, there might be no results that satisfy the query. But as soon as an extreme severity Forest Fire in Southern California is added to the database, the query might generate the following output showing that two records had been added to the query result:

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

If Bob was removed from the Southern Californian Region while the Forest Fire was still active, the query would generate the following output, showing that Bob’s record had been deleted from the query result:

```
{
 “added”: [],
 “updated”: [],
 “deleted”: [
  { “ManagerName”: “Allen”, “ManagerEmail”: “allen@contoso.com”, “EmployeeName”: “Bob”, “EmployeeEmail”: “bob@contoso.com”, “RegionName”: “Southern California”, “IncidentId”: “in1000”, “IncidentSeverity”: “extreme”, “IncidentDescription”: “Forest Fire” }
 ]
}
```

And then, if the severity of the Forest Fire changed from extreme to critical, the query would immediately generate the following output showing a that Claire’s result had been updated, and including what the result was both before and after the change:

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