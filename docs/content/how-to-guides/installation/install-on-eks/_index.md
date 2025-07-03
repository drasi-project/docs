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
- The following Kubernetes concepts and how to create/update them using `kubectl`: 
  - [Storage Classes](https://kubernetes.io/docs/concepts/storage/storage-classes/)
  - [Persistent Volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/).
- An EKS Cluster and how to use [AWS CLI](https://aws.amazon.com/cli/) to manage EKS clusters.

You will need admin access to an [EKS cluster](https://docs.aws.amazon.com/eks/latest/userguide/create-cluster.html). The EKS cluster needs to have a working Kubernetes node. This [document](https://docs.aws.amazon.com/eks/latest/userguide/create-managed-node-group.html) explains how to create a managed node group for your cluster.

Additionally, the Drasi infrastructure pods require the use of persistent volumes, which must be bound to a Kubernetes StorageClass. The AWS cluster comes with a default storage class backed by Amazon Elastic Block Store (EBS) volumes, but it also supports various other types. Before installing Drasi, you must install a Container Storage Interface (CSI) driver for the type of volumes you wish to use. The following instructions provide guidance on configuring either EBS or EFS (Elastic File System) volumes, as well as setting up an IAM role with sufficient permissions for the drivers, depending on your storage requirements:

**Note:** if you are using RocksDB as the Query Container storage, you must setup an EFS storage class. For more information on configuring Query Containers, visit [Configure Query Containers](/how-to-guides/configure-query-containers):

<details>
<summary style="font-size: 1em;">Configuring Kubernetes StorageClass and Amazon EBS CSI Drivers</summary>

1. **Follow this [tutorial](https://docs.aws.amazon.com/eks/latest/userguide/ebs-csi.html) for configuring Amazon EBS CSI Driver**

   This will guide you through the steps to install and configure the Amazon EBS CSI driver for your EKS cluster. Step 1 of this tutorial will also create an IAM role with the required permissions.

2. **Ensure that the EBS StorageClass is set to be default**

   After configuring the CSI driver, you can set the EBS StorageClass as the default one in your Kubernetes cluster by following these steps:

   1. **List the available StorageClasses**:

      Identify the one where the provisioner is `kubernetes.io/aws-ebs`.
      ```bash
      kubectl get storageclass
      ```

   2. **Patch the EBS StorageClass** to set it as the default:

      ```bash
      kubectl patch storageclass <name-of-storageclass> -p '{"metadata": {"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}'
      ```

   3. **(Optional) If other StorageClasses are already set as default**, patch them to remove the default annotation:

      ```bash
      kubectl patch storageclass <other-storage-class-name> -p '{"metadata": {"annotations":{"storageclass.kubernetes.io/is-default-class":"false"}}}'
      ```

   4. **Verify that the default StorageClass is updated** by listing the StorageClasses again:

      ```bash
      kubectl get storageclass
      ```

      The EBS StorageClass should now have "(default)" next to its name.

</details>

<details>
<summary style="font-size: 1em;">Configuring Kubernetes StorageClass and Amazon EFS CSI Drivers (Required if using RocksDB)</summary>

1. **Follow this [tutorial](https://docs.aws.amazon.com/eks/latest/userguide/efs-csi.html) for configuring Amazon EFS CSI Driver**

   This will guide you through the steps to install and configure the Amazon EFS CSI driver for your EKS cluster. Step 1 of this tutorial will also create an IAM role with the required permissions.

2. **Follow this [tutorial](https://community.aws/content/2iCiQb70sP9wWcOLgG67jLVqK53/navigating-amazon-eks-eks-with-efs-add-on#step-6-set-up-a-storage-class-for-the-sample-application) for creating an EFS StorageClass in your EKS cluster**

3. **Ensure that the EBS StorageClass is set to be default**

   After configuring the CSI driver, you can set the EFS StorageClass as the default one in your Kubernetes cluster by following these steps:

   1. **List the available StorageClasses**:

      Identify the one where the provisioner is `efs.csi.aws.com`.
      ```bash
      kubectl get storageclass
      ```

   2. **Patch the EFS StorageClass** to set it as the default:

      ```bash
      kubectl patch storageclass <name-of-storageclass> -p '{"metadata": {"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}'
      ```

   3. **(Optional) If other StorageClasses are already set as default**, patch them to remove the default annotation:

      ```bash
      kubectl patch storageclass <other-storage-class-name> -p '{"metadata": {"annotations":{"storageclass.kubernetes.io/is-default-class":"false"}}}'
      ```

   4. **Verify that the default StorageClass is updated** by listing the StorageClasses again:

      ```bash
      kubectl get storageclass
      ```

      The EFS StorageClass should now have "(default)" next to its name.

</details>


On the computer where you will run the install process, you need to install the following software:
- [Kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl)
- [AWS CLI](https://aws.amazon.com/cli/)


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
You will install Drasi on the EKS cluster using the [Drasi CLI](/reference/command-line-interface/). This guide focuses on how to install Drasi on an EKS cluster and covers only a few features of the Drasi CLI. Refer to the [Drasi CLI Command Reference](/reference/command-line-interface/#command-reference) for a complete description of the functionality it provides.

You can get the Drasi CLI for your platform using one of the following options:

{{< tabpane >}}
{{< tab header="macOS" lang="bash" >}}
curl -fsSL https://raw.githubusercontent.com/drasi-project/drasi-platform/main/cli/installers/install-drasi-cli.sh | /bin/bash
{{< /tab >}}
{{< tab header="Windows PowerShell" lang="powershell" >}}
iwr -useb "https://raw.githubusercontent.com/drasi-project/drasi-platform/main/cli/installers/install-drasi-cli.ps1" | iex
{{< /tab >}}
{{< tab header="Linux" lang="bash" >}}
wget -q "https://raw.githubusercontent.com/drasi-project/drasi-platform/main/cli/installers/install-drasi-cli.sh" -O - | /bin/bash
{{< /tab >}}
{{% tab header="Binaries" text=true %}}
Download a specific version of the CLI from the [drasi-platform releases](https://github.com/drasi-project/drasi-platform/releases) page on GitHub. The file to download for your platform is:
- **macOS arm64** - drasi-darwin-arm64
- **macOS x64** - drasi-darwin-x64
- **Windows x64** - drasi-windows-x64.exe
- **Linux x64** - drasi-linux-x64
- **Linux arm64** - drasi-linux-arm64

Once downloaded, rename the file to `drasi` (macOS and Linux) or `drasi.exe` (Windows) and add it to your path.
{{% /tab %}}
{{% tab header="Build from Source" text=true %}}
The Drasi CLI source code is in the [drasi-platform repo](https://github.com/drasi-project/drasi-platform) in the [cli folder](https://github.com/drasi-project/drasi-platform/tree/main/cli).

The [readme.md](https://github.com/drasi-project/drasi-platform/blob/main/cli/README.md) file in the `cli` folder describes how to build and install the Drasi CLI on your computer.
{{% /tab %}}
{{< /tabpane >}}



## Install Drasi on the EKS Cluster
Before installing Drasi, set your environment to use the EKS cluster by running the following command:
```text
drasi env kube
```

Then, to install Drasi on the EKS cluster using all default settings, simply run the command:

```text
drasi init
```

This will install the version of Drasi that matches the version of the Drasi CLI that you are using and will create the Drasi environment in the **drasi-system** namespace, which will be created if it doesn't exist. The Drasi container images will be pulled from the main Drasi container registry located on **ghcr.io**.

{{% alert tip %}}
If you wish to use RocksDB as the Query Container storage and you have already configured an EFS StorageClass, you need to update the default Query Container settings with the `Drasi` CLI. Please navigate to this [page](/how-to-guides/configure-query-containers/#rocksdb-storage-options) for more detailed instructions on how to configure the storage settings with the StorageClass you created earlier.
{{% /alert %}}

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

{{% alert tip %}}
To test that Drasi has been successfully installed on your EKS cluster, you can run a quick end to end test by following the [Quickly Test a Drasi Environment guide](/docs/content/how-to-guides/testing/quick-test-environment).
{{% /alert %}}

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

```
drasi uninstall
```

The Drasi CLI will delete the `drasi-system` namespace containing the Drasi environment. Everything in that namespace will be deleted and cannot be recovered, so the Drasi CLI will prompt you to confirm you want to uninstall with the following message:

```
Uninstalling Drasi
Deleting namespace:  drasi-system
Are you sure you want to uninstall Drasi from the namespace drasi-system? (yes/no)
```

Type `yes` and hit `enter` to proceed. 

Once Drasi is successfully uninstalled you will see the following confirmation message:

```
Drasi uninstalled successfully
```

To force the uninstall to proceed without prompting you to confirm you can add the `-y` or `--yes` flag to the command:

```
drasi uninstall --yes
```

To delete a Drasi environment from a specific namespace, include the `-n` flag:

```
drasi uninstall -n drasi-dev