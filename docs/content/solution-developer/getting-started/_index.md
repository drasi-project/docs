---
type: "docs"
title: "Getting Started"
linkTitle: "Getting Started"
weight: 10
description: >
    Building Solutions with Drasi
---

To use Drasi as part of a solution you must do the following three things:

1. Define [Sources](/solution-developer/components/sources) for each of the source databases or systems from which you want to detect and react to change.
1. Define [Continuous Queries](/solution-developer/components/continuous-queries) for each of the queries you want to run across those sources.
1. Define [Reactions](/solution-developer/components/reactions) to handle the output from each of your Continuous Queries and integrate the results into your broader solution.

The [Tutorial](#tutorial) section below provides step-by-step instruction for getting your first end-to-end Drasi-based solution running, and full details of each component are provided in the sections linked above.

However, as with many new technologies, the challenge to getting started with Drasi can be less about how to use it, and more about understanding **why** and **when** to use it. Learning how to use Drasi **most effectively** involves understanding where Drasi replaces and simplifies the way you detect and react to change today, as well as how Drasi enables new ways to think about query-driven solutions that would not be possible today with significant development efforts. 

Once you understand the basics of Drasi, the following sections will help you master Drasi quickly so you can start using it to build more responsive solutions that detect and react to change:
- The [Background](/solution-developer/background) section explores in more detail the problems Drasi was created to solve. This will be useful if you are looking for more context and trying to relate the benefits of Drasi to other alternatives for building solutions that detect and react to change.
- The [Solution Patterns](/solution-developer/solution-patterns) section describes how to use Drasi most effectively in your solutions. It describes multiple ways to think about and apply the functionality provided by Continuous Queries and Reactions. Some are improved alternatives to existing patterns, while others are unique to Drasi. 
- The Drasi repo includes multiple [Sample Applications](/solution-developer/sample-apps/) that are fully functional solutions that demonstrate the use of Drasi in realistic scenarios. These sample apps contain working implementations of the patterns described in the [Solution Pattern](/solution-developer/solution-patterns) section.
- The [Recipes](/solution-developer/recipes) section provides code-based solutions to common problems. These recipes will be useful as you start to implement Drasi in your solution and need quick answers to specific questions.
- The [Troubleshooting](/solution-developer/troubleshooting) section provides guidance on how to investigate problems if they occur when you are creating the Sources, Continuous Queries, and Reactions that you will use as part of your solution.

To develop solutions that use Drasi, you will need a Drasi deployment for dev/test. The [Deploying Drasi](/administrator/platform-deployment) section of the [Administration Guides](/administrator) describe how to deploy Drasi, providing a number of options for both local and cloud deployments. 

## Tutorial: Hello World!
The following is a step-by-step tutorial that will walk you through the creation of a simple Drasi-based solution, basically the *Hello World* of Drasi solutions. The tutorial explains how to:
1. [Create a PostgreSQL Source](#1-postgresql-source).
1. [Create a *Hello World* Continuous Query](#2-create-hello-world-continuous-query).
1. [Deploy a Debug Reaction to view the results of the *Hello World* Continuous Query](#3-deploy-the-debug-reaction).

Each of these steps is straightforward, requiring no code, only configuration. However, you will need access to a Drasi environment on which to deploy the *Hello World* solution. If you don't have access to a Drasi environment, see the [Deploying Drasi](/administrator/platform-deployment/) section in the [Administrator Guides](/administrator) for instructions.

### 1. PostgreSQL Source
#### Install PostgreSQL
Install a PostgreSQL database that meets the following requirements:
- Version 10 or greater.
- Configured to support `LOGICAL` replication.
- A PostgreSQL user that has at least the LOGIN, REPLICATION and CREATE permissions on the database and SELECT permissions on the tables you are interested in.

If you are using **Azure Database for PostgreSQL**, you can configure the replication to `LOGICAL` from the Azure portal on the **Replication** page, or you can use the CLI as follows:

```azurecli
az postgres server configuration set --resource-group mygroup --server-name myserver --name azure.replication_support --value logical

az postgres server restart --resource-group mygroup --name myserver
```

#### Create Database Table
Use a tool such as [pgAdmin](https://www.pgadmin.org/) to create a new database called `hello-world`.

Use the following script to create a table named `Message`.

```
CREATE TABLE "Message" (
    "MessageId" integer NOT NULL,
    "From" character varying(10) NOT NULL,
    "Message" character varying(100) NOT NULL
);

ALTER TABLE "Message" ADD CONSTRAINT pk_item
  PRIMARY KEY ("MessageId");
```

#### Create a PostgreSQL Source
Create a file named `hello-world-source.yaml` containing the following Kubernetes resource definition. 

```
apiVersion: v1
kind: Secret
metadata:
  name: db-creds
type: Opaque
stringData:
  password: <db-password>
---
apiVersion: query.reactive-graph.io/v1
kind: Source
metadata:
  name: hello-world-source
spec:
  sourceType: PostgreSQL
  properties: 
  - name: database.hostname
    value: <db-host-name>
  - name: database.port
    value: "<db-port>"
  - name: database.user
    value: <db-user>
  - name: database.password
    valueFrom:
      secretKeyRef:
        name: db-creds
        key: password
  - name: database.dbname
    value: hello-world
  - name: tables
    value: public.Message
```

You must replace the values described in this table with values for the PostgreSQL database you created earlier:

|Value|Description|
|-|-|
|< db-host-name >| |
|< db-port >||
|< db-user >||
|< password >||


Now use kubectl to create the source

```
kubectl apply -f hello-world-source.yaml
```

Your PostgreSQL Source is now created and ready to use.

### 2. Create Hello World! Continuous Queries

Next, you will create two Continuous Queries that do the following:
1. Identify anytime there is a message in the **Message** table with the value "Hello World", and tell you who it is from.
2. Maintain a count of the number of messages currently in the **Message** table that have the value "Hello World".

Create a file named `hello-world-queries.yaml` containing the following Kubernetes resource definitions.

```
apiVersion: query.reactive-graph.io/v1
kind: ContinuousQuery
metadata:
  name: hello-world-from-query
spec:
  mode: query
  sources:    
    subscriptions:
      - id: hello-world-source
  query: > 
    MATCH 
      (m:Message {Message: 'Hello World'})
    RETURN 
      m.MessageId AS MessageId,
      m.From AS From
---
apiVersion: query.reactive-graph.io/v1
kind: ContinuousQuery
metadata:
  name: hello-world-count-query
spec:
  mode: query
  sources:    
    subscriptions:
      - id: hello-world-source
  query: > 
    MATCH 
      (m:Message)
    RETURN 
      m.Message AS Message,
      count(m.Message) AS Count
```

Now use kubectl to deploy the queries:

```
kubectl apply -f hello-world-queries.yaml
```

### 3. Deploy the Debug Reaction
In order to view results of the *Hello World* Continuous Queries you will deploy an instance of the Debug Reaction. The Debug Reaction provides a simple web-based you that lets you see the current result set of a Continuous Query as a table, and to view the results updating dynamically as the source dat changes.

Create a file named `debug-reaction.yaml` containing the following Kubernetes resource definition.

```
apiVersion: query.reactive-graph.io/v1
kind: Reaction
metadata:
  name: debug
spec:
  reactionType: Debug
  queries:
    - queryId: hello-world-from-query
    - queryId: hello-world-count-query
```

Now use kubectl to deploy the debug reaction:

```
kubectl apply -f debug-reaction.yaml
```

In order to access the UI of the debug reaction from a local machine, we can forward the port to a local one.

```
kubectl port-forward services/debug-gateway 81:80 -n default
```

Now open your browser and navigate to `http://localhost:81`, where you should see a UI with menu options for each query on the left.  Select `my-query1`.

Use a tool such as [pgAdmin](https://www.pgadmin.org/) to add/remove/update rows in the `Item` table and you should see the debug reaction UI update in realtime with all the rows with Category = `A`.
