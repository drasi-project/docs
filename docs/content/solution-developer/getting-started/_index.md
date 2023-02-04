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

The links above take you to sections that provide in-depth discussion of each of the three main Drasi components. But if this is your first exposure to Drasi, the [Tutorial](#tutorial) section below is the best place to start; it provides step-by-step instruction for getting a simple end-to-end Drasi-based solution running. 

To develop solutions that use Drasi, you will need a Drasi deployment for dev/test. The [Deploying Drasi](/administrator/platform-deployment) section of the [Administration Guides](/administrator) describe how to deploy Drasi, providing a number of options for both local and cloud deployments. 

## Tutorial: Hello World
The following is a step-by-step tutorial that will walk you through the creation of a simple Drasi-based solution, basically the *Hello World* of Drasi solutions. 

In this solution, there will be a `Message` table on a PostgreSQL database that contains three fields:
- a `MessageId` field containing a unique id for each message. 
- a `From` field containing the name of who the message is from.
- a `Message` field containing the message.

For example:

|MessageId|From|Message|
|-|-|-|
|1|Buzz Lightyear|To infinity and beyond!|
|2|Brian Kernighan|Hello World|
|3|Terminator|I'll be back|

Two Continuous Queries will use the `Message` table as a source of change:
1. The first will identify when the message "Hello World" is present in the Message table and report who it is from.
1. The second will maintain the frequency of each unique message in the Message table and output results when the frequencies change.

The Debug Reaction, representing a downstream consumer of the Continuous Query results, is used as an easy way to view the results of the Continuous Queries in a Web browser.

When complete, the Hello World solution will have the component architecture shown in this diagram:

{{< figure src="hello-world-solution.png" alt="Hello World Solution" width="70%" >}}

The tutorial steps below explain how to:
1. Create the PostgreSQL Source.
1. Create the two Continuous Queries, subscribing to the PostgreSQL Source as their source of change.
1. Deploy the Debug Reaction that subscribes to the two Continuous Queries and displays their results.
1. Test the solution by changing the data in the Message table so you can observe the changing Continuous Query results in the Debug Reaction.

Each of these steps is straightforward, requiring no code, only configuration. 

### Prerequisites
To complete the tutorial, you will need:
- Access to a Drasi environment. If you don't have access to a Drasi environment, see the [Deploying Drasi](/administrator/platform-deployment/) section in the [Administrator Guides](/administrator) for instructions.
- A PostgreSQL database to use as a source of change:
  - Version 10 or greater.
  - Configured to support `LOGICAL` replication.
  - A PostgreSQL user that has at least the LOGIN, REPLICATION and CREATE permissions on the database and SELECT permissions on the tables you are interested in.
- A tool such as [pgAdmin](https://www.pgadmin.org/) with which you can run commands against your PostgreSQL server to create tables and add/update data.

If you are using **Azure Database for PostgreSQL**, you can configure the replication to `LOGICAL` from the Azure portal on the **Replication** page, or you can use the CLI as follows:

```azurecli
az postgres server configuration set --resource-group mygroup --server-name myserver --name azure.replication_support --value logical

az postgres server restart --resource-group mygroup --name myserver
```

### 1. PostgreSQL Source

#### Create Database Table
On your PostgreSQL server, create a new database named `hello-world`.

Then, create a table named `Message` using the following SQL script.

```
CREATE TABLE "Message" (
    "MessageId" integer NOT NULL,
    "From" character varying(10) NOT NULL,
    "Message" character varying(100) NOT NULL
);

ALTER TABLE "Message" ADD CONSTRAINT pk_message
  PRIMARY KEY ("MessageId");
```

#### Create a PostgreSQL Source
To define your PostgreSQL Source, create a file named `hello-world-source.yaml` containing the following Kubernetes resource definition. 

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
  - name: database.ssl
    value: "true"
  - name: tables
    value: public.Message
```

You must replace the values described in this table with values for your PostgreSQL database:

|Value|Description|
|-|-|
|\<db-host-name>|The DNS hostname of the PostgreSQL database.|
|\<db-port>|The port through which you communicate with the PostgreSQL database. Must be enclosed in quotes.|
|\<db-user>|The User ID that the Source will use to connect to the PostgreSQL database.|
|\<password>|The Password for the User ID that the Source will use to connect to the PostgreSQL database.|

Once the values are updated and the `hello-world-source.yaml` saved, use `kubectl` to create the Source with the following command:

```
kubectl apply -f hello-world-source.yaml
```

Your PostgreSQL Source is now created and ready to use.

### 2. Create Continuous Queries
To define your Continuous Queries, create a file named `hello-world-queries.yaml` containing the following Kubernetes resource definitions.

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
      m.From AS MessageFrom
---
apiVersion: query.reactive-graph.io/v1
kind: ContinuousQuery
metadata:
  name: message-count-query
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
      count(m.Message) AS Frequency
```

This table describes the most important configuration settings in this resource definition:
|Property|Description|
|-|-|
|kind|Specifies that we want to create Continuous Queries|
|metadata.name|Provides the **id** of the Continuous Query. This is used to manage the Continuous Query and in the Reaction configuration below.|
|spec.source.subscriptions.id| Identifies the Source the Continuous Query will subscribe to. In this instance, this refers to the PostgreSQL Source created in the previous step.|
|spec.query|Contains the Cypher Query that defines both which changes the Continuous Query is detecting and the output it should generate.|

Use `kubectl` to deploy the Continuous Queries with the following command:

```
kubectl apply -f hello-world-queries.yaml
```

### 3. Deploy the Debug Reaction
In order to view the results of the Continuous Queries you will deploy an instance of the Debug Reaction. The Debug Reaction provides a simple web-based UI that lets you see the current result of a Continuous Query as a table, and to view the query results updating dynamically as the source data changes.

To define your Debug Reaction, create a file named `hello-world-reaction.yaml` containing the following Kubernetes resource definition.

```
apiVersion: query.reactive-graph.io/v1
kind: Reaction
metadata:
  name: hello-world-debug-reaction
spec:
  reactionImage: reactive-graph/reaction-debug
  endpoints:
    - name: gateway
      port: 8080
  queries:
    - queryId: hello-world-from-query
    - queryId: message-count-query
```

This table describes the most important configuration settings in this resource definition:
|Property|Description|
|-|-|
|kind|Specifies that we want to create Reaction|
|metadata.name|Provides the **id** of the Reaction.|
|spec.reactionImage|Identifies the container image to use for the Reaction.|
|spec.endpoints|Specifies the port name and number through which the Debug reaction Web UI is accessible.|
|spec.queries|Subscribes this Reaction to the two Continuous Queries created in the previous step.|

Use `kubectl` to deploy the Debug reaction with the following command:

```
kubectl apply -f hello-world-reaction.yaml
```

In order to access the UI of the debug reaction from a local machine, we must forward the port to a local one using the following command:

```
kubectl port-forward services/hello-world-debug-reaction-gateway 8080:80 -n default
```

### 4. Test the Solution
Now open your browser and navigate to `http://localhost:8080`, where you will see the UI shown here:

{{< figure src="debug-reaction-ui.png" alt="Debug Reaction UI" width="70%" >}}

On the left hand side is a menu containing the two Continuous Queries created earlier. Select `hello-world-from-query`. You will see that the Query Results are initially empty.

Use a tool such as [pgAdmin](https://www.pgadmin.org/) to add, update, and delete Message records in the Message table. Each time you add the Message "Hello World" it will appear in the query result, and each time you change or delete the message, it will disappear.

Switch to the `message-count-query` Continuous Query and you will see a list of the unique messages and the frequency with which they occur in the Message table. As you add, update, and delete messages, the list of messages and frequencies will change.

## Next Steps...
As with many new technologies, the challenge to getting started with Drasi can be less about how to use it, and more about understanding **why** and **when** to use it. Learning how to use Drasi **most effectively** involves understanding where Drasi replaces and simplifies the way you detect and react to change today, as well as how Drasi enables new ways to think about query-driven solutions that would not be possible today with significant development efforts. 

Once you understand the basics of Drasi, the following sections will help you master Drasi quickly so you can start using it to build more responsive solutions that detect and react to change:
- The [Background](/solution-developer/background) section explores in more detail the problems Drasi was created to solve. This will be useful if you are looking for more context and trying to relate the benefits of Drasi to other alternatives for building solutions that detect and react to change.
- The [Solution Patterns](/solution-developer/solution-patterns) section describes how to use Drasi most effectively in your solutions. It describes multiple ways to think about and apply the functionality provided by Continuous Queries and Reactions. Some are improved alternatives to existing patterns, while others are unique to Drasi. 
- The Drasi repo includes multiple [Sample Applications](/solution-developer/sample-apps/) that are fully functional solutions that demonstrate the use of Drasi in realistic scenarios. These sample apps contain working implementations of the patterns described in the [Solution Pattern](/solution-developer/solution-patterns) section.
- The [Recipes](/solution-developer/recipes) section provides code-based solutions to common problems. These recipes will be useful as you start to implement Drasi in your solution and need quick answers to specific questions.
- The [Troubleshooting](/solution-developer/troubleshooting) section provides guidance on how to investigate problems if they occur when you are creating the Sources, Continuous Queries, and Reactions that you will use as part of your solution.
