---
type: "docs"
title: "Reactions"
linkTitle: "Reactions"
weight: 40
description: >
    What are Reactions and how to use them?
related:
  tutorials:
    - title: "Getting Started with Drasi"
      url: "/drasi-kubernetes/getting-started/"
    - title: "Connecting Frontends to Queries"
      url: "/drasi-kubernetes/tutorials/connecting-frontends/"
  concepts:
    - title: "Sources"
      url: "/concepts/sources/"
    - title: "Continuous Queries"
      url: "/concepts/continuous-queries/"
  howto:
    - title: "Configure Debug Reaction"
      url: "/drasi-kubernetes/how-to-guides/configure-reactions/configure-drasi-debug-reaction/"
    - title: "Configure SignalR Reaction"
      url: "/drasi-kubernetes/how-to-guides/configure-reactions/configure-signalr-reaction/"
    - title: "Configure Event Grid Reaction"
      url: "/drasi-kubernetes/how-to-guides/configure-reactions/configure-azure-eventgrid-reaction/"
  reference:
    - title: "CLI Reference"
      url: "/drasi-kubernetes/reference/command-line-interface/"
    - title: "Reaction Provider Schema"
      url: "/reference/schema/reaction-provider/"
---

Reactions process query result changes output by one or more Continuous Queries and act on them. The action taken depends on the Reaction being used. 

{{< figure src="simple-end-to-end.png" alt="End to End" width="65%" >}}

## Creation
Reactions can be created and managed using the [Drasi CLI](/reference/command-line-interface/). 

The easiest way to create a Reaction, and the way you will often create one as part of a broader software solution, is to:

1. Collect endpoint addresses and credentials that provide access to the downstream system/s the Reaction will connect to. These could be databases, queues, or service endpoints depending on the Reaction type.
1. Create Kubernetes secrets containing the credentials the Reaction will use to connect to the external systems. 
1. Create a YAML file containing the Reaction resource definition. This will include the configuration settings that enable the Reaction to connect to specific Continuous Queries, connect to downstream system, and identify the Kubernetes secrets that contain the credentials it should use. This file can be stored in your solution repo and versioned along with all the other solution code / resources.
1. Run [drasi apply](/reference/command-line-interface/#drasi-apply) to apply the Reaction resource definition to  Drasi environment.

As soon as the Reaction is created it will start running, monitoring the configured Continuous Queries for changes and taking action on the changes they receive.

The definition for a Reaction has the following basic structure:

```
apiVersion: v1
kind: Reaction
name: <id>
spec:
  kind: <reaction-type>
  queries:
    <query-id>: <query-config>
    <query-id>: <query-config>
    ...
  properties:
    (reaction kind specific fields)...
```
The following table describes these configuration settings:

|Name|Description|
|-|-|
|apiVersion|Must have the value **v1**|
|kind|Must have the value **Reaction**|
|name|Provides the unique ID of the Reaction. This must be unique across all Reactions in the Drasi environment and is used to manage the Reaction.|
|spec.kind|The type of Reaction to create, which must be one of the available [Reaction Providers](/how-to-guides/configure-reactions/) registered in the Drasi environment.|
|spec.queries|The list of Continuous Query IDs that the Reaction will receives change notifications from. Some Reactions also support per-query configuration which can be passed using the `query-config` property, separated from the `query-id` by a colon.|
|spec.properties|Everything in the **spec.properties** section is unique to the type of Reaction you are creating. See the [individual page](/how-to-guides/configure-reactions/) for the Reaction you are creating for details.


Note that any of the properties in the **spec.properties** section can either be specified inline or reference a Kubernetes secret. eg. 

```yaml
apiVersion: v1
kind: Reaction
name: my-event-grid
spec:
  kind: EventGrid
  queries:
    hello-world:
  properties:
    EventGridUri: https://drasi-app.westus-1.eventgrid.azure.net/api/events
    EventGridKey: 
      kind: Secret
      name: credentials
      key: access-key        
```

Once configured, to create a Reaction defined in a file called `reaction.yaml`, you would run the command:

```
drasi apply -f reaction.yaml
```

You can then use the [drasi list](/reference/command-line-interface/#drasi-list) commands to query the existence and status of the Reaction. For example, to see a list of the active Reactions, run the following command:

```
drasi list reaction
```

## Deletion
To delete an active Reaction, run the following [drasi delete](/reference/command-line-interface/#drasi-delete) command:

```
drasi delete reaction <id>
```

For example, if the Reaction ID is `event-grid`, you would run,

```
drasi delete reaction event-grid
```

## Available Reactions
Drasi currently provides the following Reactions:

- [AWS Event Bridge Reaction](/drasi-kubernetes/how-to-guides/configure-reactions/configure-aws-eventbridge-reaction/), which generates CloudEvents from Continuous Query notifications and publishes them to an AWS Event Bus.
- [Azure Event Grid](/drasi-kubernetes/how-to-guides/configure-reactions/configure-azure-eventgrid-reaction/), to forward Continuous Query results to Azure Event Grid, which in turn enables integration with any application, service, or function that can receive updates from Azure Event Grid.
- [Debug](/drasi-kubernetes/how-to-guides/configure-reactions/configure-drasi-debug-reaction/), a tool to help developers inspect the results generated by Continuous Queries.
- [SignalR](/drasi-kubernetes/how-to-guides/configure-reactions/configure-signalr-reaction/), to forward Continuous Query results to Web Applications.
- [Gremlin](/drasi-kubernetes/how-to-guides/configure-reactions/configure-gremlin-command-reaction/), to use the Continuous Query results as parameters to commands that run against a Gremlin database.
- [StoredProc](/drasi-kubernetes/how-to-guides/configure-reactions/configure-sql-stored-proc-reaction/), to use the Continuous Query results as parameters to Stored Procedures that run against a SQL database.
- [Sync Dapr State Store](/drasi-kubernetes/how-to-guides/configure-reactions/configure-sync-dapr-statestore-reaction/), to create an incrementally up-to-date materialized view of the query result set in a Dapr State Store.
- [Post Dapr Pub Sub](/drasi-kubernetes/how-to-guides/configure-reactions/configure-post-dapr-pubsub-reaction/), to post change notifications emitted by a Drasi Query to a Dapr Pub/Sub topic.
- [Dataverse](/drasi-kubernetes/how-to-guides/configure-reactions/configure-dataverse-reaction/), to use the Continuous Query results as parameters to commands that run against a Microsoft Dataverse entities.