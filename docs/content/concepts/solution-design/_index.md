---
type: "docs"
title: "Solution Design"
linkTitle: "Solution Design"
weight: 40
description: >
    How to Design Solutions with Drasi
---

Drasi provides capabilities that exceed most existing change notification solutions. As a Solution Developer, there are multiple approaches you can take to use Drasi depending on what you need to achieve and how you choose to model the data and services in your solution. When starting to learn how to adopt Drasi, it can be useful to think in terms of the following 3 increasingly sophisticated approaches:
1. [Observing Changes](#observing-changes), where you use Drasi to detect the simple creation, modification, and deletion of data elements in one or more source systems and take some action in response to those changes. This approach is the most similar to existing change notification solutions and is the easiest way in which to use Drasi in place of existing alternatives.
1. [Observing Conditions](#observing-conditions), where you use Drasi to detect when changes in one or more source systems cause some pre-defined condition to be met. These conditions can be simple property constraints, but more interestingly they can describe conditions that include multiple entities and the dynamic relationships that exist between them. Without Drasi, doing this requires the development of a custom service or function that periodically checks for the condition, or which takes multiple source feeds and performs checks to determine when the condition is met.
1. [Observing Collections](#observing-collections), where you use Drasi to define stateful collections of data elements that meet some criteria, for example **all orders that are ready for which there is a vehicles waiting in the curbside pickup zone** or **all employees in my team that are currently in a location that is at risk due to a high severity incident**. Using Drasi, changes to the content of these collections can be used to trigger automated processes or through SignalR to dynamically update application UIs.

Each of these approaches is described in more detail in the linked sections below. However, it is important to understand that the only difference in these approaches is the degree to which you embrace the capabilities of Drasi. The more sophisticated approaches require you to include more Sources; write richer Continuous Queries; and take a greater dependency on the no-code Reactions. But they also allow you to push more responsibility onto Drasi, meaning you write and maintain less code.

**In addition** to these three approaches, which are focused on the detection and processing of change in existing systems, you might also consider adopting Drasi if you are creating a solution that you want to be a source of change for other systems to observe. Under such circumstances, you might consider Drasi as an alternative to implementing your own change notification solution. Just as most people do not implement their own database, messaging infrastructure, or web framework, using Drasi means you do not need to implement your own change notification solution. Instead, as part of your overall solution, you could provision a Drasi deployment and instruct downstream developers to use it to observe and react to changes from your system. You are freed from a great deal of work (as described in the [Background](/solution-developer/background) section) and the downstream developers get a richer and more flexible way to detect and react to change in your system.

## Observing Changes
Most systems that provide the capability for you as a Solution Developer to react to change do so by propagating events/messages that describe the basic creation, update, or deletion of some data entity that is modeled in the system. For example: 
- a Retail Operations system might generate create, update, and delete events related to:
  - Orders
  - Products
  - Customers
- a Human Resources system might generate create, update, and delete events related to:
  - Employees
  - Teams
  - Vacancies

Database change logs are an obvious examples of this approach that simply output the details of every entity/record that is created, updated, or deleted. Many other software system that generate change events follow a similar approach, but when the change events are generated in custom services and components, the system can generate change events for higher level domain objects or include data for closely related entities in a single event making them easier and more efficient to consume (e.g. an order with customer and product details).

However, the source system generates a fixed set of events with schema defined by the developer at design time. To maximize the utility of these events, the developer often adopts a very generic but broad event taxonomy, creating similar events for large numbers of data types, even if there is no specific use case for their creation. It becomes the responsibility of the consumer to decide what to do with the potentially high volume of change events, including which events can be ignored and which to process. The logic to filter and process the required changes must be written and maintained by the consumer, usually in a service or function. And if the consumer needs more information related to a specific change, they must call back into the source system to get it, somehow dealing with the possibility that the source data has changed during the time between the change event and the consumer querying for more data.

Using Drasi to observe these types of changes is trivial without the need for you to write any code, or deploy and manage services to process the source change stream. For example, using the following Continuous Query named **observe-incident**, which is subscribed to the **risk-mgmt** Source, you would get notified when any Node with an **Incident** label was created or deleted, as well as the **before** and **after** version if an **Incident** was updated.

```
apiVersion: v1
kind: ContinuousQuery
name: observe-incident
spec:
  sources:    
    subscriptions:
      - id: risk-mgmt
  query: > 
    MATCH
      (:Incident)
```

By default, this Continuous Query will return all data for each Incident, but if you want to limit the data to select properties, you could assign the Incident an identifier ('i' in the example) and project desired properties using a RETURN clause, like this:

```
apiVersion: v1
kind: ContinuousQuery
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
More flexible change notification systems allow consumers greater control over which events they receive so they don't have to take the entire feed and filter it themselves in code. In the simplest form this is done using event type and property filters with more advanced systems supporting rules and logical predicates. This allows you to think less about observing low level data changes and more about receiving notifications when desired conditions become true. For example, when:
- an Incident becomes critical.
- an Order becomes ready for pickup.
- a Room's temperature exceeds 80 degrees.
- the occupancy of a Store exceeds 100 people.

In Drasi, you have access to the rich and expressive Cypher language making it trivial to implement condition-based filters. For example, the following Continuous Query generates results when an added or updated **Incident**:
- has a **type** property with the value **environmental**.
- has a **severity** property with the value **critical** or **extreme**.

```
apiVersion: v1
kind: ContinuousQuery
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

Going beyond simple property value filtering is also straightforward; Drasi enables you to think in terms of complex conditions that encompass multiple connected elements. For example, the following Continuous Query requires that the **Incident** have an **OCCURS_IN** Relation to a **Region**, which in turn has a **PART_OF** Relation to a **Continent**. And that the **Continent** have an **id** of 'NA'.

```
apiVersion: v1
kind: ContinuousQuery
name: observe-incident
spec:
  sources:    
    subscriptions:
      - id: risk-mgmt
  query: > 
    MATCH
      (i:Incident {type:'environmental'})-[:OCCURS_IN]->(r:Region)-[:PART_OF]->(:Continent {id:'NA'}) 
    WHERE
      i.severity IN [‘critical’, ‘extreme’]
    RETURN 
      elementId(i) AS IncidentId, 
      i.severity AS IncidentSeverity, 
      i.description AS IncidentDescription,
      r.name AS RegionName
```

Now, using the rich Cypher language supported by Continuous Query and no coding, you are dynamically detecting complex conditions and generating custom change notifications on a source system that doesn’t inherently support rule-based change notification.

## Observing Collections
Many software solutions are built to enable people to manage, or even fully automate, the day-to-day operations or processes of a business. In general, such systems enable people and organizations to manage and manipulate collections of things in order to transition the individual things from one state (or collection of things) to another. For example:
- In an e-commerce system:
  - There are new customer orders. These need to be picked from stock.
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

When implementing these kind of system, it is common to both need to get the current things in a given state (or collection) and to know when the collection changes so that processes can be started, UIs updated, and integrated systems notified. Modern databases make it easy to track and retrieve the things currently in a collection through simple queries or views, but they do not provide the capability to notify the consumer when the things in the collection change. So developers build custom change notification solutions, processing low level change feeds, or poll the database periodically.

Drasi provides a new opportunity for creating query-based dynamic collections with integrated change notifications that can power these types of business solutions. A new architectural building block that encapsulates the need for a query-based collection and the dynamic notification when the collection changes. A building block that requires no code and is consistent in its application across many types of data sources. But using this new building block requires that you think about your solution as a set of dynamic collections and how to react to the changes when they occur.

For example, the following Continuous Query maintains a collection of all Employees currently located in Buildings that are in Regions where there are active high risk Incidents. 

```
apiVersion: v1
kind: ContinuousQuery
name: observe-incident
spec:
  sources:    
    subscriptions:
      - id: risk-mgmt
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
The collection is updated dynamically when Employees change locations or Incidents change severity. It generates notifications both when new Employees become at risk, and when Employees are no longer at risk. And you can hook this up to alerting and management system using Reactions with very little code so that people in the organization can make checks or arrangement to deal with Employees at risk.

In addition, using the SignalR Reaction, applications can drive their entire React UI by effectively binding the UI to the results of a Continuous Query. See the Curbside Pickup and Building Comfort sample applications for examples of how to do this.

## Reacting to Change
The sections above present increasingly sophisticated approaches in how to use Drasi's change detection capabilities. The other aspect of Drasi to discuss is how to react to change. In Drasi, the results of Continuous Queries are always handled by Reactions. Drasi provides a standard set of Reactions that you can use with just configuration. Some of these Reactions simply forward the Continuous Query results using standard messaging infrastructure so you can consume the results with your custom services, functions, and applications. 

However, other Reactions are design to allow to to run commands using the query result data as input to a set of configurable commands. This means under certain circumstances, you can simply avoid the development of intermediate services.

Another alternative is to create a custom reaction, so your custom code would be deployed as part of the solution and it would live entirely on the Drasi environment.

## When Not to Use Drasi
There are, of course, situations where it does not make sense to use Drasi, or where you need to carefully consider the benefits and disadvantages of other alternatives. Some of these situations are related to the current experimental status of Drasi but some are related to the challenges or complexities of specific environments or data models. Here are a few examples:

- If a source system already has a mature change notification capability, it might be a more suitable choice. This is particularly true if the system's underlying data model is extremely complicated and the events it generates significantly abstract the complexity away from the consumer. It might be easier to consume the in-built events and/or the in-built eventing mechanism might be optimized for the systems data-model.
- When your Continuous Query includes data types for which there is a lot of data. Drasi will create an optimized index of the data it needs from the source system, but if there are millions of nodes/records that need to be bootstrapped and index, you should consider the cost/benefit of the query you are considering.
- If you really want to do stream analytics or streaming data transformation over high volume data streams there are technologies optimized for these use cases.