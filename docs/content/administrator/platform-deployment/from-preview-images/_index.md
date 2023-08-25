---
type: "docs"
title: "Deploying Drasi from Preview Images"
linkTitle: "From Images"
weight: 10
description: >
    Self-hosting Drasi on Kubernetes from Preview Images
---

## Prerequisites

- You need to be member of the **Project Drasi Preview Users** security group. Contact [Allen Jones (alljones)](mailto:alljones@microsoft.com) to request access.
- On the computer where you will run the install process:
  - [Kubectl](https://kubernetes.io/docs/tasks/tools/)
  - [Azure CLI](https://learn.microsoft.com//cli/azure/install-azure-cli) if you are deploying to AKS.
- A Kubernetes cluster. Common options include:
  - Cloud:
    - [Azure Kubernetes Service (AKS)](https://learn.microsoft.com/en-us/azure/aks/learn/quick-kubernetes-deploy-portal?tabs=azure-cli)
  - Local (for dev/test):
    - [Docker Desktop](https://www.docker.com/products/docker-desktop/) with [Kubernetes enabled](https://docs.docker.com/desktop/kubernetes/)
    - [Minikube](https://minikube.sigs.k8s.io/docs/)
    - [Kind](https://kind.sigs.k8s.io/)
    - An x64/amd64 machine.  The preview images are built for amd64 and are known to have issues running under QEMU on an arm64 host.

**If you are deploying to an AKS cluster**, you can use the following `az cli` commands to pull the cluster credentials into your list of `kubectl` contexts:

```bash
az login
az account set --subscription <your subscription id>
az aks get-credentials --resource-group <your resource group> --name <your cluster name>
```

## Installing Drasi
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


Make sure the current `kubectl` context is set to the Kubernetes cluster where you want to install Drasi:

```bash
kubectl config use-context <your cluster name>
```


For deploying Drasi within your Kubernetes cluster, execute the following command based on your cluster configuration:

{{< tabpane langEqualsHeader=true >}}
{{< tab header="AKS Cluster" lang="Bash" >}}
drasi init --version preview.1
{{< /tab >}}
{{< tab header="Kind (x64 arch)" lang="Bash" >}}
drasi init --version preview.1
{{< /tab >}}
{{< tab header="Kind (arm64 arch)" lang="Bash" >}}
drasi init --version preview_arm
{{< /tab >}}
{{< /tabpane >}}

Dapr should be automatically installed to your cluster. You can verify this by running the command `kubectl get pods -n dapr-system`. 

## Testing the Deployment
To test that Drasi has been correctly deployed to your Kubernetes cluster, you can deploy a quick smoke test workload.


Execute the following command:
```bash
bash <(curl -s https://drasi.blob.core.windows.net/smoke-tests/setup-smoke-test.sh)
```

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