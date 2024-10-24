---
type: "docs"
title: "Install on Azure Kubernetes Service"
linkTitle: "Install on Azure Kubernetes Service"
weight: 10
toc_hide: false
hide_summary: false
description: >
    Learn how to install Drasi on an Azure Kubernetes Service (AKS) cluster
---

[Azure Kubernetes Service (AKS)](https://learn.microsoft.com/en-us/azure/aks/) is a managed Kubernetes environment hosted in Microsoft's Azure cloud. It is a secure and scalable Kubernetes environment suitable for both the development/testing and production hosting of Drasi and Drasi-based solutions. This guide explains how to install Drasi on AKS.

## Prerequisites
This guide assumes you are familiar with:
- [Kubernetes](https://kubernetes.io/) and know how to use [kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl) to manage a Kubernetes cluster
- [Azure Kubernetes Service (AKS)](https://learn.microsoft.com/en-us/azure/aks/what-is-aks) and how to create and manage AKS clusters using either the [Azure Portal](https://learn.microsoft.com/en-us/azure/aks/learn/quick-kubernetes-deploy-portal) or the [Azure CLI](https://learn.microsoft.com/en-us/azure/aks/learn/quick-kubernetes-deploy-cli)

You will need admin access to the AKS cluster on which you will install Drasi.

On the computer from which you will install Drasi, you need to install the following software:
- [kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl)
- [docker](https://www.docker.com/)
- [Azure CLI](https://learn.microsoft.com//cli/azure/install-azure-cli)

## Get the Drasi CLI
You will install Drasi on the AKS cluster using the [Drasi CLI](/reference/command-line-interface/). 

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

This guide focuses on how to install Drasi on an AKS cluster and covers only a few features of the Drasi CLI. Refer to the [Drasi CLI Command Reference](/reference/command-line-interface/#command-reference) for a complete description of the functionality it provides.

## Set the kubectl context
Execute the following `az cli` commands to pull the AKS cluster credentials into your list of `kubectl` contexts:

```bash
az login
az account set --subscription <your subscription id>
az aks get-credentials --resource-group <your resource group> --name <your cluster name>
```

Set the current `kubectl` context to the AKS cluster where you want to install Drasi with the following command:

```bash
kubectl config use-context <your cluster name>
```

## Install Drasi on the AKS Cluster
To install Drasi on the AKS cluster using all default settings, simply run the command:

```text
drasi init
```

This will install the version of Drasi that matches the version of the Drasi CLI that you are using and will create the Drasi environment in the **drasi-system** namespace, which will be created if it doesn't exist. The Drasi container images will be pulled from the main Drasi container registry located on **ghcr.io**.

The `drasi init` command gives you control over certain aspects of the install process and the configuration of the Drasi environment through these flags and argument:

- `--dapr-runtime-version <version>`: Specifies the Dapr runtime version to install. The default value is "1.10.0".
- `--dapr-sidecar-version <version>`: Specifies the Dapr sidecar (daprd) version to install. The default value is "1.9.0".
- `--local`: If set, the Drasi CLI will use locally available images to install Drasi instead of pulling them from a remote container registry.
- `-n|--namespace <namespace>`: Specifies the Kubernetes namespace to install Drasi into. This namespace will be created if it does not exist. The default value is "drasi-system".
- `--registry <registry>`: Address of the container registry to pull Drasi images from. The default value is "ghcr.io".
- `--version <tag>`: Container image version tag to use when pulling Drasi images. The default value is the version tag of the Drasi CLI, which is available through the [drasi version](/reference/command-line-interface#drasi-version) command.

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
  ✓ app=drasi-redis is online
  ✓ app=drasi-mongo is online
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
To test that Drasi has been successfully installed on your AKS cluster, you can run a quick end to end test by following the [Quickly Test a Drasi Environment guide](/docs/content/how-to-guides/testing/quick-test-environment).
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

```bash
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
```


