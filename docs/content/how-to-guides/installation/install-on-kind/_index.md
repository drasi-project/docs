---
type: "docs"
title: "Install on kind"
linkTitle: "Install on kind"
weight: 10
description: >
    Learn how to install Drasi on a kind cluster for local development and testing
---

[kind](https://kind.sigs.k8s.io/) is a tool for running Kubernetes clusters on your local computer. Aimed primarily at developers, it is an easy to use option for doing local development and testing of Drasi and Drasi-based solutions. This tutorial teaches you how to install Drasi on kind.

## Prerequisites
This tutorial assumes you are familiar with [Kubernetes](https://kubernetes.io/) and know how to use [kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl) to manage a Kubernetes cluster.

On the computer where you will install kind, you need to install the following software:
- [kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl)
- [docker](https://www.docker.com/products/docker-desktop/)

## Install Kind
The [kind installation](https://kind.sigs.k8s.io/docs/user/quick-start/#installation) instructions describe multiple ways to install kind on macOS, Windows, and Linux. These include downloading binaries, using a package manager, and building from source. Review the available installation options and use one to install kind on your computer before continuing.

## Create a kind Cluster
To create a kind cluster, run the following command from a terminal window: 

```bash
kind create cluster
```

During the cluster creation, you will see output similar to this:

```
Creating cluster "kind" ...
 ✓ Ensuring node image (kindest/node:v1.30.0) 🖼
 ✓ Preparing nodes 📦
 ✓ Writing configuration 📜
 ✓ Starting control-plane 🕹️
 ✓ Installing CNI 🔌
 ✓ Installing StorageClass 💾
Set kubectl context to "kind-kind"
You can now use your cluster with:

kubectl cluster-info --context kind-kind
```

This will create a kind cluster named **kind-kind** and set the current kubectl context to the new cluster. You can manage the kind cluster using familiar Kubernetes management tools such as kubectl and the [Kubernetes extension](https://marketplace.visualstudio.com/items?itemName=ms-kubernetes-tools.vscode-kubernetes-tools) for [Visual Studio Code](https://code.visualstudio.com/).

## Get the Drasi CLI
You can get the Drasi CLI for your platform using one of the following options:

{{< tabpane >}}
{{< tab header="MacOS" lang="bash" >}}
curl -fsSL https://raw.githubusercontent.com/drasi-project/drasi-platform/installer-hotfix/cli/installers/install-drasi-cli.sh | /bin/bash
{{< /tab >}}
{{< tab header="Windows" lang="bash" >}}
iwr -useb "https://raw.githubusercontent.com/drasi-project/drasi-platform/main/cli/installers/install-drasi-cli.ps1" | iex
{{< /tab >}}
{{< tab header="Linux" lang="bash" >}}
wget -q "https://raw.githubusercontent.com/drasi-project/drasi-platform/main/cli/installers/install-drasi-cli.sh" -O - | /bin/bash
{{< /tab >}}
{{% tab header="Binaries" text=true %}}
Download a specific version of the CLI from the [drasi-platform releases](https://github.com/drasi-project/drasi-platform/releases) page on GitHub. The file to download for your platform is:
- **MacOS arm64** - drasi-darwin-arm64
- **MacOS x64** - drasi-darwin-x64
- **Windows x64** - drasi-windows-x64.exe
- **Linux x64** - drasi-linux-x64
- **Linux arm64** - drasi-linux-arm64

Once downloaded, rename the file to `drasi` (MacOs and Linux) or `drasi.exe` (Windows) and add it to your path.
{{% /tab %}}
{{% tab header="Build from Source" text=true %}}
The Drasi CLI source code is in the [drasi-platform repo](https://github.com/drasi-project/drasi-platform) in the [cli folder](https://github.com/drasi-project/drasi-platform/tree/main/cli).

The [readme.md](https://github.com/drasi-project/drasi-platform/blob/main/cli/README.md) file in the `cli` folder describes how to build and install the Drasi CLI on your computer.
{{% /tab %}}
{{< /tabpane >}}

Refer to the [Drasi CLI Reference](/reference/command-line-interface/) for a complete description of how to use it and the functionality it provides.

## Install Drasi on the kind Cluster
To install Drasi on the kind cluster run:

```drasi
drasi init
```

By default, this will install the same version of Drasi as the version number of the CLI. You can check which Drasi CLI version you have by running the command:

```drasi
drasi version
```

If you want to install a specific version of Drasi, you can pass the `--version` flag to the `drasi init` command. Here is an example of how to install Drasi **0.1.3**:

```drasi
drasi init --version 0.1.3
```

The following shows the output you would expect from a successful Drasi installation:

```
Installing Drasi with version latest from registry ghcr.io
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

Note that the Drasi install process also installs [DAPR](https://dapr.io/) on the kind cluster, along with some infrastructure components used by Drasi and DAPR, such as [Redis](https://redis.io/) and [Mongo DB](https://www.mongodb.com/).

If `drasi init` completes without error, the Drasi environment is ready for use and you can start to create [Sources](/how-to-guides/configure-sources/), [Continuous Queries](/how-to-guides/write-continuous-queries/), and [Reactions](/how-to-guides/configure-reactions/).

If you want to verify that your new Drasi environment is working correctly, you can walk through the [Getting Started tutorial](/getting-started/) using your new environment instead of the Dev Container suggested in the tutorial. 

## Troubleshooting Installation Errors
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

Sometimes, `drasi init` can fail due to transient errors, usually due to failed network connections or timeouts experienced while downloading and installing dependencies. In these situations you can simply rerun the `drasi init` command and the Drasi CLI will attempt to complete the remaining incomplete steps.

To verify DAPR was installed successfully, you can check what DAPR pods are running using the command:

```kubectl
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

## Deleting the kind cluster
To delete the kind cluster and everything it contains, including the Drasi environment, run this command:

```bash
kind delete cluster
```

You will see the following output:

```
Deleting cluster "kind" ...
Deleted nodes: ["kind-control-plane"]
```

After this the kind cluster is gone.