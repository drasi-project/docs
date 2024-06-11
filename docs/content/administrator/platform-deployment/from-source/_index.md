---
type: "docs"
title: "Deploying Drasi from Source"
linkTitle: "From Source"
weight: 20
description: >
    Self-hosting Drasi on Kubernetes from Source
---

## Prerequisites

- On the computer where you will run the install process:
  - A copy of the [source code repo](https://github.com/project-drasi/drasi-platform.git)
  - A terminal environment that supports Bash
  - [Kubectl](https://kubernetes.io/docs/tasks/tools/)
  - [helm](https://helm.sh/docs/intro/install/)
  - [Azure CLI](https://learn.microsoft.com//cli/azure/install-azure-cli) if you are deploying to AKS.
- A Kubernetes cluster. Common options include:
  - Cloud:
    - [Azure Kubernetes Service (AKS)](https://learn.microsoft.com/azure/aks/)
  - Local (for dev/test):
    - [Kind](https://kind.sigs.k8s.io/)
    - [Minikube](https://minikube.sigs.k8s.io/docs/)
    - [Docker Desktop](https://www.docker.com/products/docker-desktop/) with [Kubernetes enabled](https://docs.docker.com/desktop/kubernetes/)


**If you are deploying to an AKS cluster**, you can use the following `az cli` commands to pull the cluster credentials into your list of `kubectl` contexts:

```bash
az login
az account set --subscription <your subscription id>
az aks get-credentials --resource-group <your resource group> --name <your cluster name>
```

## Installing Drasi

The process to deploy Drasi from source code requires you perform the following steps:

1. Get the Source Code
1. Set Kubectl Context
1. Build Drasi Component Images
1. Install Drasi in local mode

These steps are described below.

### Get the Source Code

The scripts used to do the build and deployment will use the files from the currently checked out source code branch.

First, clone the `drasi-platform`  repo:

```bash
git clone https://github.com/project-drasi/drasi-platform.git
```

<!-- Checkout the branch you want to deploy:

```bash
git checkout <branch name>
```

Standard branches are:

|Folder|Purpose|
|-|-|
|develop| The main development branch containing the most recent runnable code. |
|preview| Code used to build the images released for people to run ```preview``` environments. |
|demo| Code currently running in the Drasi ```demo``` environment. | -->

### Set Kubectl Context

Make sure the current `kubectl` context is set to the Kubernetes cluster where you want to install Drasi:

```bash
kubectl config use-context <your cluster name>
```

### Build Drasi Component Images

To build the docker images of all the Drasi services, from the `/scripts` folder, execute the following:

{{< tabpane langEqualsHeader=true >}}
{{< tab header="MacOS" lang="Bash" >}}
./local-build-images.sh
{{< /tab >}}
{{< tab header="Windows Powershell" lang="Bash" >}}
./local-build-images.bat
{{< /tab >}}
{{< /tabpane >}}



> Note:  If you are running a local cluster with `Kind`, you also need to run `load-images-to-kind.sh` (`load-images-to-kind.bat` if you are running on Windows) to load the built images into your Kind cluster.

## Installing Drasi
Download the CLI for your platform

**NOTE:** Since all of our Github repositories are private at the moment, please replace `$GITHUB_TOKEN` with your Github PAT if you are using `MacOS` or `Linux`. Please ensure that you are logged into Github if you want to download the binaries directly.
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


Run the following command, this will install Drasi in local mode, which means it won't try pull images from a container registry but rather use your local image cache, this is ideal for dev workflows:

```bash
drasi init --local
```

Dapr should be automatically installed to your cluster. You can verify this by running the command `kubectl get pods -n dapr-system`. 

## Optional: Testing the Deployment
To test that Drasi has been correctly deployed to your Kubernetes cluster, you can deploy a quick [smoke test](/reference/smoke-test) workload.