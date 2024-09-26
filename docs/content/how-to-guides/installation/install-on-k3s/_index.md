---
type: "docs"
title: "Install on k3s"
linkTitle: "Install on k3s"
weight: 30
description: >
    Learn how to install Drasi on a k3s cluster (using k3d) for local development and testing
---

[k3s](https://k3s.io/) is a lightweight Kubernetes distribution that is ideal for running on your local computer. This tutorial teaches you how to install Drasi on k3s using [k3d](https://k3d.io/), a lightweight wrapper to run k3s in docker. It is an easy to use option for doing local development and testing of Drasi, Drasi extensions, and Drasi-based solutions. 

## Prerequisites
This guide assumes you are familiar with [Kubernetes](https://kubernetes.io/) and know how to use [kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl) to manage a Kubernetes cluster.

On the computer where you will install k3d/k3s, you need to install the following software:
- [kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl)
- [docker](https://www.docker.com/)

## Install k3d
The [k3d installation](https://k3d.io/v5.6.3/#installation) instructions describe multiple ways to install k3d on macOS, Windows, and Linux. The options include downloading binaries, using a package manager, and building from source. Review the available installation options and use one to install k3d on your computer before continuing.

## Create a k3s Cluster
To create a k3s cluster, open a terminal or command prompt and run the following command: 

```bash
k3d cluster create
```

During the cluster creation, you will see output similar to this:

```
INFO[0000] Prep: Network
INFO[0000] Created network 'k3d-k3s-default'
INFO[0000] Created image volume k3d-k3s-default-images
INFO[0000] Starting new tools node...
INFO[0001] Creating node 'k3d-k3s-default-server-0'
INFO[0001] Pulling image 'ghcr.io/k3d-io/k3d-tools:5.7.4'
INFO[0002] Pulling image 'docker.io/rancher/k3s:v1.30.4-k3s1'
INFO[0003] Starting node 'k3d-k3s-default-tools'
INFO[0008] Creating LoadBalancer 'k3d-k3s-default-serverlb'
INFO[0010] Pulling image 'ghcr.io/k3d-io/k3d-proxy:5.7.4'
INFO[0014] Using the k3d-tools node to gather environment information
INFO[0014] Starting new tools node...
INFO[0014] Starting node 'k3d-k3s-default-tools'
INFO[0016] Starting cluster 'k3s-default'
INFO[0016] Starting servers...
INFO[0016] Starting node 'k3d-k3s-default-server-0'
INFO[0019] All agents already running.
INFO[0019] Starting helpers...
INFO[0019] Starting node 'k3d-k3s-default-serverlb'
INFO[0026] Injecting records for hostAliases (incl. host.k3d.internal) and for 3 network members into CoreDNS configmap...
INFO[0028] Cluster 'k3s-default' created successfully!
INFO[0028] You can now use it like this:
kubectl cluster-info
```

This will create a k3s cluster named **k3d-k3s-default** and set the current kubectl context to the new cluster. Now you can manage the k3s cluster using familiar Kubernetes management tools such as kubectl and the [Kubernetes extension](https://marketplace.visualstudio.com/items?itemName=ms-kubernetes-tools.vscode-kubernetes-tools) for [Visual Studio Code](https://code.visualstudio.com/).

## Get the Drasi CLI
You will install Drasi on the k3s cluster using the [Drasi CLI](/reference/command-line-interface/). 

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

This guide focuses on how to install Drasi on a k3s cluster and covers only a few features of the Drasi CLI. Refer to the [Drasi CLI Command Reference](/reference/command-line-interface/#command-reference) for a complete description of the functionality it provides.

## Install Drasi on the k3s Cluster
To install Drasi on the k3s cluster using all default settings, simply run the command:

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

```text
drasi uninstall
```

To delete a Drasi environment from a specific namespace, include the `-n` flag:

```text
drasi uninstall -n drasi-dev
```

In either case, the Drasi CLI will delete the namespace containing the Drasi environment. Everything in that namespace will be deleted and cannot be recovered.

## Deleting the k3s cluster
To delete the k3s cluster and everything it contains, including the Drasi environment, run this command:

```bash
k3d cluster delete
```

You will see the following output:

```
INFO[0000] Deleting cluster 'k3s-default'
INFO[0003] Deleting cluster network 'k3d-k3s-default'
INFO[0003] Deleting 1 attached volumes...
INFO[0003] Removing cluster details from default kubeconfig...
INFO[0003] Removing standalone kubeconfig file (if there is one)...
INFO[0003] Successfully deleted cluster k3s-default!
```