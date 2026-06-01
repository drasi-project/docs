---
type: "docs"
title: "Getting Started"
linkTitle: "Getting Started"
weight: 5
no_list: true
hide_readingtime: true
description: "Build your first change-driven solution with Drasi Server"
---

Imagine you want to react the instant data changes — a new row in a database, a value crossing a threshold, or something that *should* have changed but didn't. Maybe something more complex like cross-referencing the pods running on your Kubernetes cluster against a database of vulnerable and non-compliant images.

Drasi Server lets you express these as Continuous Queries that stay constantly up to date, with no polling. In this tutorial you'll connect Drasi Server to a live PostgreSQL server and, step by step, build four Continuous Queries that detect changes, filter them, aggregate them, and even detect the *absence* of change — watching each one react in real time. By the end of the tutorial you'll have a running Drasi Server reacting to live database changes and a solid understanding of how to use Drasi Server to build your own change-driven solutions.

You'll work with a single PostgreSQL table of messages — imagine it as a simple live message feed — and build a monitor over it one query at a time. Throughout, you write only declarative queries and configuration; there's no application code to write.

Building this kind of capability by hand usually means stitching together several moving parts — change-data-capture, a message queue, a stream processor to filter and aggregate, somewhere to hold state, and a scheduler for time-based checks — plus the code and operations to connect them. In this tutorial, you'll see Drasi Server simplifies these concerns, turning them into a single, unified experience of writing queries and configuration against a single server that handles the rest.

**What you'll build:** a running Drasi Server that connects to a live PostgreSQL database and reacts to its changes, assembled from Drasi's three core building blocks:

<div class="flow-diagram">
  <div class="flow-step">
    <div class="flow-step__icon">
      <i class="fas fa-database"></i>
    </div>
    <div class="flow-step__label">Sources</div>
    <div class="flow-step__description">Connect to your data sources</div>
  </div>

  <div class="flow-arrow">
    <i class="fas fa-arrow-right"></i>
  </div>

  <div class="flow-step">
    <div class="flow-step__icon">
      <i class="fas fa-filter"></i>
    </div>
    <div class="flow-step__label">Continuous Queries</div>
    <div class="flow-step__description">Define what changes matter</div>
  </div>

  <div class="flow-arrow">
    <i class="fas fa-arrow-right"></i>
  </div>

  <div class="flow-step">
    <div class="flow-step__icon">
      <i class="fas fa-bolt"></i>
    </div>
    <div class="flow-step__label">Reactions</div>
    <div class="flow-step__description">Take action automatically</div>
  </div>
</div>

You'll configure each of these building blocks yourself as you work through the steps below.

**Steps 1–3** give you a working Drasi Server solution in under 20 minutes.  
**Steps 4–6** explore progressively advanced capabilities of Drasi Server.

| Step | What You'll Learn | Time |
| ---- | ----------------- | ---- |
| **[Step 1: Set Up Your Environment](#setup)** | Install Drasi Server and set up your development environment | 5 min |
| **[Step 2: Set Up the Tutorial Database](#database)** | Start a PostgreSQL database and load sample data | 3 min |
| **[Step 3: Create Your First Configuration](#phase-1)** | Start from a provided config file with a Source, Continuous Query, and Log Reaction — see Drasi detect and react to change in real time | 3 min |
| **[Step 4: Add a Continuous Query with Criteria](#phase-2)** | Add a filtered query via the REST API — learn how `WHERE` clauses tell Drasi what changes you are interested in | 3 min |
| **[Step 5: Add an Aggregation Query](#phase-3)** | Add a query with `count()` — see aggregations update automatically as data changes and add a new Reaction that generates Server-Sent Events (SSE) when query results change | 5 min |
| **[Step 6: Add Time-Based Detection](#phase-4)** | Detect the *absence of change* over time — a powerful capability for monitoring and alerting | 5 min |

{{% alert title="Before you begin" color="info" %}}
- **Terminals:** you'll use more than one. **Terminal 1** runs Drasi Server; use **Terminal 2** for `docker` and `curl` commands. Step 5 adds **Terminal 3** for the SSE CLI.
- **Command tabs:** commands are shown in tabs (for example *bash / zsh* and *PowerShell*) — use the one for your shell.
- **Expected output** blocks show roughly what you'll see; exact versions, IDs, and timestamps will differ.
{{% /alert %}}

## Step 1 of 6: Set Up Your Environment {#setup}

Choose your preferred environment for working through the Getting Started tutorial. Each approach gets you to the same starting point with Drasi Server installed and ready to work through the tutorial.

<div class="card-grid">
  <a href="download-binary/">
    <div class="unified-card unified-card--tutorials">
      <div class="unified-card-icon"><i class="fas fa-download"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Download Binary</h3>
        <p class="unified-card-summary">Download a prebuilt binary. The fastest way to get started (recommended).</p>
      </div>
    </div>
  </a>
  <a href="github-codespace/">
    <div class="unified-card unified-card--tutorials">
      <div class="unified-card-icon"><i class="fab fa-github"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">GitHub Codespace</h3>
        <p class="unified-card-summary">One-click cloud environment. No local installation needed.</p>
      </div>
    </div>
  </a>
  <a href="dev-container/">
    <div class="unified-card unified-card--tutorials">
      <div class="unified-card-icon"><i class="fas fa-cube"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Dev Container</h3>
        <p class="unified-card-summary">VS Code Dev Container with all dependencies preconfigured.</p>
      </div>
    </div>
  </a>
  <a href="build-from-source/">
    <div class="unified-card unified-card--tutorials">
      <div class="unified-card-icon"><i class="fas fa-hammer"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Build from Source</h3>
        <p class="unified-card-summary">Clone and build Drasi Server yourself. Ideal for would-be contributors.</p>
      </div>
    </div>
  </a>
</div>

<div style="margin-top: 2rem;"></div>

After completing your preferred setup, return here to continue with the tutorial.

---

## Step 2 of 6: Set Up the Tutorial Database {#database}

The tutorial uses a PostgreSQL database as a data source. Start the database container using Docker Compose:

```bash
docker compose -f examples/getting-started/database/docker-compose.yml up -d
```

Verify the database container is running:

```bash
docker compose -f examples/getting-started/database/docker-compose.yml ps
```

You should see the `getting-started-postgres` container with a status of `Up`:

```text
NAME                       IMAGE                COMMAND                  SERVICE    CREATED          STATUS                    PORTS
getting-started-postgres   postgres:14-alpine   "docker-entrypoint.s…"   postgres   31 seconds ago   Up 30 seconds (healthy)   0.0.0.0:5432->5432/tcp
```

If the container shows a different status or you see errors, check the container logs with `docker compose -f examples/getting-started/database/docker-compose.yml logs`. See the [Docker Compose documentation](https://docs.docker.com/compose/) for additional troubleshooting help.

### Initialize the Database

Once the container is up, initialize the database schema and sample data.

The tutorial uses a simple `Message` table with the following schema:

| Field | Type | Description |
| ----- | ---- | ----------- |
| MessageId | integer | Unique message identifier |
| From | varchar(50) | Who sent the message |
| Message | varchar(200) | The message content |
| CreatedAt | timestamp | When the message was sent |

<div style="margin-top: 1.5rem;"></div>

The `Message` table is initially populated with these messages:

| MessageId | From | Message |
| --------- | ---- | ------- |
| 1 | Buzz Lightyear | To infinity and beyond! |
| 2 | Brian Kernighan | Hello World |
| 3 | Antoninus | I am Spartacus |
| 4 | David | I am Spartacus |

<div style="margin-top: 1.5rem;"></div>

Run the database initialization script:

{{< tabpane persist="header" >}}
{{< tab header="bash / zsh" lang="bash" >}}
docker exec -i getting-started-postgres psql -U postgres -d getting_started < examples/getting-started/database/init.sql
{{< /tab >}}
{{< tab header="PowerShell" lang="powershell" >}}
Get-Content examples/getting-started/database/init.sql | docker exec -i getting-started-postgres psql -U postgres -d getting_started
{{< /tab >}}
{{< /tabpane >}}

You should see:

```text
NOTICE:  Getting Started database initialized successfully!
NOTICE:  Tables: Message
NOTICE:  Publication: drasi_pub
NOTICE:  Replication slot: drasi_slot
```

Verify the sample data was loaded:

{{< tabpane persist="header" >}}
{{< tab header="bash / zsh" lang="bash" >}}
docker exec getting-started-postgres psql -U drasi_user -d getting_started -c 'SELECT * FROM "Message";'
{{< /tab >}}
{{< tab header="PowerShell" lang="powershell" >}}
docker exec getting-started-postgres psql -U drasi_user -d getting_started -c "SELECT * FROM \""Message\"";"
{{< /tab >}}
{{< /tabpane >}}

You should see the 4 sample messages:

```text
 MessageId |      From       |         Message          |         CreatedAt          
-----------+-----------------+--------------------------+----------------------------
         1 | Buzz Lightyear  | To infinity and beyond!  | 2026-02-10 21:30:08.123456
         2 | Brian Kernighan | Hello World              | 2026-02-10 21:30:08.123456
         3 | Antoninus       | I am Spartacus           | 2026-02-10 21:30:08.123456
         4 | David           | I am Spartacus           | 2026-02-10 21:30:08.123456
(4 rows)
```

---

## Step 3 of 6: Run Your First Drasi Server {#phase-1}

Now you'll create your initial Drasi Server configuration. To keep this first step focused on getting Drasi Server running, you'll start from a pre-prepared config file included with the tutorial.

The config file creates:

- A **PostgreSQL Source** named `my-postgres` that connects to the `getting_started` database and monitors the `Message` table for changes.
- A **Continuous Query** named `all-messages` that selects all messages from the source.
- A **Log Reaction** named `log-reaction` that prints query result changes to the console.

### Copy the Tutorial Config File

From the tutorial root folder, copy the pre-prepared config file and rename it `getting-started.yaml`:

{{< tabpane persist="header" >}}
{{< tab header="bash / zsh" lang="bash" >}}
cp examples/getting-started/configs/getting-started-step-3.yaml getting-started.yaml
{{< /tab >}}
{{< tab header="PowerShell" lang="powershell" >}}
Copy-Item examples/getting-started/configs/getting-started-step-3.yaml getting-started.yaml
{{< /tab >}}
{{< /tabpane >}}

### The all-messages Continuous Query

The Continuous Query is at the heart of Drasi Server, so before running anything it's worth looking at the one in this config. Here's how `all-messages` looks in the config file:

```yaml
- id: all-messages
  autoStart: true
  sources:
    - sourceId: my-postgres
  query: |
    MATCH (m:Message)
    RETURN m.MessageId AS MessageId, m.From AS From, m.Message AS Message
  queryLanguage: GQL
```

The `sources` section connects the query to the `my-postgres` Source, so it receives all changes made to the `Message` table. The `queryLanguage` field is set to `GQL`; Drasi Server supports Continuous Queries written in both [GQL](../../reference/query-language/gql.md) and [openCypher](../../reference/query-language/cypher.md).

The `query` itself is deliberately trivial — just enough to get started. The `MATCH` clause selects every `Message` node from the Source, and the `RETURN` clause passes through the `MessageId`, `From`, and `Message` fields unchanged. There's no `WHERE` filter or aggregation, so the result set is simply *every* message in the table, kept continuously up to date. In Steps 4, 5, and 6 you'll write queries that filter, aggregate, and reason about time — but this one establishes the basic shape: `MATCH` what you care about, `RETURN` the fields you want.

{{% alert title="Graph queries over any source" color="info" %}}
Notice that you're using a *graph* query language (GQL) to query a *relational* database. Drasi Server projects every Source — relational, NoSQL, an HTTP API, and more — into a common graph model, so the same query language works regardless of where the data lives. This is also what lets a single Continuous Query draw on *multiple, disparate* Sources at once, correlating changes across systems that have no knowledge of each other. See [Continuous Queries](/concepts/continuous-queries/) to go deeper.
{{% /alert %}}

### Start Drasi Server

In **Terminal 1**, run Drasi Server with your new configuration:

```bash
./bin/drasi-server --config getting-started.yaml
```

You'll see detailed startup logs as Drasi Server downloads plugins and initializes all configured Sources, Continuous Queries, and Reactions. There's a lot of output, so look for these key lines at the end of the startup process:

```text
2026-05-31T16:21:00.488072Z  INFO drasi_lib::lifecycle: [STARTUP-COMPLETE] DrasiLib.start() is now returning - all components and subscriptions should be active
2026-05-31T16:21:00.488075Z  INFO drasi_lib::lib_core: drasi-lib started successfully
2026-05-31T16:21:00.489511Z  INFO drasi_server::server: Configuration persistence enabled
2026-05-31T16:21:00.502638Z  INFO drasi_server::server: Drasi Server Admin UI found on filesystem, serving at /ui/
2026-05-31T16:21:00.503097Z  INFO drasi_server::server: Starting web API on 0.0.0.0:8080
2026-05-31T16:21:00.503108Z  INFO drasi_server::server: API v1 available at http://0.0.0.0:8080/api/v1/
2026-05-31T16:21:00.503110Z  INFO drasi_server::server: Swagger UI available at http://0.0.0.0:8080/api/v1/docs/
2026-05-31T16:21:00.503112Z  INFO drasi_server::server: Drasi Server Admin UI at http://0.0.0.0:8080/ui/
2026-05-31T16:21:00.503548Z  INFO drasi_server::server: Drasi Server started successfully with API on port 8080
```

This shows that Drasi Server has started successfully and lists the URLs for Drasi Server's REST API, Swagger UI, and Admin UI.

You can confirm the server is healthy at any time by requesting its health endpoint: `curl http://localhost:8080/health`.

{{% alert title="If Drasi Server didn't start" color="info" %}}
- **`Address already in use`**: port 8080 is already taken. Stop the process using it, or change the port in `getting-started.yaml`.
- **Plugin download errors**: Drasi downloads plugins on first start. Check your network or proxy, then run the command again.
- Drasi Server is safe to stop (`Ctrl+C`) and restart; it reloads from `getting-started.yaml`.
{{% /alert %}}

As part of the startup process, Drasi Server would have bootstrapped the `all-messages` Continuous Query by loading all existing messages from the `Message` table and processing them through the query. Within the log output you should be able to see a message like this confirming the bootstrap process completed successfully:

```text
2026-05-31T16:21:00.486167Z  INFO drasi_host_sdk::callbacks: [plugin:postgres-bootstrap] Completed PostgreSQL bootstrap for query all-messages: sent 4 records
```

### View Continuous Query Results

At any time during the tutorial you can view the current result set of a Continuous Query using Drasi Server's [REST API](../reference/rest-api/). For example, choose your preferred method to view the `all-messages` query results:

{{< tabpane text=true >}}
{{% tab header="Browser" %}}

Click to open the following URL in a browser:

<a href="http://localhost:8080/api/v1/queries/all-messages/results" target="_blank">http://localhost:8080/api/v1/queries/all-messages/results</a>

{{% /tab %}}
{{% tab header="curl" %}}

Run the following curl command in the terminal:

```bash
curl -s http://localhost:8080/api/v1/queries/all-messages/results
```

{{% /tab %}}
{{% tab header="VS Code REST Client" %}}

If you are using VS Code, you can call the REST API using the <a href="https://marketplace.visualstudio.com/items?itemName=humao.rest-client" target="_blank">REST Client extension</a>.

The Drasi Server repo includes a file at `examples/getting-started/requests.http` that contains a variety of pre-written REST API requests for use with the Getting Started tutorial.

{{% /tab %}}
{{< /tabpane >}}

However you choose to view the `all-messages` results, that data will look something like this (formatted for readability):

```json
{
  "success": true,
  "data": [
    {
      "From": "Buzz Lightyear",
      "Message": "To infinity and beyond!",
      "MessageId": "1"
    },
    {
      "From": "Brian Kernighan",
      "Message": "Hello World",
      "MessageId": "2"
    },
    {
      "From": "Antoninus",
      "Message": "I am Spartacus",
      "MessageId": "3"
    },
    {
      "From": "David",
      "Message": "I am Spartacus",
      "MessageId": "4"
    }
  ],
  "error": null
}
```

{{% alert title="Tip" color="primary" %}}
The Drasi Server REST API also provides a Swagger UI at <a href="http://localhost:8080/api/v1/docs/" target="_blank" rel="noopener noreferrer">http://localhost:8080/api/v1/docs/</a> where you can explore all available endpoints interactively.
{{% /alert %}}

If a `curl` command can't connect, confirm Drasi Server is still running in **Terminal 1** and reported that the API is available on port 8080.

### Test the all-messages Continuous Query

Open **Terminal 2** and run the following command, which calls `psql` in the database container to manually **insert** a record into the `Message` table:

{{< tabpane persist="header" >}}
{{< tab header="bash / zsh" lang="bash" >}}
docker exec -it getting-started-postgres psql -U drasi_user -d getting_started -c \
  "INSERT INTO \"Message\" (\"From\", \"Message\") VALUES ('You', 'My first message!');"
{{< /tab >}}
{{< tab header="PowerShell" lang="powershell" >}}
docker exec -it getting-started-postgres psql -U drasi_user -d getting_started -c "INSERT INTO \""Message\"" (\""From\"", \""Message\"") VALUES ('You', 'My first message!');"
{{< /tab >}}
{{< /tabpane >}}

Watch the Drasi Server console — a notification of an addition to the `all-messages` query result appears instantly output by the Log Reaction:

```text
[log-reaction] Query 'all-messages' (1 items):
[log-reaction]   [ADD] {"From":"You","Message":"My first message!","MessageId":"5"}
```

If you view the `all-messages` query results again through the REST API, you'll see the new message included in the result set.

Now, run the following command to **update** the message we just inserted and change its text:

{{< tabpane persist="header" >}}
{{< tab header="bash / zsh" lang="bash" >}}
docker exec -it getting-started-postgres psql -U drasi_user -d getting_started -c \
  "UPDATE \"Message\" SET \"Message\" = 'My first UPDATED message!' WHERE \"MessageId\" = 5;"
{{< /tab >}}
{{< tab header="PowerShell" lang="powershell" >}}
docker exec -it getting-started-postgres psql -U drasi_user -d getting_started -c "UPDATE \""Message\"" SET \""Message\"" = 'My first UPDATED message!' WHERE \""MessageId\"" = 5;"
{{< /tab >}}
{{< /tabpane >}}

The notification output by the Log Reaction shows the item before and after the update — Drasi reports the transition because it maintains the query's result set, not just the latest change:

```text
[log-reaction] Query 'all-messages' (1 items):
[log-reaction]   [UPDATE] {"From":"You","Message":"My first message!","MessageId":"5"} -> {"From":"You","Message":"My first UPDATED message!","MessageId":"5"}
```

If you view the `all-messages` query results again through the REST API, you'll see the message text has been updated in the query result set.

Finally, **delete** the message with this command:

{{< tabpane persist="header" >}}
{{< tab header="bash / zsh" lang="bash" >}}
docker exec -it getting-started-postgres psql -U drasi_user -d getting_started -c \
  "DELETE FROM \"Message\" WHERE \"MessageId\" = 5;"
{{< /tab >}}
{{< tab header="PowerShell" lang="powershell" >}}
docker exec -it getting-started-postgres psql -U drasi_user -d getting_started -c "DELETE FROM \""Message\"" WHERE \""MessageId\"" = 5;"
{{< /tab >}}
{{< /tabpane >}}

The console shows the message being deleted from the query's result set:

```text
[log-reaction] Query 'all-messages' (1 items):
[log-reaction]   [DELETE] {"From":"You","Message":"My first UPDATED message!","MessageId":"5"}
```

If you view the `all-messages` query results again through the REST API, you'll see the message is no longer included in the result set.

With three SQL statements you've now seen all three change notifications the Log Reaction emits: an **ADD** when a row entered the result set, an **UPDATE** showing the row's *before* and *after* values, and a **DELETE** when the row left. Each appeared in the console the instant the database changed — and you didn't write a single line of code to detect, diff, or deliver them. That work is the Continuous Query and the Reaction doing their job.

Try it with your own data: insert a few more messages with any text you like, and watch each change appear in the Log Reaction output.

{{% alert title="Key Concept" color="info" %}}
All data source changes that alter the result set of a Continuous Query generate notifications that are delivered to subscribed Reactions for handling. The above example demonstrates the simple Log Reaction that displays these notifications to the console, but there are more sophisticated Reactions that can send notifications to other systems, trigger actions, update databases, and more. You can also write your own custom Reactions to implement any behavior you want in response to changes in your data.
{{% /alert %}}

<div style="margin-top: 1.5rem;"></div>

**✅ Checkpoint**: You've created your first Source, Continuous Query, and Reaction. You know how to view the current result set of a Continuous Query through the REST API. And you've also seen how changes in the database flow into Drasi Server and notification of changes to Continuous Query results are output by Reactions as soon as they happen.

---

## Step 4 of 6: Add a Continuous Query with Criteria {#phase-2}

The `all-messages` Continuous Query is very simple and includes all messages written to the Message table. Now you'll add a second Continuous Query that answers the question "Who sent messages containing 'Hello World'?". You will add the new `hello-world-senders` Continuous Query using the Drasi Server REST API so you learn how to extend your configuration without restarting Drasi Server.

### The hello-world-senders Continuous Query

Here's how the new query would look in a Drasi Server config file:

```yaml
- id: hello-world-senders
  autoStart: true
  sources:
    - sourceId: my-postgres
  query: |
    MATCH (m:Message) 
    WHERE m.Message = 'Hello World' 
    RETURN m.MessageId AS Id, m.From AS Sender
  queryLanguage: Cypher
```

In Drasi Server, multiple Continuous Queries can share the same Source. The `sources` section above configures the query to use the same `my-postgres` Source as the `all-messages` query, so it will also react to changes in the `Message` table.

The `queryLanguage` field specifies that this query is written in openCypher. Drasi Server supports Continuous Queries written in both [GQL](../../reference/query-language/gql.md) and [openCypher](../../reference/query-language/cypher.md), so you can choose the language that best fits your use case and preferences.

The `query` section contains the openCypher query that selects only messages where the `Message` field equals `'Hello World'`. The `MATCH` clause selects all `Message` nodes from the data source. The `WHERE` clause filters to only messages where the `Message` field equals `'Hello World'` — so changes to messages with different content won't appear in this query's result set. The `RETURN` clause renames the output fields to `Id` and `Sender`.

This is the kind of filter that turns a raw change feed into a focused signal — for example, selecting only the items that became non-compliant rather than every change in the table.

### Add the hello-world-senders Query using the REST API

In **Terminal 2**, use the following `curl` command to create the `hello-world-senders` Continuous Query:

{{< tabpane persist="header" >}}
{{< tab header="bash / zsh" lang="bash" >}}
curl -X POST http://localhost:8080/api/v1/queries \
  -H "Content-Type: application/json" \
  -d '{
    "id": "hello-world-senders",
    "autoStart": true,
    "sources": [{"sourceId": "my-postgres"}],
    "query": "MATCH (m:Message) WHERE m.Message = '\''Hello World'\'' RETURN m.MessageId AS Id, m.From AS Sender",
    "queryLanguage": "Cypher"
  }'
{{< /tab >}}
{{< tab header="PowerShell" lang="powershell" >}}
Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/v1/queries `
  -ContentType "application/json" `
  -Body '{
    "id": "hello-world-senders",
    "autoStart": true,
    "sources": [{"sourceId": "my-postgres"}],
    "query": "MATCH (m:Message) WHERE m.Message = ''Hello World'' RETURN m.MessageId AS Id, m.From AS Sender",
    "queryLanguage": "Cypher"
  }'
{{< /tab >}}
{{< /tabpane >}}

{{% alert title="Note" color="info" %}}
This command is also included in the `examples/getting-started/requests.http` file for use with the VS Code REST Client extension.
{{% /alert %}}

### Update the Log Reaction

Without a Reaction subscribed to the new `hello-world-senders` Continuous Query, Drasi Server will not send notifications or initiate any action when the query results change. For this tutorial, we want to see notifications of changes to the `hello-world-senders` query results in the Drasi Server console in the same way we see notifications for the `all-messages` query results.

In Drasi Server, a single Reaction can subscribe to multiple Continuous Queries (and a single Continuous Query can have multiple Reactions subscribed to it). However, Drasi Server does not currently support editing existing Sources, Continuous Queries, or Reactions through the REST API. **To modify a component, you must delete it and re-add it with the updated configuration**.

<div style="margin-top: 1.5rem;"></div>

To subscribe the Log Reaction to the new query, you need to delete and re-create it with using these calls to the Drasi Server REST API.

{{< tabpane persist="header" >}}
{{< tab header="bash / zsh" lang="bash" >}}
# Delete the existing log-reaction
curl -X DELETE http://localhost:8080/api/v1/reactions/log-reaction

# Re-create the log-reaction subscribed to both Continuous Queries
curl -X POST http://localhost:8080/api/v1/reactions \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "log",
    "id": "log-reaction",
    "queries": ["all-messages", "hello-world-senders"],
    "autoStart": true
  }'
{{< /tab >}}
{{< tab header="PowerShell" lang="powershell" >}}
# Delete the existing log reaction
Invoke-RestMethod -Method Delete -Uri http://localhost:8080/api/v1/reactions/log-reaction

# Re-create it subscribed to both queries
Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/v1/reactions `
  -ContentType "application/json" `
  -Body '{
    "kind": "log",
    "id": "log-reaction",
    "queries": ["all-messages", "hello-world-senders"],
    "autoStart": true
  }'
{{< /tab >}}
{{< /tabpane >}}

You should see in the Drasi Server console that the `log-reaction` is created and subscribed to both queries.

Also, if you open the Drasi Server config file (getting-started.yaml), you'll see that the new query has been added to the `queries` section, and the `log-reaction` configuration has been updated to include both queries. Drasi Server automatically updates the config file when you make changes through the REST API, so the config file is always an up-to-date representation of your running Drasi Server configuration.

### Test the hello-world-senders Continuous Query

Even though you haven't inserted any new data, if you view the `hello-world-senders` query results through the REST API using the following command:

{{< tabpane persist="header" >}}
{{< tab header="bash / zsh" lang="bash" >}}
curl -s http://localhost:8080/api/v1/queries/hello-world-senders/results
{{< /tab >}}
{{< tab header="PowerShell" lang="powershell" >}}
Invoke-RestMethod -Method Get -Uri http://localhost:8080/api/v1/queries/hello-world-senders/results
{{< /tab >}}
{{< /tabpane >}}

...you'll see that it already includes Brian Kernighan's "Hello World" message:

```json
{
  "success": true,
  "data": [
    {
      "Id": "2",
      "Sender": "Brian Kernighan"
    }
  ],
  "error": null
}
```

This is because Drasi Server's Continuous Query bootstrap process loaded all existing messages from the `Message` table and processed them through the `hello-world-senders` query, so any messages that met the query criteria were included in the query's initial result set and notifications were sent to subscribed Reactions.

Now, run the following command to **insert** a new message that contains **Hello World**, and so matches the `WHERE` criteria of the `hello-world-senders` query:

{{< tabpane persist="header" >}}
{{< tab header="bash / zsh" lang="bash" >}}
docker exec -it getting-started-postgres psql -U drasi_user -d getting_started -c \
  "INSERT INTO \"Message\" (\"From\", \"Message\") VALUES ('Alice', 'Hello World');"
{{< /tab >}}
{{< tab header="PowerShell" lang="powershell" >}}
docker exec -it getting-started-postgres psql -U drasi_user -d getting_started -c "INSERT INTO \""Message\"" (\""From\"", \""Message\"") VALUES ('Alice', 'Hello World');"
{{< /tab >}}
{{< /tabpane >}}

Watch the console and you will see notifications for both the `all-messages` and `hello-world-senders` queries — the new message is part of both query result sets:

```text
[log-reaction] Query 'hello-world-senders' (1 items):
[log-reaction]   [ADD] {"Id":"6","Sender":"Alice"}
[log-reaction] Query 'all-messages' (1 items):
[log-reaction]   [ADD] {"From":"Alice","Message":"Hello World","MessageId":"6"}
```

Now **insert** a message that doesn't match the `hello-world-senders` criteria:

{{< tabpane persist="header" >}}
{{< tab header="bash / zsh" lang="bash" >}}
docker exec -it getting-started-postgres psql -U drasi_user -d getting_started -c \
  "INSERT INTO \"Message\" (\"From\", \"Message\") VALUES ('Bob', 'Goodbye World');"
{{< /tab >}}
{{< tab header="PowerShell" lang="powershell" >}}
docker exec -it getting-started-postgres psql -U drasi_user -d getting_started -c "INSERT INTO \""Message\"" (\""From\"", \""Message\"") VALUES ('Bob', 'Goodbye World');"
{{< /tab >}}
{{< /tabpane >}}

The console shows the new message in the `all-messages` query, but there is no notification for the `hello-world-senders` query because the new message doesn't meet the query's `WHERE` criteria and so isn't part of that query's result set:

```text
[log-reaction] Query 'all-messages' (1 items):
[log-reaction]   [ADD] {"From":"Bob","Message":"Goodbye World","MessageId":"7"}
```

**✅ Checkpoint**: You understand how to add new Continuous Queries to a running Drasi Server instance via the REST API. You also understand how `WHERE` clauses in Continuous Queries control what data is part of the query's result set and therefore what changes generate notifications to subscribed Reactions.

Doing this without Drasi would typically mean adding a filter stage to a stream-processing job and redeploying it; here it's one `WHERE` clause added to a running server.

{{% alert title="Note" color="info" %}}
The Drasi Server config file after the changes made in this step is available in `./examples/getting-started/configs/getting-started-step-4.yaml` if you want to compare it with your config file or use it as a reference for future use.
{{% /alert %}}
---

## Step 5 of 6: Add an Aggregation Query and the SSE Reaction {#phase-3}

Drasi maintains state across all the data it processes, enabling Continuous Queries that compute aggregations — like counts, sums, or averages — that update automatically as the underlying data changes. This is useful for dashboards, reporting, and any scenario where you need live summary statistics without polling or recalculating from scratch.

In this step, you'll add a new `message-counts` Continuous Query that contains the count of how many times each unique message text has been sent. As you insert, update, or delete messages, you'll see the counts of each unique message update in real time.

Aggregations like this are what back live dashboards and metrics — kept current incrementally, without re-running a `GROUP BY` over the whole table on every change.

### The message-counts Query

Here's the new `message-counts` query as it would appear in a Drasi Server config file:

```yaml
- id: message-counts
  autoStart: true
  sources:
    - sourceId: my-postgres
  query: |
    MATCH (m:Message) 
    RETURN m.Message AS MessageText, count(m) AS Count
  queryLanguage: Cypher
```

The `sources` section again instructs Drasi Server to use the same `my-postgres` Source as used by the previous queries, so this query will also observe changes in the `Message` table.

In the `query` section, the `RETURN` clause includes the `count(m)` aggregation, which groups messages by their `Message` text and counts how many times each message has been sent. As messages are inserted or deleted, Drasi automatically recalculates the affected counts.

### Add the message-counts Continuous Query using the REST API

In **Terminal 2**, use the following curl command to create the `message-counts` Continuous Query:

{{< tabpane persist="header" >}}
{{< tab header="bash / zsh" lang="bash" >}}
curl -X POST http://localhost:8080/api/v1/queries \
  -H "Content-Type: application/json" \
  -d '{
    "id": "message-counts",
    "autoStart": true,
    "sources": [{"sourceId": "my-postgres"}],
    "query": "MATCH (m:Message) RETURN m.Message AS MessageText, count(m) AS Count",
    "queryLanguage": "Cypher"
  }'
{{< /tab >}}
{{< tab header="PowerShell" lang="powershell" >}}
Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/v1/queries `
  -ContentType "application/json" `
  -Body '{
    "id": "message-counts",
    "autoStart": true,
    "sources": [{"sourceId": "my-postgres"}],
    "query": "MATCH (m:Message) RETURN m.Message AS MessageText, count(m) AS Count",
    "queryLanguage": "Cypher"
  }'
{{< /tab >}}
{{< /tabpane >}}

### Installing the SSE Reaction

Until now, you've been observing Continuous Query changes through the Log Reaction in the Drasi Server console. Now you will start using a second Reaction--the SSE Reaction. The SSE Reaction subscribes to one or more Continuous Queries and when there are query result changes, it formats them and sends them as Server-Sent Events (SSE) to any client that is subscribed to the SSE Reaction. The SSE Reaction is ideal for streaming real-time updates to dashboards, web applications, or any system that can consume SSE.

To install the SSE Reaction plugin on your Drasi Server from the Drasi plugin repository, run the following command in your terminal:

{{< tabpane persist="header" >}}
{{< tab header="bash / zsh" lang="bash" >}}
curl -X POST http://localhost:8080/api/v1/plugins/install \
  -H "Content-Type: application/json" \
  -d '{
     "ref": "reaction/sse",
     "registry": "ghcr.io/drasi-project"
  }'
{{< /tab >}}
{{< tab header="PowerShell" lang="powershell" >}}
Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/v1/plugins/install `
  -ContentType "application/json" `
  -Body '{
    "ref": "reaction/sse"
  }'
{{< /tab >}}
{{< /tabpane >}}

In the Drasi Server console, you will see logs indicating that the SSE Reaction plugin is being downloaded and installed.

### Stream the message-counts Continuous Query using SSE

To receive notifications from the SSE Reaction you'll use the **SSE CLI** — a command-line tool included with the Drasi Server repo. When you run the SSE CLI, it calls Drasi Server's REST API and creates an SSE Reaction that it subscribes to a Continuous Query that you specify. While running, the SSE CLI prints all the query result changes it receives to the terminal in real time. When you stop the SSE CLI (by pressing `Ctrl+C`), it automatically deletes the SSE Reaction it created on Drasi Server.

The SSE CLI will enable you to see query result updates from the `message-counts` query as you change the underlying data without needing to view the Drasi Server console or call the REST API repeatedly.

In **Terminal 3**, start the SSE CLI to stream changes from the `message-counts` query. You must specify the Drasi Server URL and the Continuous Query ID you want the SSE Reaction to subscribe to:

{{< tabpane persist="header" >}}
{{< tab header="bash / zsh" lang="bash" >}}
./bin/drasi-sse-cli \
  --server http://localhost:8080 \
  --query message-counts
{{< /tab >}}
{{< tab header="PowerShell" lang="powershell" >}}
./bin/drasi-sse-cli `
  --server http://localhost:8080 `
  --query message-counts
{{< /tab >}}
{{< /tabpane >}}

You'll see:

```text
Creating SSE reaction 'sse-cli-...' for query 'message-counts'... done.
Streaming events (Ctrl-C to stop)...

Connected to SSE stream at http://localhost:8090/events
```

You will also see in the Drasi Server console that a new SSE Reaction has been created and subscribed to the `message-counts` query.

### Test Aggregation Updates

In **Terminal 2**, insert a new "Hello World" message:

{{< tabpane persist="header" >}}
{{< tab header="bash / zsh" lang="bash" >}}
docker exec -it getting-started-postgres psql -U drasi_user -d getting_started -c \
  "INSERT INTO \"Message\" (\"From\", \"Message\") VALUES ('Eve', 'Hello World');"
{{< /tab >}}
{{< tab header="PowerShell" lang="powershell" >}}
docker exec -it getting-started-postgres psql -U drasi_user -d getting_started -c "INSERT INTO \""Message\"" (\""From\"", \""Message\"") VALUES ('Eve', 'Hello World');"
{{< /tab >}}
{{< /tabpane >}}

Watch the SSE CLI terminal — you'll see the **Count** field has increased from the `before` value of `2` to the `after` value of `3` for the "MessageText" of "Hello World":

```json
{
  "queryId": "message-counts",
  "results": [
    { 
      "after": { 
        "Count": 3,
        "MessageText": "Hello World"
      },
      "before": { 
        "Count": 2,
        "MessageText": "Hello World"
      },
      "type": "aggregation"
    }
  ],
  "timestamp": 1771304966308
}
```

Now delete Eve's message:

{{< tabpane persist="header" >}}
{{< tab header="bash / zsh" lang="bash" >}}
docker exec -it getting-started-postgres psql -U drasi_user -d getting_started -c \
  "DELETE FROM \"Message\" WHERE \"From\" = 'Eve';"
{{< /tab >}}
{{< tab header="PowerShell" lang="powershell" >}}
docker exec -it getting-started-postgres psql -U drasi_user -d getting_started -c "DELETE FROM \""Message\"" WHERE \""From\"" = 'Eve';"
{{< /tab >}}
{{< /tabpane >}}

The `Count` decreases from 3 to 2:

```json
{
  "queryId": "message-counts",
  "results": [
    { 
      "after": { 
        "Count": 2,
        "MessageText": "Hello World"
      },
      "before": { 
        "Count": 3,
        "MessageText": "Hello World"
      },
      "type": "aggregation"
    }
  ],
  "timestamp": 1771305070361
}
```

{{% alert title="Key Concept" color="info" %}}
Drasi Server didn't re-scan the `Message` table in the database at any point — it incrementally updated the Continuous Query's aggregation from each individual change as it processed it. This is what lets a query stay current over a large dataset without the cost of repeatedly re-reading it.
{{% /alert %}}

Press `Ctrl+C` in the SSE CLI terminal to stop streaming and delete the SSE Reaction.

**✅ Checkpoint**: You understand that Drasi tracks state — aggregations update in real-time as data changes, without re-querying the database. You have seen it is possible to create temporary Reactions programmatically (like the SSE CLI) that subscribe to Continuous Queries on the fly to stream changes in real time. To do the equivalent yourself, you would write and maintain the kind of stateful, incremental-aggregation logic you'd normally implement in a stream processor; here it is a query plus a Reaction.

{{% alert title="Note" color="info" %}}
The Drasi Server config file after the changes made in this step is available in `./examples/getting-started/configs/getting-started-step-5.yaml` if you want to compare it with your config file or use it as a reference for future use.
{{% /alert %}}

---

## Step 6 of 6: Add Time-Based Detection {#phase-4}

Drasi can query patterns over time, including the **absence of change**. This is powerful for monitoring and alerting scenarios — for example queries that contain:

- all sensors that have stopped reporting data for more than 5 minutes
- all customer that have been idle for 10 minutes
- all deliveries that are overdue

In this step, you'll add an `inactive-senders` Continuous Query that contains people who haven't sent a message in the last 20 seconds. You'll see how Drasi can automatically re-evaluate the query over time to detect when senders become inactive even if no new messages are inserted, all without the need for polling or external schedulers.

This is the "something that *should* have happened but didn't" case — expressed as a query rather than a cron job or a background worker you maintain.

### The inactive-senders Continuous Query

Here's the new `inactive-senders` query as it would appear in a Drasi Server config file:

```yaml
- id: inactive-senders
  autoStart: true
  sources:
    - sourceId: my-postgres
  query: |
    MATCH (m:Message) 
    WITH m.From AS MessageFrom, max(drasi.changeDateTime(m)) AS LastMessageTimestamp 
    WHERE LastMessageTimestamp <= datetime.realtime() - duration({ seconds: 20 }) 
      OR drasi.trueLater(LastMessageTimestamp <= datetime.realtime() - duration({ seconds: 20 }), 
                         LastMessageTimestamp + duration({ seconds: 20 })) 
    RETURN MessageFrom, LastMessageTimestamp
  queryLanguage: Cypher
```

This query introduces two [Drasi custom functions](../../reference/query-language/drasi-custom-functions):

- **`drasi.changeDateTime(m)`** — returns the timestamp when the node was last changed, rather than relying on a user-managed timestamp column in the source data.
- **`drasi.trueLater(condition, futureTime)`** — schedules Drasi Server to re-evaluate the condition at `futureTime`. Without this, the time-based `WHERE` clause would only be checked when data changes. With `drasi.trueLater`, Drasi automatically re-evaluates after the 20-second window expires, causing idle senders to appear in the result set even when no new data arrives.

The `WHERE` clause combines two conditions with `OR`: senders who are *already* inactive, and a scheduled future check for senders who *will become* inactive if no new message arrives within 20 seconds.

### Add the inactive-senders Continuous Query using the REST API

In **Terminal 2**, use the following curl command to create the `inactive-senders` Continuous Query:

{{< tabpane persist="header" >}}
{{< tab header="bash / zsh" lang="bash" >}}
curl -X POST http://localhost:8080/api/v1/queries \
  -H "Content-Type: application/json" \
  -d '{
    "id": "inactive-senders",
    "autoStart": true,
    "sources": [{"sourceId": "my-postgres"}],
    "query": "MATCH (m:Message) WITH m.From AS MessageFrom, max(drasi.changeDateTime(m)) AS LastMessageTimestamp WHERE LastMessageTimestamp <= datetime.realtime() - duration({ seconds: 20 }) OR drasi.trueLater(LastMessageTimestamp <= datetime.realtime() - duration({ seconds: 20 }), LastMessageTimestamp + duration({ seconds: 20 })) RETURN MessageFrom, LastMessageTimestamp",
    "queryLanguage": "Cypher"
  }'
{{< /tab >}}
{{< tab header="PowerShell" lang="powershell" >}}
Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/v1/queries `
  -ContentType "application/json" `
  -Body '{
    "id": "inactive-senders",
    "autoStart": true,
    "sources": [{"sourceId": "my-postgres"}],
    "query": "MATCH (m:Message) WITH m.From AS MessageFrom, max(drasi.changeDateTime(m)) AS LastMessageTimestamp WHERE LastMessageTimestamp <= datetime.realtime() - duration({ seconds: 20 }) OR drasi.trueLater(LastMessageTimestamp <= datetime.realtime() - duration({ seconds: 20 }), LastMessageTimestamp + duration({ seconds: 20 })) RETURN MessageFrom, LastMessageTimestamp",
    "queryLanguage": "Cypher"
  }'
{{< /tab >}}
{{< /tabpane >}}

### Stream the inactive-senders Query

In **Terminal 3**, start the SSE CLI:

{{< tabpane persist="header" >}}
{{< tab header="bash / zsh" lang="bash" >}}
./bin/drasi-sse-cli \
  --server http://localhost:8080 \
  --query inactive-senders
{{< /tab >}}
{{< tab header="PowerShell" lang="powershell" >}}
./bin/drasi-sse-cli `
  --server http://localhost:8080 `
  --query inactive-senders
{{< /tab >}}
{{< /tabpane >}}

### Test the inactive-senders Continuous Query

In **Terminal 2**, create a new message from Alice:

{{< tabpane persist="header" >}}
{{< tab header="bash / zsh" lang="bash" >}}
docker exec -it getting-started-postgres psql -U drasi_user -d getting_started -c \
  "INSERT INTO \"Message\" (\"From\", \"Message\") VALUES ('Alice', 'About to go inactive');"
{{< /tab >}}
{{< tab header="PowerShell" lang="powershell" >}}
docker exec -it getting-started-postgres psql -U drasi_user -d getting_started -c "INSERT INTO \""Message\"" (\""From\"", \""Message\"") VALUES ('Alice', 'About to go inactive');"
{{< /tab >}}
{{< /tabpane >}}

Wait for 20 seconds... Alice will be automatically added to the `inactive-senders` query result because she hasn't sent a new message in the last 20 seconds. The subscribed SSE Reaction (created by the SSE CLI) will forward the change to the SSE CLI and you will see this query result `ADD` notification in your terminal:

```json
{
  "queryId": "inactive-senders",
  "results": [
    {
      "data": {
        "LastMessageTimestamp": "ZonedDateTime(2026-02-17 05:35:51.703 +00:00)",
        "MessageFrom": "Alice"
      },
      "type": "ADD"
    }
  ],
  "timestamp": 1771306571705
}
```

Now make Alice active again, by adding a new message from her:

{{< tabpane persist="header" >}}
{{< tab header="bash / zsh" lang="bash" >}}
docker exec -it getting-started-postgres psql -U drasi_user -d getting_started -c \
  "INSERT INTO \"Message\" (\"From\", \"Message\") VALUES ('Alice', 'Active again');"
{{< /tab >}}
{{< tab header="PowerShell" lang="powershell" >}}
docker exec -it getting-started-postgres psql -U drasi_user -d getting_started -c "INSERT INTO \""Message\"" (\""From\"", \""Message\"") VALUES ('Alice', 'Active again');"
{{< /tab >}}
{{< /tabpane >}}

Alice will be immediately removed from the `inactive-senders` query result because she has sent a message within the last 20 seconds. The subscribed SSE Reaction will forward the change to the SSE CLI and you will see this query result `DELETE` notification in your terminal:

```json
{
  "queryId": "inactive-senders",
  "results": [
    {
      "data": {
        "LastMessageTimestamp": "ZonedDateTime(2026-02-17 05:35:51.703 +00:00)",
        "MessageFrom": "Alice"
      },
      "type": "DELETE"
    }
  ],
  "timestamp": 1771307261645
}
```

If you wait a further 20 seconds without sending a message from Alice, she will once again be added to the `inactive-senders` query result and you'll see another `ADD` notification in the SSE CLI terminal.

No database change triggered this second notification — Drasi re-evaluated the time condition on its own. You expressed the intent in the query; there's no polling loop or scheduler in your code.

Press `Ctrl+C` to stop the SSE CLI.

**✅ Checkpoint**: You understand that Drasi can detect the *absence of change* over time — a powerful capability for monitoring, alerting, and SLA enforcement — without a scheduler or background worker you run.

{{% alert title="Note" color="info" %}}
The Drasi Server config file after the changes made in this step is available in `./examples/getting-started/configs/getting-started-step-6.yaml` if you want to compare it with your config file or use it as a reference for future use.
{{% /alert %}}

---

## What You've Learned {#summary}

That concludes the Drasi Server Getting Started tutorial. You have learned the core Drasi Server concepts that enable you to build change-driven solutions that react to data changes in real time:

| Concept | What You Did |
| ------- | ------------ |
| **Configuration** | Started from a pre-prepared config file, then dynamically added components via the REST API |
| **Sources** | Created a PostgreSQL source to connect Drasi to your database |
| **Queries** | Wrote 4 Continuous Queries: simple change detection, criteria-based selection, aggregation, and time-based detection |
| **Reactions** | Configured a Log Reaction for console output and used the SSE CLI to stream query result changes to your terminal |
| **REST API** | Used the REST API to create, delete, and query Sources, Continuous Queries, and Reactions while the server is running |

**Lines of application code written: 0.** You built all of this with declarative queries and configuration.

A conventional change-driven stack would assemble these capabilities from separate tools — change-data-capture, streaming, state management, and scheduling — each integrated and operated by you. Here the same behavior came from queries and configuration against a single server.

---

## Cleanup {#cleanup}

Stop the SSE CLI if it's still running by pressing `Ctrl+C` in the terminal where it's running.

Stop Drasi Server with `Ctrl+C` in the Drasi Server console.

Stop the tutorial database:

```bash
docker compose -f examples/getting-started/database/docker-compose.yml down -v
```

The `-v` flag removes the persistent volume. Without it, the database data persists after the container is removed and can cause confusion if you restart the tutorial later.

---

## Next Steps

Now that you understand the core Drasi concepts, here's where to go next.

**Start here:** **Build a change-driven POC** — try connecting Drasi Server to one of your own databases and build a proof-of-concept to test it on a real problem.

**Go further with the components you used**

You used a config file, a Log Reaction, and the SSE Reaction in their simplest form. Each offers more:

- **Generate config files with the wizard** — instead of editing YAML by hand, use the interactive `drasi-server init` wizard. See [Create Configuration with the Wizard](../how-to-guides/configuration/create-config-with-wizard/).
- **Customize Log Reaction output** — format the console output with templates. See [Configure Log Reaction](../how-to-guides/configuration/configure-reactions/configure-log-reaction/).
- **Shape SSE Reaction payloads** — use templates to control the events the SSE Reaction streams. See [Configure SSE Reaction](../how-to-guides/configuration/configure-reactions/configure-sse-reaction/).
- **Control config persistence** — by default Drasi Server writes REST API changes back to your config file. Set `persistConfig` to `false` in the **Server Settings** section to keep the file fixed and revert to it on restart.

**Go deeper**

- **Read the Concepts** — Read the <a href="/concepts/overview/" target="_blank" rel="noopener noreferrer">Drasi Concepts</a> to understand how Drasi works under the hood.
- **Explore drasi-lib** — Use the <a href="/drasi-lib/" target="_blank" rel="noopener noreferrer">drasi-lib Rust crate</a> to embed Drasi capabilities directly in your Rust applications.

**Build something**

- **Configure Sources** — Learn how to <a href="../how-to-guides/configuration/configure-sources/" target="_blank" rel="noopener noreferrer">detect changes in PostgreSQL, HTTP, gRPC, and more</a>.
- **Configure Queries** — Learn how to <a href="../how-to-guides/configuration/configure-queries/" target="_blank" rel="noopener noreferrer">write advanced Continuous Queries in GQL and openCypher</a>.
- **Configure Reactions** — Learn how to <a href="../how-to-guides/configuration/configure-reactions/" target="_blank" rel="noopener noreferrer">react to changes using SSE, gRPC, Stored Procedures, and more</a>.
- **Try Drasi for Kubernetes** — Deploy Drasi as a managed service on Kubernetes with <a href="/drasi-kubernetes/" target="_blank" rel="noopener noreferrer">Drasi for Kubernetes</a>.
- **Walk through a tutorial** — Follow one of the <a href="/drasi-kubernetes/tutorials/" target="_blank" rel="noopener noreferrer">end-to-end tutorials</a> to see Drasi in action on realistic scenarios.

**Get involved**

- **Contribute to Drasi** — Explore the <a href="https://github.com/drasi-project" target="_blank" rel="noopener noreferrer">Drasi project on GitHub</a> and read the <a href="https://github.com/drasi-project/drasi-server/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer">Contributing Guide</a> to start contributing.
- **Join the conversation** — Connect with the Drasi community on <a href="https://aka.ms/drasidiscord" target="_blank" rel="noopener noreferrer">Discord</a>.
- **Follow Drasi** — Stay up to date on <a href="https://x.com/drasi_project" target="_blank" rel="noopener noreferrer">X</a>, <a href="https://www.youtube.com/@DrasiProject" target="_blank" rel="noopener noreferrer">YouTube</a>, and <a href="https://bsky.app/profile/drasi-project.bsky.social" target="_blank" rel="noopener noreferrer">Bluesky</a>.
