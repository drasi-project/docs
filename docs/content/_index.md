---
type: "docs"
title: "Project Drasi"
linkTitle: "Home"
weight: 1
description: >
    Mission: Make it easier to detect and react to change in dynamic systems
---

## Getting Started
- If you want to **understand** the concepts, functionality, and benefits of Drasi, read the [Introduction](#introduction) and [Benefits](#benefits) sections below.

- If you are a **developer** who wants to **use** Drasi to add Continuous Queries to a solution you are creating, go to the [Solution Developer Guides](/solution-developer).

- If you are a **developer** who wants to **contribute** to Drasi or **create custom Reactions** for Drasi, go to the [Platform Developer Guides](/platform-developer).

- If you want to **deploy** or **manage** a Drasi environment, go to the [Administrator Guides](/administrator)

- If you are interested in **discussing** Drasi, having a **demonstration** of Drasi's capabilities, or getting access to a live demo environment so you can **explore** solutions built using Drasi, contact [Allen Jones (alljones)](mailto:alljones@microsoft.com).

## Introduction
Drasi is a [Data Change Processing](/reference/glossary/#data-change-processing) platform that makes it easier to build dynamic solutions that detect and react to data changes that occur in databases and software systems. Drasi's change detection capabilities go beyond simply reporting add, update, and delete operations, as you would typically get from database transaction/change logs and message-based change notification solutions. Instead, Drasi's low-code query-based approach enables you to write rich graph queries through which you can express sophisticated rules describing the types of changes you want to detect. 

## Components
Drasi is built around three simple components: **Sources**, **Continuous Queries**, and **Reactions**. In the simplest scenario, data flows through these components from left to right as shown in the diagram below. But, a single Drasi environment can host many Sources, Continuous Queries, and Reactions, allowing you to connect them together to build scalable Data Change Processing capabilities to power dynamic business solutions. Each of these concepts is discussed in more detail below.

{{< figure src="simple-end-to-end.png" alt="End to End" width="50%" >}}

### Sources
Sources provide connectivity to the systems that Drasi can observe as sources of change. These are often relational or graph databases. But Sources can be implemented for any system that provides a low-level change feed and a way to query the current data in the system. This diagram shows three Sources, providing Drasi with access to changes from an Azure Cosmos Gremlin database, a PostreSQL database, and a Kubernetes cluster.

{{< figure src="sources-component.png" alt="Sources Component" width="50%" >}}

Drasi’s Source input schema is modeled on Debezium (https://debezium.io), an open-source Change Data Capture platform that has adapters for many common data sources. By embracing the open data standard defined by Debezium, Drasi will more easily integrate with the many existing Debezium sources. 

More detail about Sources is available in the [Sources](/solution-developer/components/sources) section of the [Solution Developer Guide](/solution-developer). 

### Continuous Queries

Continuous Queries, as the name implies, are queries that run continuously. To understand what is unique about them, it is useful to contrast them with a the kind of **instantaneous queries** developers are accustomed to running against databases. 

When you execute an **instantaneous query**, you are running the query against the database at a point in time. The database calculates the results to the query and returns them. While you work with those results, you are working with a static snapshot of the data and are unaware of any changes that may have happened to the data after you ran the query. If you run the same instantaneous query periodically, the query results might be different each time due to changes made to the data by other processes. But to understand what has changed, you would need to compare the most recent result with the previous result.

{{< figure src="instantaneous-query.png" alt="Instantaneous Query" width="50%" >}}

**Continuous Queries**, once started, continue to run until they are stopped. While running, Continuous Queries maintain a perpetually accurate query result, incorporating any changes made to the source database as they occur. Not only do Continuous Queries allow you to request the query result as it was at any point in time, but as changes occur, the Continuous Query determines exactly which result elements have been added, updated, and deleted, and distributes a precise description of the changes to all Reactions that have subscribed to the Continuous Query. 

{{< figure src="/continuous-query.png" alt="Continuous Query" width="50%" >}}

Continuous Queries are implemented as graph queries written in the [Cypher Query Language](https://neo4j.com/developer/cypher/). The use of a declarative graph query language means you can:
- describe in a single query expression which changes you are interested in detecting and what data you want notifications of those changes to contain.
- express rich query logic that takes into consideration both the properties of the data you are querying and the relationships between data. 
- create queries that span data across multiple Sources without complex join syntax, even when there is no natural connection between data in the Source systems, including queries that incorporate both relational and graph sources.

The following diagram shows where Continuous Queries fit in the data flow of a Drasi environment in relation to Sources. Note that a Continuous Query can take input from multiple Sources and multiple Continuous Queries can also make use of a single Source.

{{< figure src="queries-component.png" alt="Continuous Queries Component" width="50%" >}}

More detail about Continuous Queries is available in the [Continuous Queries](/solution-developer/components/continuous-queries) section of the [Solution Developer Guide](/solution-developer). 

### Reactions
Reactions receive a stream of query result changes generated by one or more Continuous Queries and take action. The action taken depends on the Reaction implementation.  Drasi provides standard Reactions that:
- forward the query result changes to Azure Event Grid or SignalR so they can be processed by solution specific code in applications, services, and functions.
- use the query result changes as input to configurable Stored Procedures or Gremlin commands to update databases without the need to integrate additional intermediary software services.

{{< figure src="reactions-component.png" alt="Reactions Component" width="50%" >}}

More detail about Reactions is available in the [Reactions](/solution-developer/components/reactions) section of the [Solution Developer Guide](/solution-developer). 

## Benefits
Drasi provides significant benefits over existing change event/notification approaches, including:
- Continuous Queries are written as declarative graph queries using the Cypher Query Language, making them easy to write, while supporting a rich and expressive syntax. Using a single query, you describe the changes you want to detect, and the data you want to capture to describe when those changes occur.
- Continuous Queries are graph queries, allowing you to write queries that walk relationships that exist between connected data elements or which aggregate data across a set of connected elements. 
- Continuous Queries can incorporate data from multiple sources, even if the data from those sources has no natural connection and uses different data schema. For example, data both a Gremlin database and a PostgreSQL database could be used in a single query.
- Out of the box support for multiple source systems including Azure Cosmos Gremlin API, PostgreSQL, and Kubernetes. 
- Integration with the rich Change Data Capture ecosystem provided by the open source Debezium project.
- Out of the box Reactions include support for the following:
  - forwarding changes to Azure Event Grid so you can integrate easily with PowerPlatform functionality as well as bespoke applications, services, and functions.
  - forwarding changes to SignalR so you can integrate easily with Web Applications and use real-time output from Continuous Queries to drive application UIs.
  - use the changes to automatically execute commands and stored procedures on source databases
- The ability to write custom Reactions that process the output of Continuous Queries means you can easily customize the change handling functionality provided by Drasi.
