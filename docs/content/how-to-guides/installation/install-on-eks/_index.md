---
type: "docs"
title: "Install on AWS Elastic Kubernetes Service"
linkTitle: "Install on AWS Elastic Kubernetes Service"
weight: 50
description: >
    Learn how to install Drasi on an AWS Elastic Kubernetes Service (EKS) cluster
---

[Amazon Elastic Kubernetes Service (EKS)](https://aws.amazon.com/eks/) is a managed Kubernetes service that allows users to run Kubernetes on Amazon Web Services (AWS).

**NOTE**: Installing Drasi in an EKS cluster can be significantly more complex than a standard installation on other platforms. Instead of downloading a CLI binary using the provided installation scripts, this approach requires modifying the source code of the Drasi CLI and building a local version of the CLI. While not strictly necessary, having knowledge of AWS storage services such as [EFS(Elastic File System)](https://aws.amazon.com/efs/) and [EBS(Elastic Block Storage)](https://aws.amazon.com/ebs/), as well as how to them up in Kubernetes as [Storage Classes](https://kubernetes.io/docs/concepts/storage/storage-classes/) can be extremely helpful.

## Prerequisites
This tutorial assumes you are familiar with:
- [Kubernetes](https://kubernetes.io/) and how to use [kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl) to manage a Kubernetes cluster.
- The following Kubernetes concepts and how to create/update them using `kubectl`: 
  - [Storage Classes](https://kubernetes.io/docs/concepts/storage/storage-classes/)
  - [Persistent Volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/).
- EKS and how to use [AWS CLI](https://aws.amazon.com/cli/) to manage EKS clusters.
- Making minor code changes in the [drasi-platform](https://github.com/drasi-project/drasi-platform) repository and using the `make` command to build a new, local version of the Drasi CLI from the source code.
- *Optional*:
  - Understanding of AWS [EFS(Elastic File System)](https://aws.amazon.com/efs/) and AWS [EBS(Elastic Block Storage)](https://aws.amazon.com/ebs/)

You will need admin access to an [EKS cluster](https://docs.aws.amazon.com/eks/latest/userguide/create-cluster.html). The EKS cluster needs to have a working Kubernetes node. This [document](https://docs.aws.amazon.com/eks/latest/userguide/create-managed-node-group.html) explains how to create a managed node group for your cluster.

On the computer where you will run the install process, you need to install the following software:
- [Kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl)
- [EKS CLI](https://aws.amazon.com/cli/)
- [Make](https://www.gnu.org/software/make/)
- [Go](https://go.dev/)
- [git](https://git-scm.com/downloads)

You will also need a git clone or a local fork of the [drasi-platform](https://github.com/drasi-project/drasi-platform) repository.

## Set the kubectl context
*If you created your cluster using eksctl, then you can skip this step. This is because eksctl already completed this step for you.* 
Use the following command to add the context of cluster to the kubectl config file. Replace `region-code` with the appropriate AWS region code and `my-cluster` with the name of your EKS cluster.

```bash
aws configure # You will be prompted to enter your AWS credentials
aws eks update-kubeconfig --region <region-code> --name <my-cluster>
```

Make sure the current `kubectl` context is set to the Kubernetes cluster where you want to install Drasi:

```bash
kubectl config use-context <your cluster name>
```

## Get the Drasi CLI
Usually you can utilize the installation scripts to install the Drasi CLI. However, we will be making minor code changes in the CLI in this installation guide, which means you must build the CLI from the source code. The section below will walkthrough the steps in-depth.



## Configuring Kubernetes StorageClass for the Drasi infrastructure
By default, the Drasi CLI uses Redis as the storage for the Query Container. There are two other valid storage types: In-memory and RocksDB (See [Configure Query Containers](/how-to-guides/configure-query-containers) for more details). Currently, some code changes in the CLI is needed for all three types.

<details>
<summary style="font-size: 1.5em;">Configuration for Redis and In-memory storage</summary>

#### 1. Configure the Drasi CLI
To begin with, retrieve the name of the StorageClass in your EKS cluster using the following command:
```bash
kubectl get storageclass
```
In your local clone or fork of the `drasi-platform` repo, navigate to `cli/service/resources/infra.yaml`. Locate a StatefulSet with the name `drasi-redis` and navigate to the `volumeClaimTemplates` section. Under `spec`, add a field with the name `storageClassname` and the name of your storage class that you have retrieved previously.
```yaml
...
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: drasi-redis
  labels:
    app: drasi-redis
spec:
...
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: [ReadWriteOnce]
        storageClassName: <your-storage-class>  # Add the storage class here
        resources:
          requests:
            storage: 1Gi
...
```

Similarly, locate a StatefulSet with the name `drasi-mongo` and navigate to the `volumeClaimTemplates` section. Under `spec`, add a field with the name `storageClassname` and the name of your storage class that you have retrieved previously.

```yaml
...
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: drasi-mongo
  labels:
    app: drasi-mongo
spec:
...
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: [ReadWriteOnce]
        storageClassName: <your-storage-class>  # Add the storage class here
        resources:
          requests:
            storage: 1Gi
...
```

A re-build of the Drasi CLI is needed. The [readme.md](https://github.com/drasi-project/drasi-platform/blob/main/cli/README.md) file in the `cli` folder describes how to build and install the Drasi CLI on your computer.

#### 2. Enable the AWS EBS CSI driver as an EKS addon
We recommend following this [tutorial](https://stackoverflow.com/a/75758116) for this step if you are unfamiliar with the process.

This completes the configuration steps for using Redis/In-memory as the Query Container storage. Proceed to the next section for installing Drasi to the cluster.

</details>



<details>
<summary style="font-size: 1.5em;">Configuration for RocksDB storage</summary>

#### 1. Configure the Drasi CLI
To begin with, retrieve the name of the StorageClass in your EKS cluster using the following command:
```bash
kubectl get storageclass
```
In your local clone or fork of the `drasi-platform` repo, navigate to `cli/service/resources/infra.yaml`. Locate a StatefulSet with the name `drasi-redis` and navigate to the `volumeClaimTemplates` section. Under `spec`, add a field with the name `storageClassname` and the name of your storage class that you have retrieved previously.
```yaml
...
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: drasi-redis
  labels:
    app: drasi-redis
spec:
...
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: [ReadWriteOnce]
        storageClassName: <your-storage-class>  # Add the storage class here
        resources:
          requests:
            storage: 1Gi
...
```

Similarly, locate a StatefulSet with the name `drasi-mongo` and navigate to the `volumeClaimTemplates` section. Under `spec`, add a field with the name `storageClassname` and the name of your storage class that you have retrieved previously.

```yaml
...
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: drasi-mongo
  labels:
    app: drasi-mongo
spec:
...
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: [ReadWriteOnce]
        storageClassName: <your-storage-class>  # Add the storage class here
        resources:
          requests:
            storage: 1Gi
...
```

#### 2. Enable the AWS EBS CSI driver as an EKS addon
We recommend following this [tutorial](https://stackoverflow.com/a/75758116) for this step if you are unfamiliar with the process.

This completes the configuration steps for using Redis/In-memory as the Query Container storage. Proceed to the next section for installing Drasi to the cluster.

#### 3. Enable an EFS CSI driver
To begin with, we need to enable an AWS EFS CSI driver and create an EFS system. The default EBS system does not support the PVC access mode of `ReadWriteMany`, which is used by RocksDB. This [guide](https://docs.aws.amazon.com/eks/latest/userguide/efs-csi.html) showcases how to setup this driver and create a file system.

#### 4. Deploy StorageClass, PersistentVolume and PersistentVolumeClaim
This [guide](https://stackoverflow.com/a/59671383) uses `kubectl` to configure the necessary Kubernetes resources. Specifically, a StorageClass, PersistentVolume and a PersistentVolumeClaim will be created.

#### 5. Configuring the default Query Container in the CLI
In your local clone or fork of the `drasi-platform` repo, navigate to `cli/service/resources/default-query-container.yaml`. Create a new storage with type `rocksDb` and put in the name of the Storageclass that you just created in the `storageClass` field. 

*Sample default-query-container.yaml file with rocksDB*
```yaml
kind: QueryContainer
apiVersion: v1
name: default
spec:
  queryHostCount: 1
  defaultStore: rocks
  storage:
    rocks:
      kind: rocksDb
      storageClass: <name-of-your-storage-class>
      enableArchive: false
```
A rebuild of the Drasi CLI is needed. The [readme.md](https://github.com/drasi-project/drasi-platform/blob/main/cli/README.md) file in the `cli` folder describes how to build and install the Drasi CLI on your computer.

</details>

## Install Drasi on the EKS Cluster
To install Drasi on the EKS cluster using all default settings, simply run the command:

```text
drasi init
```

This will install the version of Drasi that matches the version of the Drasi CLI that you are using and will create the Drasi environment in the **drasi-system** namespace, which will be created if it doesn't exist. The Drasi container images will be pulled from the main Drasi container registry located on **ghcr.io**.

The `drasi init` command gives you to control over certain aspects of the install process and the configuration of the Drasi environment through these flags and argument:

- `--dapr-runtime-version <version>`: Specifies the Dapr runtime version to install. The default value is "1.10.0".
- `--dapr-sidecar-version <version>`: Specifies the Dapr sidecar (daprd) version to install. The default value is "1.9.0".
- `--local`: If set, the Drasi CLI will use locally available images to install Drasi instead of pulling them from a remote container registry.
- `-n|--namespace <namespace>`: Specifies the Kubernetes namespace to install Drasi into. This namespace will be created if it does not exist. The default value is "drasi-system".
- `--registry <registry>`: Address of the container registry to pull Drasi images from. The default value is "ghcr.io".
- `--version <tag>`: Container image version tag to use when pulling Drasi images. The default value is the version tag of the Drasi CLI, which is available through the [drasi version](/docs/content/reference/command-line-interface#drasi-version) command.

For example, to install Drasi **0.1.3** in the **drasi-dev** namespace, you would run the following command:

```text
drasi init --version 0.1.3 -n drasi-dev
```

The following shows the output you would expect from a successful installation of Drasi 0.1.3:

```
Installing Drasi with version 0.1.3 from registry ghcr.io
ℹ Dapr not installed
✓ Dapr installed successfully
✓ Infrastructure deployed
  ✓ app=rg-redis is online
  ✓ app=rg-mongo is online
✓ Control plane is online
  ✓ drasi/infra=api is online
  ✓ drasi/infra=resource-provider is online
✓ Query container created
  ✓ Apply: QueryContainer/default: complete
  ✓ Wait QueryContainer/default online
✓ Default source providers created
  ✓ Apply: SourceProvider/PostgreSQL: complete
  ✓ Apply: SourceProvider/SQLServer: complete
  ✓ Apply: SourceProvider/CosmosGremlin: complete
✓ Default reaction providers created
  ✓ Apply: ReactionProvider/Debug: complete
  ✓ Apply: ReactionProvider/Debezium: complete
  ✓ Apply: ReactionProvider/EventGrid: complete
  ✓ Apply: ReactionProvider/Gremlin: complete
  ✓ Apply: ReactionProvider/Result: complete
  ✓ Apply: ReactionProvider/SignalR: complete
  ✓ Apply: ReactionProvider/StorageQueue: complete
  ✓ Apply: ReactionProvider/StoredProc: complete
```

Note that the Drasi installation also installs a number of dependencies, including:
- [Dapr](https://dapr.io/)
- [Redis](https://redis.io/)
- [Mongo DB](https://www.mongodb.com/).

If `drasi init` completes without error, the Drasi environment is ready for use and you can start to create [Sources](/how-to-guides/configure-sources/), [Continuous Queries](/how-to-guides/write-continuous-queries/), and [Reactions](/how-to-guides/configure-reactions/).

## Troubleshooting Installation Problems
If any of installation steps fail, a check mark will appear next to the failed step and the installation process will abort. For example:

```
ℹ Dapr not installed
✓ Dapr installed successfully
✓ Infrastructure deployed
  ✗ Timed out waiting for app=drasi-redis
  ✗ Timed out waiting for app=drasi-mongo
✓ Control plane is online
  ✗ Timed out waiting for drasi/infra=api
  ✗ Timed out waiting for drasi/infra=resource-provider
●∙∙ Creating query container...
Error: drasi API not available
```

Sometimes, `drasi init` can fail due to transient errors, usually due to failed network connections or timeouts experienced while downloading and installing dependencies. In these situations you can simply rerun the same `drasi init` command and the Drasi CLI will attempt to complete the remaining incomplete steps.

To verify Dapr was installed successfully, you can check what Dapr pods are running using the command:

```text
kubectl get pods -n dapr-system
```

Which should show output similar to this:

```
NAME                                     READY   STATUS    RESTARTS        AGE
dapr-dashboard-5cc65d985f-qzqbg          1/1     Running   0               10m
dapr-operator-5d98f57c86-kspwk           1/1     Running   0               10m
dapr-placement-server-0                  1/1     Running   0               10m
dapr-sentry-697bdc6cc4-xprww             1/1     Running   0               10m
dapr-sidecar-injector-56c4c4b485-n48bg   1/1     Running   0               10m
```

## Deleting Drasi
To delete a Drasi environment that is installed in the default `drasi-system` namespace, run the command:

```text
drasi uninstall
```

To delete a Drasi environment from a specific namespace, include the `-n` flag:

```text
drasi uninstall -n drasi-dev
```

In either case, the Drasi CLI will delete the namespace containing the Drasi environment. Everything in that namespace will be deleted and cannot be recovered.