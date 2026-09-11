---
type: "docs"
title: "Using the Web UI"
linkTitle: "Using the Web UI"
weight: 15
hide_readingtime: true
description: >-
    Manage a Drasi Server pipeline visually — no config files or API calls required.
related:
  tutorials:
    - title: "Getting Started"
      url: "/drasi-server/tutorials/getting-started/"
  howto:
    - title: "Installation"
      url: "/drasi-server/how-to-guides/installation/"
    - title: "Configuration"
      url: "/drasi-server/how-to-guides/configuration/"
  reference:
    - title: "REST API"
      url: "/drasi-server/reference/rest-api/"
    - title: "CLI"
      url: "/drasi-server/reference/cli/"
---

Drasi Server ships with a visual Web UI for building and operating a data pipeline without writing configuration files or making raw API calls. It's enabled by default — most of what you can do here, you can also do through the [REST API](/drasi-server/reference/rest-api/) or a [config file](/drasi-server/reference/configuration/), but the UI is the fastest way to see your pipeline as it actually runs.

## Accessing the Web UI

Open **`http://localhost:8080/ui`** in your browser once Drasi Server is running (adjust the host/port if you've changed them).

The UI is on by default. To turn it off:

```bash
# Via command line
drasi-server --disable-ui

# Via config file
enableUi: false
```

**If you're building from source**, the UI is a separate Vite/React app that compiles to static assets the server binary serves at `/ui`. Build it alongside the server:

```bash
make build-release    # builds server + UI (recommended)
# or, if you already built the binary with cargo:
make build-ui         # build only the UI
```

The published Docker image (`ghcr.io/drasi-project/drasi-server`) already includes the compiled UI — nothing extra to do. If `ui/dist` is missing at startup, the server logs a warning and `/ui` returns 404; either build the UI or pass `--disable-ui` to suppress the warning intentionally.

## Layout

The interface has three parts: a slim top bar, the flow canvas in the center, and an icon rail down the left side that opens sliding panels.

**Top bar** — the Drasi logo and current instance selector on the left; a connection indicator and the light/dark theme toggle on the right. The connection indicator reflects the UI's live SSE stream rather than polling, so it's an honest signal of whether you're actually watching real-time updates:

| Indicator | Meaning |
|---|---|
| Green, pulsing — "Live" | Connected, receiving real-time events |
| Amber, pulsing — "Connecting..." | Reconnecting |
| Red — "Disconnected" | No active connection |

**Flow Canvas** — the center of the screen, and the main reason to use the UI at all: your Sources, Continuous Queries, and Reactions rendered as a live node graph.

- **Green nodes** are Sources, **blue nodes** are Continuous Queries, **purple nodes** are Reactions — matching the same color convention used throughout the docs.
- Edges animate when data is actively flowing between two *running* components.
- Click a node to expand it in place for more detail (query text, source lists, connection info), or click the icon-rail's **Selected Component** tab for a fuller inspector.
- Drag to reposition nodes, scroll to zoom, and use the auto-layout button in the canvas controls to snap everything back into tidy Source → Query → Reaction columns. Layout, expanded/collapsed state, and lock state are all remembered per instance.

**Icon rail** — six sections, each opening a panel:

| Section | What it's for |
|---|---|
| **Components** | A searchable, filterable catalog of every Source, Query, and Reaction kind available from your installed plugins. Click one to configure and create it. |
| **Solutions** | Browse, deploy, and create Solution Templates — see below. |
| **Plugins** | See what's installed, and search/install more from a plugin registry. |
| **Instances** | Create, switch between, and clone Drasi Server instances. |
| **Logs** | A live, searchable feed of component events — started, stopped, created, deleted — plus errors and warnings. |
| **Selected Component** | Only active once you've selected a node: status, full configuration, connected components, and Start/Stop/Delete actions. |

## Creating a Source, Query, or Reaction

1. Open the **Components** panel from the icon rail.
2. Filter by type if you like (All / Sources / Queries / Reactions), or search by name.
3. Click a kind — say, a PostgreSQL source, or a Cypher query.
4. A form slides in from the right. For plugin-backed components, this form is generated directly from the plugin's own schema, so it stays accurate as plugins are added or updated.
5. Fill it in and click **Save**. The component appears on the canvas immediately and starts (unless you've configured it not to auto-start).

Edits are staged as a local draft until you save, so you can back out of a half-finished configuration without side effects.

## Working with instances

An instance is an isolated set of sources, queries, and reactions — useful for separating environments (dev/staging/prod) or tenants on a single server. Drasi Server always has at least one, and the UI operates on whichever instance is currently selected in the top bar.

- **Switch** instances from the top-bar dropdown, or deep-link to one directly: `http://localhost:8080/ui?instance=my-instance-id`.
- **Create** a new instance from the **Instances** panel — optionally seeding it immediately from a Solution Template.
- **Clone** an instance (and everything in it) from the same panel when you want a copy to experiment on.

## Solution Templates

A Solution Template is a YAML-defined, reusable bundle of sources, queries, and reactions — a whole pipeline you can deploy in one action instead of building it component by component. Drasi Server ships with a couple of ready-made examples:

| Template | Description |
|---|---|
| `simple-log-pipeline.yaml` | Basic source → query → log setup |
| `iot-temperature-monitor.yaml` | IoT sensor monitoring with alerts |

**To deploy one:** open the **Solutions** panel, pick a template, fill in any variables it exposes (templates can define these with `${VAR_NAME:-default}` syntax, with sensible defaults), choose which instance to deploy into, and confirm. Drasi Server validates every component in the template before creating anything, so you get all configuration errors at once rather than a partial pipeline.

**To go the other direction:** with an instance selected, use **Create Template** in the Solutions panel to export its current sources, queries, and reactions as a new reusable template — handy for turning something you built by hand into a starting point for next time.

## Managing plugins

The **Plugins** panel lists what's currently installed and lets you search a plugin registry for more. Since the Components catalog only shows kinds backed by an installed plugin, this is usually your first stop after adding a new type of Source or Reaction you don't see yet.
