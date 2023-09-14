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
  - A copy of the [source code repo](https://dev.azure.com/azure-octo/Incubations/_git/ReactiveGraph?path=%2F&version=GBdevelop&_a=contents)
  - A terminal environment that supports Bash
  - [Kubectl](https://kubernetes.io/docs/tasks/tools/)
  - [helm](https://helm.sh/docs/intro/install/)
  - [Azure CLI](https://learn.microsoft.com//cli/azure/install-azure-cli) if you are deploying to AKS.
- A Kubernetes cluster. Common options include:
  - Cloud:
    - [Azure Kubernetes Service (AKS)](https://learn.microsoft.com/azure/aks/)
  - Local (for dev/test):
    - [Docker Desktop](https://www.docker.com/products/docker-desktop/) with [Kubernetes enabled](https://docs.docker.com/desktop/kubernetes/)
    - [Minikube](https://minikube.sigs.k8s.io/docs/)
    - [Kind](https://kind.sigs.k8s.io/)

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

First, clone the Drasi repo:

```bash
git clone https://azure-octo@dev.azure.com/azure-octo/Incubations/_git/ReactiveGraph
```

Checkout the branch you want to deploy:

```bash
git checkout <branch name>
```

Standard branches are:

|Folder|Purpose|
|-|-|
|develop| The main development branch containing the most recent runnable code. |
|preview| Code used to build the images released for people to run ```preview``` environments. |
|demo| Code currently running in the Drasi ```demo``` environment. |

### Set Kubectl Context

Make sure the current `kubectl` context is set to the Kubernetes cluster where you want to install Drasi:

```bash
kubectl config use-context <your cluster name>
```

### Build Drasi Component Images

To build the docker images of all the Drasi services, from the `/devops/build` folder, execute the following:

{{< tabpane langEqualsHeader=true >}}
{{< tab header="MacOS" lang="Bash" >}}
./local-build-images.sh
{{< /tab >}}
{{< tab header="Windows Powershell" lang="Bash" >}}
./local-build-images.bat
{{< /tab >}}
{{< /tabpane >}}



> Note:  If you are running a local cluster with `Kind`, you also need to run `load-images-to-kind.sh` (`load-images-to-kind.bat` if you are running on Windows) to load the built images into your Kind cluster.

### Install Drasi in local mode

Download the CLI for your platform
{{< tabpane langEqualsHeader=true >}}
{{< tab header="MacOS" lang="Bash" >}}
curl -fsSL "https://drasi.blob.core.windows.net/installs/install-drasi-cli.sh" | /bin/bash
{{< /tab >}}
{{< tab header="Linux" lang="Bash" >}}
curl -fsSL "https://drasi.blob.core.windows.net/installs/install-drasi-cli.sh" | /bin/bash
{{< /tab >}}
{{< tab header="Windows Powershell" lang="Bash" >}}
iwr -useb "https://drasi.blob.core.windows.net/installs/install.ps1" | iex
# You may need to refresh your $PATH environment variable:
$Env:Path = [System.Environment]::GetEnvironmentVariable("Path","User")
{{< /tab >}}
{{% tab header="Binaries" text=true %}}
Download the CLI for your platform, and add it to your system path:
- [MacOS arm64](https://drasi.blob.core.windows.net/installs/darwin-arm64/drasi)
- [MacOS x64](https://drasi.blob.core.windows.net/installs/darwin-x64/drasi)
- [Windows x64](https://drasi.blob.core.windows.net/installs/windows-x64/drasi.exe)
- [Linux x64](https://drasi.blob.core.windows.net/installs/linux-x64/drasi)
{{% /tab %}}
{{< /tabpane >}}

Run the following command, this will install Drasi in local mode, which means it won't try pull images from a container registry but rather use your local image cache, this is ideal for dev workflows:

```bash
drasi init --local
```

Dapr should be automatically installed to your cluster. You can verify this by running the command `kubectl get pods -n dapr-system`. 

## Testing the Deployment
To test that Drasi has been correctly deployed to your Kubernetes cluster, you can deploy a quick smoke test workload.
### Prerequisites
- [Helm](https://helm.sh/docs/intro/install/)
- [Kubectl](https://kubernetes.io/docs/tasks/tools/)
- Drasi CLI

Execute the following command:
{{< tabpane langEqualsHeader=true >}}
{{< tab header="MacOS" lang="Bash" >}}
bash <(curl -s https://drasi.blob.core.windows.net/smoke-tests/setup-smoke-test.sh)
{{< /tab >}}
{{< tab header="Windows Powershell" lang="Bash" >}}
iwr -useb "https://drasi.blob.core.windows.net/smoke-tests/setup-smoke-test.ps1" | iex
{{< /tab >}}
{{< /tabpane >}}

This shell script accomplishes the following tasks:
1. Sets up a PostgreSQL database in your Kubernetes cluster
1. Adds the following entries to your database
| id |  name  | category |
|----|--------|----------|
|  1 | Item 1 | A        |
|  2 | Item 2 | B        |
|  3 | Item 3 | A        |

1. Deploy a PostgreSQL source, a continuous query and a reaction to your cluster using the Drasi CLI
1. Verifies the initial bootstrap
1. Adds a new entry ({"Id": 4, "Name": "Item 4", "Category": "A"}) to the PostgreSQL database
1. Verifies the new entries got propagated from the source to the reaction
1. Cleans-up by deleting all of the components