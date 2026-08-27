---
type: "docs"
title: "Create Configuration with the Wizard"
linkTitle: "Create Configuration with the Wizard"
weight: 5
description: "Use the interactive `drasi-server init` wizard to create a Drasi Server config file"
related:
  tutorials:
    - title: "Getting Started"
      url: "/drasi-server/tutorials/getting-started/"
  howto:
    - title: "Configure Drasi Server"
      url: "/drasi-server/how-to-guides/configuration/configure-drasi-server/"
    - title: "Configure Sources"
      url: "/drasi-server/how-to-guides/configuration/configure-sources/"
    - title: "Configure Reactions"
      url: "/drasi-server/how-to-guides/configuration/configure-reactions/"
  reference:
    - title: "CLI Reference"
      url: "/drasi-server/reference/cli/"
    - title: "Configuration Reference"
      url: "/drasi-server/reference/configuration/"

draft: true
---

Drasi Server includes an interactive configuration wizard, `drasi-server init`, that helps you create correctly-formatted config files from scratch. The wizard prompts you for server settings, then walks you through selecting and configuring {{< term "Source" "Sources" >}}, {{< term "Reaction" "Reactions" >}}, and {{< term "Bootstrap Provider" "Bootstrap Providers" >}}, downloading any required plugins from the plugin registry as it goes.

This guide walks you through the wizard end-to-end using the same scenario as the [Getting Started](../../../getting-started/) tutorial: a PostgreSQL data source that monitors a `Message` table, plus a Continuous Query and Log Reaction. After the wizard generates the config file, the guide also shows the small manual edits needed to tailor the generated Continuous Query and Log Reaction for the tutorial scenario.

> **Note:** The `init` command cannot be used to edit existing config files — once a config file has been created, you must edit it in your preferred text editor.

> **Note:** The plugin lists, version numbers, and prompt wording shown below may differ slightly depending on which plugins are available in the registry at the time you run the wizard. When in doubt, select the **PostgreSQL** Source, the **PostgreSQL** Bootstrap Provider, and the **Log** Reaction.

## Prerequisites

This guide assumes:

- You have completed [Step 1](../../../getting-started/#setup) and [Step 2](../../../getting-started/#database) of the Getting Started tutorial — you have Drasi Server installed and the tutorial PostgreSQL database running.
- You are working from the Drasi Server repository root (the "tutorial root folder").

## Create the Drasi Server Configuration

From the tutorial root folder, run the following command to start the wizard:

```bash
./bin/drasi-server init --output getting-started.yaml
```

The wizard will only write the config file at the end, so if you make a mistake just break out of the wizard using `ctrl-c` and run `drasi-server init` again.

Here's what to enter at each prompt:

### 1. Server Settings

Configuration starts with general Drasi Server settings.

| Prompt | Enter | Notes |
| ------ | ----- | ----- |
| **Server host** | `0.0.0.0` (default) | Press Enter to accept default value |
| **Server port** | `${SERVER_PORT:-8080}` | Uses env var with 8080 as default (see note below) |
| **Log level** | `info` (default)| Use arrow keys to select |
| **Enable persistent indexing (RocksDB)?** | `N` (default) | Press Enter to accept default value |
| **State store** | `None` | Use arrow keys to select "None - In-memory state" |
| **Plugin registry** | `ghcr.io/drasi-project` (default) | Press Enter to accept default value |
| **Enable plugin signature verification (cosign)?** | N (default) | Press Enter to accept default value |
| **Auto-install plugins from registry on startup?** | N (default) | Press Enter to accept default value |
| **Enable hot-reload for plugins?** | N (default) | Press Enter to accept default value |

<div style="margin-top: 1.5rem;"></div>

Your terminal should show the following once you have completed the Server Settings section of the wizard:

```text
  IP address to bind to (0.0.0.0 for all interfaces)
> Server host: 0.0.0.0

  Port for the REST API
> Server port: ${SERVER_PORT:-8080}

  Logging verbosity
> Log level: info

  Persists query index data to disk. Use for production workloads.
> Enable persistent indexing (RocksDB)? No

  Allows plugins to persist runtime state that survives restarts
> State store (for plugin state persistence): None - In-memory state (lost on restart)

  Default registry for downloading plugins
> Plugin registry (OCI URL or local path): ghcr.io/drasi-project

  Verify cosign signatures on downloaded plugins for supply-chain security
> Enable plugin signature verification (cosign)? No

  Automatically download missing plugins when the server starts
> Auto-install plugins from registry on startup? No

  Automatically detect and reload plugins when files change on disk
> Enable hot-reload for plugins? No
```

> **Environment variables in config values:** The `${SERVER_PORT:-8080}` syntax tells Drasi Server to use the value of the `SERVER_PORT` environment variable, falling back to `8080` if it isn't set. You can use this `${VAR:-default}` pattern in any configuration value.

### 2. Data Sources

After configuring server settings, you'll add a data source. You'll add a PostgreSQL source that connects to the `getting_started` database you set up in Step 2 of the Getting Started tutorial and monitors the `Message` table for changes.

First you need to install the source plugin for PostgreSQL. Drasi Server uses a plugin architecture to support different types of data sources and reactions. It is possible to load plugins dynamically and also to download plugins automatically from the Drasi Server plugin registry, but for this walkthrough you'll install the PostgreSQL plugin using the configuration wizard.

Immediately after the Server Settings section, the wizard prompts you with the following:

```text
Data Sources
------------
No source plugins installed locally.
? Select sources (space to select, enter to confirm):
> [ ] ⬇ Install a source from a registry
[Use arrow keys to navigate, space to select/deselect]
```

Press `space` and a check mark will appear next to `Install a source from a registry`, then press `enter` to confirm your selection.

You will be asked to confirm the plugin source:

```text
? Plugin source (registry URL or local directory path): (ghcr.io/drasi-project)
```

Press `enter` to accept the default value of `ghcr.io/drasi-project`, which is the Drasi Server plugin registry.

The configuration wizard searches for available plugins on `ghcr.io/drasi-project` and displays a list of available source plugins:

```text 
Searching ghcr.io/drasi-project...
? Select sources to install:
> [ ] source/grpc (latest: 0.1.11)
  [ ] source/http (latest: 0.1.11)
  [ ] source/mock (latest: 0.1.11)
  [ ] source/mssql (latest: 0.1.0)
  [ ] source/postgres (latest: 0.1.10)
  [ ] source/dataverse (latest: 0.2.0)
v [ ] source/gtfs-rt (latest: 0.1.0)
[↑↓ to move, space to select one, → to all, ← to none, type to filter]
```

The configuration wizard will download the PostgreSQL Source plugin and install it locally ready for Drasi Server to use, but you must select it as the Source for your configuration first from the list displayed:

```text
? Select sources (space to select, enter to confirm):
> [ ] postgres (v0.2.2, from libdrasi_source_postgres.dylib)
  [ ] ⬇ Install a source from a registry
[Use arrow keys to navigate, space to select/deselect]
```

Press `space` and then `enter` and the configuration wizard will prompt you for the settings to configure the PostgreSQL Source; use the settings from the following table.


| Prompt | Enter | Notes |
| ------ | ----- | ----- |
| **Source ID** | `my-postgres` | A unique name for this source |
| **Database host** | `${DB_HOST:-localhost}` | Defaults to `localhost` if `DB_HOST` is not set |
| **Database port** | `${POSTGRES_HOST_PORT:-5432}` | Defaults to `5432` if `POSTGRES_HOST_PORT` is not set |
| **Database name** | `getting_started` | The tutorial database |
| **Database user** | `drasi_user` | |
| **Database password** | `drasi_password` | Type the password (characters won't display) and press Enter |
| **Tables to monitor** | `Message` | The table we'll query |
| **Configure table keys for tables without primary keys?** | `Y` | Required for CDC change tracking |
| **Does table 'Message' need key columns specified?** | `Y` | Need to configure tableKey for `Message` table |
| **Key columns for 'Message'** | `MessageId` | The Message table's primary key |
| **Bootstrap provider** | `PostgreSQL` | Use arrow keys to select "PostgreSQL - Load initial data" |

After you select to use the PostgreSQL Bootstrap provider, you will be asked where it should be loaded from.

```text
Bootstrap provider for source 'my-postgres':
No bootstrap plugins installed locally.
? Select bootstraps (space to select, enter to confirm):
> [ ] ⬇ Install a bootstrap from a registry
[Use arrow keys to navigate, space to select/deselect]
```

```text
? Plugin source (registry URL or local directory path): (ghcr.io/drasi-project)
```


```text
> Select bootstraps (space to select, enter to confirm): ⬇ Install a bootstrap from a registry
> Plugin source (registry URL or local directory path): ghcr.io/drasi-project
Searching ghcr.io/drasi-project...
? Select bootstraps to install:
^ [ ] bootstrap/mysql (latest: 0.2.0)
  [ ] bootstrap/open511 (latest: 0.1.0)
  [ ] bootstrap/oracle (latest: 0.1.0)
  [ ] bootstrap/sqlite (latest: 0.1.0)
  [ ] bootstrap/sui-deepbook (latest: 0.1.0)
> [ ] bootstrap/cloudflare-radar (latest: 0.1.0)
  [ ] bootstrap/here-traffic (latest: 0.1.0)
[↑↓ to move, space to select one, → to all, ← to none, type to filter]
```

```text
? Select bootstraps (space to select, enter to confirm):
> [ ] postgres (v0.2.5, from libdrasi_bootstrap_postgres.dylib)
  [ ] ⬇ Install a bootstrap from a registry
[Use arrow keys to navigate, space to select/deselect]
```

```text
> Select bootstraps (space to select, enter to confirm): postgres (v0.2.5, from libdrasi_bootstrap_postgres.dylib)
> Bootstrap DB host: localhost
> Bootstrap DB port: 5432
> Bootstrap DB name: getting_started
> Bootstrap DB user: drasi_user
> Bootstrap DB password: ********
```


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

### 3. Reactions

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

## Update the Default Continuous Query

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

## Update the Log Reaction

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

## Next Steps

Your `getting-started.yaml` file is now ready. Return to [Step 3 of the Getting Started tutorial](../../../getting-started/#phase-1) and continue from **Run Drasi Server** to start Drasi Server with your new configuration.

To learn more about the config file structure, see [Configure Drasi Server](../configure-drasi-server/). To explore other Source, Reaction, and Bootstrap Provider options the wizard offers, see [Configure Sources](../configure-sources/), [Configure Reactions](../configure-reactions/), and [Configure Bootstrap Providers](../configure-bootstrap-providers/).
