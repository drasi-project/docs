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
  - [Dapr CLI](https://docs.dapr.io/getting-started/install-dapr-cli/)
  - [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) if you are deploying to AKS.
- A Kubernetes cluster. Common options include:
  - Cloud:
    - [Azure Kubernetes Service (AKS)](https://learn.microsoft.com/en-us/azure/aks/)
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

The process to deploy Drasi from source code requires you perfrom the following steps:

1. Get the Source Code
1. Set Kubectl Context
1. Install Dapr
1. Deploy Standard Software Infrastructure
1. Build Drasi Component Images
1. Build and Deploy Drasi Control Plane
1. Deploy a Default Query cCntainer

These steps are described below.

### Get the Source Code 
The scripts used to do the build and deployment will use the files from the currently checked out source code branch. 

First, clone the Drasi repo:
```
git clone https://azure-octo@dev.azure.com/azure-octo/Incubations/_git/ReactiveGraph
```

Checkout the branch you want to deploy: 

```
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

### Install Dapr

Install Dapr in your Kubernetes cluster:

```bash
dapr init -k
```

### Deploy Standard Software Infrastructure

Drasi has a dependency on MongoDb, Redis, and some Dapr components that must be installed before Drasi.

From the `/devops/deploy/kubernetes` folder, execute the following:

```bash
kubectl apply -f deploy-default-infra.yaml
```


### Build your container images

To build the docker images of all the Drasi services, from the `/devops/build` folder, execute the following:

```bash
./local-build-images.sh
```

### Build and deploy the control plane

To build and install the Drasi Kubernetes Operator, from the `/src/platform/kubernetes-operator` folder, execute the following:

```bash
make docker-build IMG=reactive-graph/operator
make deploy IMG=reactive-graph/operator
```

### Deploy a default query container

To deploy a default Query Container, from the `/devops/deploy/kubernetes` folder, execute the following:

```bash
kubectl apply -f default-query-container.yaml
```

## Testing the Deployment
TODO - a simple way to prove that the new deployment is working
