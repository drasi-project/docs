---
type: "docs"
title: "Quickstart Tutorial"
linkTitle: "Quickstart Tutorial"
weight: 10
description: >
    Get started building Drasi-based solutions quickly
---

This step-by-step tutorial will help you get Drasi up and running quickly and show you how easy it is to create Sources, Continuous Queries, and Reactions.

After completing this tutorial, you will have a simple end-to-end Drasi-based solution running, and a Drasi environment suitable for further experimentation on your own. You will then be able to continue to explore the capabilities of the Drasi platform as described in the [Solution Developer Guides](/solution-developer).

## Solution Overview
In this sample Drasi solution, the source of data (and change) will be a `Message` table in a PostgreSQL database, which holds the content of messages sent by people. The `Message` table contains these three fields:

|Field Name|Type|Description|
|-|-|-|
|MessageId|integer|A unique id for each message.|
|From|character varying(50)|The name of who the message is from.|
|Message|character varying(200)|The text of the message.|

You will create two Continuous Queries that observe the `Message` table to answer the following questions in real-time:
1. Which people have sent the message "Hello World"? This demonstrates how to write a basic Continuous Query.
1. How many times has each unique message been sent? This demonstrates how to use aggregations in Continuous Queries.

Initially, the `Message` table will contain the following messages:

|MessageId|From|Message|
|-|-|-|
|1|Buzz Lightyear|To infinity and beyond!|
|2|Brian Kernighan|Hello World|
|3|Antoninus|I am Spartacus|
|4|David|I am Spartacus|

During the tutorial, you will add and remove messages and immediately observe the effect of those changes on your Continuous Query results using the [Debug Reaction](/solution-developer/components/reactions/#debug-reaction). The Debug Reaction subscribes to a set of Continuous Queries and provides a dynamic view of each query's result set in a Web browser. It is common to use the Debug Reaction to test your Continuous Queries prior to setting up your actual Reactions.

## Solution Architecture
When complete, the Hello World solution will have the component architecture shown in this diagram:

{{< figure src="hello-world-solution.png" alt="Hello World Solution" width="70%" >}}

Although an intentionally simple example, the Hello World solution contains all the components of any Drasi-based solution, including:
- Drasi **Sources** that provide access to external data sources
- **Continuous Queries** that observe Sources and detect change
- **Reactions** that take action on the Continuous Query result set changes

To complete the tutorial, you will be guided through the following steps:
1. Deploy Drasi
1. Create the PostgreSQL Sources
1. Create the Continuous Queries
1. Create the Debug Reactions
1. Test the Solution

## Step 1 - Deploy Drasi
To complete the Hello World tutorial, you need a Drasi environment. The quickest and easiest way to get  one suitable for the tutorial is to use a [Visual Studio Code Dev Container](https://code.visualstudio.com/docs/devcontainers/containers) we have created for the tutorial. 

To use the Drasi Dev Container, you will need:
- [Visual Studio Code](https://code.visualstudio.com/)
- A [git CLI ](https://cli.github.com/)

To download the Dev Container files:
1. Open a terminal window
1. Create and/or change to a folder where you want to put the Dev Container files
1. Execute the following commands:

```bash
mkdir drasi-dev-container
cd drasi-dev-container
git clone --filter=blob:none --sparse -b preview https://azure-octo@dev.azure.com/azure-octo/Incubations/_git/ReactiveGraph
cd ReactiveGraph
git sparse-checkout add tutorial
```

Then open the `drasi-dev-container` in VS Code using the following commands:

```bash
cd tutorial/getting-started
code .
```

Once you are in VS Code, run the Dev Container as follows:
1. Open the Command Palette using `Ctrl + Shift + P` (Win/Linux) or `Cmd + Shift + P` (Mac)
1. Type "dev containers:"
1. Select "Dev Containers: Rebuild and Reopen in Container"

Once the Dev Container environment is ready, execute the following command in the VS Code terminal to deploy Drasi:

```bash
drasi init --version preview.1
```

You will also need a way to run commands against your PostgresSQL database to create tables and add/update/delete data. Some options include:
- [pgAdmin](https://www.pgadmin.org/) if you want a GUI
- [psql](https://www.postgresql.org/docs/current/app-psql.html) if you want a CLI

#### Alternatives to the Drasi Dev Container
If you cannot or do not want to use a Dev Container, we recommend you install Drasi on a local Kubernetes environment such as [Kind](/reference/using-kind/) and [deploy Drasi from pre-built Preview Images](/administrator/platform-deployment/from-preview-images/). You can also explore other options by going to the [Deploying Drasi](/administrator/platform-deployment/) section.

In this case you must also install a PostgreSQL database to use as a source of change. The [Using PostgreSQL](/reference/setup-postgres) section provides instruction on setting up a Kubernetes hosted PostgreSQL database suitable for this tutorial. If you want to use a different PostgreSQL setup, the requirements are:
- Version 10 or greater.
- Configured to support `LOGICAL` replication.
- A PostgreSQL user that has at least the LOGIN, REPLICATION and CREATE permissions on the database and SELECT permissions on the tables you are interested in.

## Step 2 - Create the PostgreSQL Source

### Create Database and Table
On your PostgreSQL server, create a `hello-world` database. 

Then, in the `hello-world` database create a table named `Message` and add some initial data using the following SQL script:

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

### Create a Source for PostgreSQL
The following YAML contains the minimal settings to create a Source that connects to your PostgreSQL database.

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

The configuration settings in angled brackets `<...>` are values you need to provide based on the configuration of your PostgreSQL database. 

If you are using the Dev Container, it contains a fully specified Source file named `/tutorial/getting-started/resources/hello-world-source.yaml`. Run the `drasi` CLI to create the Source using the following command:

```bash
drasi apply -f ./resources/hello-world-source.yaml
```

Otherwise, create a file named `hello-world-source.yaml` and configure the missing values based on the following information:

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

It may take a minute or two for the new Source to startup and become available. You can run the `drasi list source` command to inspect the status of all deployed sources.

If your Source is not yet available, use the `drasi wait` command to wait for it to become available:

```bash
drasi wait source hello-world -t 120
```

Your Drasi Source for PostgreSQL is now created and ready to use.

## Step 3 - Create the Continuous Queries
The following YAML contains the settings required to create the Continuous Queries you need.

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

Notice that the YAML describes two Continuous Queries. You can define any number of resources in a single YAML file as long as they are of the same type and you separate each definition with a line containing `---`.

In the first Continuous Query, named `hello-world-from`, the Cypher Query is simply matching nodes with a label (type) `Message` and filtering for only those that have a Message field containing the value "Hello World". For records that match that pattern, it includes their **MessageId** and **From** fields in the result.

In the second Continuous Query named `message-count`, the Cypher Query is aggregating the count of the number of times each message has been sent. For each message, the query result will contain the message and the frequency.

You don't need to change this YAML, but this table describes the most important configuration settings in these Continuous Query definitions. 

|Property|Description|
|-|-|
|kind|Specifies that the resource is a **Continuous Query**|
|name|Provides the **id** of the Continuous Query. This is used to manage the Continuous Query and in the Reaction configuration below.|
|spec.source.subscriptions.id| Identifies the **id** of the Source the Continuous Query will subscribe to as a source of change data. In this instance, these refer to the PostgreSQL Source created in the previous step.|
|spec.query|Contains the [Cypher Query](/solution-developer/query-language/) that defines the behavior of the Continuous Query i.e. which changes it is detecting and the schema of its result set.|

If you are using the Dev Container, run the `drasi` CLI to create the Continuous Queries using the following command:

```bash
drasi apply -f ./resources/hello-world-queries.yaml
```

Otherwise, create a file named `hello-world-queries.yaml` from the content above and run the `drasi` command:

```bash
drasi apply -f hello-world-queries.yaml
```

To verify the status of the Continuous Queries, execute the following command: 

```bash
drasi list query
```

You should expect to see the following output:
```
         ID        | STATUS  | CONTAINER | ERRORMESSAGE |              HOSTNAME                
-------------------+---------+-----------+--------------+--------------------------------------
  hello-world-from | Running | default   |              | default-query-host-xxx-xxx
  message-count    | Running | default   |              | default-query-host-xxx-xxx
```

## Step 4 - Create the Debug Reaction
In order to view the results of the Continuous Queries you will deploy an instance of the [Debug Reaction](/solution-developer/components/reactions/#debug-reaction). The Debug Reaction provides a simple Web-based UI that lets you see the current result of a Continuous Query as a table, and to view the query results updating dynamically as the source data changes.

The following YAML file contains the settings necessary to create a Debug Reaction.

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

You don't need to change this YAML, but this table describes the most important configuration settings in this resource definition:
|Property|Description|
|-|-|
|kind|Specifies that the resource is a **Reaction**|
|name|Provides the **id** of the Reaction.|
|spec.image|Identifies the type of Reaction.|
|spec.queries|Subscribes this Reaction to the two Continuous Queries created in the previous step.|
|spec.endpoints|Specifies the port name and number through which the Debug reaction Web UI is accessible.|


If you are using the Dev Container, run the `drasi` CLI to create the Debug Reaction using the following command:

```bash
drasi apply -f ./resources/hello-world-reaction.yaml
```

Otherwise, create a file named `hello-world-reaction.yaml` from the content above and run the `drasi` command:

```bash
drasi apply -f hello-world-reaction.yaml
```

To verify the status of the Reaction, execute the following command: 

```bash
drasi list reaction
```

Once the Reaction is working, the Drasi Hello World solution is fully deployed and ready to test.

## Step 5 - Test the Solution
In order to access the Web UI of the Debug Reaction from a local machine, you must forward the container port to a local one using the following command:

```bash
kubectl port-forward services/hello-world-debug-gateway 8080:8080 -n drasi-system
```

Now open your browser and navigate to [http://localhost:8080](http://localhost:8080), where you will see the Debug Reaction UI shown here:

{{< figure src="debug-reaction-ui.png" alt="Debug Reaction UI" width="70%" >}}

On the left hand side is a menu listing the two Continuous Queries created earlier. Select `hello-world-from` entry and the right hand pane will show the current results of the `hello-world-from` query. Initially, there is only one result, because only **Brian Kernighan** is associated with the "Hello World" message.

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
In completing the tutorial, you were able to answer questions like "Which people have sent the message `Hello World`" and "How many times has each unique message been sent" using Continuous Queries to detect changes in a PostgreSQL database and distribute those changes to Reactions for further processing or integration into a broader solution. You did this with no custom code and a minimal amount of configuration information.

Although the data and queries in the tutorial where trivial, the process is exactly the same for richer and more complex scenarios, only the Continuous Query increases in complexity and this depends totally on what question you are trying to answer.

Without Drasi, to achieve what you just did in the tutorial, you would need to write code to process change logs or periodically poll the database for changes. You would also need to maintain your own state to track which data had changed and to calculate the aggregates across the changing data. And you would need to implement unique solutions for each type of source you wanted to support. 

Hopefully, from this simple tutorial you can see the efficiencies and time saving Drasi offers, and the opportunities it presents for improving and simplifying the ability to detect and react to change in dynamic system as well as its ability to power solutions that are more dynamic and responsive.

## Next Steps...
As with many new technologies, the challenge to getting started with Drasi can be less about how to use it, and more about understanding **why** and **when** to use it. Learning how to use Drasi **most effectively** involves understanding where Drasi replaces and simplifies the way you detect and react to change today, as well as how Drasi enables new ways to think about query-driven solutions that would not be possible today without significant development efforts. 

Once you understand the basics of Drasi, the following sections will help you master Drasi quickly so you can start using it to build more responsive solutions that detect and react to change:
- The [Background](/solution-developer/background) section explores in more detail the problems Drasi was created to solve. This will be useful if you are looking for more context and trying to relate the benefits of Drasi to other alternatives for building solutions that detect and react to change.
- The [Solution Design](/solution-developer/solution-design) section describes how to use Drasi most effectively in your solutions. It describes multiple ways to think about and apply the functionality provided by Continuous Queries and Reactions. Some are improved alternatives to existing patterns, while others are unique to Drasi. 
- The Drasi repo includes multiple [Sample Applications](/solution-developer/sample-apps/) that are fully functional solutions that demonstrate the use of Drasi in realistic scenarios. These sample apps contain working implementations of the patterns described in the [Solution Pattern](/solution-developer/solution-patterns) section.
- The [Troubleshooting](/solution-developer/troubleshooting) section provides guidance on how to investigate problems if they occur when you are creating the Sources, Continuous Queries, and Reactions that you will use as part of your solution.
