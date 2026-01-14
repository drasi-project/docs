---
type: "docs"
title: "Risky Containers"
linkTitle: "Risky Containers"
weight: 40
description: >
    Build a no-code realtime dashboard of high risk container images running in your Kubernetes cluster
related:
  tutorials:
    - title: "Getting Started with Drasi"
      url: "/drasi-kubernetes/getting-started/"
  concepts:
    - title: "Continuous Queries"
      url: "/concepts/continuous-queries/"
    - title: "Sources"
      url: "/concepts/sources/"
  howto:
    - title: "Configure Kubernetes Source"
      url: "/drasi-kubernetes/how-to-guides/configure-sources/configure-kubernetes-source/"
    - title: "Configure PostgreSQL Source"
      url: "/drasi-kubernetes/how-to-guides/configure-sources/configure-postgresql-source/"
  reference:
    - title: "Query Language Reference"
      url: "/reference/query-language/"
---

## Scenario

In this tutorial, we will connect a PostgreSQL source with a Kubernetes source in order to create a Continuous Query that will join the two together.  The PostgreSQL table will hold a list of container image tags that are considered high risk, and the query will join this table to the live Pods running in a Kubernetes cluster to create a real-time dashboard of running containers with an image tag that is marked as risky.

{{< youtube irbhm9Xv8Kc >}}

### Tutorial Modes

You can follow along the steps below in a Github codespace, a VSCode Dev Container or your own Kubernetes environment.

{{< tabpane >}}

{{% tab header="Github Codespaces" text=true %}}

The easiest way to follow along with this tutorial is to launch a Github
  Codespace using the link below. This will allow you to run the example
  application within your browser without setting up anything on your own
  machines.

[![Open in Github Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/drasi-project/learning?devcontainer_path=.devcontainer%2Frisky-containers%2Fdevcontainer.json&machine=standardLinux32gb)

This will open a page with some configuration options. Make sure that the
  **Branch** selected is **main** and set the **Dev Container configuration** to **Risky Containers with Drasi**.

  {{< figure src="code-space-branch.png" >}}
  {{< figure src="code-space-container-config.png" >}}

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


##### Recommended Docker Resources

For optimal performance with the Drasi Dev Container, we recommend configuring Docker with the following minimum resources:

- **CPU**: 3 cores or more
- **Memory**: 4 GB or more
- **Swap**: 1 GB or more
- **Disk**: 50 GB available space 

To adjust these settings in Docker Desktop:
1. Open Docker Desktop
2. Go to Settings (gear icon)
3. Navigate to "Resources" → "Advanced"
4. Adjust the sliders to meet or exceed the recommended values
5. Click "Apply & Restart"

{{% /tab %}}

{{% tab header="Local Setup" text=true %}}

You need to have your own Kubernetes cluster setup.
You can use any Kubernetes setup.
For a local testing setup, you can choose one of alternatives
  like Kind, Minikube or k3d.

Make sure that `kubectl` on your system points to your Kubernetes cluster.

You will need [VS Code](https://code.visualstudio.com/)

You will need the [Drasi VS Code extension](https://marketplace.visualstudio.com/items?itemName=DrasiProject.drasi)

You will need the [PostgreSQL CLI tool](https://www.postgresql.org/download/)

You will need to deploy PostgreSQL to your cluster. The following command can be used, it will also create the table and data required for this tutorial.

```shell
kubectl apply -f ./resources/postgres.yaml 
kubectl wait --for=condition=ready pod -l app=postgres --timeout=60s
```

If you are not using the GitHub codespace or VS Code dev container, you will need to open a port forward to access the PostgreSQL instance.
    
```shell
kubectl port-forward services/postgres 5432:5432
```

{{% /tab %}}

{{% /tabpane %}}

### PostgreSQL Table

A PostgreSQL table named `RiskyImage` has been pre-loaded with that following data:


| Id  | Image                             | Reason        |
|-----|-----------------------------------|---------------|
| 1   | ghcr.io/drasi-project/my-app:0.1  | Security Risk |
| 2   | docker.io/library/redis:6.2.3-alpine   | Compliance Issue  |


### Deploy Pods

The following command will deploy two Pods of `my-app`, one with version `0.1` and one with version `0.2`. 

```shell
kubectl apply -f ./resources/my-app.yaml  
```


### Store Kubernetes credentials in a secret

Before we can create a Kubernetes source, we need the credentials of the cluster that the source will connect to. The way to get these credentials will differ depending on how you are running Kubernetes.  The scripts below will extract the credentials of your current Kubernetes context and store them in a secret, to be referenced by the Drasi Kubernetes source.

> If you are running using Github Codespaces or the VS code dev container, then use the `k3d` script.

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


### Deploy the sources

The following command will deploy the PostgreSQL and the Kubernetes sources.


```shell
drasi apply -f ./resources/sources.yaml
```

The following command will wait for the source to be ready.

```shell
drasi wait -f ./resources/sources.yaml
```


### Deploy Continuous Query

Next, we will create a Continuous Query that will join the rows in the `RiskyImage` table to Pods that are running inside the Kubernetes cluster.  The Kubernetes source will create graph nodes that match the Kubernetes API.  The container information that we are interested in is nested in this object in the `status.containerStatuses` array.  We are looking to use the `image` property on the entries in this array to join to the `Image` column of the `RiskyImages` table.

Here is a sample of the Pod payload from the Kubernetes API.
```json
{
    "apiVersion": "v1",
    "kind": "Pod",
    "metadata": {    
        "creationTimestamp": "2024-12-18T20:00:13Z",
        "name": "my-app-1"
    },
    "spec": ...,
    "status": {
        "conditions": [
          ...
        ],
        "containerStatuses": [
            {
                "containerID": "containerd://...",
                "image": "ghcr.io/drasi-project/my-app:0.1",
                "name": "app",
                "ready": true,
                "restartCount": 0,
                "started": true,
                "state": {
                    "running": {
                        "startedAt": "2024-12-18T20:00:19Z"
                    }
                }
            }
        ]
    }
}
```

In order to extract the containers in this array and promote them to top level graph nodes, we will use the **unwind** middleware.  This middleware will pre-process incoming changes by extracting each entry in the `containerStatuses` array and promoting it to a node with the label of `Container`. It will use the `containerID` as a unique key for the container within the scope of the parent Pod and it will create a graph relation between them with the label of `OWNS`.  The `Container` nodes can now be used in a synthetic join with the `RiskyImage` table by creating the `HAS_IMAGE` relation.

```yaml
apiVersion: v1
kind: ContinuousQuery
name: risky-containers
spec:
  mode: query
  sources:    
    subscriptions:
      - id: k8s # Kubernetes cluster
        nodes:
          - sourceLabel: Pod
        pipeline:
          - extract-containers
      - id: devops  # PostgreSQL Database
        nodes:
          - sourceLabel: RiskyImage
    joins:
        # The relation name of the synthetic join
      - id: HAS_IMAGE
        keys:
            # The label of the PostgreSQL table
          - label: RiskyImage
            property: Image
            # The label of the Container entries extracted from the Pod
          - label: Container
            property: image
    middleware:
      - kind: unwind
        name: extract-containers
        # The incoming element label to unwind from
        Pod:                                        
            # The JsonPath location of the field on the parent element to unwind.
          - selector: $.status.containerStatuses[*]
            # The label of the nodes that will be creating from this array.
            label: Container
            # A unique identifier for each container within the scope of the Pod
            key: $.containerID
            # The label of the relation that joins the parent Pod to the child Container
            relation: OWNS

  query: > 
    MATCH 
      (p:Pod)-[:OWNS]->(c:Container)-[:HAS_IMAGE]->(i:RiskyImage)    
    RETURN
      p.name as pod,
      c.image as image,
      c.name as name,
      c.ready as ready,
      c.started as started,
      c.restartCount as restartCount,
      i.Reason as reason
```

This query can be found in the `resources` folder, use the following command to deploy it.

```shell
drasi apply -f ./resources/queries.yaml
```

The VS Code extension Drasi explorer can be used to attach to the query to monitor it in realtime.
> You may need to click the refresh button in the top right corner to see the newly created query.

<video width="842" height="344" autoplay loop>
  <source src="attach-query.mov" type="video/mp4">
  {{< figure src="attach-query.png" >}}
</video>

You should see the current result set of the query which lists **my-app:0.1** as a **Security Risk**

{{< figure src="query-result-1.png" >}}

### Add a new High Risk Image Tag

Next, we will add a row to the **RiskyImage** table that marks **my-app:0.2** as having a **Critical Bug**.

Connect to the PostgreSQL instance.

```shell
psql
```
Then run the following SQL script:

```sql
insert into "RiskyImage" ("Id", "Image", "Reason") values (101, 'ghcr.io/drasi-project/my-app:0.2', 'Critical Bug');
```

You should now also see **my-app:0.2** in the query results.

{{< figure src="query-result-2.png" >}}

### Upgrade a Pod to a non-high risk tag

Next, we will use **kubectl** to upgrade the Pod from version `0.2` to `0.3`, which will make it disappear from the result set.

```shell
kubectl set image pod/my-app-2 app=ghcr.io/drasi-project/my-app:0.3
```

> It may take more than ten seconds for Kubernetes to tear down the old Pod and bring up the new one, once it does you will see the second row disappear from the query result set.

