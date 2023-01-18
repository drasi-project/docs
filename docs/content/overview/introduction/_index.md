---
type: "docs"
title: "Introduction"
linkTitle: "Introduction"
weight: 1
description: >
    What is Reactive Graph and what problem does it solve?
---

**The Reactive Graph Preview is a prototype and is only suitable for experimentation, not for production systems.**

## The Problem
The world is complex and constantly changing. Organizations create ever more sophisticated software systems in an effort to model, reason about, and manage their physical assets and operational activities.  Examples of highly complex software systems are common in the following domains:
- Enterprise Resource Planning
- Supply Chain Management
- Logistics and Transportation
- Facilities Management
- Manufacturing Control

The data managed by these software systems can be large and complex, in some instances containing millions of digital entities that represent real-world things like people, vehicles, products, orders, processes, and incidents. These systems can also contain millions of relationships between entities that describe how things in the real world are physically or logically related to each other, for example a Car is made from a set of Components whereas a Team includes a collection of People.

Because the world is constantly changing, the digital representations of real-world things must also change. In software systems, this results in the creation and deletion of entities, changes to the properties that represent the state of the entities, and the creation and deletion of relationships between entities. In large systems, the frequency and volume of change can be very high.

There exist a variety of architectural approaches and technologies to meet the scale and performance requirements of such software systems with respect to the representation, storage, modification, and retrieval of data. But being able to react dynamically when data changes is increasingly important to organizations that want to improve productivity and operational efficiency through the creation of more integrated and responsive software solutions.

Some software systems are designed with built-in change notification capabilities that enable cascading updates within the system or external consumers to observe changes as they occur and react accordingly. But building such systems is difficult and time consuming. If you want to build event generation capabilities in a system you are building, you will need to decide:
- Which actions or operations in your system generate events (i.e an event taxonomy). For a large system there could easily be hundreds of actions you for which you could generate events.
- What data to use to describe those changes (i.e. an event schema). This could be very generic using a single schema for all events, or require different schema for different event types.
- Which components and services in your system will generate events and under what circumstances.
- How to distribute the events reliably and efficiently at a scale to meet expected consumer demands.
- How to enable consumer systems to register interest in the events your system generates. The more flexible you make this (e.g. supporting filters and rich queries), the more complex it becomes.
- How to secure your system so that the events you are generating are only accessible to authorized systems.
- How to test the event generation.
- How to monitor the eventing functionality and infrastructure in production.
- How to educate developers in the use of your eventing capabilities and make it easy for them to use.

In all, this is a great deal of work to design, implement, and maintain and requires a deep understanding of data modeling and messaging techniques and technologies. Doing all this successfully (in addition to delivering the system’s primary functionality) requires the developer to have good data modelling skills, a good understanding of event driven architectures, and experience with messaging infrastructure technology. All of this is in addition to skills in their domain of expertise, like financial services or life sciences. As such, many systems do not include such capabilities, or have very simplistic implementations.

Observing and reacting to software systems that were not originally designed to generate change notifications presents additional challenges for developers. While they still need to address all the concerns outlined previously, they must also solve the problem of detecting when changes occur. If they are unable to modify the system source code to update components and services to generate change notifications, as is often the case when dealing with third-party or legacy systems, the developer must implement complex work arounds like database polling and change log mining.

Without Reactive Graph, if you want to observe and react to change in a source system that does not implement its own change event/notification functionality, you will be forced to do one of the following:
- Periodically query (AKA query polling) the source and compare results to detect changes over time.
- Process the source change feed and determine which low-level changes are relevant.

While there are established patterns and technologies that help developers deal with each of these challenges, the knowledge, skills, and time taken to implement them effectively at scale are beyond the capabilities of many people and organizations. 

**We believe, the ability to observe source systems, detect specific changes, and react dynamically to those changes is fundamentally too hard and is an area that is ready for disruption.**

## The Solution
Reactive Graph is a **Data Change Detection and Distribution** infrastructure that makes it easier to build dynamic solutions that observe and react to change in source systems. As illustrated in the diagram below, Reactive Graph processes change logs from source systems and enables you to run Continuous Queries across the changing data. When changes occur that affect the Continuous Query result, Reactive Graph pushes the result updates to one or more Reactions that are subscribed to the Continuous Query. These Reactions can act on the updates themselves, use them to update a source system, or forward the updates to your apps and services for processing.

 ![Complex Flow](complex_services.png)

As a Solution Developer, there are multiple approaches you can take to use Reactive Graph depending on what you need to achieve and how you choose to model the data and services in your solution. When starting to learn how to use Reactive Graph, it can be useful to think in terms of the following 3 increasingly sophisticated approaches:
1. **Observing Changes**, where you use Reactive Graph to detect the creation, modification, or deletion of data elements in one or more source systems and take some action in response to those changes.
1. **Observing Conditions**, where you use Reactive Graph to detect when changes in one or more source systems cause some pre-defined condition to be met and take some action in response.
1. **Observing Collections**, where you use Reactive Graph to define collections of data elements that meet some criteria, and you use those collections and the changes to those collections over time to drive your solution behavior.

Each of these approaches is described in more detail in the [Continuous Queries](/solution-developer/continuous-queries) section. However, it is important to understand that the only difference in these approaches is the degree to which you embrace the capabilities of Reactive Graph. The more sophisticated approaches often require you to include more sources and/or write richer queries, but they also allow you to push more responsibility onto Reactive Graph, meaning you write and maintain less code.

The 3 approaches above are focused on the observation of data from an existing source system were your solution is the consumer. You might also consider Reactive Graph if you are creating a solution that you expect other systems will need to observe for change. For example, if you are building an Order management system, you might want to generate events when orders are placed or cancelled so that other systems in your business can take some action.

Under such circumstances, you might consider Reactive Graph as an alternative to implementing your own eventing solution. Just as most people do not implement their own database, messaging solution, or web framework, using Reactive Graph means you do not need to implement your own Change Detection and Distribution solution. Instead, as part of your overall solution, you could provision a Reactive Graph deployment and instruct downstream developers to use it to observe and react to changes from your system. You are freed from a great deal of work and the downstream developers get a richer and more flexible way to observe your system.

Even if the source you want to observe does implement its own change event/notification functionality, Reactive Graph provides capabilities that most embedded event/notification solutions do not, including:
- The ability to describe the changes you want to observe as Continuous Queries, which are rich declarative graph queries written in the Cypher Query Language.
- The ability to write Continuous Queries that incorporate data from multiple sources.
- Out of the box support for multiple source systems including Cosmos Gremlin, PostgreSQL, and Kubernetes.
- Out of the box Reactions that use Continuous Query result updates to run commands on source systems, or forward them using existing messaging infrastructure such as Azure Event Grid.
- The ability to write custom Reactions (and Sources in the future).

## Why NOT use Reactive Graph
There are situations where it does not make sense to use Reactive Graph, or where you need to carefully consider the benefits and disadvantages of other alternatives. Some of these situations are related to the current experimental status of Reactive Graph but some are related to the challenges or complexities of specific environments or data models. Here are a few examples:

- The Reactive Graph Preview is a prototype and is only suitable for experimentation, not for production systems. This will change over time as Reactive Graph matures.
- If a source system already has a mature change notification capability, it might be a more suitable choice. THis is particularly true if the system's underlying data model is extremely complicated and the events it generates abstract the complexity away from the consumer. It might be easier to consume the in-built events. This is often the case in complex ERP and manufacturing solutions.
- When you need to take action when something didn't happen. Reactive Graph relies on changes in source systems to activate it, if something doesn't happen, there is no trigger.