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
  - [helm](https://helm.sh/docs/intro/install/)
- A Kubernetes cluster. Common options include:
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

## Installing Drasi

Make sure the current `kubectl` context is set to the Kubernetes cluster where you want to install Drasi:

```bash
kubectl config use-context <your cluster name>
```

Run the following command:

```bash
curl -s https://drasi.blob.core.windows.net/installs/install-preview.sh | bash
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
  
You can then open a browser and navigate to http://localhost:8080/query/smoke-query to see the results of the test query, which should display `Item 1` and `Item 3`. You can also modify the test database directly to verify that the query is updating as expected:

```bash
kubectl run smoke-postgresql-client --rm --tty -i --restart='Never' --namespace default \
  --image docker.io/bitnami/postgresql:15.1.0-debian-11-r31 --env="PGPASSWORD=$POSTGRES_PASSWORD" \
  --command -- psql --host smoke-postgresql -U postgres -d postgres -p 5432 -c '\c smokedb' \
  -c "INSERT INTO item (id, name, category) VALUES (4, 'Item 4', 'A');"
```

The new item should show up in the `smoke-query`, and the event that was generated should show up under  http://localhost:8080/stream with `Item 4` in `addedResults`.

### Uninstall the smoke test workload

To completely remove the smoke test workload from your cluster:

```bash
kubectl delete -f drasi-smoke-test.yaml
helm uninstall smoke-postgresql
kubectl delete pvc data-smoke-postgresql-0
```
