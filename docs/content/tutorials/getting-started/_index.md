---
type: "docs"
title: "Getting Started"
linkTitle: "Getting Started"
weight: 10
description: >
    Get started building Drasi-based solutions quickly
---

This step-by-step tutorial will help you get Drasi up and running quickly and show you how easy it is to create Sources, Continuous Queries, and Reactions.

After completing this tutorial, which should take around 30 minutes, you will have created a simple end-to-end Drasi-based solution, and you will have a fully functional Drasi environment suitable for further experimentation on your own. You will then be able to continue to explore the capabilities of the Drasi platform as described in the [Solution Developer Guides](/solution-developer).

## Solution Overview
In this sample Drasi solution, the source of data (and change) will be a `Message` table in a PostgreSQL database, which holds the content of messages sent by people. The `Message` table contains these three fields:

|Field Name|Type|Description|
|-|-|-|
|MessageId|integer|A unique id for each message.|
|From|character varying(50)|The name of who the message is from.|
|Message|character varying(200)|The text of the message.|

You will create three Continuous Queries that observe the `Message` table to answer the following questions in real-time:
1. Which people have sent the message "Hello World"? 
1. How many times has the same message been sent? 
1. Which people haven't sent a message in the last 20 seconds?

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
1. Create the PostgreSQL Source
1. Create the Continuous Queries
1. Create the Debug Reaction
1. Test the Solution

## Step 1 - Deploy Drasi
To complete the Hello World tutorial, you need a Drasi environment. The quickest and easiest way to get one suitable for the tutorial is to use a [Visual Studio Code Dev Container](https://code.visualstudio.com/docs/devcontainers/containers) we have created for the tutorial. 

To use the Drasi Dev Container, you will need to install:
- [Visual Studio Code](https://code.visualstudio.com/) (or [Insiders Edition](https://code.visualstudio.com/insiders))
- Visual Studio Code [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) 
- [Docker](https://www.docker.com/get-started/)

Once you have these prerequisites installed:
1. Download the [Drasi QuickStart ZIP file](https://drasi.blob.core.windows.net/tutorials/quickstart-dev-container.zip?latest)
1. Unzip the Drasi QuickStart ZIP file to a temporary location on your computer
1. Run VS Code and open the `tutorial/getting-started` folder from the Drasi QuickStart files you just unzipped

If you have opened the correct folder, in the VS Code Explorer panel you will see two folders:
- `.devcontainer` contains files that VS Code requires to configure the Dev Container
- `resources` contains files you will use later in the tutorial to create the Drasi Sources, Continuous Queries, and Reactions

Run the Dev Container as follows:
1. Open the Command Palette using `Ctrl + Shift + P` (Win/Linux) or `Cmd + Shift + P` (Mac)
2. Type "dev containers:"
3. Select "Dev Containers: Rebuild and Reopen in Container"

The Drasi Dev Container will take a few minutes to initialize depending on how many images it needs to download and the speed of your internet connection. The first time you run the Dev Container, it could take around 10 minutes because VS Code needs to download multiple images, install PostgreSQL, and install Drasi and its dependencies. 

When you see the following message in the Dev Container terminal, it is ready to use and you can proceed with the rest of the tutorial.

```
Done. Press any key to close the terminal.
```

If the Dev Container startup fails, it is usually due to a problem with Docker resources. The following link contains instructions for [cleaning out unused containers and images](https://code.visualstudio.com/docs/devcontainers/tips-and-tricks#_cleaning-out-unused-containers-and-images). If this doesn't resolve your problem, you can email the [Drasi Team](mailto:projectdrasiteam@service.microsoft.com). 

#### Alternatives to the Drasi Dev Container
The rest of the QuickStart Tutorial assumes you are using the Dev Container. However, if you cannot or do not want to use a Dev Container to run this QuickStart Tutorial, we recommend you install Drasi on a local Kubernetes environment such as [Kind](/reference/using-kind/) and [deploy Drasi from pre-built Preview Images](/administrator/platform-deployment/from-preview-images/). You can also explore other options by going to the [Deploying Drasi](/administrator/platform-deployment/) section.

In this case you must also install a PostgreSQL database to use as a source of change. The [Using PostgreSQL](/reference/setup-postgres) section provides instruction on setting up a Kubernetes hosted PostgreSQL database suitable for this tutorial, including all required tables and data.

The files you will need to create the Drasi Source, Continuous Queries, and Reaction in the following steps are located in the `tutorial/getting-started/resources` folder of the Drasi QuickStart files you downloaded earlier. 

## Step 2 - Create the PostgreSQL Source
The following YAML is the content of the `hello-world-source.yaml` file, which you will use to create a Source that connects to your PostgreSQL database.

```yaml
apiVersion: v1
kind: Source
name: hello-world
spec:
  kind: PostgreSQL
  host: postgres
  port: 5432
  user: test
  password: test
  database: hello-world
  ssl: true
  tables:
    - public.Message
```

This table describes the most important configuration settings in this Source definition. 

|Property|Description|
|-|-|
|kind|Specifies that the resource is a **Source**|
|name|Provides the unique **ID** of the Source. This is used to manage the Source and in Continuous Query definitions to configure which Sources the Continuous Query uses as input.
|spec.kind|Identifies this Source as a **PostgreSQL** Source that enables connectivity to a PostgreSQL database.| 
|spec.host|The DNS host name of the PostgreSQL server.|
|spec.user|The **User ID** that the Source will use to connect to the PostgreSQL database.|
|spec.password|The **Password** for the User ID that the Source will use to connect to the PostgreSQL database.<br />**Note**: It is also possible to reference a Kubernetes secret for this value, see [Sources](/solution-developer/components/sources) for more details.|
|spec.database|The name of the **Database** this Source will observe changes from.|
|spec.ssl|Whether SSL is enabled on the database.<br />**Note**: If you deployed your PostgreSQL database in your Kubernetes cluster, make sure to set the `ssl` configuration option to `false`. |
|spec.tables|The list of database **table** names that the Source will observe for changes.|

Use the `drasi` CLI to create the Source by running the following command in a terminal window:

```bash
drasi apply -f ./resources/hello-world-source.yaml
```

It may take a minute or two for the new Source to startup and become available. You can inspect the status of all deployed sources by running the command:

```bash
drasi list source
```

You should expect to see a response like this until the Source is ready (AVAILABLE = true):
```
      ID      | AVAILABLE  
--------------+------------
  hello-world | false     
```

If your Source is not yet available (AVAILABLE = false), you can use the `drasi wait` command to wait for it to complete its startup:

```bash
drasi wait source hello-world -t 120
```

When `drasi wait` returns, your Drasi Source for PostgreSQL is created and ready to use.

## Step 3 - Create the Continuous Queries
The following YAML is the content of the `hello-world-queries.yaml` file, which you will use to create the Continuous Queries you need.

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
---
apiVersion: v1
kind: ContinuousQuery
name: inactive-people
spec:
  mode: query
  sources:    
    subscriptions:
      - id: hello-world
  query: >
      MATCH
        (m:Message)
      WITH
        m.From AS MessageFrom,
        max(drasi.changeDateTime(m)) AS LastMessageTimestamp
      WHERE
        LastMessageTimestamp <= datetime.realtime() - duration({ seconds: 20 })
      OR
        drasi.trueLater(LastMessageTimestamp <= datetime.realtime() - duration({ seconds: 20 }), LastMessageTimestamp + duration({ seconds: 20 }))
      RETURN
        MessageFrom,
        LastMessageTimestamp
```

Notice that the YAML describes three Continuous Queries. You can define any number of Drasi Sources, Continuous Queries, and Reactions in a single YAML file as long as you separate each definition with a line containing `---`.

This table describes the most important configuration settings in these Continuous Query definitions. 

|Property|Description|
|-|-|
|kind|Specifies that the resource is a **Continuous Query**|
|name|Provides the **ID** of the Continuous Query. This is used to manage the Continuous Query and in the Reaction configuration below to tell the Reaction which Continuous Queries to subscribe to.|
|spec.source.subscriptions.id| Identifies the **ID** of the Source the Continuous Query will subscribe to as a source of change data. In this instance, the id "hello-world" refers to the PostgreSQL Source you created in the previous step.|
|spec.query|Contains the [Cypher Query](/solution-developer/query-language/) that defines the behavior of the Continuous Query i.e. what data it is observing to detect change and the content of its result set.|

The following table describes the Cypher Query used by each of the Continuous Queries you are about to create:
|Query&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|Description|
|-|-|
|hello-world-from|Matches all nodes with a label (type) `Message` and filters for only those that have a `Message` field containing the value "Hello World". For records that match that pattern, it includes their `MessageId` and `From` fields in the query result.|
|message-count|Matches all nodes with a label (type) `Message`, groups them by the value of their `Message` field and uses the `count` aggregation function to calculate the number of times the same value occurred. For each unique message value, the query result will contain the `Message` value and its `Frequency`.|
|inactive-people|Matches all nodes with a label (type) `Message` and uses the time when the `Message` was added to the database to represent that `LastMessageTimestamp` for the person that sent the message. The query uses the [drasi.trueLater](/solution-developer/query-language/#drasi-future-functions) function to only include people that **haven't** sent messages in the last 20 seconds to be included in the query result.|

Use the `drasi` CLI to create the Continuous Queries by running the following command in a terminal window:

```bash
drasi apply -f ./resources/hello-world-queries.yaml
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
  inactive-people  | Running | default   |              | default-query-host-xxx-xxx
```

## Step 4 - Create the Debug Reaction
In order to view the results of the Continuous Queries you will deploy an instance of the [Debug Reaction](/solution-developer/components/reactions/#debug-reaction). The Debug Reaction provides a simple Web-based UI that lets you see the current result of a Continuous Query as a table, and to view the query results updating dynamically as the source data changes.

The following YAML is the content of the `hello-world-reaction.yaml` file, which you will use to create the Debug Reaction.

```yaml
apiVersion: v1
kind: Reaction
name: hello-world-debug
spec:
  image: reaction-debug
  queries:
    hello-world-from:
    message-count:
    inactive-people:
  endpoints:
    gateway: 8080  
```

This table describes the most important configuration settings in this Reaction definition:
|Property|Description|
|-|-|
|kind|Specifies that the resource is a **Reaction**|
|name|Provides the **ID** of the Reaction. This is used to manage the Reaction. |
|spec.image|Identifies the type of Reaction. The value `reaction-debug` identifies that it is a Debug reaction you want to create.|
|spec.queries|Specifies the IDs of the Continuous Queries the Reaction will subscribe to. In this case you specify the IDs of the three Continuous Queries you created in the previous step.|
|spec.endpoints|Specifies the port name and number through which the Debug reaction Web UI is accessible.|

Use the `drasi` CLI to create the Debug Reaction by running the following command in a terminal window:

```bash
drasi apply -f ./resources/hello-world-reaction.yaml
```

To verify the status of the Reaction, execute the following command: 

```bash
drasi list reaction
```

You should expect to see the following response:

```
         ID         | AVAILABLE  
--------------------+------------
  hello-world-debug | false  
```

If your Reaction is not yet available (AVAILABLE = false), you can use the `drasi wait` command to wait for it to complete its startup:

```bash
drasi wait reaction hello-world-debug -t 120
```

When `drasi wait` returns, your Debug Reaction is created and ready to use.

Once the Debug Reaction is working (AVAILABLE = true), the Drasi Hello World solution is fully deployed and ready to test.

Because the Debug Reaction is running in Kubernetes, in order to connect its Web UI you must forward the container port to a local port. In the Dev Container terminal, run the following command:

```bash
kubectl port-forward services/hello-world-debug-gateway 8080:8080 -n drasi-system
```

Now open your browser and navigate to [http://localhost:8080](http://localhost:8080), where you will see the Debug Reaction UI shown here:

{{< figure src="debug-reaction-ui.png" alt="Debug Reaction UI" width="70%" >}}

## Step 5 - Test the Solution
To test the Hello World solution, you will need to add/update/delete data in the `Message` table of the PostgreSQL database, so you will need a way to run SQL commands. The Dev Container is pre-configured with [psql](https://www.postgresql.org/docs/current/app-psql.html), the PostgreSQL CLI, which will connect to the pre-installed PostgreSQL database. If you run the following command from a Dev Container terminal, it will create an interactive terminal session with the database in which you can enter SQL commands and see the results:

```bash
psql
```

If you prefer to use a GUI interface, you can install [pgAdmin](https://www.pgadmin.org/) on your local machine and use the following connections settings:

|Setting|Value|
|-|-|
|Host Name|localhost|
|Database Name|hello-world|
|Port|5432|
|User Id|test|
|Password|test|


On the left hand side is a menu listing the three Continuous Queries created earlier. Select `hello-world-from` entry and the right hand pane will show the current results of the `hello-world-from` query. Initially, there is only one result, because only **Brian Kernighan** is associated with the "Hello World" message.

{{< figure src="hello-world-from-debug.png" alt="Hello World From" width="70%" >}}

If you add another Message to the table using the following SQL insert statement:

```sql
INSERT INTO public."Message" VALUES (5, 'Allen', 'Hello World');
```

You will see a second record for **Allen** appear dynamically in the query result:

{{< figure src="hello-world-from-debug-updated.png" alt="Hello World From Updated" width="70%" >}}

In the list of Continuous Queries select the `message-count` entry and the right hand pane will show the current results to the `message-count` query. There are three results, as shown below. Note that because of the "Hello World" message you just added for **Allen**, both "Hello World" and "I am Spartacus" have a Frequency of 2.

{{< figure src="message-count-debug.png" alt="Message Count" width="70%" >}}

If you add another Message to the table using the following SQL insert statement:

```sql
INSERT INTO public."Message" VALUES (6, 'Allen', 'I am Spartacus');
```

You will see the "I am Spartacus" Frequency increase dynamically to 3:

{{< figure src="message-count-debug-updated.png" alt="Message Count Updated" width="70%" >}}

In the list of Continuous Queries select the `inactive-people` entry and the right hand pane will show the current results to the `inactive-people` query. Assuming you issued the last database change more than 20 seconds ago, you will see **Allen** on the list of inactive people.

{{< figure src="inactive-people-debug.png" alt="Initial Inactive People" width="70%" >}}

If you add another Message from **Allen** to the table using the following SQL insert statement:

```sql
INSERT INTO public."Message" VALUES (7, 'Allen', 'Goodbye');
```

**Allen** will disappear from the list of inactive people, because he just sent a message:

{{< figure src="inactive-people-debug-is-active.png" alt="Allen is active" width="70%" >}}

But, if you wait 20 seconds, **Allen** will reappear on the list of inactive people, because he has not sent a message in the allowed 20 second time interval:

{{< figure src="inactive-people-debug-is-inactive.png" alt="Allen is inactive" width="70%" >}}

Finally, if you return to the `message-count` Continuous Query and delete both "Hello World" messages using the following SQL statement:

```sql
DELETE FROM public."Message" WHERE "Message" = 'Hello World';
```

The Debug Reaction updates to show that there are no messages with the text "Hello World":

{{< figure src="message-count-debug-deleted.png" alt="Message Count" width="70%" >}}

And if you switch back to the `hello-world-from` Continuous Query, the current result is empty as expected:

{{< figure src="hello-world-from-debug-deleted.png" alt="Message Count" width="70%" >}}


The QuickStart Tutorial is now complete. The QuickStart Dev Container is running a fully functional version of Drasi that you can use for further exploration, development, and testing. 

## Reflection
In completing the tutorial, you were able to answer questions like "Which people have sent the message `Hello World`", "How many times has each unique message been sent", and "Which people haven't sent messages in the last 20 seconds" using Continuous Queries. Using the Continuous Queries `RESULT` clause, you were able to describe those changes to best meet your needs. And then you could distribute those changes to Reactions for further processing or integration into a broader solution. You did this with no custom code and a minimal amount of configuration information.

Although the data and queries in the tutorial where trivial, the process is exactly the same for richer and more complex scenarios, only the Continuous Query increases in complexity and this depends totally on what question you are trying to answer.

Without Drasi, to achieve what you just did in the tutorial, you would need to write code to process change logs or periodically poll the database for changes. You would need to maintain your own state to track which data had changed and to calculate the aggregates across the changing data. And you would need to implement a timer and callback mechanism to create notifications when changes had not happened as expected. You would need to implement unique solutions for each type of source you wanted to support. 

Hopefully, from this simple tutorial you can see the efficiencies and time saving Drasi offers, and the opportunities it presents for improving and simplifying the ability to detect and react to change in dynamic system as well as its ability to power solutions that are more dynamic and responsive.

## Cleanup

If you no longer need the Dev Container and want to cleanup, you can
1. Click the `Dev Container connection status` box in the bottom left corner of VS Code
1. Select `Close Remote Connection` from the list of options that appear
1. Run the VS Code command `Dev Containers: Clean Up Dev Containers..."
1. Select the `getting-started` image and click `ok` to remove the unused image
1. Select the unused volumes and click `ok` to remove the unused volumes


## Next Steps...
As with many new technologies, the challenge to getting started with Drasi can be less about how to use it, and more about understanding **why** and **when** to use it. Learning how to use Drasi **most effectively** involves understanding where Drasi replaces and simplifies the way you detect and react to change today, as well as how Drasi enables new ways to think about query-driven solutions that would not be possible today without significant development efforts. 

Once you understand the basics of Drasi, the following sections will help you master Drasi quickly so you can start using it to build more responsive solutions that detect and react to change:
- The [Background](/solution-developer/background) section explores in more detail the problems Drasi was created to solve. This will be useful if you are looking for more context and trying to relate the benefits of Drasi to other alternatives for building solutions that detect and react to change.
- The [Solution Design](/solution-developer/solution-design) section describes how to use Drasi most effectively in your solutions. It describes multiple ways to think about and apply the functionality provided by Continuous Queries and Reactions. Some are improved alternatives to existing patterns, while others are unique to Drasi. 
- The Drasi repo includes multiple [Sample Applications](/solution-developer/sample-apps/) that are fully functional solutions that demonstrate the use of Drasi in realistic scenarios. These sample apps contain working implementations of the patterns described in the [Solution Pattern](/solution-developer/solution-patterns) section.
- The [Troubleshooting](/solution-developer/troubleshooting) section provides guidance on how to investigate problems if they occur when you are creating the Sources, Continuous Queries, and Reactions that you will use as part of your solution.
