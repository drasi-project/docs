---
type: "docs"
title: "Getting Started"
linkTitle: "Getting Started"
weight: 5
no_list: true
hide_readingtime: true
description: "Build your first change-driven solution with Drasi Server"
---

This Getting Started tutorial teaches you how to use Drasi Server by getting it installed and running, then progressively building an increasingly sophisticated change-driven solution. You'll start with a simple configuration and extend it step by step — each step introduces a new Drasi capability.

| Step | What You'll Learn | Time |
| ---- | ----------------- | ---- |
| **[Step 1: Set Up Your Environment](#setup)** | Install Drasi Server and set up your development environment | 5 min |
| **[Step 2: Set Up the Tutorial Database](#database)** | Start a PostgreSQL database and load sample data | 3 min |
| **[Step 3: Create Your First Configuration](#phase-1)** | Use `drasi-server init` to create a Source, Continuous Query, and Log Reaction — see changes flow through Drasi in real time | 10 min |
| **[Step 4: Add a Query with Criteria](#phase-2)** | Add a filtered query via the REST API — learn how `WHERE` clauses control which changes generate notifications | 3 min |
| **[Step 5: Add an Aggregation Query](#phase-3)** | Add a query with `count()` — see aggregations update automatically as data changes. Introduces the SSE CLI for streaming results | 5 min |
| **[Step 6: Add Time-Based Detection](#phase-4)** | Detect the *absence* of activity over time — a powerful capability for monitoring and alerting | 5 min |

**Steps 1–3** give you a working Drasi Server solution in under 20 minutes.  
**Steps 4–6** explore progressively advanced capabilities of Drasi Server.

## Step 1: Set Up Your Environment {#setup}

Choose your preferred environment for working through the Getting Started tutorial. Each approach gets you to the same starting point with Drasi Server installed and ready to run the tutorial.

<div class="card-grid">
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
  <a href="download-binary/">
    <div class="unified-card unified-card--tutorials">
      <div class="unified-card-icon"><i class="fas fa-download"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Download Binary</h3>
        <p class="unified-card-summary">Download a prebuilt binary for macOS or Linux. The fastest way to get started.</p>
      </div>
    </div>
  </a>
  <a href="build-from-source/">
    <div class="unified-card unified-card--tutorials">
      <div class="unified-card-icon"><i class="fas fa-hammer"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Build from Source</h3>
        <p class="unified-card-summary">Clone and build Drasi Server yourself. Ideal for contributors.</p>
      </div>
    </div>
  </a>
</div>

<div style="margin-top: 2rem;"></div>

After completing your preferred setup, return here to continue with the tutorial.

---

## Step 2: Setup the Tutorial Database {#database}

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

```bash
docker exec getting-started-postgres psql -U drasi_user -d getting_started -c 'SELECT * FROM "Message";'
```

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

## Step 3: Create Your First Configuration {#phase-1}

Now you'll create your initial Drasi Server configuration using the interactive `drasi-server init` command.

The `init` command walks you through an interactive wizard that will assist you in creating a correctly formatted Drasi Server config file. The wizard will only write the config file at the end, so if you make a mistake just break out of the wizard using `ctrl-c` and run `drasi-server init` again.

> **Note:** The `init` command cannot be used to edit existing config files, you must edit them in your preferred text editor.

### Create the Drasi Server Configuration

From the tutorial root folder, run the following command:

```bash
./bin/drasi-server init --output getting-started.yaml
```

Here's what to enter at each prompt:

#### 1. Server Settings

Configuration starts with general Drasi Server settings.

| Prompt | Enter | Notes |
| ------ | ----- | ----- |
| **Server host** | `0.0.0.0` (default) | Press Enter to accept |
| **Server port** | `${SERVER_PORT:-8080}` | Uses env var with 8080 as default (see note below) |
| **Log level** | `info` | Use arrow keys to select |
| **Enable persistent indexing (RocksDB)?** | `No` (default) | Press Enter to accept |
| **State store** | `None` | Use arrow keys to select "None - In-memory state" |

<div style="margin-top: 1.5rem;"></div>

Your terminal should show this once you have completed the Server Settings section of the wizard:

```text
Server Settings
---------------
> Server host: 0.0.0.0
> Server port: ${SERVER_PORT:-8080}
> Log level: info
> Enable persistent indexing (RocksDB)? No
> State store (for plugin state persistence): None - In-memory state (lost on restart)
```

> **Environment variables in config values:** The `${SERVER_PORT:-8080}` syntax tells Drasi Server to use the value of the `SERVER_PORT` environment variable, falling back to `8080` if it isn't set. You can use this `${VAR:-default}` pattern in any configuration value.

#### 2. Data Sources

After configuring server settings, you'll add a data source. For this tutorial, use the arrow keys to highlight **PostgreSQL**, press Space to select the source, then Enter.

After selecting PostgreSQL, you'll configure the database connection settings:

| Prompt | Enter | Notes |
| ------ | ----- | ----- |
| **Source ID** | `my-postgres` | A unique name for this source |
| **Database host** | `${DB_HOST:-localhost}` | Defaults to `localhost` if `DB_HOST` is not set |
| **Database port** | `${POSTGRES_HOST_PORT:-5432}` | Defaults to `5432` if `POSTGRES_HOST_PORT` is not set |
| **Database name** | `getting_started` | The tutorial database |
| **Database user** | `drasi_user` | |
| **Database password** | `drasi_password` | Type the password (characters won't display) and press Enter |
| **Tables to monitor** | `Message` | The table we'll query |
| **Configure table keys for tables without primary keys??** | `Yes` | Required for CDC change tracking |
| **Does table 'Message' need key columns specified?** | `Yes` | Need to configure tableKey for `Message` table |
| **Key columns for 'Message'** | `MessageId` | The Message table's primary key |
| **Bootstrap provider** | `PostgreSQL` | Use arrow keys to select "PostgreSQL - Load initial data" |

<div style="margin-top: 1.5rem;"></div>

Your terminal should show this once you complete the Data Source section of the wizard:

```text
Data Sources
------------
Select one or more data sources for your configuration.

> Select sources (space to select, enter to confirm): PostgreSQL - CDC from PostgreSQL database

Configuring PostgreSQL Source
------------------------------
> Source ID: my-postgres
> Database host: ${DB_HOST:-localhost}
> Database port: ${POSTGRES_HOST_PORT:-5432}
> Database name: getting_started
> Database user: drasi_user
> Database password: ********
> Tables to monitor (comma-separated): Message
> Configure table keys for tables without primary keys? Yes
> Does table 'Message' need key columns specified? Yes
> Key columns for 'Message' (comma-separated): MessageId
> Bootstrap provider (for initial data loading): PostgreSQL - Load initial data from PostgreSQL
```

#### 3. Reactions

Finally, you will add a Reaction to process changes to the Continuous Query results.

Use the arrow keys to highlight **Log**, press Space to select the Reaction, then Enter.

After selecting Log, you'll configure the following settings:

| Prompt | Enter | Notes |
| ------ | ----- | ----- |
| **Reaction ID** | `log-reaction` (default) | Press Enter to accept |

After completing the Reactions section of the wizard, your terminal will show the following:

```text
Reactions
---------
Select how you want to receive query results.

> Select reactions (space to select, enter to confirm): Log - Write query results to console

Configuring Log Reaction
------------------------
> Reaction ID: log-reaction


Configuration saved to: getting-started.yaml

Next steps:
  1. Review and edit getting-started.yaml as needed
  2. Run: drasi-server --config getting-started.yaml
```

### Update the Default Continuous Query

The wizard created a default Continuous Query that selects all nodes from the `my-postgres` Source. Now you'll edit the Continuous Query to select only `Message` nodes and to rename some of their fields for clarity.

Open `getting-started.yaml` in your preferred editor and find the `queries` section. The wizard's default Continuous Query looks like this:

```yaml
queries:
- id: my-query
  autoStart: true
  query: MATCH (n) RETURN n
  queryLanguage: GQL
  middleware: []
  sources:
  - sourceId: my-postgres
    nodes: []
    relations: []
    pipeline: []
  enableBootstrap: true
  bootstrapBufferSize: 10000
```

Replace the `id` and `query` settings as shown here:

```yaml
queries:
  - id: all-messages
    autoStart: true
    query: |
      MATCH (m:Message)
      RETURN m.MessageId AS MessageId, m.From AS From, m.Message AS Message
    queryLanguage: GQL
    ...
```

The `|` character allows you to write the query across multiple lines for readability. The `Message` label in the `Match` clause must match the table name exactly (labels are case-sensitive). Leave the other fields (`queryLanguage`, `sources`, etc.) as they are.

### Update the Log Reaction

Because you changed the Continuous Query's `id` from `my-query` to `all-messages`, you need to update the Log Reaction's configuration to subscribe to the new Continuous Query ID.

Find the `reactions` section in your config file and update the `queries` field to reference the new query ID as shown here:

```yaml
reactions:
  - kind: log
    id: log-reaction
    queries:
      - all-messages    # Update this from my-query to all-messages
    autoStart: true
```

### Run Drasi Server

Run Drasi Server with your new configuration using the following command:

```bash
./bin/drasi-server --config getting-started.yaml
```

You'll see detailed startup logs as Drasi Server initializes all configured Sources, Continuous Queries, and Reactions. There's a lot of output, so look for these key lines:

```text
Starting Drasi Server
  Config file: getting-started.yaml
  API Port: 8080
  Log level: info
```

This shows the name of the config file being used, the log level that controls the output to the console, and the port on which the Drasi Server management API is accessible.

```text
[log-reaction] Started - receiving results from queries: ["all-messages"]
```

This confirms that the `log-reaction` Reaction is subscribed to Query Result Change notifications from the `all-messages` Continuous Query.

```text
Drasi Server started successfully with API on port 8080
```

Shortly after, the bootstrap process loads the initial data from the `Messages` table and passes it to the `all-messages` query for processing. Look for output like this in the console:

```text
[BOOTSTRAP] Query 'all-messages' completed bootstrap from source 'my-postgres' (4 events)
[BOOTSTRAP] Query 'all-messages' all sources completed bootstrap
[BOOTSTRAP] Emitted bootstrapCompleted signal for query 'all-messages'
```

### View Continuous Query Results

At any time you can view the current result set of a Continuous Query using Drasi Server's [REST API](../reference/rest-api/). For example, choose your preferred method to view the `all-messages` query results:

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

> **Tip:** The Drasi Server REST API also provides a Swagger UI at <a href="http://localhost:8080/api/v1/docs/" target="_blank" rel="noopener noreferrer">http://localhost:8080/api/v1/docs/</a> where you can explore all available endpoints interactively.

### Test the all-messages Continuous Query

Open a **new terminal** and run the following command to manually **insert** a record into the `Message` table:

{{< tabpane persist="header" >}}
{{< tab header="bash / zsh" lang="bash" >}}
docker exec -it getting-started-postgres psql -U drasi_user -d getting_started -c \
  "INSERT INTO \"Message\" (\"From\", \"Message\") VALUES ('You', 'My first message!');"
{{< /tab >}}
{{< tab header="PowerShell" lang="powershell" >}}
docker exec -it getting-started-postgres psql -U drasi_user -d getting_started -c "INSERT INTO `"Message`" (`"From`", `"Message`") VALUES ('You', 'My first message!');"
{{< /tab >}}
{{< /tabpane >}}

Watch the Drasi Server console — a notification of an addition to the `all-messages` query result appears instantly output by the Log Reaction:

```text
[log-reaction] Query 'all-messages' (1 items):
[log-reaction]   [ADD] {"From":"You","Message":"My first message!","MessageId":"5"}
```

> **Tip:** You can customize the Log Reaction output format using templates. See [Configure Log Reaction](../how-to-guides/configuration/configure-reactions/configure-log-reaction/) for details.

If you view the `all-messages` query results again through the REST API, you'll see the new message included in the result set.

Now, run the following command to **update** the message we just inserted and change its text:

{{< tabpane persist="header" >}}
{{< tab header="bash / zsh" lang="bash" >}}
docker exec -it getting-started-postgres psql -U drasi_user -d getting_started -c \
  "UPDATE \"Message\" SET \"Message\" = 'My first UPDATED message!' WHERE \"MessageId\" = 5;"
{{< /tab >}}
{{< tab header="PowerShell" lang="powershell" >}}
docker exec -it getting-started-postgres psql -U drasi_user -d getting_started -c "UPDATE `"Message`" SET `"Message`" = 'My first UPDATED message!' WHERE `"MessageId`" = 5;"
{{< /tab >}}
{{< /tabpane >}}

The notification output by the Log Reaction shows the the item from the query result before and after the update:

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
docker exec -it getting-started-postgres psql -U drasi_user -d getting_started -c "DELETE FROM `"Message`" WHERE `"MessageId`" = 5;"
{{< /tab >}}
{{< /tabpane >}}

The console shows the message being deleted from the query's result set:

```text
[log-reaction] Query 'all-messages' (1 items):
[log-reaction]   [DELETE] {"From":"You","Message":"My first UPDATED message!","MessageId":"5"}
```

If you view the `all-messages` query results again through the REST API, you'll see the message is no longer included in the result set.

{{< alert title="Key Concept" color="info" >}}
All data source changes that alter the result set of a Continuous Query generate notifications that are delivered to subscribed Reactions for handling. The above example demonstrates the simple Log Reaction that displays these notifications to the console, but there are more sophisticated Reactions that can send notifications to other systems, trigger actions, update databases, and more. You can also write your own custom Reactions to implement any behavior you want in response to changes in your data.
{{< /alert >}}

<div style="margin-top: 1.5rem;"></div>

**✅ Checkpoint**: You've created your first Source, Continuous Query, and Reaction. You know how to view the current result set of a Continuous Query through the REST API. And you've also seen how changes in the database flow into Drasi Server and notification of changes to Continuous Query results are output by Reactions as soon as they happen.

> **Note**: The Drasi Server config file after the changes made in this step is available in `./examples/getting-started/configs/getting-started-step-3.yaml` if you want to compare it with your config file or use it as a reference for future use.

---

## Step 4: Add a Query with Criteria {#phase-2}

The `all-messages` Continuous Query is very simple and includes all messages written to the Message table. Now you'll add a second Continuous Query that answers the question "Who sent messages containing 'Hello World'?". You will add the new `hello-world-senders` Continuous Query using the Drasi Server REST API so you learn how to extend your configuration without restarting Drasi Server.

### The hello-world-senders Query

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

The `MATCH` clause selects all `Message` nodes from the data source. The `WHERE` clause filters to only messages where the `Message` field equals `'Hello World'` — so changes to messages with different content won't appear in this query's result set. The `RETURN` clause renames the output fields to `Id` and `Sender`.

Notice this query uses `queryLanguage: Cypher` instead of `GQL` — Drasi Server supports Continuous Queries written in both [GQL](../../reference/query-language/gql.md) and [openCypher](../../reference/query-language/cypher.md).

### Add the Query via the REST API

In your second terminal, use the following `curl` command to create the `hello-world-senders` Continuous Query:

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

> **Note:** This command is also included in the `examples/getting-started/requests.http` file for use with the VS Code REST Client extension.

The new `hello-world-senders` Continuous Query references the same `my-postgres` Source used by the original `all-messages` Continuous Query — multiple Continuous Queries can share the same Source.

### Update the Log Reaction

Without a Reaction subscribed to the `hello-world-senders` Continuous Query, Drasi Server will not send notifications when the query results change.

> **Note:** Drasi Server does not currently support editing existing Sources, Continuous Queries, or Reactions through the REST API. To modify a component, you must delete it and re-add it with the updated configuration.

<div style="margin-top: 1.5rem;"></div>

To subscribe the Log Reaction to the new query, you need to delete and re-create it with both queries listed.

{{< tabpane persist="header" >}}
{{< tab header="bash / zsh" lang="bash" >}}
# Delete the existing log reaction
curl -X DELETE http://localhost:8080/api/v1/reactions/log-reaction

# Re-create it subscribed to both queries
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

You should see in the Drasi Server console that the `log-reaction` is now subscribed to both queries.

Also, if you open the Drasi Server config file (getting-started.yaml), you'll see that the new query has been added to the `queries` section, and the `log-reaction` configuration has been updated to include both queries. Drasi Server automatically updates the config file when you make changes through the REST API, so the config file is always an up-to-date representation of your running Drasi Server configuration. 

> **Tip**: You can stop Drasi Server from automatically updating the config file by setting `persistConfig` to `false` in the **Server Settings** section of the config file.

### Test the hello-world-senders Continuous Query

Even though you haven't inserted any new data, if you view the `hello-world-senders` query results through the REST API, you'll see that it already includes Brian Kernighan's "Hello World" message from the initial data load:

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

This is because Drasi Server's bootstrap process loaded all existing messages from the `Message` table and processed them through the `hello-world-senders` query, so any messages that met the query criteria were included in the query's result set and notifications were sent to subscribed Reactions.

Now, run the following command to **insert** a new message that contains **Hello World**, and so matches the `WHERE` criteria of the `hello-world-senders` query:

{{< tabpane persist="header" >}}
{{< tab header="bash / zsh" lang="bash" >}}
docker exec -it getting-started-postgres psql -U drasi_user -d getting_started -c \
  "INSERT INTO \"Message\" (\"From\", \"Message\") VALUES ('Alice', 'Hello World');"
{{< /tab >}}
{{< tab header="PowerShell" lang="powershell" >}}
docker exec -it getting-started-postgres psql -U drasi_user -d getting_started -c "INSERT INTO `"Message`" (`"From`", `"Message`") VALUES ('Alice', 'Hello World');"
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
docker exec -it getting-started-postgres psql -U drasi_user -d getting_started -c "INSERT INTO `"Message`" (`"From`", `"Message`") VALUES ('Bob', 'Goodbye World');"
{{< /tab >}}
{{< /tabpane >}}

The console shows the new message in the `all-messages` query, but there is no notification for the `hello-world-senders` query because the new message doesn't meet the query's `WHERE` criteria and so isn't part of that query's result set:

```text
[log-reaction] Query 'all-messages' (1 items):
[log-reaction]   [ADD] {"From":"Bob","Message":"Goodbye World","MessageId":"7"}
```

**✅ Checkpoint**: You understand how to add new Continuous Queries to a running Drasi Server instance via the REST API. You also understand how `WHERE` clauses in Continuous Queries control what data is part of the query's result set and therefore what changes generate notifications to subscribed Reactions.

> **Note**: The Drasi Server config file after the changes made in this step is available in `./examples/getting-started/configs/getting-started-step-4.yaml` if you want to compare it with your config file or use it as a reference for future use.
---

## Step 5: Add an Aggregation Query and the SSE Reaction {#phase-3}

Drasi maintains state across all the data it processes, enabling Continuous Queries that compute aggregations — like counts, sums, or averages — that update automatically as the underlying data changes. This is useful for dashboards, reporting, and any scenario where you need live summary statistics without polling or recalculating from scratch.

In this step, you'll add a new `message-counts` Continuous Query that contains the count of how many times each unique message text has been sent. As you insert, update, or delete messages, you'll see the counts of each unique message update in real time.

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

The `count(m)` aggregation groups messages by their `Message` text and counts how many times each message has been sent. As messages are inserted or deleted, Drasi automatically recalculates the affected counts.

### Add the Query via the REST API

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

### Using the SSE Reaction

Until now, you've been observing Continuous Query changes through the Log Reaction in the Drasi Server console. For the remaining steps, you'll use the **SSE CLI** — a command-line tool included with the Drasi Server repo. When you run the SSE CLI, it calls Drasi Server's REST API and creates an SSE (Server-Sent Events) Reaction that it subscribes to a Continuous Query of your choice. While running, the SSE CLI prints all the query result changes it receives to the terminal in real time. When you stop the SSE CLI (by pressing `Ctrl+C`), it automatically deletes the SSE Reaction it created on Drasi Server.

The SSE CLI will enable you to see query result updates from the `message-counts` query as you change the underlying data without needing to view the Drasi Server console or call the REST API repeatedly.

Build the SSE CLI:

```bash
cd examples/sse-cli && cargo build --release && cd ../..
```

### Stream the message-counts Query

In a **new terminal**, start the SSE CLI to stream changes from the `message-counts` query:

{{< tabpane persist="header" >}}
{{< tab header="bash / zsh" lang="bash" >}}
./examples/sse-cli/target/release/drasi-sse-cli \
  --server http://localhost:8080 \
  --query message-counts
{{< /tab >}}
{{< tab header="PowerShell" lang="powershell" >}}
./examples/sse-cli/target/release/drasi-sse-cli `
  --server http://localhost:8080 `
  --query message-counts
{{< /tab >}}
{{< /tabpane >}}

You'll see:

```text
Creating SSE reaction 'sse-cli-...' for query 'message-counts'... done.
Streaming events (Ctrl-C to stop)...
```

### Test Aggregation Updates

In your other terminal, insert a new "Hello World" message:

{{< tabpane persist="header" >}}
{{< tab header="bash / zsh" lang="bash" >}}
docker exec -it getting-started-postgres psql -U drasi_user -d getting_started -c \
  "INSERT INTO \"Message\" (\"From\", \"Message\") VALUES ('Eve', 'Hello World');"
{{< /tab >}}
{{< tab header="PowerShell" lang="powershell" >}}
docker exec -it getting-started-postgres psql -U drasi_user -d getting_started -c "INSERT INTO `"Message`" (`"From`", `"Message`") VALUES ('Eve', 'Hello World');"
{{< /tab >}}
{{< /tabpane >}}

Watch the SSE CLI terminal — you'll see the **Count** update:

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

The Count for "Hello World" messages increased from 2 to 3.

Now delete Eve's message:

{{< tabpane persist="header" >}}
{{< tab header="bash / zsh" lang="bash" >}}
docker exec -it getting-started-postgres psql -U drasi_user -d getting_started -c \
  "DELETE FROM \"Message\" WHERE \"From\" = 'Eve';"
{{< /tab >}}
{{< tab header="PowerShell" lang="powershell" >}}
docker exec -it getting-started-postgres psql -U drasi_user -d getting_started -c "DELETE FROM `"Message`" WHERE `"From`" = 'Eve';"
{{< /tab >}}
{{< /tabpane >}}

The Count decreases from 3 to 2:

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

Drasi didn't re-scan the `Message` table in the database — it incrementally updated the Continuous Query's aggregation based on each individual change as it processed them.

Press `Ctrl+C` in the SSE CLI terminal to stop streaming and delete the SSE Reaction.

**✅ Checkpoint**: You understand that Drasi tracks state — aggregations update in real-time as data changes, without re-querying the database. You have seen it is possible to create temporary Reactions programmatically (like the SSE CLI) that subscribe to Continuous Queries on the fly to stream changes in real time.

> **Note**: The Drasi Server config file after the changes made in this step is available in `./examples/getting-started/configs/getting-started-step-5.yaml` if you want to compare it with your config file or use it as a reference for future use.

---

## Step 6: Add Time-Based Detection {#phase-4}

Drasi can query patterns over time, including the **absence** of activity. This is powerful for monitoring and alerting scenarios — for example queries that contain:

- all sensors that have stopped reporting data for more than 5 minutes
- all customer that have been idle for 10 minutes
- all deliveries that are overdue

In this step, you'll add an `inactive-senders` Continuous Query that contains people who haven't sent a message in the last 20 seconds. You'll see how Drasi can automatically re-evaluate the query over time to detect when senders become inactive even if no new messages are inserted.

### The inactive-senders Query

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
- **`drasi.trueLater(condition, futureTime)`** — schedules Drasi to re-evaluate the condition at `futureTime`. Without this, the time-based `WHERE` clause would only be checked when data changes. With `drasi.trueLater`, Drasi automatically re-evaluates after the 20-second window expires, causing idle senders to appear in the result set even when no new data arrives.

The `WHERE` clause combines two conditions with `OR`: senders who are *already* inactive, and a scheduled future check for senders who *will become* inactive if no new message arrives within 20 seconds.

### Add the Query via the REST API

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

In a separate terminal, start the SSE CLI:

{{< tabpane persist="header" >}}
{{< tab header="bash / zsh" lang="bash" >}}
./examples/sse-cli/target/release/drasi-sse-cli \
  --server http://localhost:8080 \
  --query inactive-senders
{{< /tab >}}
{{< tab header="PowerShell" lang="powershell" >}}
./examples/sse-cli/target/release/drasi-sse-cli `
  --server http://localhost:8080 `
  --query inactive-senders
{{< /tab >}}
{{< /tabpane >}}

### Test the inactive-senders Query

In your other terminal, send a new message from Alice:

{{< tabpane persist="header" >}}
{{< tab header="bash / zsh" lang="bash" >}}
docker exec -it getting-started-postgres psql -U drasi_user -d getting_started -c \
  "INSERT INTO \"Message\" (\"From\", \"Message\") VALUES ('Alice', 'About to go inactive');"
{{< /tab >}}
{{< tab header="PowerShell" lang="powershell" >}}
docker exec -it getting-started-postgres psql -U drasi_user -d getting_started -c "INSERT INTO `"Message`" (`"From`", `"Message`") VALUES ('Alice', 'About to go inactive');"
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

Now make Alice active again, by sending a new message from her:

{{< tabpane persist="header" >}}
{{< tab header="bash / zsh" lang="bash" >}}
docker exec -it getting-started-postgres psql -U drasi_user -d getting_started -c \
  "INSERT INTO \"Message\" (\"From\", \"Message\") VALUES ('Alice', 'Active again');"
{{< /tab >}}
{{< tab header="PowerShell" lang="powershell" >}}
docker exec -it getting-started-postgres psql -U drasi_user -d getting_started -c "INSERT INTO `"Message`" (`"From`", `"Message`") VALUES ('Alice', 'Active again');"
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

Press `Ctrl+C` to stop the SSE CLI.

**✅ Checkpoint**: You understand that Drasi can detect the *absence* of activity over time — a powerful capability for monitoring, alerting, and SLA enforcement.

> **Note**: The Drasi Server config file after the changes made in this step is available in `./examples/getting-started/configs/getting-started-step-6.yaml` if you want to compare it with your config file or use it as a reference for future use.

---

## What You've Learned {#summary}

That concludes the Drasi Server Getting Started tutorial. You have learned the core Drasi Server concepts that enable you to build change-driven solutions that react to data changes in real time:

| Concept | What You Did |
| ------- | ------------ |
| **Configuration** | Used `drasi-server init` to scaffold an initial configuration, then dynamically added components via the REST API |
| **Sources** | Created a PostgreSQL source to connect Drasi to your database |
| **Queries** | Wrote 4 Continuous Queries: simple change detection, criteria-based selection, aggregation, and time-based detection |
| **Reactions** | Configured a Log Reaction for console output and used the SSE CLI to stream query result changes to your terminal |
| **REST API** | Used the REST API to create, delete, and query Sources, Continuous Queries, and Reactions while the server is running |

---

## Cleanup {#cleanup}

Stop Drasi Server with `Ctrl+C`.

Stop the tutorial database:

```bash
docker compose -f examples/getting-started/database/docker-compose.yml down -v
```

The `-v` flag removes the persistent volume. Without it, the database data persists after the container is removed and can cause confusion if you restart the tutorial later.

---

## Next Steps

Now that you understand the core Drasi concepts, here are some things you can do next:

- **Deepen your understanding** — Read the <a href="/concepts/overview/" target="_blank" rel="noopener noreferrer">Drasi Concepts</a> to understand how Drasi works under the hood.
- **Build a change-driven POC** — Try connecting Drasi Server to one of your own databases and build a proof-of-concept to test it on a real problem.
- **Configure Sources** — Learn how to <a href="../how-to-guides/configuration/configure-sources/" target="_blank" rel="noopener noreferrer">detect changes in PostgreSQL, HTTP, gRPC, and more</a>.
- **Configure Queries** — Learn how to <a href="../how-to-guides/configuration/configure-queries/" target="_blank" rel="noopener noreferrer">write advanced Continuous Queries in GQL and openCypher</a>.
- **Configure Reactions** — Learn how to <a href="../how-to-guides/configuration/configure-reactions/" target="_blank" rel="noopener noreferrer">react to changes using SSE, gRPC, Stored Procedures, and more</a>.
- **Explore drasi-lib** — Use the <a href="/drasi-lib/" target="_blank" rel="noopener noreferrer">drasi-lib Rust crate</a> to embed Drasi capabilities directly in your Rust applications.
- **Try Drasi for Kubernetes** — Deploy Drasi as a managed service on Kubernetes with <a href="/drasi-kubernetes/" target="_blank" rel="noopener noreferrer">Drasi for Kubernetes</a>.
- **Walk through a tutorial** — Follow one of the <a href="/drasi-kubernetes/tutorials/" target="_blank" rel="noopener noreferrer">end-to-end tutorials</a> to see Drasi in action on realistic scenarios.
- **Contribute to Drasi** — Explore the <a href="https://github.com/drasi-project" target="_blank" rel="noopener noreferrer">Drasi project on GitHub</a> and read the <a href="https://github.com/drasi-project/drasi-server/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer">Contributing Guide</a> to start contributing.
- **Join the conversation** — Connect with the Drasi community on <a href="https://aka.ms/drasidiscord" target="_blank" rel="noopener noreferrer">Discord</a>.
- **Follow Drasi** — Stay up to date on <a href="https://x.com/drasi_project" target="_blank" rel="noopener noreferrer">X</a>, <a href="https://www.youtube.com/@DrasiProject" target="_blank" rel="noopener noreferrer">YouTube</a>, and <a href="https://bsky.app/profile/drasi-project.bsky.social" target="_blank" rel="noopener noreferrer">Bluesky</a>.
