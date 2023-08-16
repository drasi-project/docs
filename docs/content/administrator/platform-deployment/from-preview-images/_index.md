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
  - [Dapr CLI](https://docs.dapr.io/getting-started/install-dapr-cli/) if Dapr is not yet installed on your cluster.
  - [Azure CLI](https://learn.microsoft.com//cli/azure/install-azure-cli) if you are deploying to AKS.
- A Kubernetes cluster (with Dapr installed). Common options include:
  - Cloud:
    - [Azure Kubernetes Service (AKS)](https://learn.microsoft.com/en-us/azure/aks/)
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

### Installing Dapr

If Dapr in not already installed in your Kubernetes cluster, you can use the Dapr CLI to install it.  It is recommended to enable the injector watchdog as follows: 

```bash
dapr init -k --set dapr_operator.watchInterval=10s --wait
```


## Installing Drasi

Download the CLI for your platform, and optionally add it to your system path

- [MacOS arm64](https://drasi.blob.core.windows.net/installs/darwin-arm64/drasi)
- [MacOS x64](https://drasi.blob.core.windows.net/installs/darwin-amd64/drasi)
- [Windows x64](https://drasi.blob.core.windows.net/installs/windows-amd64/drasi.exe)

Make sure the current `kubectl` context is set to the Kubernetes cluster where you want to install Drasi:

```bash
kubectl config use-context <your cluster name>
```

Run the following command:

```bash
drasi init --version preview.1
```

## Testing the Deployment
To test that Drasi has been correctly deployed to your Kubernetes cluster, you can deploy a quick smoke test workload.


Execute the following command:
```bash
bash <(curl -s https://drasi.blob.core.windows.net/smoke-tests/setup-smoke-test.sh)
```

This shell script accomplishes the following tasks:
- Sets up a PostgreSQL database in your Kubernetes cluster
- Adds the following entries to your database
| id |  name  | category |
|----|--------|----------|
|  1 | Item 1 | A        |
|  2 | Item 2 | B        |
|  3 | Item 3 | A        |

- Deploy a PostgreSQL source, a continuous query and a reaction to your cluster using the Drasi CLI
- Verifies the initial bootstrap
- Adds a new entry ({"Id": 4, "Name": "Item 4", "Category": "A"}) to the PostgreSQL database
- Verifies the new entries got propagated from the source to the reaction
- Cleans-up by deleting all of the components