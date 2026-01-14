---
type: "docs"
title: "Why Drasi?"
linkTitle: "Why Drasi?"
weight: 10
related:
  tutorials:
    - title: "Getting Started (Server)"
      url: "/drasi-server/getting-started/"
    - title: "Getting Started (Kubernetes)"
      url: "/drasi-kubernetes/getting-started/"
  concepts:
    - title: "Sources"
      url: "/concepts/sources/"
    - title: "Continuous Queries"
      url: "/concepts/continuous-queries/"
    - title: "Reactions"
      url: "/concepts/reactions/"
    - title: "Change-Driven Solutions"
      url: "/concepts/solution-design/"
---

Drasi is an open-source Data Change Processing platform that simplifies the creation and operation of change-driven solutions. It enables you to detect and react to meaningful data changes that occur in **existing** databases and software systems—not only new systems built using Drasi.

## The Problem Drasi Solves
Detecting specific meaningful changes in data is complex. Traditional approaches require:
- **Polling**: Retrieving current data and comparing it with previous results is inefficient and requires complex logic to isolate what has changed.
- **Processing change feeds**: Database change logs and message-based notifications generate high volumes of mostly uninteresting changes, requiring significant infrastructure to filter to relevant changes.
- **Maintaining state**: Determining what has actually changed often requires caching previous states and writing complex comparison logic.
- **Reacting to change**: TODO: talk about the need to code / integrate with downstream systems.

These approaches make solutions brittle and costly to maintain / update as requirements change.

## How Drasi Helps
Drasi's low-code query-based approach enables you to write declarative graph queries that define the changes you want to detect and the data you want to distribute when those changes occur. Change semantics are defined by your query, not the source system. This eliminates the overhead of polling, parsing, filtering, and state management.

When changes do occur - TODO: talk about reactions as opposed to custom code / integration with downstream systems.

Drasi is available in three deployment options to match your needs:
- **[{{< term "drasi-lib" >}}](/drasi-lib/)** - A Rust crate for building change-driven Rust solutions
- **[{{< term "Drasi Server" >}}](/drasi-server/)** - A standalone {{< term "Data Change Processing" >}} server running as a process or Docker container
- **[{{< term "Drasi for Kubernetes" >}}](/drasi-kubernetes/)** - A scalable Data Change Processing platform running on Kubernetes clusters

Here are examples of change-driven solutions across different industries:

<div class="card-grid card-grid--2">
  <div class="unified-card unified-card--static">
    <div class="unified-card-icon"><i class="fas fa-building"></i></div>
    <div class="unified-card-content">
      <h4 class="unified-card-title">IoT & Smart Buildings</h4>
      <ul class="unified-card-list">
        <li><strong>Building comfort management</strong> - Observe sensor data and automatically adjust HVAC settings for occupant comfort</li>
        <li><strong>Occupancy optimization</strong> - Detect when space utilization patterns indicate opportunities to reduce energy usage</li>
      </ul>
    </div>
  </div>

  <div class="unified-card unified-card--static">
    <div class="unified-card-icon"><i class="fas fa-chart-line"></i></div>
    <div class="unified-card-content">
      <h4 class="unified-card-title">Financial Services</h4>
      <ul class="unified-card-list">
        <li><strong>Payment reconciliation</strong> - Identify discrepancies when transactions don't match across order, payment, and fulfillment systems</li>
        <li><strong>Compliance monitoring</strong> - Alert when data combinations approach regulatory thresholds</li>
      </ul>
    </div>
  </div>

  <div class="unified-card unified-card--static">
    <div class="unified-card-icon"><i class="fas fa-truck"></i></div>
    <div class="unified-card-content">
      <h4 class="unified-card-title">Supply Chain</h4>
      <ul class="unified-card-list">
        <li><strong>Shipment exceptions</strong> - Detect when shipments deviate from expected routes, times, or conditions</li>
        <li><strong>Fulfillment bottlenecks</strong> - Identify orders stuck at stages longer than expected</li>
      </ul>
    </div>
  </div>

  <div class="unified-card unified-card--static">
    <div class="unified-card-icon"><i class="fas fa-cogs"></i></div>
    <div class="unified-card-content">
      <h4 class="unified-card-title">Operations & Infrastructure</h4>
      <ul class="unified-card-list">
        <li><strong>Predictive maintenance</strong> - Trigger maintenance when sensors and usage patterns indicate equipment issues</li>
        <li><strong>Container security</strong> - Alert when vulnerable containers are deployed to clusters</li>
      </ul>
    </div>
  </div>
</div>

## Components
Drasi is built around three simple components: {{< term "Source" "Sources" >}}, {{< term "Continuous Query" "Continuous Queries" >}}, and {{< term "Reaction" "Reactions" >}}. In the simplest scenario, data flows through these components from left to right as shown in the diagram below. But, a single Drasi environment can host many Sources, Continuous Queries, and Reactions, allowing you to connect them together to build scalable Data Change Processing capabilities to power change-driven solutions. Each of these concepts is discussed in more detail below.

{{< figure src="simple-end-to-end.png" alt="End to End" width="90%" >}}

### Sources
Sources provide connectivity to the systems that Drasi can observe as sources of change. These are often relational or graph databases. But Sources can be implemented for any system that provides a low-level change feed and a way to query the current data in the system. Sources translate data into a unified {{< term "Property Graph" "property graph" >}} model. This diagram shows three Sources, providing Drasi with access to changes from an Azure Cosmos Gremlin database, a PostgreSQL database, and a Kubernetes cluster.

{{< figure src="sources-component.png" alt="Sources Component" width="85%" >}}

Drasi's Source input schema is modeled on {{< term "Debezium" >}} (https://debezium.io), an open-source {{< term "Change Data Capture" >}} platform that has adapters for many common data sources. By embracing the open data standard defined by Debezium, Drasi will more easily integrate with the many existing Debezium sources. 

More detail about Sources is available in the [Sources](/concepts/sources) overview page. 

### Continuous Queries

Continuous Queries, as the name implies, are queries that run continuously. To understand what is unique about them, it is useful to contrast them with a the kind of {{< term "Instantaneous Query" "instantaneous queries" >}} developers are accustomed to running against databases. 

When you execute an **instantaneous query**, you are running the query against the database at a point in time. The database calculates the results to the query and returns them. While you work with those results, you are working with a static snapshot of the data and are unaware of any changes that may have happened to the data after you ran the query. If you run the same instantaneous query periodically, the query results might be different each time due to changes made to the data by other processes. But to understand what has changed, you would need to compare the most recent result with the previous result.

{{< figure src="instantaneous-query.png" alt="Instantaneous Query" width="80%" >}}

**Continuous Queries**, once started, continue to run until they are stopped. While running, Continuous Queries maintain a perpetually accurate query result, incorporating any changes made to the source database as they occur. Not only do Continuous Queries allow you to request the query result as it was at any point in time, but as changes occur, the Continuous Query determines exactly which result elements have been added, updated, and deleted, and distributes a precise description of the changes to all Reactions that have subscribed to the Continuous Query. 

{{< figure src="continuous-query.png" alt="Continuous Query" width="85%" >}}

Continuous Queries are implemented as graph queries written in either the {{< term "openCypher" "openCypher Query Language" >}} or {{< term "GQL" "Graph Query Language" >}}. The use of a declarative graph query language means you can:
- describe in a single query expression which changes you are interested in detecting and what data you want notifications of those changes to contain.
- express rich query logic that takes into consideration both the properties of the data you are querying and the relationships between data. 
- create queries that span data across multiple Sources without complex join syntax, even when there is no natural connection between data in the Source systems, including queries that incorporate both relational and graph sources.

The following diagram shows where Continuous Queries fit in the data flow of a Drasi environment in relation to Sources. Note that a Continuous Query can take input from multiple Sources and multiple Continuous Queries can also make use of a single Source.

{{< figure src="queries-component.png" alt="Continuous Queries Component" width="90%" >}}

More detail about Continuous Queries is available in the [Continuous Queries](/concepts/continuous-queries) overview page. 

### Reactions
Reactions receive query result changes generated by one or more Continuous Queries and take action. The action taken depends on the Reaction implementation. Drasi provides standard Reactions that integrate with many popular downstream systems and makes it easy to develop new custom Reactions.

{{< figure src="reactions-component.png" alt="Reactions Component" width="95%" >}}

More detail about Reactions is available in the [Reactions](/concepts/reactions) overview page. 

## Benefits
Drasi provides significant benefits over traditional event-driven change detection approaches:

### Consumer-Driven Data Model
Query structure is defined by consumers, not producers—you define what changes matter to your solution. Change semantics are defined by your query, not the source system.

### Works with Existing Systems
Drasi works with existing databases and software systems, not only new systems built using Drasi. Out of the box support includes Azure Cosmos Gremlin API, PostgreSQL, MySQL, SQL Server, Kubernetes, and more.

### Multi-Source Queries
A single Continuous Query can span data from multiple Sources (e.g., PostgreSQL and Cosmos DB together), even when there is no natural connection between the data.

### Less Brittle Solutions
Eliminates the need to parse ambiguous payloads, filter firehose change feeds, and maintain external state—making solutions easier to update as requirements change.

### Graph Query Capabilities
Continuous Queries are graph queries written in Cypher or GQL, enabling you to walk relationships between connected data elements, aggregate data across connected elements, and express rich query logic considering both properties and relationships.

### Flexible Deployment Options
Deploy as an embedded Rust library (drasi-lib), standalone Docker container (Drasi Server), or production-grade Kubernetes platform (Drasi for Kubernetes) based on your needs.

### Ready-to-Use Reactions
Built-in Reactions forward changes to Azure Event Grid, SignalR for real-time web UIs, or automatically execute stored procedures and commands on databases. Custom Reactions let you extend functionality as needed.

## When Not to Use Drasi

There are, of course, situations where it does not make sense to use Drasi, or where you need to carefully consider the benefits and disadvantages of other alternatives. Some of these situations are related to the current maturity of Drasi but some are related to the challenges or complexities of specific environments or data models. Here are a few examples:

- If a source system already has a mature change notification capability, it might be a more suitable choice. This is particularly true if the system's underlying data model is extremely complicated and the events it generates significantly abstract the complexity away from the consumer. It might be easier to consume the in-built events and/or the in-built eventing mechanism might be optimized for the system's data-model.
- When your Continuous Query includes data types for which there is a lot of data. Drasi will create an optimized index of the data it needs from the source system, but if there are millions of nodes/records that need to be bootstrapped and indexed, you should consider the cost/benefit of the query you are considering.
- If you really want to do stream analytics or streaming data transformation over high volume data streams there are technologies optimized for these use cases.
- If you need to migrate or replicate data either in batch or real-time, existing Change Data Capture (CDC) solutions may be more suitable.
