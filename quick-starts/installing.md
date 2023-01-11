# Install Reactive Graph

## Prerequisites

- Dapr CLI - [Download here](https://docs.dapr.io/getting-started/install-dapr-cli/)
- Kubectl - [Download here](https://kubernetes.io/docs/tasks/tools/)
- Azure account

## Setup a Kubernetes cluster in AKS

Login to the Azure portal and create a new `Azure Kubernetes Service (AKS)` resource.
In the `Integrations` step of the AKS wizard, select the `reactive-graph` -> `reactivegraph` container registry.

## Connect to your cluster

```bash
az account set --subscription <your subscription id>
az aks get-credentials --resource-group <your resource group> --name <your cluster name>
```

## Install Dapr into your cluster

```bash
dapr init -k
```

## Install Reactive Graph control plane

From `/devops/deploy/kubernetes` run

```bash
./install-drasi.sh drasi preview.1
```
