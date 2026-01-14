---
type: "docs"
title: "Install on kind"
linkTitle: "Install on kind"
weight: 40
description: >
    Learn how to install Drasi on a kind cluster for local development and testing
related:
  tutorials:
    - title: "Getting Started with Drasi"
      url: "/drasi-kubernetes/getting-started/"
  concepts:
    - title: "Why Drasi?"
      url: "/concepts/overview/"
  howto:
    - title: "Configure Sources"
      url: "/drasi-kubernetes/how-to-guides/configure-sources/"
    - title: "Configure Reactions"
      url: "/drasi-kubernetes/how-to-guides/configure-reactions/"
    - title: "Quickly Test a Drasi Environment"
      url: "/drasi-kubernetes/how-to-guides/testing/quick-test-environment/"
  reference:
    - title: "CLI Reference"
      url: "/drasi-kubernetes/reference/command-line-interface/"
---

[kind](https://kind.sigs.k8s.io/) is a tool for running Kubernetes clusters on your local computer. Aimed primarily at developers, kind is an easy to use option for doing local development and testing of Drasi, Drasi extensions, and Drasi-based solutions. This guide describes how to install Drasi on kind.

## Prerequisites
This guide assumes you are familiar with [Kubernetes](https://kubernetes.io/) and know how to use [kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl) to manage a Kubernetes cluster.

On the computer where you will install kind, you need to install the following software:
- [kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl)
- [docker](https://www.docker.com/products/docker-desktop/)

## Install kind
The [kind installation](https://kind.sigs.k8s.io/docs/user/quick-start/#installation) instructions describe multiple ways to install kind on macOS, Windows, and Linux. The options include downloading binaries, using a package manager, and building from source. Review the available installation options and use one to install kind on your computer before continuing.

## Create a kind Cluster
To create a kind cluster, open a terminal or command prompt and run the following command: 

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

This will create a kind cluster named **kind-kind** and set the current kubectl context to the new cluster. Now you can manage the kind cluster using familiar Kubernetes management tools such as kubectl and the [Kubernetes extension](https://marketplace.visualstudio.com/items?itemName=ms-kubernetes-tools.vscode-kubernetes-tools) for [Visual Studio Code](https://code.visualstudio.com/).

## Get the Drasi CLI
{{< read file= "/shared-content/installation/drasi-cli/cli-installation.md" >}}

This guide focuses on how to install Drasi on a kind cluster and covers only a few features of the Drasi CLI. Refer to the [Drasi CLI Command Reference](/reference/command-line-interface/#command-reference) for a complete description of the functionality it provides.

## Install Drasi on the kind Cluster
Before installing Drasi, ensure that your kubectl context is set to the kind cluster where you want to install Drasi. Then, configure a new Drasi CLI environment by running the following command:
```text
drasi env kube
```

This command adds the current Kubernetes context as a Drasi configuration and set it as the current Drasi environment. The Drasi CLI will use this environment to install Drasi on the kind cluster.

Then, to install Drasi on the kind cluster using all default settings, simply run the command:

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

If `drasi init` completes without error, the Drasi environment is ready for use and you can start to create {{< term "Source" "Sources" >}}, {{< term "Continuous Query" "Continuous Queries" >}}, and {{< term "Reaction" "Reactions" >}}.

{{% alert tip %}}
To test that Drasi has been successfully installed on your kind cluster, you can run a quick end to end test by following the [Quickly Test a Drasi Environment guide](/docs/content/how-to-guides/testing/quick-test-environment).
{{% /alert %}}

If `drasi init` completes without error, the Drasi environment is ready for use and you can start to create {{< term "Source" "Sources" >}}, {{< term "Continuous Query" "Continuous Queries" >}}, and {{< term "Reaction" "Reactions" >}}.

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