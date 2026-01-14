---
type: "docs"
title: "Reactions"
linkTitle: "Reactions"
weight: 50
related:
  concepts:
    - title: "Sources"
      url: "/concepts/sources/"
    - title: "Continuous Queries"
      url: "/concepts/continuous-queries/"
    - title: "Change-Driven Solutions"
      url: "/concepts/solution-design/"
  howto:
    - title: "Configure Reactions (Server)"
      url: "/drasi-server/how-to-guides/configuration/configure-reactions/"
    - title: "Configure Reactions (Kubernetes)"
      url: "/drasi-kubernetes/how-to-guides/configure-reactions/"
  reference:
    - title: "Result Change Event Schema"
      url: "/reference/schema/result-change-event/"
    - title: "Reaction Provider Schema"
      url: "/reference/schema/reaction-provider/"
---

Reactions are triggered actions that respond to result set changes reported by Continuous Queries. When a Continuous Query's result set changes (i.e. items added, updated, or deleted) subscribed Reactions receive Continuous Query Result notifications that give them the option to take action. The specific action depends on the type of Reaction e.g. forwarding changes to messaging systems, updating databases, triggering webhooks, or driving real-time user interfaces.

{{< figure src="simple-end-to-end.png" alt="End to End" width="90%" >}}

## How Reactions Work

Reactions subscribe to one or more Continuous Queries and receive Continuous Query Result notifications whenever the query results change. Each notification includes:

- **Added items**: New results that now match the query criteria
- **Updated items**: Results that still match but have changed (with before/after values)
- **Deleted items**: Results that no longer match the query criteria

When a Reaction receives a notification, it processes the changes according to its type. For example:

- The **SignalR** Reaction pushes changes to connected web clients in real-time, enabling live dashboard updates without polling
- The **StoredProc** Reaction executes SQL stored procedures using the change data as parameters, allowing you to trigger database operations when query results change
- The **Azure Event Grid** Reaction publishes changes as CloudEvents to Azure Event Grid, enabling integration with Azure Functions, Logic Apps, and other event-driven services
- The **Debug** Reaction provides a web UI for inspecting query results during development, helping you understand what changes your Continuous Queries are detecting

## Available Reaction Implementations

Different Reaction implementations are available depending on which Drasi product you use:

| Reaction Type | drasi-lib / Drasi Server | Drasi for Kubernetes |
|---------------|:------------------------:|:--------------------:|
| Debug | - | Yes |
| HTTP | Yes | Yes |
| SignalR | - | Yes |
| Azure Event Grid | - | Yes |
| Azure Storage Queue | - | Yes |
| AWS EventBridge | - | Yes |
| Result | - | Yes |
| StoredProc | - | Yes |
| Gremlin | - | Yes |
| Dataverse | - | Yes |
| Debezium | - | Yes |
| PostDaprPubSub | - | Yes |
| SyncDaprStateStore | - | Yes |
| Log | Yes | - |
| gRPC | Yes | - |
| gRPC-Adaptive | Yes | - |
| SSE (Server-Sent Events) | Yes | - |
| Platform (Redis Streams) | Yes | - |
| Profiler | Yes | - |

## Reaction Lifecycle

Reactions are long-running components that:

- Start monitoring their subscribed Continuous Queries as soon as they are created
- Continue running until explicitly stopped or deleted
- Process all change notifications from their subscribed queries
- Handle connection management to downstream systems automatically

When a Reaction is stopped or deleted, it stops receiving notifications from its subscribed Continuous Queries. The Continuous Queries continue running and can still be consumed by other Reactions.

## Configuring Reactions

Reaction configuration varies by Drasi product. Each product provides its own approach for defining Reactions with connection details, credentials, and query subscriptions.

To configure Reactions for your deployment, see the product-specific guides:

- **[Drasi Server Reactions](/drasi-server/how-to-guides/configuration/configure-reactions/)** - Configure Reactions in standalone server deployments
- **[Drasi for Kubernetes Reactions](/drasi-kubernetes/how-to-guides/configure-reactions/)** - Configure Reactions using Kubernetes resource manifests

For **drasi-lib**, Reactions are configured programmatically via the Rust API. See the [drasi-lib documentation](/drasi-lib/) for details.

### Per-Query Configuration

Some Reactions support per-query configuration, allowing different behavior for different subscribed queries. This is useful when a single Reaction handles notifications from multiple queries but needs to process them differently (for example, routing changes from different queries to different topics or executing different stored procedures).
