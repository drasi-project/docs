---
type: "docs"
title: "Risky Containers"
linkTitle: "Risky Containers"
weight: 40
description: >
    
---

## Scenario

In this tutorial, we will connect a a PostgreSQL source with a Kubernetes source in order to create a Continuous Query that will join the two together.  The PostgreSQL will holds a list of container image tags that are considered risky, and the query will join this table to the live Pods running in a Kubernetes cluster to create a real-time dashboard of running containers with an image tag that is marked as risky.

### Tutorial Modes

You can follow along the steps below in a Github codespace, a VSCode Dev Container or your own Kubernetes environment.

{{< tabpane >}}

{{% tab header="Github Codespaces" text=true %}}

The easiest way to follow along with this tutorial is to launch a Github
  Codespace using the link below. This will allow you to run the example
  application within your browser without setting up anything on your own
  machines.

[![Open in Github Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/drasi-project/learning?devcontainer_path=.devcontainer%2Frisky-containers%2Fdevcontainer.json)

This will open a page with some configuration options. Make sure that the
  'Branch' selected is `main` and set the 'Dev Container configuration' to
  'Risky Containers with Drasi'.

{{% /tab %}}

{{% tab header="VS Code Container" text=true %}}

To follow along with a Dev Container, you will need to install:
- [Visual Studio Code](https://code.visualstudio.com/)
- Visual Studio Code [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) 
- [docker](https://www.docker.com/get-started/)

Next, [clone the learning repo from Github](https://github.com/drasi-project/learning),
  and open the repo in VS Code. Make sure that Docker daemon
  (or Docker Desktop) is running.

Once the solution is open in VS Code, follow these steps:
- Press Cmd + Shift + P (on MacOS) or Ctrl + Shift + P (Windows or Linux) to
    launch the command palette.
- Select `Dev Containers: Rebuild and Reopen in Container`.
- Select the `Risky Containers with Drasi` option to launch this tutorial.

{{% /tab %}}

{{% tab header="Local Setup" text=true %}}

You need to have your own Kubernetes cluster setup.
You can use any Kubernetes setup.
For a local testing setup, you can choose one of alternatives
  like Kind, Minikube or k3d.

Make sure that `kubectl` on your system points to your Kubernetes cluster.

{{% /tab %}}

{{% /tabpane %}}



### Store Kubernetes credentials in a secret

Before we can create a Kubernetes source, we need the credentials of the cluster that the source will connect to. The way to get these credentials will differ depending on how you are running Kubernetes.  The scripts below will extract the credentials of your current Kubernetes context and store them in a secret, to be referenced by the Drasi Kubernetes source.  If you are running using Github Codespaces or the VS code dev container, then use the `k3d` script.

{{< tabpane >}}

{{% tab header="k3d" text=true %}}

```shell
k3d kubeconfig get k3s-default | sed 's/0.0.0.0.*/kubernetes.default.svc/g' | kubectl create secret generic k8s-context --from-file=context=/dev/stdin -n drasi-system
```

{{% /tab %}}

{{% tab header="Kind" text=true %}}

```shell
kind get kubeconfig | sed 's/127.0.0.1.*/kubernetes.default.svc/g' | kubectl create secret generic k8s-context --from-file=context=/dev/stdin -n drasi-system
```

{{% /tab %}}

{{% tab header="AKS" text=true %}}

```shell
az aks get-credentials --resource-group <resource-group> --name <cluster-name> --file - | kubectl create secret generic k8s-context --from-file=context=/dev/stdin -n drasi-system
```

{{% /tab %}}

{{% /tabpane %}}


```shell
kubectl apply -f ./resources/postgres.yaml 
```



```shell
drasi apply -f ./resources/sources.yaml
drasi wait -f ./resources/sources.yaml
```

```shell
kubectl apply -f ./resources/my-app.yaml  
```

```shell
drasi apply -f ./resources/queries.yaml
```

```shell
drasi watch risky-containers
```

```shell
psql
```

```sql
insert into "RiskyImage" ("Id", "Image", "Reason") values (101, 'drasidemo.azurecr.io/my-app:0.2', 'Critical Bug')
```


```shell
kubectl set image pod/my-app-2 app=drasidemo.azurecr.io/my-app:0.3
```