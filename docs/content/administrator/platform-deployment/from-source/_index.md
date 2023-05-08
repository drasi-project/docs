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
1. Install Dapr
1. Deploy Standard Software Infrastructure
1. Build Drasi Component Images
1. Build and Deploy Drasi Control Plane
1. Deploy a Default Query container

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

### Install Dapr

Install Dapr in your Kubernetes cluster:

```bash
helm repo add dapr https://dapr.github.io/helm-charts/
helm upgrade --install dapr dapr/dapr --create-namespace --namespace dapr-system --set dapr_operator.watchInterval=45s --wait
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

> Note:  If you are running a local cluster with `Kind`, you also need to run `load-images-to-kind.sh` to load the built images into your Kind cluster.

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

To test that Drasi has been correctly deployed to your Kubernetes cluster, you can deploy a quick smoke test workload:

### Deploy a PostgreSQL smoke test data provider

From the `/devops/deploy/kubernetes` folder, execute the following:

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install smoke-postgresql -f smoke-postgresql-values.yaml bitnami/postgresql
export POSTGRES_PASSWORD=$(kubectl get secret --namespace default smoke-postgresql -o jsonpath="{.data.postgres-password}" | base64 -d)
./setup-smoke-data.sh
```

This will configure a PostgreSQL `smokedb` database with an `item` table that contains the following information:

|id|name|category|
| - | - | - |
|1|Item 1|A|
|2|Item 2|B|
|3|Item 3|A|

### Deploy and run the smoke test Drasi workload

```bash
envsubst < drasi-smoke-test.yaml | kubectl apply -f -
```

This will deploy the `smoke-postgres` Source and `smoke-query` Continuous Query, which simply returns the properties of all items in category 'A'. It also deploys the `smoke-debug` Reaction, which can be used to verify that the test query is behaving as expected.

To connect to the debug Reaction:

```bash
kubectl port-forward svc/smoke-debug-gateway 8080:80
```

You can then open a browser and navigate to <http://localhost:8080/query/smoke-query> to see the results of the test query, which should display `Item 1` and `Item 3`. You can also modify the test database directly to verify that the query is updating as expected:

```bash
kubectl run smoke-postgresql-client --rm --tty -i --restart='Never' --namespace default \
  --image docker.io/bitnami/postgresql:15.1.0-debian-11-r31 --env="PGPASSWORD=$POSTGRES_PASSWORD" \
  --command -- psql --host smoke-postgresql -U postgres -d postgres -p 5432 -c '\c smokedb' \
  -c "INSERT INTO item (id, name, category) VALUES (4, 'Item 4', 'A');"
```

The new item should show up in the `smoke-query`, and the event that was generated should show up under <http://localhost:8080/stream> with `Item 4` in `addedResults`.

### Uninstall the smoke test workload

To completely remove the smoke test workload from your cluster:

```bash
kubectl delete -f drasi-smoke-test.yaml
helm uninstall smoke-postgresql
kubectl delete pvc data-smoke-postgresql-0
```
