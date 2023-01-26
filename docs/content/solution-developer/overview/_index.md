---
type: "docs"
title: "Overview"
linkTitle: "Overview"
weight: 1
description: >
    Drasi for Solution Developers
---

**We created Drasi because we believe, the ability to observe systems, detect changes, and react dynamically to those changes is fundamentally too hard and is an area that is ready for disruption.**

To use Drasi as part of a solution you must do the following three things:

1. Define [Sources](/solution-developer/sources) for each of the source databases or systems from which you want to detect and react to change.
1. Define [Continuous Queries](/solution-developer/continuous-queries) for each of the queries you want to run across those sources.
1. Define [Reactions](/solution-developer/reactions) to handle the output from each of your Continuous Queries. Either handling the change in the Reaction, or using the Reaction to push the change into your broader solution for processing by your application, service, or function logic.

Each of these steps is straightforward to configure and is documented in the linked section. The Drasi repo also includes multiple [Sample Applications](/solution-developer/sample-apps/) that are fully functional solutions that demonstrate the use of Drasi in realistic scenarios.

However, as with many new technologies, the challenge to getting started with Drasi can be less about how to use it, and more about understanding **why** and **when** to use it. The following sections explore the challenges Drasi was created to solve and describes why and when you might choose to use Drasi over existing alternatives.

## Why and When to Use Drasi

The world is complex and constantly changing. Organizations create ever more sophisticated software systems in an effort to model, reason about, and manage their physical assets and operational activities. The data managed by these software systems can be large and complex, in some instances containing millions of digital entities that represent real-world things like people, vehicles, products, orders, processes, and incidents. These systems can also contain millions of relationships between entities that describe how things in the real world are physically or logically related to each other

As the world changes, the data must also change, resulting in the continual creation and deletion of entities, modifications to the properties that represent the state of the entities, and the creation and deletion of relationships between entities. In large systems, the frequency and volume of change can be very high. 

### The Problem
Being able to react dynamically when this data changes is increasingly important to organizations that want to improve productivity and operational efficiency through the creation of more integrated and responsive software solutions across and between organizations.

Some software systems are designed with built-in change notification capabilities that enable cascading updates within the system or external consumers to observe changes as they occur and react accordingly. But building such systems is difficult and time consuming. For example, if you want to include change notification capabilities in a system you are building, you will need to decide:
- Which actions or operations in your system generate events (i.e an event taxonomy). For a large system there could be hundreds or thousands of actions for which you need to generate events.
- What data to use to describe those changes (i.e. an event schema). This could be very generic using a single schema for all events, or require different schema for different event types.
- Which components and services in your system will generate events and under what circumstances.
- How to distribute the events reliably and efficiently at a scale to meet expected consumer demands.
- How to enable consumer systems to register interest in the events your system generates. The more flexible you make this, by supporting filters and rich query capabilities, the more complex it becomes.
- How to secure your system so that the events you are generating are only accessible to authorized consumers.
- How to test the event generation and distribution.
- How to monitor the eventing functionality and supporting infrastructure in production.
- How to educate developers in the use of your eventing capabilities and make it easy for them to use.

Doing all this successfully (in addition to delivering the system’s primary functionality) requires the developer to have good data modelling skills, a deep understanding of event driven architectures, and experience with messaging infrastructure technology. All of this is in addition to skills in their domain of expertise, like financial services or life sciences. As such, many systems do not include change notification capabilities, or have very simplistic implementations that provide limited value to the developers trying to use them.

Further, observing and reacting to software systems that were not originally designed to generate change notifications presents additional challenges for developers. While the developer still needs to address many of the concerns outlined previously, they must also solve the problem of detecting when changes occur in the source systems. If they are unable to modify the system source code to update components and services to generate change notifications, as is often the case when dealing with third-party or legacy systems, the developer must implement a complex and inefficient work around such as:
- periodically querying (i.e. polling) the source system and comparing results to detect changes over time.
- processing the source change feed and determining, often with complex logic, which low-level changes are relevant.

While there are established patterns and technologies that help developers deal with each of these challenges, the knowledge, skills, and time taken to implement them effectively at scale are beyond the capabilities of many people and organizations. 

### The Solution
Drasi is a **Data Change Processing** infrastructure that makes it easier to build dynamic solutions that detect and react to change in source systems. As illustrated in the diagram below, Drasi processes change logs from source systems and enables you to run Continuous Queries across the changing data. When changes occur that affect the Continuous Query result, Drasi pushes the result updates to one or more Reactions that are subscribed to the Continuous Query. These Reactions can act on the updates themselves, use them to update a source system, or forward the updates to your apps and services for processing.

 ![Solution Overview](end_to_end.png)

Drasi provides capabilities that most existing change event/notification solutions do not, including:
- The ability to use Continuous Queries, which are rich declarative graph queries written in the Cypher Query Language, to both describe the changes you want to detect and the way you want to describe those changes. 
- The ability to write Continuous Queries that incorporate data from multiple sources, even if the data from those sources has no natural connection and uses different data schema.
- Out of the box support for multiple source systems including Azure Cosmos Gremlin API, PostgreSQL, and Kubernetes. And integration with the rich Change Data Capture ecosystem provided by the open source Debezium project.
- Out of the box Reactions that use Continuous Query result updates to run commands on source systems, or forward them using existing messaging infrastructure such as Azure Event Grid.
- The ability to write custom Reactions (and Sources in the future).


As a Solution Developer, there are multiple approaches you can take to use Drasi depending on what you need to achieve and how you choose to model the data and services in your solution. When starting to learn how to use Drasi, it can be useful to think in terms of the following 3 increasingly sophisticated approaches:
1. **Observing Changes**, where you use Drasi to detect the simple creation, modification, or deletion of data elements in one or more source systems and take some action in response to those changes.
1. **Observing Conditions**, where you use Drasi to detect when changes in one or more source systems cause some pre-defined condition, often including multil to be met and take some action in response.
1. **Observing Collections**, where you use Drasi to define collections of data elements that meet some criteria, and you use those collections and the changes to those collections over time to drive your solution behavior.

Each of these approaches is described in more detail in the below. However, it is important to understand that the only difference in these approaches is the degree to which you embrace the capabilities of Drasi. The more sophisticated approaches often require you to include more sources and/or write richer queries, but they also allow you to push more responsibility onto Drasi, meaning you write and maintain less code.

The 3 approaches above are focused on the observation of data from an existing source system were your solution is the consumer. You might also consider adopting Drasi if you are creating a solution that you expect other systems will need to observe for change. Under such circumstances, you might consider Drasi as an alternative to implementing your own eventing solution. Just as most people do not implement their own database, messaging solution, or web framework, using Drasi means you do not need to implement your own Change Detection and Response solution. Instead, as part of your overall solution, you could provision a Drasi deployment and instruct downstream developers to use it to observe and react to changes from your system. You are freed from a great deal of work and the downstream developers get a richer and more flexible way to observe your system.

## Approaches
### Observing Changes
Most systems that provide the capability for you as a Solution Developer to observe and react to change do so by propagating events (sometimes called notifications) that describe the creation, deletion, or update to some data entity that is modelled in the system. For example: 
- a Retail Operations system might generate create, update, and delete events related to:
  - Orders
  - Products
  - Customers
  - Deliveries
  - Invoices
- a Human Resources system might generate create, update, and delete events related to:
  - Employees
  - Teams
  - Contractors

Database change logs are an obvious examples of this approach; they simply output the details of the entity/record that was created, updated, or deleted. It is the responsibility of the consumer to decide what to do with those changes, including which events can be ignored and which to process.

But this is also the approach with many systems. Although they may contain events that are more related to the domain (not dependent on the underlying data model), the events are often of a fixed schema and represent a single change to a single element.

Drasi can be used to handle this simple case by:
1. Creating a Source to handle the source
2. Creating a Continuous Query that describes the elements you want
3. Reactions

The CQ in this instance would be very somple:

```
MATCH [:Order]
```

But if you wanted to resshape the output, it is a s simple as:

```
MATCH [o:Order]
RETURN 
  o.id AS OrderNumber,
  o.customerId AS CustomerId
  o.total AS OrderTotal
```


### Observing Conditions
More flexible systems allow consumers greater control over which events they received, this is often done using filters or rules. The consumer only reveis events that match the rules criteria. 

In RG you have the ability to specify 
- graph
- properties
- connects that dont exist in the source data
- aggregates

### Observing Collections
Each time a Source propagates a change into Drasi, the change is evaluated by each Continuous Query and the impact of the change on the query result is calculated. This means at any point in time, each Continuous Query has an accurate result, and for each change the COntinuous Query generates a descriptions of exactly which result elements where added, updated, or deleted.

As a Solution Developer, this enables you to think in terms of dynamic collections defined using rich declarative queries that you can incorporate into your solution.

It might help to think of these as 
For example, 

### AND ALSO
The 3 approaches above are focused on the observation of data from an existing source system were your solution is the consumer. You might also consider adopting Drasi if you are creating a solution that you expect other systems will need to observe for change. 

Under such circumstances, you might consider Drasi as an alternative to implementing your own eventing solution. Just as most people do not implement their own database, messaging solution, or web framework, using Drasi means you do not need to implement your own Change Detection and Response solution. Instead, as part of your overall solution, you could provision a Drasi deployment and instruct downstream developers to use it to observe and react to changes from your system. You are freed from a great deal of work and the downstream developers get a richer and more flexible way to observe your system.


## Why and When Not to Use Drasi
There are, of course, situations where it does not make sense to use Drasi, or where you need to carefully consider the benefits and disadvantages of other alternatives. Some of these situations are related to the current experimental status of Drasi but some are related to the challenges or complexities of specific environments or data models. Here are a few examples:

- The Drasi Preview is a prototype and is only suitable for experimentation, not for production systems. This will change over time as Drasi matures.
- If a source system already has a mature change notification capability, it might be a more suitable choice. This is particularly true if the system's underlying data model is extremely complicated and the events it generates significantly abstract the complexity away from the consumer. It might be easier to consume the in-built events and/or the in-built eventing mechanism might be optimized for the systems data-model.
- When you need to take action when something didn't happen. Drasi relies on changes in source systems to activate it, if something doesn't happen, there is no trigger.





