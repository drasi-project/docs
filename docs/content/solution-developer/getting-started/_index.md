---
type: "docs"
title: "Getting Started"
linkTitle: "Getting Started"
weight: 10
description: >
    Drasi Quickstart Tutorial
---

This section will get you up and running with Drasi in 10 minutes by following a simple step-by-step tutorial to build the *Hello World* of Drasi solutions. 

After completing this tutorial, you will have a simple end-to-end Drasi-based solution running, and a Drasi environment suitable for further exploration as a dev/test environment. You will then be able to continue to explore the capabilities of the Drasi platform as described in the [Solution Developer Guides](/solution-developer).

## Hello World Solution Overview
In this solution, the source of data (and change) will be a `Message` table on a PostgreSQL database that contains three fields:

|Field Name|Type|Allow Nulls|Description|
|-|-|-|-|
|MessageId|integer|No|A unique id for each message.|
|From|character varying(50)|No|The name of who the message is from.|
|Message|character varying(200)|No|The text of the message.|

We will start with the `Message` table containing the following messages:

|MessageId|From|Message|
|-|-|-|
|1|Buzz Lightyear|To infinity and beyond!|
|2|Brian Kernighan|Hello World|
|3|Antoninus|I am Spartacus|
|4|David|I am Spartacus|

Two Continuous Queries will use the `Message` table as a source of change:
1. The first will identify whenever the message "Hello World" is present in the Message table and report who it is from.
1. The second will calculate frequency of each unique message in the Message table and output results as the frequencies change.

For simplicity, the solution will use the [Debug Reaction](/solution-developer/components/reactions/#debug-reaction) to  represent a downstream consumer of the Continuous Query results. The Debug Reaction provides a Solution Developer with an easy way to view the results of the Continuous Queries in a Web browser.

After describing the prerequisites that must be in place to complete the tutorial, the sections below guide you through the three simple steps common to creating any Drasi-based solution:

1. **Create Sources**. In this case a PostgreSQL Source to provide access to changes in the `Message` table.
1. **Create Continuous Queries**. In this case there will be two Continuous Queries both using the PostgreSQL Source as their source of change.
1. **Create Reactions**. In this case the Debug Reaction will handle the output of both Continuous Queries.

When complete, the Hello World solution will have the component architecture shown in this diagram:

{{< figure src="hello-world-solution.png" alt="Hello World Solution" width="70%" >}}

## Prerequisites
To complete the tutorial, you will need:
- Access to a Drasi environment. If you don't have access to a Drasi environment and you want a quick and easy deployment just for the tutorial, create a local [Kind](/reference/using-kind/) cluster and [deploy Drasi from pre-built Preview Images](/administrator/platform-deployment/from-preview-images/). For other options see the [Deploying Drasi](/administrator/platform-deployment/) section in the [Administrator Guides](/administrator).
- A PostgreSQL database to use as a source of change. The [Using PostgreSQL](/reference/setup-postgres) section provides instruction on setting up a Kubernetes hosted PostgreSQL database suitable for this tutorial. If you want to use a different PostgreSQL setup, the requirements are:
  - Version 10 or greater.
  - Configured to support `LOGICAL` replication.
  - A PostgreSQL user that has at least the LOGIN, REPLICATION and CREATE permissions on the database and SELECT permissions on the tables you are interested in.
- A tool such as [pgAdmin](https://www.pgadmin.org/) with which you can run SQL commands against your PostgreSQL server to create tables and add/update/delete data.


## Step 1 - PostgreSQL Source

### Create Database and Table
On your PostgreSQL server, select the `hello-world` database. 

Then, create a table named `Message` and add some initial data using the following SQL script:

```sql
CREATE TABLE "Message" (
    "MessageId" integer NOT NULL,
    "From" character varying(50) NOT NULL,
    "Message" character varying(200) NOT NULL
);

ALTER TABLE "Message" ADD CONSTRAINT pk_message
  PRIMARY KEY ("MessageId");

INSERT INTO public."Message" VALUES (1, 'Buzz Lightyear', 'To infinity and beyond!');
INSERT INTO public."Message" VALUES (2, 'Brian Kernighan', 'Hello World');
INSERT INTO public."Message" VALUES (3, 'Antoninus', 'I am Spartacus');
INSERT INTO public."Message" VALUES (4, 'David', 'I am Spartacus');
```

### Create a PostgreSQL Source
The following yaml file contains the necessary Kubernetes resource definitions for the Continuous Queries.

```yaml
apiVersion: v1
kind: Source
name: hello-world
spec:
  kind: PostgreSQL
  host: <db-host-name>
  port: 5432
  user: <db-user>
  password: <db-password>
  database: hello-world
  ssl: true
  tables:
    - public.Message
```
if you deployed your PostgreSQL database in your cluster by following the instructions in [Using PostgreSQL](/reference/setup-postgres), use `drasi` to create the Source with the following command:

```bash
drasi apply -f https://drasi.blob.core.windows.net/getting-started/hello-world-source.yaml
```

Otherwise, create a file named `drasi-postgres.yaml` and configure the values based on the following information:

|Value|Description|
|-|-|
|\<db-host-name>|The DNS host name of the PostgreSQL server.<br />This will be '**postgres**' if using the Kubernetes hosted PostgreSQL database described in the [Using PostgreSQL](/reference/setup-postgres) section.|
|\<db-user>|The User ID that the Source will use to connect to the PostgreSQL database.<br />This will be '**test**' if using the Kubernetes hosted PostgreSQL database described in the [Using PostgreSQL](/reference/setup-postgres) section.|
|\<db-password>|The Password for the User ID that the Source will use to connect to the PostgreSQL database.<br />This will be '**test**' if using the Kubernetes hosted PostgreSQL database described in the [Using PostgreSQL](/reference/setup-postgres) section.<br />**Note**: It is also possible to reference a Kubernetes secret for this value, see [Sources](/solution-developer/components/sources) for more details.|
|ssl|If you deployed your PostgreSQL database in your Kubernetes cluster, make sure to set the `ssl` configuration option to `false`. |

Once the values are updated and the `hello-world-source.yaml` saved, use `drasi` to create the Source with the following command:

```bash
drasi apply -f hello-world-source.yaml
```

Your PostgreSQL Source is now created and ready to use.

## Step 2 - Continuous Queries
The following yaml file contains the necessary Kubernetes resource definitions for the Continuous Queries.

```yaml
apiVersion: v1
kind: ContinuousQuery
name: hello-world-from
spec:
  mode: query
  sources:    
    subscriptions:
      - id: hello-world
  query: > 
    MATCH 
      (m:Message {Message: 'Hello World'})
    RETURN 
      m.MessageId AS MessageId,
      m.From AS MessageFrom
---
apiVersion: v1
kind: ContinuousQuery
name: message-count
spec:
  mode: query
  sources:    
    subscriptions:
      - id: hello-world
  query: > 
    MATCH 
      (m:Message)
    RETURN 
      m.Message AS Message,
      count(m.Message) AS Frequency
```

You don't need to change anything in this file, but this table describes the most important configuration settings in this resource definition:
|Property|Description|
|-|-|
|kind|Specifies that the resource is a **Continuous Queries**|
|name|Provides the **id** of the Continuous Query. This is used to manage the Continuous Query and in the Reaction configuration below.|
|spec.source.subscriptions.id| Identifies the Source the Continuous Query will subscribe to as a source of change data. In this instance, these refer to the PostgreSQL Source created in the previous step.|
|spec.query|Contains the Cypher Query that defines both which changes the Continuous Query is detecting and the output it should generate.|

Use `drasi` to deploy the Continuous Queries with the following command:

```bash
drasi apply -f https://drasi.blob.core.windows.net/getting-started/hello-world-queries.yaml
```

To verify the status of the Continuous Queries, execute the following command: 

```bash
drasi list query
```

Expected output:
```
         ID        | STATUS  | CONTAINER | ERRORMESSAGE |              HOSTNAME                
-------------------+---------+-----------+--------------+--------------------------------------
  hello-world-from | Running | default   |              | default-query-host-xxx-xxx
  message-count    | Running | default   |              | default-query-host-xxx-xxx
```

## Step 3 - Debug Reaction
In order to view the results of the Continuous Queries you will deploy an instance of the [Debug Reaction](/solution-developer/components/reactions/#debug-reaction). The Debug Reaction provides a simple web-based UI that lets you see the current result of a Continuous Query as a table, and to view the query results updating dynamically as the source data changes.

The following yaml file contains the necessary Kubernetes resource definitions for the Debug Reaction.

```yaml
apiVersion: v1
kind: Reaction
name: hello-world-debug
spec:
  image: reaction-debug
  queries:
    hello-world-from:
    message-count:
  endpoints:
    gateway: 8080  
```

You don't need to change anything in this file, but this table describes the most important configuration settings in this resource definition:
|Property|Description|
|-|-|
|kind|Specifies that the resource is a **Reaction**|
|name|Provides the **id** of the Reaction.|
|spec.image|Identifies the container image to use for the Reaction.|
|spec.endpoints|Specifies the port name and number through which the Debug reaction Web UI is accessible.|
|spec.queries|Subscribes this Reaction to the two Continuous Queries created in the previous step.|

Use `drasi` to deploy the Debug Reaction with the following command:

```bash
drasi apply -f https://drasi.blob.core.windows.net/getting-started/hello-world-reaction.yaml
```

The Hello World Drasi solution is now fully deployed.

## Test the Solution
**NOTE:** This tutorial assumes that you have installed Drasi to the `drasi-system` namespace. If you installed Drasi different namespace, please replace all occurences of `-n drasi-system` in the command with `-n <your-namespace>`.

In order to access the Web UI of the Debug Reaction from a local machine, we must forward the container port to a local one using the following command:

```bash
kubectl port-forward services/hello-world-debug-gateway 8080:8080 -n drasi-system
```

Now open your browser and navigate to [http://localhost:8080](http://localhost:8080), where you will see the Debug Reaction UI shown here:

{{< figure src="debug-reaction-ui.png" alt="Debug Reaction UI" width="70%" >}}

On the left hand side is a menu listing the two Continuous Queries created earlier. Select `hello-world-from` and the right hand pane will show the current results of the `hello-world-from` query. Initially, there is only one result, because only **Brian Kernighan** is associated with the "Hello World" message.

{{< figure src="hello-world-from-debug.png" alt="Hello World From" width="70%" >}}

If you add another Message to the table using the following SQL insert statement:

```sql
INSERT INTO public."Message" VALUES (5, 'Allen', 'Hello World');
```

You will see a second record for **Allen** appear dynamically in the query result:

{{< figure src="hello-world-from-debug-updated.png" alt="Hello World From Updated" width="70%" >}}

In the list of Continuous Queries select the `message-count` entry and the right hand pane will show the  current results to the `message-count` query. There are three results, as shown below. Note that because of the "Hello World" message you just added for **Allen**, both "Hello World" and "I am Spartacus" have a Frequency of 2.

{{< figure src="message-count-debug.png" alt="Message Count" width="70%" >}}

If you add another Message to the table using the following SQL insert statement:

```sql
INSERT INTO public."Message" VALUES (6, 'Allen', 'I am Spartacus');
```

You will see the "I am Spartacus" Frequency increase dynamically to 3:

{{< figure src="message-count-debug-updated.png" alt="Message Count Updated" width="70%" >}}

Finally, if you delete both "Hello World" messages using the following SQL statement:

```sql
DELETE FROM public."Message" WHERE "Message" = 'Hello World';
```

The Debug Reaction updates to show that there are no messages with the text "Hello World":

{{< figure src="message-count-debug-deleted.png" alt="Message Count" width="70%" >}}

And if you switch back to the `hello-world-from` Continuous Query, the current result is empty as expected:

{{< figure src="hello-world-from-debug-deleted.png" alt="Message Count" width="70%" >}}

## Reflection
In completing the tutorial, using no custom code and a minimal amount of configuration information, you were able to write queries that automatically detect changes in a database and dynamically distribute a custom representation of those changes to downstream consumers for further processing or integration into a broader solution. Although the data and queries in the tutorial where trivial, the process is exactly the same for richer and more complex scenarios, only the Continuous Query increases in complexity and this depends totally on what you are trying to achieve.

Without Drasi, to achieve what you just did in the tutorial, you would need to write code to process change logs or periodically poll the database for changes. You would also need to maintain your own state to track which data had changed and to calculate the aggregates across the changing data. And you would need to implement unique solutions for each type of source you wanted to support. 

Hopefully, from this simple tutorial you can see the efficiencies and time saving Drasi offers, and the opportunities it presents for improving and simplifying the ability to detect and react to change in dynamic system as well as its ability to power solutions that are more dynamic and responsive.

## Next Steps...
As with many new technologies, the challenge to getting started with Drasi can be less about how to use it, and more about understanding **why** and **when** to use it. Learning how to use Drasi **most effectively** involves understanding where Drasi replaces and simplifies the way you detect and react to change today, as well as how Drasi enables new ways to think about query-driven solutions that would not be possible today with significant development efforts. 

Once you understand the basics of Drasi, the following sections will help you master Drasi quickly so you can start using it to build more responsive solutions that detect and react to change:
- The [Background](/solution-developer/background) section explores in more detail the problems Drasi was created to solve. This will be useful if you are looking for more context and trying to relate the benefits of Drasi to other alternatives for building solutions that detect and react to change.
- The [Solution Design](/solution-developer/solution-design) section describes how to use Drasi most effectively in your solutions. It describes multiple ways to think about and apply the functionality provided by Continuous Queries and Reactions. Some are improved alternatives to existing patterns, while others are unique to Drasi. 
- The Drasi repo includes multiple [Sample Applications](/solution-developer/sample-apps/) that are fully functional solutions that demonstrate the use of Drasi in realistic scenarios. These sample apps contain working implementations of the patterns described in the [Solution Pattern](/solution-developer/solution-patterns) section.
- The [Recipes](/solution-developer/recipes) section provides code-based solutions to common problems. These recipes will be useful as you start to implement Drasi in your solution and need quick answers to specific questions.
- The [Troubleshooting](/solution-developer/troubleshooting) section provides guidance on how to investigate problems if they occur when you are creating the Sources, Continuous Queries, and Reactions that you will use as part of your solution.
