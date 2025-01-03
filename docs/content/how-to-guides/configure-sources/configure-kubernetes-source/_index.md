---
type: "docs"
title: "Connect to Kubernetes"
linkTitle: "Connect to Kubernetes"
weight: 20
description: >
    Learn how to configure a Kubernetes Source to connect to a Kubernetes Cluster
---

The Kubernetes Source is an early stage experimental Source that enables Drasi connectivity to Kubernetes clusters, enabling Drasi to support Continuous Queries that incorporate changes to Kubernetes resources.

## Source Requirements

To create and manage Sources using the steps described in this guide, you need the [Drasi CLI](/reference/command-line-interface/) installed on your computer.

You will need a client side credentials that can be used to authenticate against your Kubernetes cluster and has permission to watch resources.

### Permissions

The client side credentials should have the following permissions:

| Resource               | Verbs       |
|------------------------|-------------|
| Pod                    | list, watch |
| Deployment             | list, watch |
| ReplicaSet             | list, watch |
| StatefulSet            | list, watch |
| DaemonSet              | list, watch |
| Job                    | list, watch |
| Service                | list, watch |
| ServiceAccount         | list, watch |
| Node                   | list, watch |
| Ingress                | list, watch |
| PersistentVolume       | list, watch |
| PersistentVolumeClaim  | list, watch |


## Creating the Source
To create a Kubernetes Source, execute the `drasi apply` command as follows:

```text
drasi apply -f my-source.yaml
```

The `drasi apply` command is how you create all new Drasi resources (in this case a Source). The `-f` flag specifies that the definition of the new Source is contained in the referenced YAML file `my-source.yaml`.

This source requires a [Kubernetes configuration context](https://kubernetes.io/docs/concepts/configuration/organize-cluster-access-kubeconfig) that specifies the cluster to connect to and the credentials to use.  The best way to do this is to extract and store this configuration is a secret.

### Extract and store Kube Context

The following scripts can be used to extract and store this config in a secret called `k8s-context` with the key of `context`, depending on your environment.

#### Using Kind

```shell
kind get kubeconfig | sed 's/127.0.0.1.*/kubernetes.default.svc/g' | kubectl create secret generic k8s-context --from-file=context=/dev/stdin -n drasi-system
```

#### Using k3d

```shell
k3d kubeconfig get k3s-default | sed 's/0.0.0.0.*/kubernetes.default.svc/g' | kubectl create secret generic k8s-context --from-file=context=/dev/stdin -n drasi-system
```

#### Using AKS

```shell
az aks get-credentials --resource-group <resource-group> --name <cluster-name> --file - | kubectl create secret generic k8s-context --from-file=context=/dev/stdin -n drasi-system
```

### Source Definition

The YAML file passed to `drasi apply` can contain one or more Source definitions. The following is an example of a full resource definition for a Kubernetes Source using Kubernetes Secrets to securely store credentials:

```yaml
apiVersion: v1
kind: Source
name: k8s
spec:
  kind: Kubernetes
  properties:
    kubeConfig:
      kind: Secret
      name: k8s-context
      key: context
```

In the Source resource definition:
- **apiVersion** must be **v1**
- **kind** must be **Source**
- **name** is the **id** of the Source and must be unique. This id is used in a Continuous Query definitions to identify which Sources the Continuous Query subscribes to for change events.
- **spec.kind** must be **Kubernetes**

The following table describes the properties that must be configured in the **spec** object:
|Property|Description|
|-|-|
|kubeConfig|A [kubeconfig](https://kubernetes.io/docs/concepts/configuration/organize-cluster-access-kubeconfig) containing the credentials to connect to your cluster|

## Data Model

Graphs nodes will be created for the following resources:

| Resource               | Documentation Link                                                                 |
|------------------------|------------------------------------------------------------------------------------|
| Pod                    | [Pod](https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/) |
| Deployment             | [Deployment](https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/deployment-v1/) |
| ReplicaSet             | [ReplicaSet](https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/replica-set-v1/) |
| StatefulSet            | [StatefulSet](https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/stateful-set-v1/) |
| DaemonSet              | [DaemonSet](https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/daemon-set-v1/) |
| Job                    | [Job](https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/job-v1/) |
| Service                | [Service](https://kubernetes.io/docs/reference/kubernetes-api/service-resources/service-v1/) |
| ServiceAccount         | [ServiceAccount](https://kubernetes.io/docs/reference/kubernetes-api/authentication-resources/service-account-v1/) |
| Node                   | [Node](https://kubernetes.io/docs/reference/kubernetes-api/cluster-resources/node-v1/) |
| Ingress                | [Ingress](https://kubernetes.io/docs/reference/kubernetes-api/service-resources/ingress-v1/) |
| PersistentVolume       | [PersistentVolume](https://kubernetes.io/docs/reference/kubernetes-api/config-and-storage-resources/persistent-volume-v1/) |
| PersistentVolumeClaim  | [PersistentVolumeClaim](https://kubernetes.io/docs/reference/kubernetes-api/config-and-storage-resources/persistent-volume-claim-v1/) |

The properties of these nodes will be populated with the properties of the corresponding Kubernetes resources. For more information on the properties of these resources, see the [Kubernetes API Reference](https://kubernetes.io/docs/reference/kubernetes-api/) or the [Kubernetes API Explorer](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.27/)..

In addtion to these nodes, any resources that are owned by a parent resource will be linked to their parent with a relation labeled `OWNS`. For example, Pods will be linked to their parent Deployment or ReplicaSet.

For example, your could query all Pods owned by a Deployment with the following Cypher query:

```cypher
MATCH
  (d:Deployment)-[:OWNS]->(r:ReplicaSet)-[:OWNS]->(p:Pod)
WHERE d.metadata.name = 'my-deployment'
RETURN
  p.metadata.name AS pod_name,
  p.status.phase AS pod_phase
```

### Decomposing Kubernetes Resources into Nodes and Relations

Many Kubernetes resources are complex and contain nested properties. For example, a Pod contains a `status` property that contains a `containerStatuses` property that contains a list. In order to make it easier to query these nested objects, you can use the `unwind` middleware within your query to extract and project them as top-level nodes within the graph. For example, the following query will extract the `containerStatuses` property from the `status` property of a Pod and project it as a top-level node with the label of `Container`, and connect them with a relation labeled `HAS`:

```yaml
apiVersion: v1
kind: ContinuousQuery
name: my-query
spec:
  mode: query
  sources:
    subscriptions:
      - id: k8s
        nodes:
          - sourceLabel: Pod
        pipeline:
          - extract-containers
    middleware:
      - kind: unwind
        name: extract-containers
        Pod:
          - selector: $.status.containerStatuses[*]
            label: Container
            key: $.containerID
            relation: HAS

  query: >
    MATCH
      (p:Pod)-[:HAS]->(c:Container)
    RETURN
      p.name as pod,
      c.image as image,
      c.name as name,
      c.ready as ready,
      c.started as started,
      c.restartCount as restartCount
```

## Inspecting the Source
Currently, a Source must be fully functional with an `available` status of `true` before Continuous Queries can subscribe to it. If you create Continuous Queries that use a Source before the Source is `available` they will either fail, or be in an unknown state.

You can check the status of the Source using the `drasi list` command:

```text
drasi list source
```

Or including a target namespace:

```text
drasi list source -n drasi-namespace
```

This will return a simple list of all Sources in the default (or specified) namespace and their overall status. For example:

```
       ID      | AVAILABLE
---------------+------------
  k8s          | true
  physical-ops | false
```

In this case, the `k8s` Source is ready for use (AVAILABLE = true), but the `physical-ops` Source is not yet ready (AVAILABLE = false).

Given how important it is for Sources to be ready before you start Continuous Queries that use them, the Drasi CLI supports the ability to wait for a Source to be ready using the [drasi wait](/reference/command-line-interface#drasi-wait) command:

```text
drasi wait source physical-ops -t 120
```

The `drasi wait` command waits for one or more resources to become operational, or for a timeout interval `-t` to be reached (in seconds).

If an error has occurred during the creation or operation of a Source, the `AVAILABLE` column will contain the error text.

For more details about a Source you can use the [drasi describe](/reference/command-line-interface#drasi-describe) command:

```text
drasi describe source retail-ops
```

This will return the full definition used to create the Source along with more detailed status information.

## Modifying the Source
Currently, Drasi does not support the modification of existing Sources. You must [Delete the Source](#deleting-the-source), make changes to the Source definition file, and [Create the Source](#creating-the-source) again. This process will leave all Continuous Queries that subscribe to that Source in an unknown state, so they should also be deleted and re-created once the updated Source is ready.

## Deleting the Source
To delete a Source you use the `drasi delete` command. There are two ways to do this.

Firstly, you can specify the type of resource (Source) and its name, for example:

```text
drasi delete source k8s
```

Secondly, you can refer to the YAML file(s) that contain the definitions used to create the Source(s):

```text
drasi delete -f my-source.yaml <file2.yaml> <file3.yaml> <...>
```

This is a convenience, especially if a single YAML file contains multiple Source definitions.

If the Source is not in the default Drasi namespace, you should specific the target namespace using the `-n` flag as usual:

```text
drasi delete -f my-source.yaml -n drasi-namespace
```
