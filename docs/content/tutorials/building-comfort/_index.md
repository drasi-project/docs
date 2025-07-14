---
type: "docs"
title: "Building Comfort with Drasi"
linkTitle: "Building Comfort with Drasi"
weight: 40
description: >
    Learn how to use Drasi in a building management scenario
---

## Scenario
Let's consider a building management scenario where we have buildings with
    several floors, with each floor having several rooms. Each room has
    sensors that measure the following:
* Temperature
* CO2 levels
* Humidity

Each sensor logs its latest reading to a datastore.
In this scenario, the `Comfort Level` for each room is computed using the formula:

```
comfortLevel = trunc(50 + (temp - 72) + (humidity - 42) + if(CO2 > 500, (CO2 - 500) / 25, 0))
```

A range of 40 to 50 is considered acceptable: a value below 40 indicates that
  temperature and/or humidity is too low, while a value above 50 indicates that
  temperature, humidity, and/or CO2 levels are too high.

### Building a reactive dashboard
What would it take to build a reactive front end dashboard that would alert
  us if the comfort level of any floor, room or building goes out of the
  acceptable range of [40, 50]?

What if we could not modify the existing system in place?

### Traditional Approaches

There could be multiple ways to solve this problem, some of which are listed
  below:

{{< tabpane >}}

{{% tab header="Event Driven Architecture" text=true %}}

We could build an event driven architecture to build the dashboard.

{{< figure src="building-comfort-traditional-event-driven.png"
  alt="Architecture diagram showing event-driven approach with message broker and stream processors" width="100%" >}}

1. Sensor values are published as messages/events to a message broker
    (e.g., Kafka).
1. If sensor is already writing to a store that has a change-log, we can push
    the log events to the message broker using platforms like Debezium.
1. If not, we could consider writing custom Kafka Connect source that queries
    database for changes and transforms results into Kafka records.
1. A stream processor subscribes to the sensor topics and runs calculations
    through a rule engine or scripting engine.
1. This stream processor needs to maintain state to store previously values
    for metrics that did not change. For instance, an event with updated Co2
    value still needs the existing values for temperature & humidity.
    Alternatively, the sensors can emit a snapshot of all readings together.
1. Stream processors can be defined as declarative queries using SQL-like DSLs
    such as Kafka-Streams/KSQL or Flink SQL.
1. The engine can load the comfort level formula from a central config store
    (e.g., a key-value store like Consul or etcd).
1. Another stream processor (or set of stream processing queries in Kafka
    Streams/Flink) listens to computed comfort levels and aggregates them per
    room, floor, and building.
1. Push to UI: The aggregated results are published to a WebSocket endpoint or
    a real-time query endpoint that the dashboard subscribes to.

Pros:
- Highly reactive, event-driven flows.
- Dynamic and easily changeable logic through declarative queries.
- Real-time updates to the dashboard.

Cons:
- More moving parts (message broker, stream processors, rule engines).
- Complexity in operating and maintaining the system.

{{% /tab %}}

{{% tab header="Microservices" text=true %}}

We can also take a Microservices based approach to this problem.

{{< figure src="building-comfort-traditional-microservices.png"
  alt="Architecture diagram showing microservices approach with ingestion, computation, and aggregation services" width="100%" >}}

1. Data Store: All sensors must write their latest value to a data store.
1. Ingestion Service: Collects raw sensor data from the data source.
    This data could be polled from the data source, or we could have triggers
    in the data store which can call an API of the ingestion service.
1. Computation Service: Reads raw data and applies a formula. The formula could
    be in a plugin or loaded as a Python/Lua/JS script at runtime.
1. Aggregation Service: Aggregates using plugins or configuration-based
    strategies.
1. Push to UI: The aggregated results are published to a WebSocket endpoint or
    a real-time query endpoint that the dashboard subscribes to.

Pros:
- Separation of concerns in microservices.
- Updating logic involves modifying a small plugin file or configuration, not
    the entire service.
- Scales well as the number of buildings/floors increases.

Cons:
- If ingestion services polls the data source, a question of the correct
    polling frequency arises.
- If ingestion service is invoked by triggers in the data source, we then need
    changes in existing system and not all data sources might support triggers.
- Managing multiple services and their deployments comes with operational
    complexity.
- Need a mechanism to ensure plugin changes are safely deployed and
    versioned.
- Coordination between services may be more complex.

{{% /tab %}}

{{% tab header="Serverless Functions" text=true %}}

An alternative approach could involve using serverless functions.

{{< figure src="building-comfort-traditional-serverless.png"
  alt="Architecture diagram showing serverless approach with Lambda functions and time-series database" width="100%" >}}

1. Store all sensor data in a time-series database.
1. Define a serverless function (e.g., AWS Lambda, Azure Function) triggered
    periodically or by new data events calculates comfort level.
1. The formula could be read from an S3 file, a parameter store, or a database
    table.
1. Define separate functions for Aggregation - it can also reads its
    aggregation logic from a config source.
1. Push to UI: The aggregated results are published to a WebSocket endpoint or
    a real-time query endpoint that the dashboard subscribes to.

Pros:
- Very modular and easy to scale.
- Configuration-driven logic adjustments.
- Minimal code changes required, mostly config updates.

Cons:
- Potentially higher latency due to function cold starts.
- Complex logic might require careful management of state and configs.
- Requires changing existing data store to one usable by Serverless functions.

{{% /tab %}}

{{% /tabpane %}}

#### Issues with Traditional Approaches

All of the approaches discussed so far have the following issues:

##### Modifications to existing systems

Many of the approaches discussed previously can require changes to the existing
  systems which, in the real world, may often be deemed too risky or simply not
  feasible.

- In event driven approach, we could use a changelog-connector for database
    that can get the changes into a message broker.
- In microservices approach, we need an ingestion service to which data changes
    must be pushed by some component.
- In serverless approach, we might require a specific type of data store
    compatible with serverless functions.

##### Implementation & Operational Overhead

To implement a reactive dashboard using any approach, following are things that
  will be required regardless of the approach we take:

- Some mechanism to push updates to the UI as they happen in the real world.
    For example, a SignalR hub.
- Something that pushes DB changes to our systems. For example, in the event
    driven scenario, we could use a Debezium connector to push the database
    changelog to message broker.
- We will also need a way to describe the comfort-level formulas and the
    alerting criterion (preferably in a declarative manner).

Beyond that, any additional components add implementation and operational
  overhead:

- In the event-driven approach, we need to deploy and maintain a message broker
    (like Kafka) and its paraphernalia. We also need to have a Stream
    Processing Engine running (or an embedded stream processor).

- With microservices approach, we add a significant overhead in implementing,
    deploying and maintaining multiple services and the communication channels
    between them. There are also questions about consistency across services
    that can arise.

- Serverless approach may not work due to cold starts impacting the
    reactiveness of the dashboard.

### Enter Drasi
What if we had a platform where we could make our existing systems reactive -
  without writing any code?

{{< figure src="building-comfort-architecture-with-drasi.png"
  alt="Architecture diagram showing Drasi solution with source, queries, and SignalR reaction" width="80%" >}}

With Drasi, we can detect changes in our existing data source, write
  complicated alerting logic declaratively and get a reaction pushing those
  changes to our UI without writing any code.

Following is all we need to do to get a SignalR hub up and running:
- YAML file describing existing data source.
- YAML file(s) containing any alerts or computation logic (written in a
    declarative `Cypher` query).
- YAML file describing the reaction we want - in this case a SignalR hub which
    will push updates to our UI.

This means, we can spend more time in focusing on how the dashboard UI will
  look, rather than worrying about implementing and operating new backend
  infrastructure.

## Building Comfort with Drasi

The rest of this tutorial will guide us in setting up a mock building
  management scenario and demonstrate how we can get a Reactive Dashboard built
  for existing systems with just some config files and Cypher queries.

### Tutorial Modes

You can follow along the steps below in a Github codespace, a VSCode Dev
  Container or on a local k3d cluster on your machine.

{{< tabpane >}}

{{% tab header="Github Codespaces" text=true %}}

The easiest way to follow along with this tutorial is to launch a Github
  Codespace using the link below. This will allow you to run the example
  application within your browser without setting up anything on your own
  machines.

[![Open in Github Codespaces](https://github.com/codespaces/badge.svg)](https://github.com/codespaces/new?hide_repo_select=true&ref=main&repo=778887889&skip_quickstart=true&machine=standardLinux32gb&devcontainer_path=.devcontainer%2Fbuilding-comfort%2Fdevcontainer.json)

This will open a page with some configuration options. Make sure that the
  'Branch' selected is `main` and set the 'Dev Container configuration' to
  'Building Comfort with Drasi'.

{{< figure src="Screenshot_CodespacesConfig.png"
  alt="GitHub Codespaces configuration page showing main branch and Building Comfort dev container selection" width="80%" >}}

**Note:** The codespace will launch and run some setup scripts. Please wait for the scripts to complete. This should take less than 5 minutes to complete.

{{< figure src="Codespaces_00a_CodespacesLoading.png"
  alt="GitHub Codespaces creation and setup in progress" width="100%" >}}

Once the setup is complete successfully, you should see a welcome message on the terminal, and the Readme file open:

{{< figure src="Codespaces_00b_CodespacesReady.png"
  alt="Codespace ready with welcome message and README file open" width="100%" >}}

{{% /tab %}}

{{% tab header="VSCode DevContainer" text=true %}}

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

    {{< figure src="Devcontainer_01_OpenLearningRepo.png"
  alt="VS Code command palette showing Dev Containers: Rebuild and Reopen in Container option" width="80%" >}}

- Select the `Building Comfort with Drasi` option to launch this tutorial.

{{< figure src="Devcontainer_02_SelectBuildingTutorial.png"
  alt="Dev container selection menu showing Building Comfort with Drasi option" width="80%" >}}

This will create a container and set it up for you. This might take up to 5 minutes and **once ready**, it will look something like this:

{{< figure src="Devcontainer_03_ReadyScreen.png"
  alt="VS Code terminal showing tutorial setup complete message" width="80%" >}}

{{% /tab %}}

{{% tab header="Local Setup" text=true %}}

To run this tutorial locally, you'll need:
- [Docker](https://www.docker.com/products/docker-desktop/) installed (for running k3d)
- kubectl CLI
- k3d installed ([v5.6.0](https://k3d.io/v5.6.0/)) installed
- [Drasi CLI](https://drasi.io/how-to-guides/installation) installed

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

**Step 1: Clone the `learning` repo**

[Clone the learning repo from Github](https://github.com/drasi-project/learning),
  and navigate to the building comfort directory (`learning/tutorial/building-comfort`)

```sh
git clone https://github.com/drasi-project/learning
cd learning/tutorial/building-comfort
```
<br/>

**Step 2: Create k3d cluster**

Use the commands below to create your own k3d cluster:

```sh
# Create k3d cluster with port mapping
k3d cluster create drasi-tutorial -p '8123:80@loadbalancer'

# Verify kubectl can connect (should show cluster info)
kubectl cluster-info
```
<br/>

This creates a cluster with Traefik v2.x ingress controller included. The port mapping `8123:80` will allow you to access applications at `http://localhost:8123`.

<br />

**Step 3: Deploy apps, Setup Ingress & Initialize Drasi**

To make things easy, we have provided a helper script. The script will:
- Check for required tools (kubectl, Drasi CLI)
- Deploy PostgreSQL database with sample data
- Deploy all containerized applications
- Initialize Drasi
- Configure ingress routes (required - setup will fail if Traefik v2.x is not available)

Once your k3d cluster is ready with `kubectl` pointing to it, run the interactive setup script for your platform:

**For macOS/Linux:**
```sh
# Ensure that you are in the tutorial directory
cd tutorial/building-comfort

./scripts/setup-tutorial.sh
```
<br />

**For Windows (PowerShell):**
```powershell
# Ensure that you are in the tutorial directory
cd tutorial\building-comfort

.\scripts\setup-tutorial.ps1
```
<br />

**If the scripts don't work for you**, you can try to setup the environment yourself. For this you must deploy the deployment YAMLs inside the following paths, to your kubernetes cluster:
```sh
- tutorial/building-comfort/control-panel/k8s/*.yaml
- tutorial/building-comfort/dashboard/k8s/*.yaml
- tutorial/building-comfort/demo/k8s/*.yaml
```
<br />

After this you must initialize drasi:
```sh
drasi env kube
drasi init
```
<br />

{{% /tab %}}

{{% /tabpane %}}

### Understanding the environment

Once your environment is ready, all applications sit behind an ingress, and are accessible through a single entry point.

{{< figure src="building-comfort-tutorial-setup.png"
  alt="Architecture diagram of the building comfort environment showing containerized applications" width="80%" >}}

The following applications are containerized and deployed on Kubernetes:

1. **Control Panel** (`/control-panel`)
   - Used to simulate changes in sensor readings
   - FastAPI backend with CRUD access to room sensor data
   - Simple React frontend built with Vite
   - Pre-loaded with sample buildings and rooms

2. **Dashboard** (`/dashboard`)
   - React app built with Vite
   - Connects to Drasi SignalR reaction
   - Displays real-time comfort levels and alerts

3. **Demo Portal** (`/`)
   - Simple HTML page with iframes
   - Shows both applications in a single view

4. **PostgreSQL Database**
   - Contains Building, Floor, and Room tables
   - Pre-loaded with sample data

{{< tabpane >}}

{{% tab header="Github Codespaces" text=true %}}

Once your codespace is ready, it should look something like this:

{{< figure src="Codespaces_01_ReadyScreen.png"
  alt="Codespace ready with welcome message and terminal output" width="100%" >}}

Open the Ports tab:

{{< figure src="Codespaces_02_PortsTab.png"
  alt="VS Code interface showing how to open the Ports tab in Codespaces" width="100%" >}}

You should see a port already exported for "Building Comfort Apps". Hover on the forwarded address and click on the button "Open in Browser".

{{< figure src="Codespaces_03_PortClick.png"
  alt="Codespaces Ports tab showing Open in Browser button for Building Comfort Apps" width="100%" >}}

This will open up a URL (something like `https://<your-codespace-id>-8123.app.github.dev/`) in a new tab.
You should see a **disconnected** demo page like shown below.

{{< figure src="Codespaces_04_BlankDashboard.png"
  alt="Demo portal showing disconnected dashboard before SignalR setup" width="100%" >}}

**Note:** This page shows **Disconnected** on the top right corner because the dashboard frontend has no websocket backend yet.
We will use Drasi to deploy a SignalR server which will work as our websocket backend.

🚀 If you're able to see this, your environment is setup correctly and you can proceed.

👍 The dashboard is still blank because our websocket server is not deployed

⌛️ If your dashboard is not loading, or your codespace wasn't setup, please try recreating your codespace.

🤨 If you keep running into issues, please reach the Drasi team at our discord channel and share your codespace creation logs.

{{% /tab %}}

{{% tab header="VSCode DevContainer" text=true %}}

Once your devcontainer is ready, it should look something like this:

{{< figure src="Devcontainer_03_ReadyScreen.png"
  alt="VS Code terminal showing dev container setup complete message" width="100%" >}}

Open the Ports tab:

{{< figure src="Devcontainer_04_OpenPortsTab.png"
  alt="VS Code interface showing how to open the Ports tab in Dev Container" width="100%" >}}

You should see a port already exported for "Building Comfort Apps". Hover on the forwarded address and click on the button "Open in Browser".

{{< figure src="Devcontainer_05_ClickOnPort.png"
  alt="Dev Container Ports tab showing Open in Browser button for Building Comfort Apps" width="100%" >}}

This will open up a URL (like `http://localhost:8123`) in a new tab.
You should see a disconnected demo page like shown below.

{{< figure src="Devcontainer_06_BlankDashboard.png"
  alt="Demo portal showing disconnected dashboard before SignalR setup" width="100%" >}}

**Note:** This page shows **Disconnected** on the top right corner because the dashboard frontend has no websocket backend yet.
We will use Drasi to deploy a SignalR server which will work as our websocket backend.

🚀 If you're able to see this, your environment is setup correctly and you can proceed.

👍 The dashboard is still blank because our websocket server is not deployed

⌛️ If your dashboard is not loading, or your codespace wasn't setup, please try recreating your dev container.

🤨 If you keep running into issues, please reach the Drasi team at our discord channel and share your dev-container creation logs.

{{% /tab %}}

{{% tab header="Local Setup" text=true %}}

Open `http://localhost:8123/` in your browser to see the demo portal showing both the dashboard and control panel.
You should see a **disconnected** demo page like shown below.

{{< figure src="Devcontainer_06_BlankDashboard.png"
  alt="Demo portal showing disconnected dashboard before SignalR setup" width="100%" >}}

**Note:** This page shows **Disconnected** on the top right corner because the dashboard frontend has no websocket backend yet.
We will use Drasi to deploy a SignalR server which will work as our websocket backend.

🚀 If you're able to see this, your environment is setup correctly and you can proceed.

👍 The dashboard is still blank because our websocket server is not deployed

🤨 If you keep running into issues, please reach the Drasi team at our discord channel.

{{% /tab %}}

{{% /tabpane %}}

If your environment setup was complete, you should see the demo portal. This demo portal shows:
- **Top half**: Real-time dashboard displaying building comfort levels
- **Bottom half**: Control panel to adjust room conditions

The code to build the realtime dashboard lives in directory `tutorial/building-comfort/dashboard` and the dashboard can be accessed directly by adding `/dashboard` to the URL opened for your demo portal.

The control panel code is in directory `tutorial/building-comfort/control-panel`, and it can be accessed directly by adding `/control-panel` to the URL opened for your demo portal.  The Swagger is accessible by adding `/control-panel/docs`.

### Drasi VSCode Extension

We also have a VSCode extension for Drasi, which can make it easy to debug and deploy Drasi components.
Although this is **not required**, you can use this during our tutorial if you want a terminal-free experience.

{{< tabpane >}}

{{% tab header="Github Codespaces" text=true %}}

Your codespace already has the Drasi extension installed:

{{< figure src="Codespaces_05_DrasiExtension.png"
  alt="VS Code showing Drasi extension installed in Codespaces" width="100%" >}}

{{% /tab %}}

{{% tab header="VSCode DevContainer" text=true %}}

Your dev container already has the Drasi extension installed:

{{< figure src="Devcontainer_07_DrasiExtension.png"
  alt="VS Code showing Drasi extension installed in Dev Container" width="100%" >}}

{{% /tab %}}

{{% tab header="Local Setup" text=true %}}

You can install the VSCode Extension by following [the instructions here](../../reference/vscode-extension/#installation).

**Note:** If you are using VSCode and installing the extension, it is recommended to open the folder `learning/tutorial/building-comfort` in VSCode.
This is because the extension automatically lists all the Drasi YAMLs found in your workspace and the screenshots in the rest of this tutorial assume the set of YAMLs within the path mentioned earlier. If you have `learning` or other a different path opened in VSCode, you might see a different set of source, query and reaction YAMLs.

{{% /tab %}}

{{% /tabpane %}}

### Drasi Source

Sources in Drasi provide connectivity to the systems that are sources of
  change. You can learn {{< relurl "concepts/sources" "more about Drasi Sources here" >}}.

Navigate to the `drasi` directory within your workspace (`tutorial/building-comfort/drasi`):

```sh
cd drasi
```

We have provided a YAML file `source-facilities.yaml` that has the connection parameters for the postgreSQL database that stores the latest sensor measurements.

```yaml
apiVersion: v1
kind: Source
name: building-facilities
spec:
  kind: PostgreSQL
  properties:
    host: postgres.default.svc.cluster.local
    port: 5432
    user: test
    password: test
    database: building-comfort-db
    ssl: false
    tables:
      - public.Building
      - public.Floor
      - public.Room
```

This YAML tells Drasi how to connect to the PostgreSQL database.

{{< tabpane >}}

{{% tab header="VSCode Extension" text=true %}}

Find the source in the Workspace inside Drasi VSCode Extension as shown here, and click "Apply":

{{< figure src="Devcontainer_08_ApplySource.png"
  alt="Drasi VS Code extension showing Apply button for building-facilities source" width="35%" >}}

You will get a pop-up on the bottom right corner of your screen. Confirm if you want to deploy the source.

{{< figure src="Devcontainer_09_ConfirmSource.png"
  alt="VS Code popup confirming deployment of building-facilities source" width="60%" >}}

You will see the source with a Red icon - which means we need to wait for few seconds for the source to come online:

{{< figure src="Devcontainer_10_WaitSource.png"
  alt="Drasi VS Code extension showing building-facilities source with red icon while deploying" width="35%" >}}

The source will show up with a Green icon when it is ready for use. Try the refresh button shown here if it does not become ready within a couple minutes:

{{< figure src="Devcontainer_11_ReadySource.png"
  alt="Drasi VS Code extension showing building-facilities source ready with green icon" width="35%" >}}

{{% /tab %}}

{{% tab header="Drasi CLI" text=true %}}

Use the following commands to apply the source, and wait for it to come online:

```sh
drasi apply -f source-facilities.yaml
drasi wait source building-facilities -t 120
```
<br/>

Verify the source is online:

```sh
drasi list source
```
<br/>

The source should be listed with AVAILABLE set to `true`:
```
          ID          | AVAILABLE | MESSAGES  
----------------------+-----------+-----------
  building-facilities | true      |           
```

{{% /tab %}}

{{% /tabpane %}}

### Continuous Queries

Continuous Queries are the mechanism by which you tell Drasi what changes to
  detect in source systems as well as the data you want distributed when changes
  are detected. You can read
  {{< relurl "concepts/continuous-queries" "more about them here" >}}.

For our scenario, we have placed a few query YAML files inside the `drasi` subdirectory.

#### Query for the UI

Let's write a query that provides all buildings, floors and rooms to the UI to
  create the dashboard.

```cypher
    MATCH
      (r:Room)-[:PART_OF_FLOOR]->(f:Floor)-[:PART_OF_BUILDING]->(b:Building)
    WITH
      r,
      f,
      b,
      floor( 50 + (r.temperature - 72) + (r.humidity - 42) + CASE WHEN r.co2 > 500 THEN (r.co2 - 500) / 25 ELSE 0 END ) AS ComfortLevel
    RETURN
      r.id AS RoomId,
      r.name AS RoomName,
      f.id AS FloorId,
      f.name AS FloorName,
      b.id AS BuildingId,
      b.name AS BuildingName,
      r.temperature AS Temperature,
      r.humidity AS Humidity,
      r.co2 AS CO2,
      ComfortLevel
```
#### Synthetic Relationships
Note that in our Cypher query we want to relate the rooms to the floor and the
  building they are part of. This relation is expressed intuitively in the
  MATCH phrase of the Cypher query.

However, our existing datastore for sensor metrics may or may not have existing
  relationships. That is not a problem for Drasi because we can model
  "Synthetic Relationships" for use in our query.

We have the query for our UI defined in the file `query-ui.yaml` that provides all buildings, floors and rooms to the UI.
This query:
- Joins rooms to floors and buildings using synthetic relationships
- Calculates comfort level for each room
- Returns all data needed for the dashboard

The full YAML looks like this:
```yaml
kind: ContinuousQuery
apiVersion: v1
name: building-comfort-ui
spec:
  mode: query
  sources:
    subscriptions:
      - id: building-facilities
        nodes:
          - sourceLabel: Room
          - sourceLabel: Floor
          - sourceLabel: Building
    joins:
      - id: PART_OF_FLOOR
        keys:
          - label: Room
            property: floor_id
          - label: Floor
            property: id
      - id: PART_OF_BUILDING
        keys:
          - label: Floor
            property: building_id
          - label: Building
            property: id
  query: >
    MATCH
      (r:Room)-[:PART_OF_FLOOR]->(f:Floor)-[:PART_OF_BUILDING]->(b:Building)
    WITH
      r,
      f,
      b,
      floor( 50 + (r.temperature - 72) + (r.humidity - 42) + CASE WHEN r.co2 > 500 THEN (r.co2 - 500) / 25 ELSE 0 END ) AS ComfortLevel
    RETURN
      r.id AS RoomId,
      r.name AS RoomName,
      f.id AS FloorId,
      f.name AS FloorName,
      b.id AS BuildingId,
      b.name AS BuildingName,
      r.temperature AS Temperature,
      r.humidity AS Humidity,
      r.co2 AS CO2,
      ComfortLevel
```

In the above query for instance, `PART_OF_FLOOR` is a synthetic relationship
  that we use to inform Drasi that a room in the 'Room' table is connected to
  (part-of) a floor in the 'Floor' table. This is specified in the `joins`
  section of the YAML.

Likewise we have another synthetic relationship in the `joins` section for
  `PART_OF_BUILDING` that connects floors to buildings.

#### Other Queries

The file `query-comfort-calc.yaml` has **2** queries for floor and building-level comfort calculations. These queries aggregate comfort levels at different levels of the building hierarchy.

The file `query-alert.yaml` has **3** queries to detect comfort level violations. These queries monitor when comfort levels go outside the acceptable range [40, 50]. The `room-alert` raises alerts for rooms out of range, `floor-alert` raises alerts for floors out of range, and `building-alert` raises alerts at the building level.

#### Deploying Queries

{{< tabpane >}}

{{% tab header="VSCode Extension" text=true %}}

Find the query in the workspace inside Drasi VSCode Extension as shown here, and click "Apply":

{{< figure src="Devcontainer_12_ApplyQuery.png"
  alt="Drasi VS Code extension showing Apply button for building-comfort-ui query" width="35%" >}}

You will get a pop-up on the bottom right corner of your screen. Confirm if you want to deploy the query.

{{< figure src="Devcontainer_13_ConfirmQuery.png"
  alt="VS Code popup confirming deployment of building-comfort-ui query" width="60%" >}}

VS Code extension also allows you to **debug** queries and see their live result set. When you select the query, you can see its definition. And when you click on the debug button for the ui query:

{{< figure src="Devcontainer_14_DebugQuery.png"
  alt="Drasi VS Code extension showing Debug button for building-comfort-ui query" width="80%" >}}

You can see the live result set maintained by the query like this:

{{< figure src="Devcontainer_15_QueryOutput.png"
  alt="Drasi VS Code extension showing live query results with building, floor, and room data" width="80%" >}}

Deploy all the 6 queries, and once they are all running, your Drasi extension should look like this:

{{< figure src="Devcontainer_16_AllQueries.png"
  alt="Drasi VS Code extension showing all 6 queries deployed and ready" width="35%" >}}

{{% /tab %}}

{{% tab header="Drasi CLI" text=true %}}

Apply all the queries to Drasi from the `drasi` directory within your workspace (`tutorial/building-comfort/drasi`)

```sh
drasi apply -f query-ui.yaml
drasi apply -f query-comfort-calc.yaml
drasi apply -f query-alert.yaml
```
<br/>

Verify all queries are running:

```sh
drasi list query
```
<br/>

You should see 6 queries total, and all of them in the running state:
```
              ID              | CONTAINER | ERRORMESSAGE |              HOSTNAME               | STATUS   
------------------------------+-----------+--------------+-------------------------------------+----------
  room-alert                  | default   |              | default-query-host-6775c649fd-k9ccr | Running  
  building-alert              | default   |              | default-query-host-6775c649fd-k9ccr | Running  
  floor-alert                 | default   |              | default-query-host-6775c649fd-k9ccr | Running  
  building-comfort-level-calc | default   |              | default-query-host-6775c649fd-k9ccr | Running  
  floor-comfort-level-calc    | default   |              | default-query-host-6775c649fd-k9ccr | Running  
  building-comfort-ui         | default   |              | default-query-host-6775c649fd-k9ccr | Running 
```

{{% /tab %}}

{{% /tabpane %}}

### SignalR Reaction

Reactions process the stream of query result changes output by one or more
  Drasi Queries and act on them. You can read
  {{< relurl "concepts/reactions" "more about Drasi Reactions here" >}}.

For our scenario, we will use the **SignalR reaction**, which provides access to the result set maintained by Drasi queries through a web socket server. It comes with React & Vue components that make it easy to develop reactive dashboards.

{{< tabpane >}}

{{% tab header="VSCode Extension" text=true %}}

Find the reaction in the Workspace inside Drasi VSCode Extension as shown here, and click "Apply":

{{< figure src="Devcontainer_17_DeployReaction.png"
  alt="Drasi VS Code extension showing Apply button for SignalR reaction" width="30%" >}}

You will notice the reaction deploying. The red icon means that it is not ready yet. Wait for the reaction to get fully deployed.

{{< figure src="Devcontainer_18_WaitReaction.png"
  alt="Drasi VS Code extension showing SignalR reaction deploying with red icon" width="30%" >}}

Once the reaction is ready, the icon will turn green like this:

{{< figure src="Devcontainer_19_ReactionReady.png"
  alt="Drasi VS Code extension showing SignalR reaction ready with green icon" width="30%" >}}

Now you have a websocket server up & running inside the Drasi Cluster.
Since our frontend dashboard will be running on localhost, we need to create a tunnel.
For this, **Right Click** on the reaction and select **Open Tunnel** as shown here:

{{< figure src="Devcontainer_20_OpenTunnel.png"
  alt="Drasi VS Code extension context menu showing Open Tunnel option" width="30%" >}}

You will get a prompt to specify the port number. We have setup the dashboard to expect signalR hub at port **`8080`**. Therefore, please **set the value as 8080 here** as shown here:

{{< figure src="Devcontainer_21_PortNumber.png"
  alt="VS Code prompt to enter port number 8080 for tunnel" width="80%" >}}

{{% /tab %}}

{{% tab header="Drasi CLI" text=true %}}

Deploy the SignalR reaction:

```sh
drasi apply -f reaction-signalr.yaml
drasi wait reaction building-signalr-hub -t 120
```
<br />

Verify the reaction is online:

```sh
drasi list reaction
```

The output should be something like this:

```
           ID          | AVAILABLE | MESSAGES  
-----------------------+-----------+-----------
  building-signalr-hub | true      |           
```
<br />

Now you have a websocket server up & running inside the Drasi Cluster.
Since our frontend dashboard will be running on localhost, we need to create a tunnel.
Use the following command to create a tunnel:

```sh
drasi tunnel reaction building-signalr-hub 8080
```
<br/>

**Note:** Keep this running, as long as you want the dashboard to be live.

{{% /tab %}}

{{% /tabpane %}}

#### Port Forwarding

{{< tabpane >}}

{{% tab header="Github Codespaces" text=true %}}

Drasi is running inside a k3d cluster inside your github codespaces container.
The Drasi tunnel for SignalR reaction has made the port accessible inside the codespace at port `8080`.
The dashboard will however run your local browser. Github codespaces automatically would have forwarded port `8080`.

**Note: Please make the port visibility as public:**
1. Go to the PORTS tab in VS Code and **Right click on port 8080**
2. Select Port Visibility
3. Mark it as public
4. Make sure that the port is marked as Public.

{{< figure src="Codespaces_21_EnsurePublicPort.png"
  alt="VS Code Ports tab showing how to make port 8080 public" width="100%" >}}

The demo should now be accessible at **`https://<your-codespace-id>-8123.app.github.dev/`**, and it should look like this:

{{< figure src="Codespaces_22_DashboardLive.png"
  alt="Demo portal showing live connected building comfort dashboard" width="100%" >}}

{{% /tab %}}

{{% tab header="VSCode DevContainer" text=true %}}

Drasi is running inside a k3d cluster inside your github codespaces container.
The Drasi tunnel for SignalR reaction has made the port accessible inside the codespace at port `8080`.
The dashboard will however run your local browser. VS Code usually forwards port `8080` to the same port on localhost automatically.

**Note: Please make sure that port 8080 is forwarded to 8080 on localhost:**
1. Go to the PORTS tab in VS Code
2. Make sure an entry for port 8080 exists
3. Make sure that it is forwarded to port 8080 on localhost.

{{< figure src="Devcontainer_22_EnsurePort.png"
  alt="VS Code Ports tab showing port 8080 forwarded to localhost" width="100%" >}}

The demo should now be accessible at **`http://localhost:8123/`**, and it should look like this:

{{< figure src="Devcontainer_23_DashboardLive.png"
  alt="Demo portal showing live connected building comfort dashboard" width="100%" >}}

{{% /tab %}}

{{% tab header="Local Setup" text=true %}}

**No need to port forward**. The Drasi Tunnel should already make your signalR reaction available in your machine at local port 8080.

The demo should now be accessible at **`http://localhost:8123/`**, and it should look like this:

{{< figure src="Devcontainer_23_DashboardLive.png"
  alt="Demo portal showing live connected building comfort dashboard" width="100%" >}}

{{% /tab %}}

{{% /tabpane %}}

### Testing the Reactiveness

Open the demo portal to see both the dashboard and control panel together. Try these scenarios:

1. **Break a Room**:
  - Focus on the lower frame on the demo page which has the control panel.
  - Find the controls for **`Building 01` → `Floor 01` → `Room 02`**.
  - Click the "Break" button as shown in the screenshot below:

{{< figure src="DevContainer_24a_BreakFloor1Room2.png"
  alt="Click Break button for Room 02 on Floor 01 in the control panel" width="80%" >}}

  - This button adjusts the values for the room's sensors
  - Within a couple seconds you should see the room's indicator turn red 
  - As the screenshot below shows, the average comfort level of `Floor 01` and `Building 01` also drops
  - In the (yellow) Alerts section on the left, we see two alerts - one for `Room 02` and another for `Floor 01` both of which are now out of comfortable range.

{{< figure src="DevContainer_24b_BrokeFloor1Room2.png"
  alt="Dashboard showing Room 02 on Floor 01 broken with red indicator and alert" width="80%" >}}

2. **Trying Break another Room**:
  - Next find the controls for **`Building 01` → `Floor 01` → `Room 03`** in the Control Panel.
  - Click the "Break" button for **Room 03** for **Floor 01** as shown in screenshot below.

{{< figure src="DevContainer_25a_BreakFloor1Room3.png"
  alt="Click Break button for Room 03 on Floor 01 in the control panel" width="80%" >}}

  - See the reactiveness again, as within a couple of seconds, both rooms showing their own alerts.
  - As the screenshot below shows, the average comfort level of `Floor 01` and `Building 01` also drops further.
  - The comfort level of `Floor 01` drops further down to 18 from the previous value of 32.
  - In the (yellow) Alerts section on the left, we see an additional alert for `Room 03` which is now also out of comfortable range.

{{< figure src="DevContainer_25b_BrokeFloor1Room3.png"
  alt="Dashboard showing two broken rooms on Floor 01 with comfort level dropped to 18" width="80%" >}}

3. **Breaking a Room on another floor**:
  - Next scroll down in the Control Panel to find the controls for **`Building 01` → `Floor 02` → `Room 02`**.
  - Click the "Break" button for **Room 02** for **Floor 02** as shown in screenshot below.

{{< figure src="Devcontainer_26a_BreakFloor2Room2.png"  
  alt="Click Break button for Room 02 on Floor 02 in the control panel" width="80%" >}}

  - Within a couple of seconds, we see that the dashboard indicator for `Room 02` in `Floor 01` turns red.
  - As the screenshot below shows, the average comfort level of `Floor 02` drops and `Building 01` also drops further to `32`.
  - In the (yellow) Alerts section on the left, we see an additional alerts for `Room 02` and `Floor 02`.

{{< figure src="DevContainer_26b_BrokeFloor2Room2.png"
  alt="Dashboard showing two broken rooms on Floor 01 and another on Floor 02" width="80%" >}}

4. **Reset a Room**:
  - In the Control-Panel, let's click the **Reset** button for `Floor 01` and `Room 03` as shown in screenshot below:

{{< figure src="DevContainer_27a_ResetFloor1Room3.png"
  alt="Click Reset button for Room 03 on Floor 01 in the control panel" width="80%" >}}

  - Within a couple of seconds we see that alerts for this room are gone.
  - As shown in screenshot below, the room's indicator is no longer red.

{{< figure src="DevContainer_27b_ResetFloor1Room3.png"
  alt="Dashboard showing Room 03 on Floor 01 recover" width="80%" >}}

5. **Reset another Room**:
  - Scroll down in the Control-Panel to find the **Reset** button for `Floor 02` and `Room 02` as shown in screenshot below, and click it:

{{< figure src="DevContainer_28a_ResetFloor2Room2.png"
  alt="Click Reset button for Room 02 on Floor 02 in the control panel" width="80%" >}}

  - Within a couple of seconds we see that alerts for this `Room 02` on `Floor 02` are gone.
  - As shown in screenshot below, the room's indicator is no longer red.

{{< figure src="DevContainer_28b_ResetFloor2Room2.png"
  alt="Dashboard showing Room 02 on Floor 02 recover" width="80%" >}}

6. **Reset remaining room**:
  - In the Control-Panel, find the **Reset** button for `Floor 02` and `Room 02` and click on it as shown in screenshot below:

{{< figure src="DevContainer_29a_ResetFloor1Room2.png"
  alt="Click Reset button for Room 02 on Floor 01 in the control panel" width="80%" >}}

  - Within a couple of seconds we see that alerts for this `Room 02` on `Floor 01` are also gone.
  - As shown in screenshot below, the room's indicator is no longer red.
  - All the alerts are also gone now.

{{< figure src="DevContainer_29b_ResetFloor1Room2.png"
  alt="Dashboard showing Room 02 on Floor 01 recover" width="80%" >}}

Feel free to explore more by adjusting individual sensors for various rooms on the control panel:
  - Use the sliders to change temperature, humidity, or CO2
  - See real-time comfort level calculations
  - Watch as rooms, floors, and buildings change colors based on average comfort
  - Observe how changes propagate up the hierarchy

As you can see our new dashboard updates instantly as you make changes, demonstrating Drasi's ability to:
- Detect changes in the PostgreSQL database
- Calculate complex metrics using Cypher queries
- Push updates in real-time via SignalR

## Reflection

Congratulations! You were able to build a reactive dashboard UI for the
  building management scenario using Drasi. Let's reflect on the journey we've
  been on.

### Work with existing systems

We did not need to make any changes to the existing system we had setup with
  sensors and the data store (Postgres). We were able to add the existing
  Postgres instance as a `Source` in Drasi which opened the system to queries.
  This source was created using a YAML file which simply describes the
  connection parameters of the datastore.

[Synthetic Relationships](#synthetic-relationships) in Drasi also helped us
  express the hierarchy between Rooms, Floors and Buildings.

### No Code

Adding the source in Drasi opened up the world of Continuous Queries. We were
  able to write the queries for `Comfort Level` in a declarative Cypher query
  without worrying about implementation. Using declarative Cypher query, we
  could intuitively express the business logic of the changes we wanted to
  monitor.

Drasi can represent one or more existing data sources as Graphs which can be
  linked together using [Synthetic Relationships](#synthetic-relationships).

### Reactiveness

With the SignalR hub giving us data about Buildings, Floors and Rooms, the
  dashboard almost instantly reflects any changes to the measurements.
  If we fiddle with the Control Panel to mock changes in sensor measurements, we
  can see clearly that the dashboard reacts to it in near real time.

### Summary

With this hypothetical scenario we are able to see how Drasi can help us build
  reactive systems out of existing systems.
  Learn {{< relurl "concepts/overview" "more about \"Why Drasi?\" here" >}}.

### Cleanup

{{< tabpane >}}

{{% tab header="Github Codespaces" text=true %}}

Simply close the codespace window - No cleanup required.
You may choose to delete your codespace to avoid additional billed usage.

{{% /tab %}}

{{% tab header="VSCode DevContainer" text=true %}}

Simply close your devcontainer and clean it up using the VS Code extension.
Or, you can delete the docker container from Docker Desktop.

{{% /tab %}}

{{% tab header="Local Setup" text=true %}}

To clean up the tutorial, you can run the following scripts at the path **`tutorial/building-comfort`:**

**macOS/Linux:**
```sh
./scripts/cleanup-tutorial.sh
```
<br/>

**Windows (PowerShell):**
```powershell
.\scripts\cleanup-tutorial.ps1
```
<br />

This will give you options to:
1. Delete tutorial resources (apps, database)
2. Uninstall Drasi (optional)
3. Delete the k3d cluster (optional)

{{% /tab %}}

{{% /tabpane %}}

### What's next?

You can try the next guided tutorial in our series that demonstrates additional
capabilities of Drasi - multiple data sources & reacting to non-events.
{{< relurl "tutorials/curbside-pickup" "The Curbside Pickup tutorial" >}}
will guide you using a scenario of Curbside Pickup management for a Store.

Here are some additional resources:

- Learn more about {{< relurl "concepts/sources" "Drasi sources here" >}}.
- Learn more about {{< relurl "concepts/continuous-queries" "Continuous queries here" >}}.
- Learn more about {{< relurl "concepts/reactions" "Drasi Reactions here" >}}.

### Appendix: Database Client

If you want to look at the PostgreSQL database, you may use psql for your local setup.
For codespaces and devcontainers, we have included a DB Client extension:

{{< figure src="Devcontainer_30_DbClientConnection.png"
  alt="Database Client extension showing PostgreSQL connection configuration" width="100%" >}}

**Note:** For this to work, you must run a port-forward on the postgres service running on k3d.

### Appendix: Additional Scripts

If you want to modify the applications, the tutorial includes helpful scripts:

#### Hot Reload for Development

**macOS/Linux:**
```sh
# Rebuild and deploy the control panel with your changes
cd tutorial/building-comfort
./scripts/dev-reload.sh control-panel
```

**Windows (PowerShell):**
```powershell
cd tutorial\building-comfort
.\scripts\dev-reload.ps1 control-panel
```

This script:
- Builds a new Docker image from local source
- Imports it into the k3d cluster
- Updates the deployment to use your custom image

#### Reset to Official Images

**macOS/Linux:**
```sh
# Reset a single app
./scripts/reset-images.sh control-panel

# Reset all apps
./scripts/reset-images.sh all
```

**Windows (PowerShell):**
```powershell
# Reset a single app
.\scripts\reset-images.ps1 control-panel

# Reset all apps
.\scripts\reset-images.ps1 all
```