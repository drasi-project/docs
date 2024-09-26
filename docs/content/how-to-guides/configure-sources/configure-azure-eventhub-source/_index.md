---
type: "docs"
title: "Connect to Azure EventHub"
linkTitle: "Connect to Azure EventHub"
weight: 20
toc_hide: true
hide_summary: true
description: >
    Learn how to configure an Azure EventHub Source to connect to an Azure EventHub
---


The Event Hubs source enables messages streaming through Azure Event Hubs to be mapped into graph nodes that can be referenced by a continuous query.
It can observe multiple Event Hubs within the same Event Hubs namespace, each incoming message will upsert graph node that will carry the label of the Event Hub name, and be queryable from a continuous query.

#### Configuration Settings

It is best practice to store the connection string to your Event Hubs instance in a secret.

```bash
kubectl create secret generic eventhub-creds --from-literal=eventHubConnectionString=...
```

You can then reference the secret when you create an Event Hub source as follows:

```yaml
kind: Source
apiVersion: v1
name: my-source
spec:
  kind: EventHub
  properties:
    connectionString: 
      kind: Secret
      name: eventhub-creds
      key: eventHubConnectionString
    eventHubs:
      - hub1
      - hub2
    bootstrapWindow: 0
```

In the Source resource definition:
- **apiVersion** must be **v1**
- **kind** must be **Source**
- **name** is the **id** of the Source and must be unique. This id is used in a Continuous Query definitions to identify which Sources the Continuous Query subscribes to for change events.
- **spec.kind** must be **EventHub**

The following table describes the EventHub specific properties:
|Property|Description|
|-|-|
|connectionString|Connection string for the Event Hubs endpoint|
|eventHubs|A list of Event Hubs within the Event Hubs namespace to observe|
|bootstrapWindow|When a query bootstraps, it can also fetch all the messages for the previous (n) minutes.  This value defines how many minutes of backfill data to bootstrap the query with.|

