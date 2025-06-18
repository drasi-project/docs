---
type: "docs"
title: "Building Comfort with Drasi"
linkTitle: "Building Comfort with Drasi"
weight: 40
description: >
    Learn how to use Drasi in a building management scenario
---

## Scenario
Imagine a hypothetical building management scenario where we have buildings
    with several floors, with each floor having several rooms. Each room has
    sensors that measure the following:
* Temperature
* CO2 levels
* Humidity

Each sensor logs its latest reading to a datastore.

### Building a reactive dashboard
Imagine a metric called Comfort Level that is computed using the following
  simplified formula:

```
comfortLevel = trunc(50 + (temp - 72) + (humidity - 42) + if(CO2 > 500, (CO2 - 500) / 25, 0))
```

A range of 40 to 50 is considered acceptable: a value below 40 indicates that
  temperature and/or humidity is too low, while a value above 50 indicates that
  temperature, humidity, and/or CO2 levels are too high.

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

Following is how the architecture looks like with Drasi:

```
|--Existing System--|
                              
Sensors → PostgreSQL →→→→→→ Drasi Source → Drasi Queries → Drasi Reaction → Frontend
                              (config)     (Declarative)       (config)
|-----No Change-----|
```

## Building Comfort with Drasi

The rest of this tutorial will guide us in setting up a mock building
  management scenario and demonstrate how we can get a Reactive Dashboard built
  for existing systems with just some config files and Cypher queries.

### Tutorial Modes

You can follow along the steps below in a Github codespace, a VSCode Dev
  Container or your own Kubernetes environment.

{{< tabpane >}}

{{% tab header="Github Codespaces" text=true %}}

The easiest way to follow along with this tutorial is to launch a Github
  Codespace using the link below. This will allow you to run the example
  application within your browser without setting up anything on your own
  machines.

[![Open in Github Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/drasi-project/learning?devcontainer_path=.devcontainer%2Fbuilding-comfort%2Fdevcontainer.json&machine=standardLinux32gb)

This will open a page with some configuration options. Make sure that the
  'Branch' selected is `main` and set the 'Dev Container configuration' to
  'Building Comfort with Drasi'.

{{< figure src="Screenshot_BuildingComfort_CodespacesConfig.png"
  alt="Screenshot showing configuration for Codespaces" width="80%" >}}

{{% /tab %}}

{{% tab header="VSCode DevContainer" text=true %}}

To follow along with a Dev Container, you will need to install:
- [Visual Studio Code](https://code.visualstudio.com/)
    (or [Insiders Edition](https://code.visualstudio.com/insiders))
- Visual Studio Code [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) 
- [docker](https://www.docker.com/get-started/)

Next, [clone the learning repo from Github](https://github.com/drasi-project/learning),
  and open the repo in VS Code. Make sure that Docker daemon
  (or Docker Desktop) is running.

#### Recommended Docker Resources

For optimal performance with the Drasi Dev Container, we recommend configuring Docker with the following minimum resources:

- **CPU**: 3 cores or more
- **Memory**: 4 GB or more
- **Swap**: 1 GB or more
- **Disk**: 272 GB available space 

To adjust these settings in Docker Desktop:
1. Open Docker Desktop
2. Go to Settings (gear icon)
3. Navigate to "Resources" → "Advanced"
4. Adjust the sliders to meet or exceed the recommended values
5. Click "Apply & Restart"


Once the solution is open in VS Code, follow these steps:
- Press Cmd + Shift + P (on MacOS) or Ctrl + Shift + P (Windows or Linux) to
    launch the command palette.
- Select `Dev Containers: Rebuild and Reopen in Container`.
- Select the `Building Comfort with Drasi` option to launch this tutorial.


##### Recommended Docker Resources

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


{{% /tab %}}

{{% tab header="Local Setup" text=true %}}

You need to have your own Kubernetes cluster setup.
You can use any Kubernetes setup.
For a local testing setup, you can choose one of alternatives
  like Kind, Minikube or k3d.

Make sure that `kubectl` on your system points to your Kubernetes cluster.
You will also need `python` and `npm` installed.

{{% /tab %}}

{{% /tabpane %}}

### Setup the Datastore
For this tutorial, let's imagine that the datastore is a PostgreSQL DB.
Below is the representation of the schema:

```
+--------------------+      +--------------------+       +--------------------+
|      Building      |      |       Floor        |       |       Room         |
+--------------------+      +--------------------+       +--------------------+
| id (PK)            |      | building_id        |       | id (PK)            |
| name               |      | id (PK)            |       | floor_id           |
+--------------------+      | name               |       | name               |
                            +--------------------+       | temperature        |
                                                         | humidity           |
                                                         | co2                |
                                                         +--------------------+
```

Perform the following steps to setup a PostgreSQL database and load it with
  some sample data.

{{< tabpane >}}
{{% tab header="Github Codespaces" text=true %}}

The container already has a K3D cluster with postgreSQL service running on it
  with the port forwarded. Verify this by running `psql` and checking that
  three tables for Building, Floor and Room exist in the DB.

```sh
psql
```

<br />

```
building-comfort-db=# \dt
         List of relations
 Schema |   Name   | Type  | Owner 
--------+----------+-------+-------
 public | Building | table | test
 public | Floor    | table | test
 public | Room     | table | test
(3 rows)
```

{{% /tab %}}
{{% tab header="VSCode DevContainer" text=true %}}

The container already has a K3D cluster with postgreSQL service running on it
  with the port forwarded. Verify this by running `psql` and checking that
  three tables for Building, Floor and Room exist in the DB.

```sh
psql
```

<br />

```
building-comfort-db=# \dt
         List of relations
 Schema |   Name   | Type  | Owner 
--------+----------+-------+-------
 public | Building | table | test
 public | Floor    | table | test
 public | Room     | table | test
(3 rows)
```

{{% /tab %}}

{{% tab header="Local Setup" text=true %}}

You need to have a PostgreSQL service running.
You can deploy the `postgres.yaml` file located in the `devops/data` directory.
This YAML file will deploy the service and also create the DB with 3 tables.
If you want to use an existing postgre instance, you can specify the connection
parameters in `config.py` located in the same directory.

```sh
cd devops/data
kubectl apply -f postgres.yaml
```

You'll also need to create a port-forward to make the Postgres service
  accessible on localhost.

```sh
kubectl port-forward svc/postgres 5432:5432 &
```

Verify this by running `psql` in a new terminal and checking that three tables
  for Building, Floor and Room exist in the DB.

```sh
psql -h localhost -U test -d building-facilities
```

<br />

```
building-comfort-db=# \dt
         List of relations
 Schema |   Name   | Type  | Owner 
--------+----------+-------+-------
 public | Building | table | test
 public | Floor    | table | test
 public | Room     | table | test
(3 rows)
```

{{% /tab %}}

{{% /tabpane %}}

Let's use the scripts in the `devops/data` directory to load the initial
  dataset. Open a new terminal and use the following commands to execute the
  `load_db.py` script. Optionally, you can customize the number of buildings
  you want, the number of floors you want in each building, and the desired
  number of rooms per floor by changing the values in `config.py`.

```sh
cd devops/data

python3 -m venv .venv && source .venv/bin/activate && pip3 install -r requirements.txt

python3 load_db.py

deactivate
```

You can confirm that the tables are now populated with some data using the
  `psql` shell like so:

```
building-comfort-db=# Select * From "Room";

      id       |  name   | temperature | humidity | co2 |  floor_id   
---------------+---------+-------------+----------+-----+-------------
 room_01_01_01 | Room 01 |          70 |       40 |  10 | floor_01_01
 room_01_01_02 | Room 02 |          70 |       40 |  10 | floor_01_01
 room_01_02_01 | Room 01 |          70 |       40 |  10 | floor_01_02
 room_01_02_02 | Room 02 |          70 |       40 |  10 | floor_01_02
 ...
```

### Control Panel
To mock the physical sensors for our hypothetical scenario, we will setup a
  Control Panel which can update the values in the datastore mimicking what
  the sensors would have done. This is a combination of a simple Python Flask
  backend exposing APIs that will be invoked by a NodeJS frontend. All the code
  lives inside the `control-panel` directory.

##### Backend

Open a new terminal and execute the following commands. This should start a
  simple server that can read from and write to the datastore.

```sh
cd control-panel/backend

python3 -m venv .venv && source .venv/bin/activate && pip3 install -r requirements.txt

python3 app.py
```

By default this will start listening on port 58580 and expects the PostgreSQL
  service to be available on localhost:5432. You can change these configs in
  the `.env` file in the `control-panel/backend` directory.

{{< tabpane >}}
{{% tab header="Github Codespaces" text=true %}}

Your backend server will listen on port `58580`. GitHub will expose the backend on a URL like `https://<your-codespace-id>-58580.app.github.dev/` where you need to plug in your codespace id.

For the control panel to be able to access it, we need to make its visibility `Public`.
{{< figure src="Screenshot_PortVisibility.png" alt="Screenshot showing how to make your port public." width="50%" >}}

Here is how your port 58580 entry should look like in the `Ports` tab:
{{< figure src="Screenshot_Public58580.png" alt="Screenshot showing how to make your port public." width="100%" >}}

For troubleshooting, you can check if data from the backend is accessible at `https://<your-codespace-id>-58580.app.github.dev/buildings/building_01/floors/floor_01_01/rooms` as an example.

{{% /tab %}}
{{% tab header="VSCode DevContainer" text=true %}}

Your backend server will listen on port `58580`. These should be accessible on `localhost`.

Your port will be automatically forwarded by VSCode. You can check this from the ports tab in VS Code.

For troubleshooting, you can check if data from the backend is accessible at `http://localhost:58580/buildings/building_01/floors/floor_01_01/rooms` as an example.

{{% /tab %}}
{{% tab header="Local Setup" text=true %}}

Your backend server will listen on port `58580`. These should be accessible on `localhost`.

No port forwarding is required for local setup.

For troubleshooting, you can check if data from the backend is accessible at `http://localhost:58580/buildings/building_01/floors/floor_01_01/rooms`.

{{% /tab %}}
{{% /tabpane %}}

##### Frontend

{{< tabpane >}}
{{% tab header="Github Codespaces" text=true %}}

Take note of the URL at which your Control Panel backend is running.

It should look something like this:
  `https://<your-codespace-id>-<port>.app.github.dev`
  where port should be 58580 unless changed.

Open the file `control-panel/frontend/src/config.json` and provide the
  crudApiUrl like so:

```json
{
    "crudApiUrl": "https://<your-codespace-id>-<port>.app.github.dev"
}
```

{{% /tab %}}
{{% tab header="VSCode DevContainer" text=true %}}

By default the backend runs on port 58580 on localhost. If you changed the
  port, then please update the URL in `control-panel/frontend/src/config.json`.

```
{
    "crudApiUrl": "http://localhost:58580/"
}
```

{{% /tab %}}
{{% tab header="Local Setup" text=true %}}

By default the backend runs on port 58580 on localhost. If you changed the
  port, then please update the URL in `control-panel/frontend/src/config.json`.

```
{
    "crudApiUrl": "http://localhost:58580/"
}
```

{{% /tab %}}
{{% /tabpane %}}

Open another terminal, navigate to the `control-panel/frontend` directory and
  launch the node frontend using the following steps.

```sh
cd control-panel/frontend

npm install

npm start
```

##### Using the Control Panel

{{< tabpane >}}
{{% tab header="Github Codespaces" text=true %}}

Your front end should start on port `3000` by default. GitHub will expose the
  frontend on a URL like `https://<your-codespace-id>-3000.app.github.dev/`
  where you need to plug in your codespace id.

When the front end launches, you should see a pop up on the bottom right corner
  of your screen like this:

{{< figure src="Screenshot_OpenPortInBrowser.png" alt="Screenshot showing how to open frontend in browser." width="50%" >}}

Click on the button to open it in browser.

If you're unable to access the frontend, check the port at which frontend is
  running. You can also open URL from the PORTS tab in the codespace. If the
  backend uses a different port, update the URL in
  `control-panel/frontend/src/config.json`.

{{% /tab %}}

{{% tab header="VSCode DevContainer" text=true %}}

Your backend server will listen on port `58580` and front end accessible on
  port `3000`. These should be accessible on `localhost`.

If you're unable to access the frontend, check the port at which frontend is
  running. You can also open URL from the PORTS tab in the dev container. If
  the backend starts on a different port, please change the URL in
  `control-panel/frontend/src/config.json`.

{{% /tab %}}

{{% tab header="Local Setup" text=true %}}

Your backend server will listen on port `58580` and front end accessible on
  port `3000`. These should be accessible on `localhost`.

If you're unable to access the frontend, check the port at which frontend is
  running. If the backend starts on a different port, please change the URL in
  `control-panel/frontend/src/config.json`.

{{% /tab %}}

{{% /tabpane %}}

You should be able to see the Control Panel in your browser like this. You can
  change sensor values for any of the rooms using the controls.

{{< figure src="Screenshot_ControlPanel.png" alt="Screenshot showing Control Panel to fiddle with sensor values." width="60%" >}}

You can fiddle with this UI to change sensor values for any room. This will
  update the database.

### Configure Drasi

Now that we have setup our scenario with ability to mock sensors, let's see how
  can we react to changes happening in the database using Drasi.

#### Installation

{{< tabpane >}}
{{% tab header="Github Codespaces" text=true %}}

Your dev container has Drasi already installed and setup.
  Continue along with steps below.

{{% /tab %}}
{{% tab header="VSCode DevContainer" text=true %}}

Your dev container has Drasi already installed and setup.
  Continue along with steps below.

{{% /tab %}}
{{% tab header="Local Setup" text=true %}}

Ensure that your `kubectl` points to your target Kubernetes cluster.

Install Drasi using [the instructions here](https://drasi.io/how-to-guides/installation).

To summarize you can install the CLI using:

```sh
curl -fsSL https://raw.githubusercontent.com/drasi-project/drasi-platform/main/cli/installers/install-drasi-cli.sh | /bin/bash
```
<br />

Next, install Drasi on your Kubernetes cluster, simply run the command:

```sh
drasi init
```
<br />

Check the [installation pages](https://drasi.io/how-to-guides/installation)
  for any troubleshooting.

{{% /tab %}}
{{% /tabpane %}}

#### Drasi Source

Sources in Drasi provide connectivity to the systems that are sources of
  change. Learn {{< relurl "concepts/sources" "more about Sources here" >}}.

In our example, it the postgreSQL DB is going to be modeled as a Drasi source.
  The `source-facilities.yaml` file in `devops/drasi` directory creates a
  source for our DB. If you're using your own postgreSQL instance, you can
  modify the connection params here.

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

Run the following command to create the Drasi source:

```sh
cd devops/drasi

drasi apply -f source-facilities.yaml
```

You can expect the following response:
```
✓ Apply: Source/building-facilities: complete
```

Sources may take a few moments to initialize. You can use the following
  convenient command to wait for it (up to 120 seconds) to come up:

```sh
drasi wait source building-facilities -t 120
```

Once a source is online you should be able to see it like so:

```sh
drasi list source
```

Following should be the output with nothing in the 'Messages' column:
```
          ID          | AVAILABLE | MESSAGES  
----------------------+-----------+-----------
  building-facilities |  true     |
```

##### Troubleshooting the source
Check messages in output of `drasi list source`.

For more details you can also use `drasi describe source building-facilities`.

Check the logs of pods `building-facilities-reactivator-xxxxx` or
  `building-facilities-proxy-xxxxx`. These are deployed under drasi's namespace
  (default: drasi-system) in your kubernetes cluster.

#### Continuous Queries
Continuous Queries are the mechanism by which you tell Drasi what changes to
  detect in source systems as well as the data you want distributed when changes
  are detected. You can read
  {{< relurl "concepts/continuous-queries" "more about them here" >}}.

##### Query for the UI

Let's create a query that provides all buildings, floors and rooms to the UI to
  create the dashboard. For this we use the `query-ui.yaml` file present in the
  `devops/drasi` directory:

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
##### Synthetic Relationships
Note that in our Cypher query we want to relate the rooms to the floor and the
  building they are part of. This relation is expressed intuitively in the
  MATCH phrase of the Cypher query.

However, our existing datastore for sensor metrics may or may not have existing
  relationships. That is not a problem for Drasi because we can model
  "Synthetic Relationships" for use in our query.

In the above query for instance, `PART_OF_FLOOR` is a synthetic relationship
  that we use to inform Drasi that a room in the 'Room' table is connected to
  (part-of) a floor in the 'Floor' table. This is specified in the `joins`
  section of the YAML.

Likewise we have another synthetic relationship in the `joins` section for
  `PART_OF_BUILDING` that connects floors to buildings.

##### Deploying the UI Query
The UI query seems to give all requisite information about the buildings,
  floors and rooms with their metrics for the UI to render. To apply this
  query we can use:

```sh
drasi apply -f query-ui.yaml
```

After this you can check if the query is deployed and is running successfully
  by running:

```sh
drasi list query
```

This should show the status of the query:

```
            ID        | CONTAINER | ERRORMESSAGE |          HOSTNAME          |  STATUS
----------------------+-----------+--------------+----------------------------+-----------
  building-comfort-ui |  default  |              | default-query-host-xxx-xxx |  Running
```

##### More Queries
We can apply the following queries to achieve the desired functionality:

1. To get floor-level comfort level and building-level comfort level
    dynamically computed, we can use `query-comfort-calc.yaml` file
    in the directory `devops/drasi`.

```sh
drasi apply -f query-comfort-calc.yaml
```

2. To get the alerts for rooms, floors or buildings out of desired
    comfort-level range, we can use the queries defined in
    `query-alert.yaml` in the directory `devops/drasi`.

```sh
drasi apply -f query-alert.yaml
```

After this, you should have 6 queries running in total.
This can be seen by running `drasi list query`:

```
              ID              | CONTAINER | ERRORMESSAGE |          HOSTNAME          |  STATUS
------------------------------+-----------+--------------+----------------------------+-----------
  building-comfort-ui         |  default  |              | default-query-host-xxx-xxx |  Running
  floor-comfort-level-calc    |  default  |              | default-query-host-xxx-xxx |  Running
  building-comfort-level-calc |  default  |              | default-query-host-xxx-xxx |  Running
  building-alert              |  default  |              | default-query-host-xxx-xxx |  Running
  floor-alert                 |  default  |              | default-query-host-xxx-xxx |  Running
  room-alert                  |  default  |              | default-query-host-xxx-xxx |  Running
```

#### SignalR Reaction

Reactions process the stream of query result changes output by one or more
  Drasi Queries and act on them. You can read
  {{< relurl "concepts/reactions" "more about Reactions here" >}}.

To implement a reactive UI, we can use any number of frameworks, and we
  would need something that can host a websocket for bidirectional
  communication with the frontend. This should also reliably fall back
  to ServerSentEvents (SSE) or long polling, ensuring broad support across
  different network and client configurations. One could use libraries like
  SignalR, Sockets.IO, Django Channels.

Drasi has a reaction for SignalR available. This simplifies the process, as a
  simple YAML configuration enables a SignalR hub to push updates from any
  Drasi query to the UI. Following is the config located in `devops/drasi`
  directory that lists the queries we're interested in exposing:

```yaml
apiVersion: v1
kind: Reaction
name: building-signalr-hub
spec:
  kind: SignalR
  queries:
    building-comfort-level-calc:
    floor-comfort-level-calc:
    building-alert:
    room-alert:
    floor-alert:
    building-comfort-ui:
  endpoint:
    gateway: 8080
```

In the terminal where you're in directory `devops/drasi`, run the following
  commands to have a SignalR Reaction deployed to your Drasi instance.

```sh
drasi apply -f reaction-signalr.yaml
```

You can expect the following response:
```
✓ Apply: Reaction/building-signalr-hub: complete
```

Note that reactions might take some time to come up. You can use the following
  convenient command to wait for it (up to 120 seconds) to come up:

```sh
drasi wait reaction building-signalr-hub -t 120
```

Once a reaction is online you should be able to see it like so:

```sh
drasi list reaction
```

Following should be the output with nothing in the 'Messages' column:
```
           ID          | AVAILABLE | MESSAGES  
-----------------------+-----------+-----------
  building-signalr-hub | true      |           
```

##### Troubleshooting the reaction
Check messages in output of `drasi list reaction`.

For more details you can also use
  `drasi describe reaction building-signalr-hub`.

Check the logs of pods created for the services `building-signalr-hub-gateway`.
  These are deployed under drasi's namespace (default: drasi-system) in your
  kubernetes cluster. You should also investigate the logs of the pods
  created for source which will have names like `building-signalr-hub-xxxxx`.


##### Port forwarding for Dashboard

The Drasi reaction creates a Kubernetes service `building-signalr-hub-gateway` in the namespace `drasi-system`. This is the SignalR hub our frontend accessible within the Kubernetes cluster.

Since the Dashboard will run in your browser, you will need port forwarding. Run the following command in the terminal.

```sh
kubectl -n drasi-system port-forward svc/building-signalr-hub-gateway 8080:8080
```

This will ensure that the SignalR hub can be accessed from localhost on port 8080. 

{{< tabpane >}}
{{% tab header="Github Codespaces" text=true %}}

Github will also automatically create URL like
  `http://<your-codespace-url>-8080.app.github.dev`. This port needs to be
  made public by by right clicking on port 8080 on the `PORTS` tab like so:

{{< figure src="Screenshot_PortVisibility.png" alt="Screenshot showing how to make port public" width="50%" >}}

Once done, your `8080` port entry in `PORTS` tab should look like this:

{{< figure src="Screenshot_Public8080.png" alt="Screenshot showing port 8080 being public" width="100%" >}}

If all works well, you should be able to access the hub URL:
  `https://<your-codespace-url>-8080.app.github.dev/hub` in your browser
  and see `Connection ID required` on a blank page.

{{< figure src="Screenshot_SignalRHub.png" alt="Screenshot showing Connection ID Required" width="70%" >}}

{{% /tab %}}
{{% tab header="VSCode DevContainer" text=true %}}

VS Code will automatically forward port 8080 to localhost.
  You should be able to access the hub URL:
  `http://localhost:8080/hub` in your browser and see
  `Connection ID required` on a blank page.

{{% /tab %}}
{{% tab header="Local Setup" text=true %}}

No extra step should be needed if you are going to run the realtime dashboard
  locally. You should be able to access the hub URL:
  `http://localhost:8080/hub` in your browser and see
  `Connection ID required` on a blank page.

{{% /tab %}}
{{< /tabpane >}}

### Realtime Dashboard

With the SignalR hub available we can write a reactive dashboard with ease. We
  are able to receive all changelog events from the data source in any frontend
  application.

The [signalR-react package for Drasi](https://www.npmjs.com/package/@drasi/signalr-react)
  further simplifies development of a frontend in react.js. We have implemented
  a simple reactive dashboard using this react package in the `dashboard`
  directory.

An example dashboard shown in the screenshot below is available in the
  `dashboard` directory. We have implemented this example dashboard in NodeJS
  using the react components for Drasi and the source code is available in
  `dashboard` directory. The same components are also
  [available for vue](https://www.npmjs.com/package/@drasi/signalr-vue)
  frontends.

{{< tabpane >}}
{{% tab header="Github Codespaces" text=true %}}

Provide the URL of the signalR hub in `dashboard/src/config.json` as follows. Replace port `8080` if you used a different port number when forwarding the port.

```json
{
  "signalRUrl": "https://<your-codespace-url>-8080.app.github.dev/hub",
  "uiQueryId": "building-comfort-ui",
  "avgFloorQueryId": "building-comfort-level-calc",
  "avgRoomQueryId": "floor-comfort-level-calc",
  "buildingAlertQueryId": "building-alert",
  "floorAlertQueryId": "floor-alert",
  "roomAlertQueryId": "room-alert"
}
```

{{% /tab %}}
{{% tab header="VSCode DevContainer" text=true %}}

Replace port `8080` if you used a different port number when forwarding the port.

```json
{
  "signalRUrl": "http://localhost:8080/hub",
  "uiQueryId": "building-comfort-ui",
  "avgFloorQueryId": "building-comfort-level-calc",
  "avgRoomQueryId": "floor-comfort-level-calc",
  "buildingAlertQueryId": "building-alert",
  "floorAlertQueryId": "floor-alert",
  "roomAlertQueryId": "room-alert"
}
```

{{% /tab %}}
{{% tab header="Local Setup" text=true %}}

Replace port `8080` if you used a different port number when forwarding the port.

```json
{
  "signalRUrl": "http://localhost:8080/hub",
  "uiQueryId": "building-comfort-ui",
  "avgFloorQueryId": "building-comfort-level-calc",
  "avgRoomQueryId": "floor-comfort-level-calc",
  "buildingAlertQueryId": "building-alert",
  "floorAlertQueryId": "floor-alert",
  "roomAlertQueryId": "room-alert"
}
```

{{% /tab %}}
{{% /tabpane %}}

To launch the dashboard, open a new terminal and use the following commands
  inside the `dashboard` directory.

```sh
cd dashboard

npm install

PORT=3001 npm start
```

{{< tabpane >}}
{{% tab header="Github Codespaces" text=true %}}

The reactive dashboard should be running on localhost at port 3001.
Github will forward it to a URL specific to your codespace like so:
`https://<your-codespace-name>-3001.app.github.dev`.

{{% /tab %}}
{{% tab header="VSCode DevContainer" text=true %}}

The reactive dashboard should be running on localhost at port 3001.
Access it at `http://localhost:3001`.

{{% /tab %}}
{{% tab header="Local Setup" text=true %}}

The reactive dashboard should be running on localhost at port 3001.
Access it at `http://localhost:3001`.

{{% /tab %}}
{{% /tabpane %}}

{{< figure src="Screenshot_ReactiveDashboard.png" alt="Screenshot showing the realtime dashboard built with Drasi" width="80%" >}}

#### Testing the reactiveness

We now have built a reactive dashboard that should respond to any changes in
  sensor measurements. To demonstrate reactiveness of the dashboard, we have
  setup a simple webpage that splits the screen between the newly built
  dashboard and the control panel. 

{{< tabpane >}}
{{% tab header="Github Codespaces" text=true %}}

Check if the URLs for both control-panel and dashboard frame are correct in
  the file `index.html` in root directory of the project. Update the ports if
  using different ones.

```html
<iframe id="dashboardFrame" src="https://<your-codespace-id>-3001.app.github.dev"></iframe>
<iframe id="controlPanelFrame" src="https://<your-codespace-id>-3000.app.github.dev"></iframe>
```

<br />

Right click on the file and select `Open in Live Server`:

{{< figure src="Screenshot_OpenLiveServer.png" alt="Screenshot showing how to open live server" width="50%" >}}

This should expose a new port and open the corresponding URL created by Github
  codespaces. Open this URL:

```
https://<your-codespace-id>-5500.app.github.dev/
```

{{% /tab %}}
{{% tab header="VSCode DevContainer" text=true %}}

Check if the URLs for both control-panel and dashboard frame are correct in
  the file `index.html` in root directory of the project. Update the ports if
  using different ones.

```html
<iframe id="dashboardFrame" src="http://localhost:3001"></iframe>
<iframe id="controlPanelFrame" src="http://localhost:3000"></iframe>
```

<br />

Right click on the file and select `Open in Live Server`:

{{< figure src="Screenshot_OpenLiveServer.png" alt="Screenshot showing how to open live server" width="50%" >}}

{{% /tab %}}
{{% tab header="Local Setup" text=true %}}

Check if the URLs for both control-panel and dashboard frame are correct in
  the file `index.html` (at root folder for `building-comfort`). Update the
  ports if using different ones.

```html
<iframe id="dashboardFrame" src="http://localhost:3001"></iframe>
<iframe id="controlPanelFrame" src="http://localhost:3000"></iframe>
```

<br />

Open this file path in your browser using URL path like this:

```
file:///<path-to-learning-repo>/apps/building-comfort/index.html
```

{{% /tab %}}
{{% /tabpane %}}

You should now be able to see this UI for playing with the reactive dashboard:

{{< figure src="Screenshot_ReactivenessPortal.png" alt="Screenshot showing the reactiveness portal" width="80%" >}}

Try the following steps:

1. Click on the "Break" button for any room in the Control Panel.
2. Observe that the dashboard shows the changes in sensor values immediately.
3. Observe the comfort alerts on left side of the dashboard.

{{< figure src="Screenshot_ShowReactiveness.png" alt="Screenshot showing the reactiveness of system" width="80%" >}}

Feel free to try any sensor values for any number of rooms and see how alerts
  are generated dynamically.

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
  dashboard instantly reflects any new entities added to the monitoring system.
  If we fiddle with the [Control Panel](#control-panel) to mock changes in
  sensor measurements, we can see clearly that the dashboard reacts to it
  instantly.

### Summary

With this hypothetical scenario we are able to see how Drasi can help us build
  reactive systems out of existing systems.
  Learn {{< relurl "concepts/overview" "more about \"Why Drasi?\" here" >}}.

### What's next?

You can try the next guided tutorial in our series that demonstrates additional
capabilities of Drasi - multiple data sources & reacting to non-events.
{{< relurl "tutorials/curbside-pickup" "The Curbside Pickup tutorial" >}}
will guide you using a scenario of Curbside Pickup management for a Store.

Here are some additional resources:

- Learn more about {{< relurl "concepts/sources" "Drasi sources here" >}}.
- Learn more about {{< relurl "concepts/continuous-queries" "Continuous queries here" >}}.
- Learn more about {{< relurl "concepts/reactions" "Drasi Reactions here" >}}.