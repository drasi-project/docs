---
type: "docs"
title: "Install on AWS Elastic Kubernetes Service"
linkTitle: "Install on AWS Elastic Kubernetes Service"
weight: 50
description: >
    Learn how to install Drasi on an AWS Elastic Kubernetes Service (EKS) cluster
---

[Amazon Elastic Kubernetes Service (EKS)](https://aws.amazon.com/eks/) is a managed Kubernetes service that allows users to run Kubernetes on Amazon Web Services (AWS).

## Prerequisites
This tutorial assumes you are familiar with:
- [Kubernetes](https://kubernetes.io/) and how to use [kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl) to manage a Kubernetes cluster.
- EKS and how to use [AWS CLI](https://aws.amazon.com/cli/) to manage EKS clusters.

You will need admin access to an [EKS cluster](https://docs.aws.amazon.com/eks/latest/userguide/create-cluster.html). The EKS cluster needs to have a working Kubernetes node. This [document](https://docs.aws.amazon.com/eks/latest/userguide/create-managed-node-group.html) explains how to create a managed node group for your cluster.

On the computer where you will run the install process, you need to install the following software:
- [Kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl)
- [EKS CLI](https://aws.amazon.com/cli/)

You will also need a clone or a fork of the [drasi-platform](https://github.com/drasi-project/drasi-platform) repository.

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
To install the latest version of Drasi on the kind cluster, run:

```bash
drasi init
```

If you want to install a specific version of Drasi, you can use the `version` flag, like this:

```bash
drasi init --version <version>
```

If `drasi init` completes without error, the Drasi environment is installed and ready for use.

## Troubleshooting Installation
If any of these steps fail, a red check mark will appear next to the step and the installation process will stop. 

Dapr should be automatically installed to your cluster. You can verify this by running the command `kubectl get pods -n dapr-system`. 

Sometimes, `drasi init` can fail due to transient errors, usually due to failed network connections or timeouts downloading and installing dependencies. In these situations you can simply rerun the same `drasi init` command and the Drasi CLI will attempt to complete the remaining incomplete steps.

## Optional:Testing the Drasi environment
To verify that Drasi has been correctly deployed to your kind cluster, you can deploy a quick [test workload](/how-to-guides/installation/test-installation.md).
