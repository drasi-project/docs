---
type: "docs"
title: "Change-Driven Solutions"
linkTitle: "Change-Driven Solutions"
weight: 60
related:
  tutorials:
    - title: "Getting Started (Kubernetes)"
      url: "/drasi-kubernetes/getting-started/"
    - title: "Getting Started (Server)"
      url: "/drasi-server/getting-started/"
  concepts:
    - title: "Sources"
      url: "/concepts/sources/"
    - title: "Continuous Queries"
      url: "/concepts/continuous-queries/"
    - title: "Reactions"
      url: "/concepts/reactions/"
  howto:
    - title: "Write Continuous Queries (Kubernetes)"
      url: "/drasi-kubernetes/how-to-guides/write-continuous-queries/"
    - title: "Write Continuous Queries (Server)"
      url: "/drasi-server/how-to-guides/write-continuous-queries/"
---

Drasi simplifies building change-driven solutions by letting you focus on which changes matter rather than how to detect them and process them. This page describes three approaches to using Drasi, from simple change observation to sophisticated dynamic collections. Each approach builds on the previous one, demonstrating how Drasi's capabilities can be progressively adopted.

1. [Observing Changes](#observing-changes), where you use Drasi to detect the simple creation, modification, and deletion of data elements in one or more source systems and take some action in response to those changes. This approach is the most similar to existing event-driven and change-detection solutions and is the easiest way in which to use Drasi in place of existing alternatives.
2. [Observing Conditions](#observing-conditions), where you use Drasi to detect when changes in one or more source systems cause some pre-defined condition to be met. These conditions can be simple property constraints, but more interestingly they can describe conditions that include multiple entities and the dynamic relationships that exist between them. Without Drasi, doing this requires the development of a custom service or function that periodically checks for the condition, or which takes multiple source feeds and performs checks to determine when the condition is met.
3. [Observing Collections](#observing-collections), where you use Drasi to define stateful collections of data elements that meet some criteria, for example **all orders that are ready for which there is a vehicle waiting in the curbside pickup zone** or **all employees in my team that are currently in a location that is at risk due to a high severity incident**. Using Drasi, changes to the content of these collections can be used to trigger automated processes or through real-time Reactions to dynamically update application UIs.

Each of these approaches is described in more detail in the sections below. However, it is important to understand that the only difference in these approaches is the degree to which you embrace the capabilities of Drasi. The more sophisticated approaches require you to include more Sources; write richer Continuous Queries; and take a greater dependency on Drasi's Reactions. But they also allow you to push more responsibility onto Drasi, meaning you write and maintain less code.

## Observing Changes

Most systems that provide change notifications do so by reporting every creation, update, or deletion of data entities as discrete events. For example:
- A Retail Operations system might report changes to Orders, Products, and Customers
- A Human Resources system might report changes to Employees, Teams, and Vacancies

Database change logs are the most common example--they output details of every record that is created, updated, or deleted. The problem is that these systems generate a fixed set of change notifications with schema defined at design time. Consumers must filter through potentially high volumes of changes to find the changes they care about, maintain state to understand what has actually changed, and call back to the source system if they need additional related data.

This traditional approach makes solutions brittle: the logic to filter and process changes must be written and maintained by the consumer, and requirements changes often require code changes.

Using Drasi to observe these types of changes is trivial without the need for you to write any code, or deploy and manage services to process the source change stream. For example, using the following Continuous Query subscribed to a suitable Source, you would get notified when any node with an **Incident** label was created or deleted, as well as the **before** and **after** version if an **Incident** was updated.

```cypher
MATCH (:Incident)
```

By default, this Continuous Query would return all data for each Incident, but if you want to limit the data to the specific properties required by your solution, you could assign the Incident an identifier ('i' in the example) and project desired properties using a RETURN clause:

```cypher
MATCH (i:Incident)
RETURN
  elementId(i) AS IncidentId,
  i.severity AS IncidentSeverity,
  i.description AS IncidentDescription
```

Now, with a single Continuous Query and no coding, you are dynamically detecting simple changes and generating custom change notifications on a source system that doesn't inherently support change notifications. You can use any Reaction to process the observed change in order to integrate with an external / downstream system.

## Observing Conditions

More flexible change notification systems allow consumers greater control over which events they receive so they don't have to take the entire feed and filter it themselves in stream processing systems or in code. In the simplest form this is done using event type and property filters with more advanced systems supporting rules and logical predicates. This allows you to think less about observing low level data changes and more about receiving notifications when desired conditions become true. For example, when:
- an Incident becomes critical.
- an Order becomes ready for pickup.
- a Room's temperature exceeds 80 degrees.
- the occupancy of a Store exceeds 100 people.

In Drasi, you have access to the rich and expressive Cypher and GQL languages making it trivial to implement condition-based filters. For example, the following Continuous Query generates results when an added or updated **Incident**:
- has a **type** property with the value **environmental**.
- AND has a **severity** property with the value **critical** or **extreme**.

```cypher
MATCH (i:Incident {type:'environmental'})
WHERE i.severity IN ['critical', 'extreme']
RETURN
  elementId(i) AS IncidentId,
  i.severity AS IncidentSeverity,
  i.description AS IncidentDescription
```

Going beyond simple property value filtering is also straightforward; Drasi enables you to think in terms of complex conditions that encompass multiple connected elements. For example, the following Continuous Query requires that the **Incident** have an **OCCURS_IN** Relation to a **Region**, which in turn has a **PART_OF** Relation to a **Continent**. And that the **Continent** have an **id** of 'NA'.

```cypher
MATCH
  (i:Incident {type:'environmental'})-[:OCCURS_IN]->(r:Region)-[:PART_OF]->(:Continent {id:'NA'})
WHERE
  i.severity IN ['critical', 'extreme']
RETURN
  elementId(i) AS IncidentId,
  i.severity AS IncidentSeverity,
  i.description AS IncidentDescription,
  r.name AS RegionName
```

Now, using the rich query language supported by Continuous Query and no coding, you are dynamically detecting complex conditions and generating custom change notifications on a source system that doesn't inherently support rule-based change notification. You can use any Reaction to process the observed condition in order to integrate with an external / downstream system.

## Observing Collections

Many software solutions are built to enable people to manage, or even fully automate, the day-to-day operations or processes of a business. In general, such systems enable people and organizations to manage and manipulate collections of things in order to transition the individual things from one state (or collection of things) to another. For example:
- In an e-commerce system:
  - There are new customer orders. These need products to be picked from stock to fill the order.
  - Once picked, orders need to be packed and prepared for dispatch.
  - Once prepared, the orders need to be dispatched through various delivery options.
  - Once dispatched, the orders need to be tracked until delivery.
  - Once the Order is delivered, it is complete, unless the customer has an issue, in which case a customer support process is initiated...
- In a patient management system:
  - On any given day there are a collection of patients with appointments scheduled.
  - When a scheduled patient arrives they sit in the waiting area and go into a queue to be seen.
  - When the doctor becomes free and they are next in the queue, they go to see the doctor.
  - Once the doctor is finished, they go into a checkout process, where tests/follow-up visits are organized and payment is collected.
  - Finally the patient leaves and their visit is complete.

When implementing these kind of system, it is common to both need to get the current things in a given state (or collection) and to know when the collection changes so that processes can be started, UIs updated, and integrated systems notified. Modern databases make it easy to identify the things currently in a collection through simple queries or views, but they generally do not provide the capability to notify the consumer when the things in the collection change. So developers end up building custom change detection / notification solutions, processing low level change feeds, or polling the database periodically for the latest data.

Drasi provides a new opportunity for creating query-based dynamic collections with integrated change notifications that can power these types of change-driven solutions. A new architectural building block that encapsulates the need for a query-based collection and the dynamic notification when the collection changes. A building block that requires no code and is consistent in its application across many types of data sources. But using this new building block requires that you think about your solution as a set of dynamic collections and how to react to the changes when they occur.

For example, the following Continuous Query maintains a collection of all Employees currently located in Buildings that are in Regions where there are active high risk Incidents.

```cypher
MATCH
  (e:Employee)-[:ASSIGNED_TO]->(t:Team),
  (m:Employee)-[:MANAGES]->(t:Team),
  (e:Employee)-[:LOCATED_IN]->(:Building)-[:LOCATED_IN]->(r:Region),
  (i:Incident {type:'environmental'})-[:OCCURS_IN]->(r:Region)
WHERE
  elementId(e) <> elementId(m) AND i.severity IN ['critical', 'extreme'] AND i.endTimeMs IS NULL
RETURN
  m.name AS ManagerName, m.email AS ManagerEmail,
  e.name AS EmployeeName, e.email AS EmployeeEmail,
  r.name AS RegionName,
  elementId(i) AS IncidentId, i.severity AS IncidentSeverity, i.description AS IncidentDescription
```

The collection is updated dynamically when Employees change locations or Incidents change severity. It generates notifications both when new Employees become at risk, and when Employees are no longer at risk. And you can hook this up to alerting and management systems using Reactions with very little code so that people in the organization can make checks or arrangements to deal with Employees at risk.

In addition, using Drasi's SignalR or SSE Reactions, applications can drive their entire UI by effectively binding it to the results of a Continuous Query.

## Change-Enabled Systems
In addition to the three approaches for using Drasi to build change-driven solutions, which are focused on the detection and processing of change in existing systems, you might also consider adopting Drasi if you are creating a system that you want to be a **source of change** for other systems to observe. Under such circumstances, you might consider Drasi as an alternative to implementing your own change notification solution. Just as most people do not implement their own database, messaging infrastructure, or web framework, using Drasi means you do not need to implement your own change notification solution. Instead, as part of your overall solution, you could provision a Drasi deployment and instruct downstream developers to use it to observe and react to changes from your system. You are freed from a great deal of design and development and the downstream developers get a richer and more flexible way to detect and react to change in your system.