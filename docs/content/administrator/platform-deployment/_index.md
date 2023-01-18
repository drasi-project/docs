---
type: "docs"
title: "Deploying Reactive Graph"
linkTitle: "Deploying Reactive Graph"
weight: 10
description: >
    Self-hosting Reactive Graph on Kubernetes
---

## Prerequisites

- Dapr CLI - [Download here](https://docs.dapr.io/getting-started/install-dapr-cli/)
- Kubectl - [Download here](https://kubernetes.io/docs/tasks/tools/)
- A Kubernetes cluster with your Kubectl context pointing to it
- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli)
- Bash

### Installing Kubernetes

If you do not have an existing Kubernetes cluster to use, you can create one in AKS or install Docker Desktop on your local machine.

#### Setting up a Kubernetes cluster in AKS

Login to the Azure portal and create a new `Azure Kubernetes Service (AKS)` resource.

Connect to your cluster

```bash
az account set --subscription <your subscription id>
az aks get-credentials --resource-group <your resource group> --name <your cluster name>
```

#### Setting up a Kubernetes on your local machine

There are several options to run a local Kubernetes cluster on your machine.

- Docker Desktop
  - [Install Docker Desktop](https://www.docker.com/products/docker-desktop/)
  - [Enable Kubernetes](https://docs.docker.com/desktop/kubernetes/)
- [Minikube](https://minikube.sigs.k8s.io/docs/)
- [Kind](https://kind.sigs.k8s.io/)

## Install Reactive Graph control plane

```bash
curl -s https://drasi.blob.core.windows.net/installs/install-preview.sh | bash
```

> Note: You need to part of the `Project Drasi Preview Users` group to run this script as it will attempt to retrieve secrets from our key vault.  You will be prompted to login via your browser.
