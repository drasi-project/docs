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

## Install the Drasi CLI
Download the Drasi CLI to your local computer using the command or link for your operating system:

{{< tabpane >}}
{{< tab header="MacOS" lang="Bash" >}}
curl -fsSL "https://drasi.blob.core.windows.net/installs-ghcr/install-drasi-cli-github.sh" | /bin/bash -s -- $GITHUB_TOKEN
{{< /tab >}}
{{< tab header="Linux" lang="Bash" >}}
curl -fsSL "https://drasi.blob.core.windows.net/installs-ghcr/install-drasi-cli-github.sh" | /bin/bash -s -- $GITHUB_TOKEN
{{< /tab >}}
{{% tab header="Windows" text=true %}}
Please download the CLI through this [link](https://github.com/project-drasi/drasi-platform/releases/download/v0.1.0/drasi-windows-x64.exe) and then add it to your system path.
{{< /tab >}}
{{% tab header="Binaries" text=true %}}
Download the CLI for your platform, and add it to your system path:
- [MacOS arm64](https://github.com/project-drasi/drasi-platform/releases/download/v0.1.0/drasi-darwin-arm64)
- [MacOS x64](https://github.com/project-drasi/drasi-platform/releases/download/v0.1.0/drasi-darwin-x64)
- [Windows x64](https://github.com/project-drasi/drasi-platform/releases/download/v0.1.0/drasi-windows-x64.exe)
- [Linux x64](https://github.com/project-drasi/drasi-platform/releases/download/v0.1.0/drasi-linux-x64)
- [Linux arm64](https://github.com/project-drasi/drasi-platform/releases/download/v0.1.0/drasi-linux-arm64)
{{% /tab %}}
{{< /tabpane >}}

> See the [Drasi CLI Reference](/reference/command-line-interface/) for a complete description of the functionality it provides.

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

## Optional:Testing the Drasi environemnt
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