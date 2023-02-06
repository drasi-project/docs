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
  - A terminal environment that supports Bash
  - [curl](https://curl.se/)
  - [Kubectl](https://kubernetes.io/docs/tasks/tools/)
  - [Dapr CLI](https://docs.dapr.io/getting-started/install-dapr-cli/)
  - [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli)
- A Kubernetes cluster. Common options include:
  - Cloud:
    - [Azure Kubernetes Service (AKS)](https://learn.microsoft.com/en-us/azure/aks/)
  - Local (for dev/test):
    - [Docker Desktop](https://www.docker.com/products/docker-desktop/) with [Kubernetes enabled](https://docs.docker.com/desktop/kubernetes/)
    - [Minikube](https://minikube.sigs.k8s.io/docs/)
    - [Kind](https://kind.sigs.k8s.io/)
    - An x64/amd64 machine.  The preview images are built for amd64 and are known to have issues running under QEMU on an arm64 host.

**If you are deploying to an AKS cluster**, you can use the following `az cli` commands to pull the cluster credentials into your list of `kubectl` contexts:

```
az login
az account set --subscription <your subscription id>
az aks get-credentials --resource-group <your resource group> --name <your cluster name>
```

## Installing Drasi


Make sure the current `kubectl` context is set to the Kubernetes cluster where you want to install Drasi:

```
kubectl config use-context <your cluster name>
```

Run the following command:

```
curl -s https://drasi.blob.core.windows.net/installs/install-preview.sh | bash
```

## Testing the Deployment
TODO - a simple way to prove that the new deployment is working