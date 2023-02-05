---
type: "docs"
title: "Solution Patterns"
linkTitle: "Solution Patterns"
weight: 50
description: >
    How to Design Solutions with Drasi
---

Drasi provides capabilities that exceed most existing change notification solutions. As a Solution Developer, there are multiple approaches you can take to use Drasi depending on what you need to achieve and how you choose to model the data and services in your solution. When starting to learn how to use Drasi, it can be useful to think in terms of the following 3 increasingly sophisticated approaches:
1. [Observing Changes](#observing-changes), where you use Drasi to detect the simple creation, modification, and deletion of data elements in one or more source systems and take some action in response to those changes. This approach is the most similar to existing change notification solutions and is the easiest, but least valuable, way in which to use Drasi.
1. [Observing Conditions](#observing-conditions), where you use Drasi to detect when changes in one or more source systems cause some pre-defined condition to be met. These conditions can be simple property constraints, but more interestingly they can describe conditions that include multiple entities and the dynamic relationships that exist between them. Without Drasi, doing this usually requires the development of a custom service or function that periodically checks for the condition, or which takes multiple source feeds and performs checks to determine if the condition is met.
1. [Observing Collections](#observing-collections), where you use Drasi to define collections of data elements that meet some criteria, and you use those collections and the changes to those collections over time to drive your solution behavior. For example, using Drasi and a simple query to dynamically identify **all orders that are ready for which there is a vehicles waiting in the curbside pickup zone** or **all employees in my team that are currently in a location that is at risk due to a high severity incident**. Changes to the content of these collections can be used to trigger automated processes or through SignalR to dynamically update application UIs.

Each of these approaches is described in more detail in the linked sections below. However, it is important to understand that the only difference in these approaches is the degree to which you embrace the capabilities of Drasi. The more sophisticated approaches require you to include more Sources; write richer Continuous Queries; and take a greater dependency on the no-code Reactions. But they also allow you to push more responsibility onto Drasi, meaning you write and maintain less code.

**In addition** to these three approaches, which are focused on the detection and processing of change in existing systems, you might also consider adopting Drasi if you are creating a solution that you want to be a source of change for other systems to observe. Under such circumstances, you might consider Drasi as an alternative to implementing your own change notification solution. Just as most people do not implement their own database, messaging infrastructure, or web framework, using Drasi means you do not need to implement your own change notification solution. Instead, as part of your overall solution, you could provision a Drasi deployment and instruct downstream developers to use it to observe and react to changes from your system. You are freed from a great deal of work (as described in the [Background](/solution-developer/background) section) and the downstream developers get a richer and more flexible way to detect and react to change in your system.

## Observing Changes
Most systems that provide the capability for you as a Solution Developer to react to change do so by propagating events/messages that describe the basic creation, update, or deletion of some data entity that is modelled in the system. For example: 
- a Retail Operations system might generate create, update, and delete events related to:
  - Orders
  - Products
  - Customers
- a Human Resources system might generate create, update, and delete events related to:
  - Employees
  - Teams
  - Contractors

Database change logs are an obvious examples of this approach that simply output the details of every entity/record that is created, updated, or deleted. Many other software system that generate change events follow a similar approach, but because the change events are generated in custom services and components, the system can generate change events for higher level domain objects or include data for parent and child entities in a single event, not just the lower level data that are directly represented in the underlying database.

In this approach, the source system generates a fixed set of events with schema defined by the system developer at design time. To maximize the utility of these events, the system developer often adopts a very generic but broad event taxonomy, creating similar events for large numbers of data types, even if there is no specific use case for their creation. It becomes the responsibility of the consumer to decide what to do with the potentially high volume of change events, including which events can be ignored and which to process. The logic to filter and process the required changes must be written and maintained by the consumer, usually in a service or function. And if the consumer needs more information, they must call back into the source system to get it, dealing with the possibility that the source data has changed during the time between the change event and the consumer querying for more data.

Drasi can support this simple case by you:
1. Creating a Source to connect to the source database/system.
1. Creating a Continuous Query that identifies the type of elements you want to observe changes in
1. Creating a Reaction to forward the changes to your software e.g. an EventGrid Reaction.

All of this is done without the need for you to write any code, or deploy and manage services to process the source change stream.

For example, using the following Continuous Query named **observe-incident**, you would get notified of all nodes in the **risk-mgmt** Source with an **Incident** label that are created or deleted, as well as the **before** and **after** version if an **Incident** changed.

```
apiVersion: query.reactive-graph.io/v1
kind: ContinuousQuery
metadata:
  name: observe-incident
spec:
  sources:    
    subscriptions:
      - id: risk-mgmt
  query: > 
    MATCH
      (:Incident)
```

Using an EventGrid Reaction, this is what the solution would look like:

{{< figure src="observe-changes.png" alt="Observe CHanges" width="70%" >}}

By default, this will return all data for each Incident, but if you want to limit the data to select properties, assign the Incident an identifier ('i' in the example) and specify a RETURN clause, like this:

```
apiVersion: query.reactive-graph.io/v1
kind: ContinuousQuery
metadata:
  name: observe-incident
spec:
  sources:    
    subscriptions:
      - id: risk-mgmt
  query: > 
    MATCH
      (i:Incident)
    RETURN
      elementId(i) AS IncidentId, 
      i.severity AS IncidentSeverity, 
      i.description AS IncidentDescription
```

Now, with a single Continuous Query and no coding, you are dynamically detecting simple changes and generating custom change notifications on a source system that doesn't inherently support change notification.

## Observing Conditions
More flexible change notification systems allow consumers greater control over which events they receive so they don't have to take the entire feed and filter it themselves in code. In the simplest form this is done using property filters or predicates. These enables scenarios where you can be notified when certain conditions are true. For example, when an Incident is critical, or an order is ready for pickup.

In Drasi, you have access to the rich and expressive Cypher language making it trivial to implement condition-based filters. For example, the following Continuous Query still outputs results for added, updated, and deleted **Incidents** but it only includes **Incidents** that meet the following criteria:
- has a **type** property with the value **environmental**.
- has a **severity** property with the value **critical** or **extreme**.

```
apiVersion: query.reactive-graph.io/v1
kind: ContinuousQuery
metadata:
  name: observe-incident
spec:
  sources:    
    subscriptions:
      - id: risk-mgmt
  query: > 
    MATCH
      (i:Incident {type:'environmental'})
    WHERE
      i.severity IN [‘critical’, ‘extreme’]
    RETURN 
      elementId(i) AS IncidentId, 
      i.severity AS IncidentSeverity, 
      i.description AS IncidentDescription
```

But, going beyond simple property value matching, Drasi enables you to think in terms of complex conditions that encompass multiple connected elements. For example, the following Continuous Query requires that the **Incident** be connected to a **Region** through a Relation with an **OCCURS_IN** label, which in turn is connected to a **Continent** through a Relation with a **PART_OF** label. And that the **Continent** have an id of na.

```
apiVersion: query.reactive-graph.io/v1
kind: ContinuousQuery
metadata:
  name: observe-incident
spec:
  sources:    
    subscriptions:
      - id: risk-mgmt
  query: > 
    MATCH
      (i:Incident {type:'environmental'})-[:OCCURS_IN]->(r:Region)-[:PART_OF]->(:Continent {id:'na'}) 
    WHERE
      i.severity IN [‘critical’, ‘extreme’]
    RETURN 
      elementId(i) AS IncidentId, 
      i.severity AS IncidentSeverity, 
      i.description AS IncidentDescription,
      r.name AS RegionName
```

## Observing Collections
Continuous Queries maintain a perpetually accurate query result and distribute detailed records describing how that result set changes over time in response to source system changes. This enables downstream consumers of these CQs to confidently drive business logic within services, and even down to UIs.

For example, using the following query you know at any point in time the employees at risk. And you know when new employees become at risk, and when they leave the risk. You can hook this up to alerting and management system so that people in the organization can make checks or arrangement to deal with risk.

XXXX

The Curbside Pickup and Building Comfort demos drive their entire React UI by effectively binding the UI to CQs and relying on the SignalR Reaction to forward change details to the React Component.

This is the query for Curbside.


## When Not to Use Drasi
There are, of course, situations where it does not make sense to use Drasi, or where you need to carefully consider the benefits and disadvantages of other alternatives. Some of these situations are related to the current experimental status of Drasi but some are related to the challenges or complexities of specific environments or data models. Here are a few examples:

- If a source system already has a mature change notification capability, it might be a more suitable choice. This is particularly true if the system's underlying data model is extremely complicated and the events it generates significantly abstract the complexity away from the consumer. It might be easier to consume the in-built events and/or the in-built eventing mechanism might be optimized for the systems data-model.
- When you need to take action when something didn't happen. Drasi relies on changes in source systems to activate it, if something doesn't happen, there is no trigger.
- When your Continuous Query includes data types for which there is a lot of data. Drasi will create an optimized index of the data it needs from the source system, but if there are millions of nodes/records that need to be bootstrapped and index, you might need to consider the cost/benefit of the query you are considering.
- If you really want to do stream analytics or streaming data transformation over high volume data streams there are technologies optimized for these use cases.