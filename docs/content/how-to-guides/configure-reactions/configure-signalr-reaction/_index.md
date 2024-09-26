---
type: "docs"
title: "Configure a SignalR Reaction"
linkTitle: "Configure a SignalR Reaction"
weight: 80
toc_hide: true
hide_summary: true
description: >
    Learn how to configure a SignalR Reaction
---

The SignalR Reaction requires the following configuration settings:

|Name|Type|Description|
|-|-|-|
|kind| | Must have the value **SignalR**|
|AzureSignalRConnectionString| Property | |
|gateway| Endpoint | |

The following is an example of a fully configured Event Grid Reaction using Kubernetes Secrets to securely store sensitive information:

```bash
kubectl create secret generic credentials --from-literal=connection-string=xxxxxx
```

```
apiVersion: v1
kind: Reaction
name: signalr1
spec:
  kind: SignalR
  properties:
    AzureSignalRConnectionString:
      kind: Secret
      name: credentials
      key: connection-string
  endpoints:
    gateway: 8080
  queries:
    my-query1:
```

