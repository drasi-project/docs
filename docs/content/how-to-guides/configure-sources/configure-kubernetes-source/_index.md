---
type: "docs"
title: "Connect to Kubernetes"
linkTitle: "Connect to Kubernetes"
weight: 20
toc_hide: true
hide_summary: true
description: >
    Learn how to configure a Kubernetes Source to connect to a Kubernetes Cluster
---

The Kubernetes Source is an early stage experimental Source that enables Drasi connectivity to Kubernetes clusters, enabling Drasi to support Continuous Queries that incorporate changes to Kubernetes resources.

#### Source Requirements

You will need a client side credentials that can be used to authenticate against your Kubernetes cluster and has permission to watch resources.

#### Configuration Settings
The following is an example of a full resource definition for a Kubernetes Source using Kubernetes Secrets to securely store credentials:

To get the credentials, export the Kubernetes credentials to a file named `credentials.yaml`

- For self hosted clusters, you can find this in your [kubeconfig](https://kubernetes.io/docs/concepts/configuration/organize-cluster-access-kubeconfig/) file
- For AKS, you can use this command
```
az aks get-credentials --resource-group <resource group> --name <cluster name> --file credentials.yaml
```

Create a secret named `k8s-context` from the `credentials.yaml` file

```bash
kubectl create secret generic k8s-context --from-file=credentials.yaml
```

```yaml
apiVersion: v1
kind: Source
name: k8s
spec:
  kind: Kubernetes
  properties:
    kubeconfig:
      kind: Secret
      name: k8s-context
      key: credentials.yaml
```

In the Source resource definition:
- **apiVersion** must be **v1**
- **kind** must be **Source**
- **name** is the **id** of the Source and must be unique. This id is used in a Continuous Query definitions to identify which Sources the Continuous Query subscribes to for change events.
- **spec.kind** must be **Kubernetes**

The following table describes the properties that must be configured in the **spec** object:
|Property|Description|
|-|-|
|kubeconfig|A [kubeconfig](https://kubernetes.io/docs/concepts/configuration/organize-cluster-access-kubeconfig) containing the credentials to connect to your cluster|

#### Data Transformation

Currently, only Pods and Containers are projected onto a graph schema.  The relation between them is labeled `HOSTS` and flows from the `Pod` to the `Container`.  A MATCH cypher clause that connects these would look as follows

```cypher
MATCH (p:Pod)-[:HOSTS]->(c:Container) 
```

The following properties are projected to the graph nodes

|Node Label|Property|Origin|
|-|-|-|
|Container|name|Pod.status.containerStatuses[].name|
|Container|image|Pod.status.containerStatuses[].image|
|Container|started|Pod.status.containerStatuses[].started|
|Container|ready|Pod.status.containerStatuses[].ready|
|Container|restartCount|Pod.status.containerStatuses[].restartCount|
|Container|state|Pod.status.containerStatuses[].state|
|Container|message|Pod.status.containerStatuses[].state.message|
|Container|reason|Pod.status.containerStatuses[].state.reason|
|Container|terminationMessage|Pod.status.containerStatuses[].lastState.terminated.message|
|Pod|name|Pod.metadata.name|
|Pod|podIP|Pod.status.podIP|
|Pod|phase|Pod.status.phase|
|Pod|message|Pod.status.message|
|Pod|hostIP|Pod.status.hostIP|
|Pod|reason|Pod.status.reason|

