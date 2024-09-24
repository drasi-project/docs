---
type: "docs"
title: "Install on AWS Elastic Kubernetes Service"
linkTitle: "Install on AWS Elastic Kubernetes Service"
weight: 50
description: >
    Learn how to install Drasi on an AWS Elastic Kubernetes Service (EKS) cluster
---

[AWS Elastic Kubernetes Service (EKS)]() todo. 

It is a secure and scalable environment suitable for both the development/testing and production hosting of Drasi and Drasi-based solutions. This tutorial teaches you how to install Drasi on AKS.

## Prerequisites
This tutorial assumes you are familiar with:
- [Kubernetes](https://kubernetes.io/) and how to use [kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl) to manage a Kubernetes cluster.
- EKS and how to use [??](https://learn.microsoft.com//cli/azure/install-azure-cli) to manage EKS clusters.

You will need admin access to an [EKS cluster](https://learn.microsoft.com/en-us/azure/aks/learn/quick-kubernetes-deploy-portal)

On the computer where you will run the install process, you need to install the following software:
- [Kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl)
- [EKS CLI](https://learn.microsoft.com//cli/azure/install-azure-cli)

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

## Set the kubectl context
use the following `az cli` commands to pull the cluster credentials into your list of `kubectl` contexts:

```bash
az login
az account set --subscription <your subscription id>
az aks get-credentials --resource-group <your resource group> --name <your cluster name>
```

Make sure the current `kubectl` context is set to the Kubernetes cluster where you want to install Drasi:

```bash
kubectl config use-context <your cluster name>
```

## Install Drasi on the AKS Cluster
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
