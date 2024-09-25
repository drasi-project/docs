---
type: "docs"
title: "Install on k3s"
linkTitle: "Install on k3s"
weight: 30
description: >
    Learn how to install Drasi on a k3s cluster for local development and testing
---

[k3s](https://k3s.sigs.k8s.io/) is a tool for running Kubernetes clusters on your local computer. It is an easy to use option for doing local development and testing of Drasi and Drasi-based solutions. This tutorial teaches you how to install Drasi on k3s.

## Prerequisites
This tutorial assumes you are familiar with [Kubernetes](https://kubernetes.io/) and know how to use [kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl) to manage a Kubernetes cluster.

On the computer where you will install k3s, you need to install the following software:
- [Kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl)
- [Docker](https://www.docker.com/)
- [k3s](https://k3s.sigs.k8s.io/docs/user/quick-start/)

## Create a k3s Cluster
To create a k3s cluster, run the following command in a terminal window: 

```bash
k3s create cluster
```

This command will create a k3s cluster named "k3s" and set the current kubectl context to refer to the new cluster. During the k3s install, you will see output similar to this:

```
Creating cluster "k3s" ...
 ✓ Ensuring node image (kindest/node:v1.30.0) 🖼
 ✓ Preparing nodes 📦
 ✓ Writing configuration 📜
 ✓ Starting control-plane 🕹️
 ✓ Installing CNI 🔌
 ✓ Installing StorageClass 💾
Set kubectl context to "k3s-k3s"
You can now use your cluster with:

kubectl cluster-info --context k3s-k3s

Not sure what to do next? 😅  Check out https://k3s.sigs.k8s.io/docs/user/quick-start/
```

Once complete, you can manage the k3s cluster with familiar Kubernetes management tools such as kubectl and the Visual Studio Code Kubernetes plugin. The k3s will have the name "k3s-k3s".

## Get the Drasi CLI
You can get the Drasi CLI for your platform using one of the following options:

{{< tabpane >}}
{{< tab header="macOS" lang="bash" >}}
curl -fsSL https://raw.githubusercontent.com/drasi-project/drasi-platform/main/cli/installers/install-drasi-cli.sh | /bin/bash
{{< /tab >}}
{{< tab header="Windows PowerShell" lang="ps" >}}
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

Refer to the [Drasi CLI Reference](/reference/command-line-interface/) for a complete description of how to use it and the functionality it provides.

## Install Drasi on the k3s Cluster
To install the latest version of Drasi on the k3s cluster, run:

```bash
drasi init
```

If you want to install a specific version of Drasi, you can use the `version` flag, like this:

```bash
drasi init --version <version>
```

The following shows the output from a successful Drasi installation:

```
Installing Drasi with version latest from registry ghcr.io
ℹ Dapr already installed
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

If `drasi init` completes without error, the Drasi environment is installed and ready for use.

## Troubleshooting Installation
If any of these steps fail, a red check mark will appear next to the step and the installation process will stop. 

Dapr should be automatically installed to your cluster. You can verify this by running the command `kubectl get pods -n dapr-system`. 

Sometimes, `drasi init` can fail due to transient errors, usually due to failed network connections or timeouts downloading and installing dependencies. In these situations you can simply rerun the same `drasi init` command and the Drasi CLI will attempt to complete the remaining incomplete steps.

## Optional:Testing the Drasi environment
To verify that Drasi has been correctly deployed to your k3s cluster, you can deploy a quick [test workload](/how-to-guides/installation/test-installation.md).

## Deleting the k3s cluster
To delete the k3s cluster and everything it contains, including the Drasi environment, run this command:

```bash
k3s delete cluster
```

You will see the following output:

```
Deleting cluster "k3s" ...
Deleted nodes: ["k3s-control-plane"]
```

After this the k3s cluster is gone.