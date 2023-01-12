---
type: "docs"
title: "Goals"
linkTitle: "Goals"
weight: 1
description: >
    What Problem Does Reactive Graph Solve and How?
---

# The Problem

Organizations continue to create ever more sophisticated software systems to model, reason about, and control dynamic, real-world systems in domains like supply chain management, transportation, connected environments, and AR/VR. These software systems, common in IoT and digital twin solutions, can be large and complex, regularly containing millions of digital entities that represent things in the real-world such as people, vehicles, products, orders, processes, and incidents. They can also contain millions of relationships between entities that describe how things in the real world are physically or logically related to each other.

Because the real world is continually changing, these digital entities must also change. This necessitates the frequent creation and deletion of entities, changes to the properties that represent the state of the entities, and the creation and deletion of relationships between entities. Being able to observe and react to these changes dynamically is increasingly important. Because of the interconnected nature of entities, a change in one often requires changes to cascade to other entities in the system. And being able to make external systems aware of changes helps organizations improve productivity and operational efficiency by:
- triggering process automation,
- reacting spontaneously to real-world observations,
- enabling cross-system and cross-organization integration,
- powering proactive user experiences for customers, staff, and partners. 

Some software systems are designed with built-in change notification capabilities that enable cascading updates within the system or external consumers to observe changes as they occur and react accordingly. But building such systems is difficult and time consuming. It requires significant up-front design to decide what changes to generate notifications for (change taxonomy) and what data to use to represent those changes (change schema). The developer must also decide when components and services generate change notifications, how to enable consumers to securely register interest in receiving change notifications, and how to reliably deliver the change notifications to the consumer securely and within acceptable timeframes. Doing all this successfully (in addition to delivering the system’s primary functionality) requires the developer to have good data modelling skills, a good understanding of event driven architectures, and experience with messaging infrastructure technology. All of this is in addition to skills in their domain of expertise, like financial services or life sciences. 

Observing and reacting to software systems that were not originally designed to generate change notifications presents additional challenges for developers. While they still need to address all the concerns outlined previously, they must also solve the problem of detecting when changes occur. If they are unable to modify the system source code to update components and services to generate change notifications, as is often the case when dealing with third-party or legacy systems, the developer must implement complex work arounds like database polling and change log mining. 

Fundamentally, it’s just too hard for the broad community of enterprise developers to build these kinds of applications. While there are established patterns and technologies that help developers deal with each of these challenges, the knowledge, skills, and time taken to implement them effectively at scale are beyond the capabilities of many people and organizations. We believe we can do better with a solution that blends the best in monitoring continuously changing data with the best in simplified application development. 

# The Solution
Reactive Graph is an early stage incubation that provides an alternative, consumer-driven and low-code approach to observing dynamic systems and reacting to change:
•	without the need for developers to define fixed change schema and taxonomies.
•	without the need to embed change generation logic in components and services 
•	without the need to implement complex and inefficient change detection.
•	without the need to publish vast quantities of unused change notifications.

Reactive Graph’s model is simple. Developers create queries that are hosted by Reactive Graph as long running processes called Continuous Queries. Developers also write code that subscribes to those queries, called Reactions. When changes occur that change the results of the query then Reactive Graph notifies the subscribers to the query. Reactive Graph has three simple building blocks: Sources, Continuous Queries, and Reactions. Details about how this works are below.

First, Reactive Graph enables developers to use declarative graph query syntax, like the Cypher query shown here, to simultaneously define what changes are of interest (using the Match and Where clauses of the query) as well as what data to use to describe those changes when they occur (using the RETURN clause of the query).

 

This query identifies all Employees located in Buildings within Regions where there are active Incidents that have a severity of ‘critical’ or ‘extreme’. The query generates output containing the name and email address of the employee and their manager, as well as details about the incident and where it is. If run against a graph database, this query might return an array of results like this:

[
  { “ManagerName”: “Allen”, “ManagerEmail”: “allen@contoso.com”, “EmployeeName”: “Bob”, “EmployeeEmail”: “bob@contoso.com”, “RegionName”: “Southern California”, “IncidentId”: “in1000”, “IncidentSeverity”: “extreme”, “IncidentDescription”: “Forest Fire” },
  { “ManagerName”: “Allen”, “ManagerEmail”: “allen@contoso.com”, “EmployeeName”: “Claire”, “EmployeeEmail”: “claire@contoso.com”, “RegionName”: “Southern California”, “IncidentId”: “in1000”, “IncidentSeverity”: “extreme”, “IncidentDescription”: “Forest Fire” }
]

Reactive Graph, instead of returning a result when the query is run, executes the query as a long-lived process and maintains a consistently up-to-date query result based on all the relevant changes that have occurred in the source system. When source changes occur that cause the query result to change, Reactive Graph generates notifications describing the effect on the query result, including exactly which elements were added, updated, or deleted. These incremental query results are then distributed to consumers for them to process.

For example, when the above Continuous Query is first run, there might be no results that satisfy the query. But as soon as an extreme severity Forest Fire in Southern California is added to the database, the query might generate the following output showing that two records had been added to the query result:

{
 “added”: [
  { “ManagerName”: “Allen”, “ManagerEmail”: “allen@contoso.com”, “EmployeeName”: “Bob”, “EmployeeEmail”: “bob@contoso.com”, “RegionName”: “Southern California”, “IncidentId”: “in1000”, “IncidentSeverity”: “extreme”, “IncidentDescription”: “Forest Fire” },
  { “ManagerName”: “Allen”, “ManagerEmail”: “allen@contoso.com”, “EmployeeName”: “Claire”, “EmployeeEmail”: “claire@contoso.com”, “RegionName”: “Southern California”, “IncidentId”: “in1000”, “IncidentSeverity”: “extreme”, “IncidentDescription”: “Forest Fire” }
 ],
 “updated”: [],
 “deleted”: []
}
 
If Bob was removed from the Southern Californian Region while the Forest Fire was still active, the query would generate the following output, showing that Bob’s record had been deleted from the query result:

{
 “added”: [],
 “updated”: [],
 “deleted”: [
  { “ManagerName”: “Allen”, “ManagerEmail”: “allen@contoso.com”, “EmployeeName”: “Bob”, “EmployeeEmail”: “bob@contoso.com”, “RegionName”: “Southern California”, “IncidentId”: “in1000”, “IncidentSeverity”: “extreme”, “IncidentDescription”: “Forest Fire” }
 ]
}

And then, if the severity of the Forest Fire changed from extreme to critical, the query would immediately generate the following output showing a that Claire’s result had been updated, and including what the result was both before and after the change:

{
 “added”: [],
 “updated”: [
  { 
   “before”: { “ManagerName”: “Allen”, “ManagerEmail”: “allen@contoso.com”, “EmployeeName”: “Bob”, “EmployeeEmail”: “bob@contoso.com”, “RegionName”: “Southern California”, “IncidentId”: “in1000”, “IncidentSeverity”: “extreme”, “IncidentDescription”: “Forest Fire” },
   “after”: { “ManagerName”: “Allen”, “ManagerEmail”: “allen@contoso.com”, “EmployeeName”: “Bob”, “EmployeeEmail”: “bob@contoso.com”, “RegionName”: “Southern California”, “IncidentId”: “in1000”, “IncidentSeverity”: “critical”, “IncidentDescription”: “Forest Fire” }
 ],
 “deleted”: []
}

# Potential Applications
With the ability to execute rich multi-source graph queries, maintain a perpetually up to date query result, and efficiently deliver timely notifications when changes occur, there are many potential applications for Reactive Graph, including:
1.	In existing business solutions that do not natively provide change notification functionality, or whose change notification functionality is insufficient, developers could use a Reactive Graph installation to provide these capabilities with minimal effort.  This would replace the need for the creation of polling-based solutions while providing more timely, accurate, and efficient results. Providing multiple user experiences would make this functionality available to a range of users e.g. visual query builder could provide a no-code experience, while APIs and client libraries enable pro-code developers.
2.	In new business solutions, developers can integrate Reactive Graph to enable rich consumer-driven change notifications, avoiding the need for them design and implement complex change notification capabilities that anticipate user’s future needs, or which implement broad and generic change notification capabilities that remain largely unused.
3.	In database management system like SQL Server, PostreSQL, and Azure Cosmos, Reactive Graph could be built into the service providing consumers with a new Continuous Query stored procedure capability that has both internal (stored procedure) and external Reactions for handling changes.
4.	In solutions or applications that transition entities through a well-defined set of states and there is continual need to access and/or act on those entities that are in a particular state. Continuous Queries will provide a single source of truth on which a distributed set of consumers can rely on for up-to-date results as well as change notifications to drive application / service functionality.
5.	As an alternative approach to functions or micro services when the required service logic can be expressed as a graph query and there is a clear action to take when those query results change, such as triggering a Power Automate process to send email or text messages.
6.	Query as a Service. By running a fully managed and hosted Reactive Graph it could be possible to offer a service where developers deploy individual Sources, Continuous Queries, and Reactions as billable components. This would be akin to Azure functions but centered around the concept of a Query meaning that less coding is required.
7.	Azure Function Trigger. Although Reactive Graph can already be used as triggers for Azure Functions via the Event Grid Reaction, it would be easier for developers if the Continuous Query config could be provided as part of the function configuration and have the Azure infrastructure deal with the provisioning and management of the required Sources, Continuous Queries, and Reactions.
