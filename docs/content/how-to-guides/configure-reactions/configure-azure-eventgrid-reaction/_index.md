---
type: "docs"
title: "Configure an Azure Event Grid Reaction"
linkTitle: "Configure an Azure Event Grid Reaction"
weight: 10
toc_hide: true
hide_summary: true
description: >
    Learn how to configure an Azure Event Grid Reaction
---

The Event Grid Reaction requires the following configuration settings:

|Name|Type|Description|
|-|-|-|
|kind| | Must have the value **EventGrid**|
|EventGridUri| Property | |
|EventGridKey| Property | |

The following is an example of a fully configured Event Grid Reaction using Kubernetes Secrets to securely store sensitive information:

```bash
kubectl create secret generic credentials --from-literal=access-key=xxxxxx
```

```
apiVersion: v1
kind: Reaction
name: eventgrid1
spec:
  kind: EventGrid
  properties:
    EventGridUri: https://reactive-graph-daniel.westus-1.eventgrid.azure.net/api/events
    EventGridKey: 
      kind: Secret
      name: credentials
      key: access-key      
  queries:
    my-query1:
```
