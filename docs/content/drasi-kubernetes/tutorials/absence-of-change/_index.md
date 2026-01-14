---
type: "docs"
title: "Absence of Change"
linkTitle: "Absence of Change"
weight: 50
description: >
    Responding in the absence of changes
related:
  tutorials:
    - title: "Getting Started with Drasi"
      url: "/drasi-kubernetes/getting-started/"
  concepts:
    - title: "Continuous Queries"
      url: "/concepts/continuous-queries/"
  howto:
    - title: "Configure PostgreSQL Source"
      url: "/drasi-kubernetes/how-to-guides/configure-sources/configure-postgresql-source/"
  reference:
    - title: "Drasi Custom Functions"
      url: "/reference/query-language/drasi-custom-functions/"
    - title: "Query Language Reference"
      url: "/reference/query-language/"
---

## Scenario

In this tutorial, we will explore the use case where the requirement is to monitor a fleet of freezers and trigger an alert if one of them remains above 32 degrees continuously for more than 15 minutes, an alert must not fire if the freezer rises above 32 but drops back below that threshold in less than 15 minutes. There is no explicit event or mechanism that confirms the fact that the temperature has been above the threshold continuously for 15 minutes. For demonstration purposes, we will use a duration of 10 seconds instead of 15 minutes. The source data is a PostgreSQL table that stores the latest reported temperature of each freezer.


### Tutorial Modes

You can follow along the steps below in a Github codespace, a VSCode Dev Container or your own Kubernetes environment.

{{< tabpane >}}

{{% tab header="Github Codespaces" text=true %}}

The easiest way to follow along with this tutorial is to launch a Github
  Codespace using the link below. This will allow you to run the example
  application within your browser without setting up anything on your own
  machines.

[![Open in Github Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/drasi-project/learning?devcontainer_path=.devcontainer%2Fabsence-of-change%2Fdevcontainer.json&machine=standardLinux32gb)

This will open a page with some configuration options. Make sure that the
  **Branch** selected is **main** and set the **Dev Container configuration** to **Absence of Change with Drasi**.

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
- Select the `Absence of Change with Drasi` option to launch this tutorial.


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
kubectl apply -f ./postgres.yaml 
kubectl wait --for=condition=ready pod -l app=postgres --timeout=60s
```

If you are not using the GitHub codespace or VS Code dev container, you will need to open a port forward to access the PostgreSQL instance.
    
```shell
kubectl port-forward services/postgres 5432:5432
```

{{% /tab %}}

{{% /tabpane %}}

### PostgreSQL Table

A PostgreSQL table named `Freezer` has been pre-loaded with that following data:


| id  | temp |
|-----|------|
| 1   | 20 |
| 2   | 28 |
| 3   | 35 |
| 4   | 20 |
| 5   | 40 |


You can view this data by connecting to the PostgreSQL instance.

```shell
psql
```
Then run the following SQL script:

```sql
select * from "Freezer";
```

### Deploy the source

Next we need to connect Drasi to the PostgreSQL database, use the following command to deploy the PostgreSQL source.


```shell
drasi apply -f source.yaml
```

The following command will wait for the source to be ready.

```shell
drasi wait -f source.yaml
```


### Continuous Query

To express that a condition must be continuously true for a specified duration, we will use the `trueFor` function.  The `trueFor` function takes an expression that must evaluate to `true` for the duration specified, if this expression holds true for the entire length of the duration specified, only then will a notification be emitted that a new item has been added to the result set. 

```cypher
MATCH 
  (f:Freezer)
WHERE drasi.trueFor(f.temp > 32, duration( { seconds: 10 } ))
RETURN
  f.id AS id,
  f.temp AS temp
```


We will use the Visual Studio extension debug feature to check our query. Open `freezer-query.yaml` in the editor, and click the `Debug` action.

{{< figure src="debug-query.png" >}}

This will open a window that will render a table with the live result set of the query.

{{< figure src="results.png" >}}

### Simulate freezer updates

Next, we will simulate some temperature changes by updating the PostgreSQL rows.

Connect to the PostgreSQL instance.

```shell
psql
```
Then run the following SQL script:

```sql
UPDATE "Freezer" SET temp = 38 WHERE id = 1;
```

If you watch the debug window, you will notice that freezer 1 only appears in the result set after 10 seconds have elapsed.

Now update freezer 3 from 35 degrees to 42 degrees, and you will see the update reflect immediately because the condition has already been true for more than 10 seconds.

```sql
UPDATE "Freezer" SET temp = 42 WHERE id = 3;
```

Now update freezer 5 from 40 degrees to 20 degrees, and you will see it removed from the result set immediately.

```sql
UPDATE "Freezer" SET temp = 20 WHERE id = 5;
```

If we update freezer 4 from 20 degrees to 35 degrees, and back down to 20 degrees before 10 seconds elapse, then it will never enter the result set.

```sql
UPDATE "Freezer" SET temp = 35 WHERE id = 4;
UPDATE "Freezer" SET temp = 20 WHERE id = 4;
```

## Further reading

There are several more functions with similar functionality for different use cases that you can explore [in the documentation](../../reference/query-language/#drasi-future-functions) 