---
type: "docs"
title: "Curbside Pickup with Drasi"
linkTitle: "Curbside Pickup with Drasi"
weight: 40
description: >
    Learn how to use Drasi to power reactive dashboards over multiple data sources
related:
  tutorials:
    - title: "Getting Started with Drasi"
      url: "/getting-started/"
    - title: "Building Comfort Tutorial"
      url: "/tutorials/building-comfort/"
    - title: "Writing Multi-Source Queries"
      url: "/tutorials/write-multi-source-continuous-queries/"
  concepts:
    - title: "Continuous Queries"
      url: "/concepts/continuous-queries/"
    - title: "Solution Design"
      url: "/concepts/solution-design/"
  howto:
    - title: "Configure PostgreSQL Source"
      url: "/how-to-guides/configure-sources/configure-postgresql-source/"
    - title: "Configure Cosmos DB Gremlin Source"
      url: "/how-to-guides/configure-sources/configure-azure-cosmos-gremlin-source/"
---

## Scenario
Imagine a hypothetical scenario where a store is operating curbside pickup for
    customer orders.

### Retail Operations
The order information is stored in a PostgreSQL database and it includes:
* Customer Name
* Driver Name
* Pickup Vehicle Plate
* Order Status

When the retail team is ready with an order, they can mark the Order status as
    "Ready". The PostgreSQL database reflects the realtime state of orders.

We can simulate the functioning of the retail team of the store using a Retail-Operations app like this:

{{< figure src="RetailOperations.png"
  alt="Screenshot of the Retail Operations application, showing a list of orders with their status." width="45%" >}}

### Physical Operations
An independent MySQL database stores information about vehicles arriving at the
    store in real time. When the drivers get assigned to an order, they
    register the following details, which gets added to the database.
* Pickup Vehicle Plate
* Vehicle Make
* Vehicle Model
* Vehicle Color
* Vehicle Location

When the driver moves to the "Curbside Pickup" zone, they update their
    "Location" to "Curbside". The MySQL database reflects the realtime state
    of the vehicles.

We can also imagine a delivery staff that takes the orders that are marked as
    "Ready" to their drivers when they are at the pickup zone on the curbside.

We can simulate movement of pickup vehicles using a Physical-Operations app like this:

{{< figure src="PhysicalOperations.png"
  alt="Screenshot of the Physical Operations application, showing a list of vehicles and their locations." width="45%" >}}

### Order Delivery

Let us say we want to build a reactive front end dashboard that would alert
    the delivery staff when an order is ready and is matched to a driver who
    has arrived at the curbside pickup zone. The dashboard should get
    dynamically updated as the vehicle location changes or when the order
    status changes.

{{< figure src="DeliveryDashboard.png"
  alt="Screenshot of the Order Delivery Dashboard, displaying a list of matched orders that are ready for pickup." width="45%" >}}

**What would it take to build such a reactive dashboard that has incoming data
    from two different databases?**

### Delayed Orders

What if we also wanted a dashboard that can alert the retail backend team
    when the pickup driver has been waiting in the curbside zone and
    the order has not been ready for more than a fixed amount of time?

{{< figure src="DelayDashboard.png"
  alt="Screenshot of the Delayed Orders Dashboard, showing a list of drivers who have been waiting at the curbside for an extended period." width="45%" >}}

**How would we build such a dashboard?**
Is it even possible to build such a dashboard if the Vehicle database does not save the time of location update?

## Traditional Approaches

Regardless of the approach we take, the front-end component of the dashboard
    can be a single-page application built using React, Vue, Angular, etc and
    it needs realtime updates which can be achieved in one of three ways:
1. Web Sockets
1. Server Sent Events
1. Long polling

We would also need a backend that powers such subscriptions for the front-end.
This could be handled by Sockets.IO, Pusher or a hub-based backend like SignalR.

But how do we generate the realtime notifications for both dashboards?
We can explore two different approaches for that below.

### Polling for changes
In this approach, a dashboard application periodically queries both databases,
  joins the data in the application layer, and evaluates the conditions for
  each dashboard.

- Components
  
  - Backend Application:
    - Polls the PostgreSQL database for order data (e.g., every 10 seconds).
    - Polls the MySQL database for vehicle data (e.g., every 10 seconds).
    - Joins the datasets in memory using the Pickup Vehicle Plate as the key.
    - Evaluates conditions and generates alerts.
  
  - Frontend Dashboard:
    - Web application that queries the backend via API or receives updates
        via polling/websockets.
    - Displays alerts to delivery staff and retail backend team.
  
  - Order Delivery Dashboard Logic
    - Query PostgreSQL for orders where Order Status = 'Ready'.
    - Query MySQL for vehicles where Location = 'Curbside'.
    - Match records by Pickup Vehicle Plate.
    - Send matched pairs as alerts to the delivery staff dashboard.
  - Delayed Orders Dashboard Logic
    - Query MySQL for vehicles where Location = 'Curbside'.
    - For each vehicle, retrieve the corresponding order from PostgreSQL.
    - Check the timestamp of the location update (assuming MySQL records when Location changes to "Curbside").
    - Calculate waiting time (current time - arrival timestamp).
    - If waiting time exceeds the threshold (e.g., 5 minutes) and Order Status ≠ "Ready", send an alert to the retail backend dashboard.

- Assumptions
  - The MySQL database includes a timestamp for location updates to track arrival time at "Curbside".

{{< figure src="Diagram_PollingApproach.png"
  alt="Architecture diagram of the polling approach. A backend application periodically queries both the PostgreSQL and MySQL databases to check for changes." width="45%" >}}

- Pros
  - Simplicity: Easy to implement with basic application logic and standard database queries.
  - No Additional Infrastructure: Relies on existing databases and a simple web app.

- Cons
  - Inefficiency: Frequent polling increases database load, especially with short intervals.
  - Latency: Long polling intervals (e.g., 30 seconds) may delay alerts, reducing real-time responsiveness.
  - Scalability: Does not scale well with high order/vehicle volumes due to repeated queries.
  - Timestamp Dependency: Requires the MySQL database to log location update timestamps, which may need schema changes if not already present.

### Streaming Processing

This approach leverages change data capture (CDC) to get real-time data streams
  from both databases into a message broker. These streams are then processed
  by a stream processing system, to detect conditions and push updates to the
  separate topics in the message broker. These topics are then consumed by a
  backend service which can push updates to a websocket service to power the
  dashboards.

- Components
  
  - Change Data Capture (CDC):
    - PostgreSQL: Use Debezium to capture changes via logical decoding.
    - MySQL: Use Debezium to capture changes via binlog streaming.
  - Message Broker:
    - Apache Kafka with following topics:
        - order_changes: Streams order updates from PostgreSQL.
        - vehicle_changes: Streams vehicle updates from MySQL.
        - matched_orders: Stores the output for matched orders.
        - delayed_orders: Stores output for delayed orders.
  - Stream Processing:
      - Need a stream processing engine like Flink.
      - Must utilize concepts like Temporal Joins, Watermarks, Interval Joins,
          and Dynamic Tables in Flink (or equivalent in other engines).
      - We explore how one would write a Flink SQL job for
          [the delivery dashboard here](#delay-dashboard-with-flink).
      - We explore how one would write a Flink SQL job for
          [the delay dashboard here](#delay-dashboard-with-flink).

- Assumptions
  - MySQL and PostgreSQL support CDC (via tools like Debezium).
  - The system can access current timestamps for vehicle location changes.

{{< figure src="Diagram_EventStreamingApproach.png"
  alt="Architecture diagram of the event streaming approach. Change Data Capture (CDC) streams data from PostgreSQL and MySQL to Kafka, which is then processed by a stream processor." width="45%" >}}

- Pros
  - Near Real-Time: Alerts are generated with minimal latency.
  - Efficiency: Reduces database load by using CDC rather than polling.
  - Scalability: Handles high data volumes with distributed streaming platforms like Kafka.
  - Flexibility: Easily extends to additional conditions or dashboards.

- Cons
  - Requires setting up CDC, Kafka, and stream processing, which involves more components and expertise.
  - Needs additional systems (Kafka, stream processor), increasing deployment overhead.
  - Need to consider event schemas for output topics.
  - Need additional backend service that consumes output of topic and updates dashboards.

##### Delivery Dashboard with Flink
A big overhead is also writing complicated Stream Processing jobs.
With declarative mode of authoring queries like Flink SQL, the queries can
  be a bit easier for simpler scenarios like required by Delivery Dashboard:
  
{{< scrollable-code lang="sql" file="content/tutorials/curbside-pickup/MatchedOrders-Flink.sql" />}}

- Connects to the `order_changes` Kafka topic, which streams CDC events from
    the PostgreSQL DB via Debezium.
- Also connects to the `vehicle_changes` Kafka topic, which streams CDC events
    from the MySQL database via Debezium.
- Tracks the latest state of each vehicle using `vehicle_plate` as the primary
    key.
- Define the output Kafka topic `matched_orders`, where matched order and
    vehicle data will be sent.
- Joins the `order_changes` and `vehicle_changes` tables on the vehicle_plate
    field, and filters for orders with `status = 'Ready'` and vehicles with
    `location = 'Curbside'`.
- The `matched_orders` table is setup with format as `changelog-json`. In Flink
    this means that inserts are emitted when a row satisfies the WHERE
      condition & deletes are emitted when a row no longer satisfies it.

##### Delay Dashboard with Flink
Far more complicated is the query to power a delay dashboard:

{{< scrollable-code lang="sql" file="content/tutorials/curbside-pickup/DelayedOrders-Flink.sql" />}}

One approach (as shown in the SQL above) could be like the following:

- First, we read CDC events from Kafka with *watermarks* for event-time
    processing. The primary key pickup_vehicle_plate ensures Flink maintains
    the latest state per vehicle, assuming one active order per vehicle at a
    time.

- Then *temporal joins* provide the current order status for vehicle events and
    vice versa, creating a stream where each event includes both
    `vehicle_location` and `order_status`.

- The `events_with_state` view uses `LAG` to compare the current waiting
    condition (is_waiting) with the previous state, identifying start and end
    points.

- The interval left outer join checks if an end event occurs within 5 minutes
    of a start event. If no end event is found (e.end_time IS NULL), an
    'insert' event is emitted when the watermark exceeds `start_time + 5`
    minutes. An end event triggers a 'delete'.

- The delayed_orders table outputs a changelog stream with op ('insert' or
    'delete'), pickup_vehicle_plate, and the relevant timestamp.

The output to the `delayed_orders` Kafka topic can then be used by the backend
  service to add or remove drivers from the result set, which is then used to
  keep the dashboards up to date by sending updates over websockets.

### Enter Drasi
Drasi offers us a unique ability to declaratively write continuously running
  queries across a virtual knowledge graph that can span across multiple
  heterogeneous data sources. Drasi can also take action when the result sets of
  the queries change.

This means that we can simply add both the data sources in Drasi and write
  declarative queries on top and create a SignalR endpoint in minutes. Here is
  all we will need:

1. YAML files for the 2 sources. These allow Drasi to subscribe to change-feeds.
1. YAML file with declarative graph queries for the two scenarios.
1. YAML file for configuring a SignalR endpoint.

Here is how the architecture will look like with Drasi:
{{< figure src="Diagram_DrasiApproach.png"
  alt="Architecture diagram of the Drasi approach. Drasi connects to PostgreSQL and MySQL as sources, runs continuous queries, and sends results to a SignalR reaction." width="70%" >}}

## Curbside Pickup with Drasi

The rest of this tutorial will guide us step by step in setting up the mock
    scenario discussed earlier and create the two realtime dashboards with
    minimal effort.

### Tutorial Modes

You can follow along the steps below in a Github codespace, a VSCode Dev
  Container or on a local k3d cluster on your machine.

{{< tabpane >}}

{{% tab header="Github Codespaces" text=true %}}

The easiest way to follow along with this tutorial is to launch a Github
  Codespace using the link below. This will allow you to run the example
  application within your browser without setting up anything on your own
  machines.

[![Open in Github Codespaces](https://github.com/codespaces/badge.svg)](https://github.com/codespaces/new?hide_repo_select=true&ref=main&repo=778887889&skip_quickstart=true&machine=standardLinux32gb&devcontainer_path=.devcontainer%2Fcurbside-pickup%2Fdevcontainer.json)

This will open a page with some configuration options. Make sure that the
  'Branch' selected is `main` and set the 'Dev Container configuration' to
  'Curbside Pickup with Drasi'.

{{< figure src="Screenshot_CodespacesConfig.png"
  alt="GitHub Codespaces configuration page showing main branch and Curbside Pickup dev container selection" width="80%" >}}

**Note:** The codespace will launch and run some setup scripts. Please wait for the scripts to complete. This should take less than 5 minutes to complete.

{{< figure src="Codespaces_01_Creating.png"
  alt="GitHub Codespaces creation and setup in progress" width="100%" >}}

Once the setup is complete successfully, you should see a welcome message on the terminal, and the Readme file open:

{{< figure src="Codespaces_02_ReadyScreen.png"
  alt="Codespace ready with welcome message and README file open" width="100%" >}}

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

Once the solution is open in VS Code, follow these steps:
- Press Cmd + Shift + P (on MacOS) or Ctrl + Shift + P (Windows or Linux) to
    launch the command palette.
- Select `Dev Containers: Rebuild and Reopen in Container`.

{{< figure src="Devcontainer_01_DevContainerOpen.png"
  alt="VS Code command palette showing Dev Containers: Rebuild and Reopen in Container option" width="100%" >}}

- Select the `Curbside Pickup with Drasi` option to launch this tutorial.

{{< figure src="Devcontainer_02_SelectCurbsideTutorial.png"
  alt="Dev container selection menu showing Curbside Pickup with Drasi option" width="100%" >}}

This will create a container and set it up for you. This might take up to 5 minutes and will look something like this:

{{< figure src="Devcontainer_03_CurbsideLoading.png"
  alt="Dev container creation and setup in progress for Curbside Pickup tutorial" width="100%" >}}

Once the setup is complete, you will see a message like this in the VSCode Terminal:

{{< figure src="Devcontainer_04_TutorialReadyScreen.png"
  alt="VS Code terminal showing tutorial setup complete message" width="100%" >}}

{{% /tab %}}

{{% tab header="Local Setup" text=true %}}

To run this tutorial locally, you'll need:
- Docker (for running k3d)
- kubectl installed and configured
- k3d installed (for creating local Kubernetes clusters)
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
  and navigate to the curbside pickup directory (`learning/tutorial/curbside-pickup`)

```sh
git clone https://github.com/drasi-project/learning
cd learning/tutorial/curbside-pickup
```
<br/>

**Step 2: Create k3d cluster**

The setup script requires a running Kubernetes cluster. Create one before proceeding:

```sh
# Create k3d cluster with port mapping
k3d cluster create drasi-tutorial -p '8123:80@loadbalancer'

# Verify kubectl can connect (should show cluster info)
kubectl cluster-info
```

This creates a cluster with Traefik v2.x ingress controller included. The port mapping `8123:80` allows you to access applications at `http://localhost:8123`.

**Step 3: Run the setup script**

Once your cluster is ready, run the interactive setup script for your platform:

**For macOS/Linux:**
```sh
cd tutorial/curbside-pickup
./scripts/setup-tutorial.sh
```
<br/>

**For Windows (PowerShell):**
```powershell
cd tutorial\curbside-pickup
.\scripts\setup-tutorial.ps1
```
<br/>

The script will:
- Check for required tools (kubectl, Drasi CLI)
- Deploy PostgreSQL and MySQL databases with sample data
- Deploy all containerized applications
- Optionally initialize Drasi (you can skip this and do it later)
- Configure ingress routes (required - setup will fail if Traefik v2.x is not available)


{{% /tab %}}

{{% /tabpane %}}

### Understanding the environment
Once your environment is ready, all applications sit behind an ingress, and are accessible through a single entry point.

{{< figure src="curbside-pickup-architecture.png"
  alt="Architecture diagram of the curbside pickup tutorial environment, showing the containerized applications for Retail Operations, Physical Operations, Delivery Dashboard, and Delay Dashboard." width="100%" >}}

The following applications are containerized and deployed on Kubernetes:

1. **Retail Operations with PostgreSQL DB** (`/retail-ops`)
  - Used to manage Orders
  - PostgreSQL database for orders
  - FastAPI backend + React frontend
  - Pre-loaded with sample data

2. **Physical Operations with MySQL DB** (`/physical-ops`)
  - Used to manage vehicles
  - MySQL database for vehicles
  - Flask backend + React frontend
  - Pre-loaded with sample data

3. **Delivery Dashboard** (`/delivery-dashboard`)
  - React app with SignalR integration
  - Shows orders that are ready and the respective pickup drivers have arrived

4. **Delay Dashboard** (`/delay-dashboard`)
  - Vue.js app with SignalR integration
  - Shows delayed orders for which drivers are waiting in pickup zone

{{< tabpane >}}

{{% tab header="Github Codespaces" text=true %}}

Once your codespace is ready, **open the Ports tab**:

{{< figure src="Codespaces_03_OpenPortsTab.png"
  alt="VS Code interface showing how to open the Ports tab in Codespaces" width="100%" >}}

You should see a port already exported for "Curbside Pickup Apps". Hover on the forwarded address and click on the button "Open in Browser".

{{< figure src="Codespaces_04_ClickPort.png"
  alt="Codespaces Click On Port" width="100%" >}}

This will open up a URL (something like `https://<your-codespace-id>-8123.app.github.dev/`) in a new tab.
You should see a **disconnected** demo page like shown below.

{{< figure src="Codespaces_05_BlankDashboard.png"
  alt="Codespaces Blank Dashboard" width="100%" >}}

**Note:** This page shows **Disconnected** because the dashboards have no websocket backend yet.
We will use Drasi to deploy a SignalR server which will work as our websocket backend.

🚀 If you're able to see this, your environment is setup correctly and you can proceed.

👍 The dashboard is still blank because our websocket server is not deployed

⌛️ If your dashboard is not loading, or your codespace wasn't setup, please try recreating your codespace.

🤨 If you keep running into issues, please reach the Drasi team at our discord channel and share your codespace creation logs.

{{% /tab %}}

{{% tab header="VSCode DevContainer" text=true %}}

Once your devcontainer is ready, **open the Ports tab**:

{{< figure src="Devcontainer_05_OpenPortsTab.png"
  alt="VS Code interface showing how to open the Ports tab in Dev Container" width="100%" >}}

You should see a port already exported for "Curbside Pickup Apps". Hover on the forwarded address and click on the button "Open in Browser".

{{< figure src="Devcontainer_06_ClickPorts.png"
  alt="Dev Container Ports tab showing Open in Browser button for port 8123" width="100%" >}}

This will open up a URL (like `http://localhost:8123`) in a new tab.
**You should see a *disconnected* demo page like shown below.**

{{< figure src="Devcontainer_07_BlankDashboard.png"
  alt="Demo portal showing disconnected dashboards before SignalR setup" width="100%" >}}

**Note:** This page shows **Disconnected** because the dashboards have no websocket backend yet.
We will use Drasi to deploy a SignalR server which will work as our websocket backend.

🚀 If you're able to see this, your environment is setup correctly and you can proceed.

👍 The dashboard is still blank because our websocket server is not deployed

⌛️ If your dashboard is not loading, or your codespace wasn't setup, please try recreating your dev container.

🤨 If you keep running into issues, please reach the Drasi team at our discord channel and share your dev-container creation logs.

{{% /tab %}}

{{% tab header="Local Setup" text=true %}}

**You should see a *disconnected* demo page like shown below.**

{{< figure src="Devcontainer_07_BlankDashboard.png"
  alt="Demo portal showing disconnected dashboards before SignalR setup" width="100%" >}}

**Note:** This page shows **Disconnected** because the dashboards have no websocket backend yet.
We will use Drasi to deploy a SignalR server which will work as our websocket backend.

{{% /tab %}}

{{% /tabpane %}}

If your environment setup was complete, you should see the demo portal. This demo portal shows all four applications in a 2x2 grid:
- **Delivery Dashboard** (top-left): Real-time order matching.
- **Delay Dashboard** (top-right): Identify extended wait times in real time.
- **Retail Operations** (bottom-right): Simulate order management
- **Physical Operations** (bottom-left): Simulate vehicle movement

### Drasi VSCode Extension

We also have a VSCode extension for Drasi, which can make it easy to debug and deploy Drasi components.
Although this is **not required**, you can use this during our tutorial if you want a terminal-free experience.

{{< tabpane >}}

{{% tab header="Github Codespaces" text=true %}}

Your codespace already has the Drasi extension installed:

{{< figure src="Codespaces_07_DrasiExtension.png"
  alt="VS Code showing Drasi extension installed in Codespaces" width="50%" >}}

{{% /tab %}}

{{% tab header="VSCode DevContainer" text=true %}}

Your dev container already has the Drasi extension installed:

{{< figure src="Devcontainer_08_DrasiExtension.png"
  alt="VS Code showing Drasi extension installed in Dev Container" width="50%" >}}

{{% /tab %}}

{{% tab header="Local Setup" text=true %}}

You can install the VSCode Extension by following [the instructions here](../../reference/vscode-extension/#installation).

**Note:** If you are using VSCode and installing the extension, it is recommended to open the folder `learning/tutorial/curbside-pickup` in VSCode.
This is because the extension automatically lists all the Drasi YAMLs found in your workspace and the screenshots in the rest of this tutorial assume the set of YAMLs within the path mentioned earlier. If you have `learning` or other a different path opened in VSCode, you might see a different set of source, query and reaction YAMLs.

{{% /tab %}}

{{% /tabpane %}}


### Add Drasi Sources

Sources in Drasi provide connectivity to the data sources and monitor them for
  change. Learn {{< relurl "concepts/sources" "more about Sources here" >}}.

The retail team uses a PostgreSQL database which can be added as a Drasi source.
We have the following YAML in file `retail-ops-source.yaml` placed in the `tutorial/curbside-pickup/drasi` directory.

```yaml
apiVersion: v1
kind: Source
name: retail-ops
spec:
  kind: PostgreSQL
  properties:
    host: postgres.default.svc.cluster.local
    user: test
    port: 5432
    ssl: false
    password: test
    database: RetailOperations
    tables:
      - public.orders
```

There is a similar source for MySQL database that tracks vehicles in the file `physical-ops-source.yaml`.


{{< tabpane >}}

{{% tab header="VSCode Extension" text=true %}}

Find the retail-ops source in the Workspace inside Drasi VSCode Extension as shown here, and click "Apply":

{{< figure src="Codespaces_08_ApplySource.png"
  alt="Drasi VS Code extension showing Apply button for retail-ops source" width="35%" >}}

You will get a pop-up on the bottom right corner of your screen. Confirm if you want to deploy the source.

{{< figure src="Codespaces_09_ConfirmSource.png"
  alt="VS Code popup confirming deployment of retail-ops source" width="60%" >}}

You will see the source with a Red icon - which means we need to wait for few seconds for the source to come online:

{{< figure src="Codespaces_10_WaitForSource.png"
  alt="Drasi VS Code extension showing retail-ops source with red icon while deploying" width="35%" >}}

The source will show up with a Green icon when it is ready for use. Try the refresh button shown here if it does not become ready within a couple minutes:

{{< figure src="Codespaces_11_ReadySource.png"
  alt="Drasi VS Code extension showing retail-ops source ready with green icon" width="35%" >}}

Likewise apply the physical-ops source in the Workspace inside Drasi VSCode Extension as shown here:

{{< figure src="Codespaces_12_ApplySecondSource.png"
  alt="Drasi VS Code extension showing Apply button for physical-ops source" width="35%" >}}

Wait for this source to be ready. Once your both sources are ready like this, you can move to the queries:

{{< figure src="Codespaces_13_BothSourcesReady.png"
  alt="Drasi VS Code extension showing both sources ready with green icons" width="35%" >}}

{{% /tab %}}

{{% tab header="Drasi CLI" text=true %}}

Open up a terminal and navigate to the `drasi` directory within your workspace (`tutorial/curbside-pickup/drasi`):

```sh
cd drasi
```
<br/>

Use the following commands to apply the PostgreSQL source, and wait for it to come online:

```sh
drasi apply -f retail-ops-source.yaml
drasi wait -f retail-ops-source.yaml -t 120
```
<br/>

Similarly, apply the MySQL source for physical operations:

```sh
drasi apply -f physical-ops-source.yaml
drasi wait -f physical-ops-source.yaml -t 120
```
<br/>

Verify both sources are online:

```sh
drasi list source
```
<br/>

You should see:
```
      ID       | AVAILABLE | MESSAGES  
---------------+-----------+-----------
  retail-ops   | true      |
  physical-ops | true      |
```

{{% /tab %}}

{{% /tabpane %}}

### Write Drasi Queries
Continuous Queries are the mechanism by which you tell Drasi what changes to
  detect in source systems as well as the data you want distributed when changes
  are detected. You can read
  {{< relurl "concepts/continuous-queries" "more about them here" >}}.

#### Query for matched orders

When writing queries, Drasi allows us to model all of our data coming
    from disparate heterogeneous systems as a single virtual graph of
    nodes and relationships. On this graph, we can then write declarative
    queries.

For example, to match `Orders` that are `Ready` with their pickup `Vehicles`
    that are in the `Curbside`, we can envision a graph of Orders & Vehicles
    connected by a relation `Pickup-By` which connects an order to a vehicle.
    (More on how Drasi makes this connection is [explained later](#synthetic-relationships)).

We can then write the following Cypher-style query:

```
MATCH (o:orders)-[:PICKUP_BY]->(v:vehicles)
    WHERE o.status = 'ready'
      AND v.location = 'Curbside'
    RETURN
      o.id AS orderId,
      o.status AS orderStatus,
      o.driver_name AS driverName,
      o.plate as vehicleId,
      v.make as vehicleMake,
      v.model as vehicleModel,
      v.color as vehicleColor,
      v.location as vehicleLocation
```

Since we are creating a mock scenario, and our database may have entries
  where the matched orders may exist at epoch (time = 0), we filter that out
  as we want to report the timestamp when the order becomes ready.

We can filter out the orders that were already matched by adding to `WHERE`
  like:
```
WHERE o.status = 'ready'
  AND v.location = 'Curbside'
  AND drasi.changeDateTime(v) != datetime({epochMillis: 0})
  AND drasi.changeDateTime(o) != datetime({epochMillis: 0})
```

And we can include the following in our projected result to report the
  timestamp when the orders got matched to the drivers:

```
RETURN
  o.id AS orderId,
  ....
  ....
  drasi.listMax([drasi.changeDateTime(o), drasi.changeDateTime(v)]) as readyTimestamp
```

The above does a `max` as we want to report when a match happened, which occurs
  when both the driver location becomes `Curbside` and order status becomes
  `Ready`. Therefore, we need the greater of the change timestamp among both.

#### Synthetic Relationships
Note that in our Cypher query we want to relate the orders with their
  respective vehicles, even though the entities live in different databases.
This is achieved by modeling the relationship as a synthetic relationship
  called `PICKUP_BY` which is defined in the `joins` section of the YAML below.

This `joins` section tells Drasi how to stitch together a graph
  of entities and relationships across arbitrary heterogeneous data sources.

To be able to create that virtualized graph, we need to tell Drasi how to
    connect vehicles to orders. In our example, we can do that by Vehicle plate
    number which is present in both databases.

Following is the complete YAML file for the continuous query that shows how the
    synthetic relationship is defined. Pay attention to the `joins` section:

```yaml
# Returns the orders ready for delivery
kind: ContinuousQuery
apiVersion: v1
name: delivery
spec:
  mode: query
  sources:
    subscriptions:
      - id: physical-ops
        nodes:
          - sourceLabel: vehicles
      - id: retail-ops
        nodes:
          - sourceLabel: orders
    joins:
      - id: PICKUP_BY
        keys:
          - label: vehicles
            property: plate
          - label: orders
            property: plate
  query: >
    MATCH (o:orders)-[:PICKUP_BY]->(v:vehicles)
    WHERE o.status = 'ready'
      AND v.location = 'Curbside'
      AND drasi.changeDateTime(v) != datetime({epochMillis: 0})
      AND drasi.changeDateTime(o) != datetime({epochMillis: 0})
    RETURN
      o.id AS orderId,
      o.status AS orderStatus,
      o.driver_name AS driverName,
      o.plate as vehicleId,
      v.make as vehicleMake,
      v.model as vehicleModel,
      v.color as vehicleColor,
      v.location as vehicleLocation,
      drasi.listMax([drasi.changeDateTime(o), drasi.changeDateTime(v)]) as readyTimestamp
```

This full YAML file is located at `curbside-pickup/drasi/delivery.yaml`.

#### Query for extended wait times

Drasi has a unique ability to react to not only events but also the lack of
  events, or non-events, for a given query. This means Drasi can watch a
  the result-set of a continuous query and if the required conditions are not
  met for the specified interval, it can signal reactions.

We can use these temporal capabilities of Drasi to write a Cypher query that
  will report `Orders` that are `In Progress`, but the driver has been waiting
  to pick it up on the curbside for 10 seconds or more.

For this, we can write the following query:

```
MATCH (o:orders)-[:PICKUP_BY]->(v:vehicles)
WHERE o.status != 'ready'
WITH
  o, v,
  drasi.changeDateTime(v) AS waitingSinceTimestamp
WHERE
  waitingSinceTimestamp != datetime({epochMillis: 0}) AND
  drasi.trueFor(v.location = 'Curbside', duration ({ seconds: 10 }))
RETURN
  o.id AS orderId,
  o.customer_name as customerName,
  waitingSinceTimestamp
```

In the query above, we only match those vehicles for which orders are not ready
  by filtering with `WHERE o.status != 'ready'`. Now, we want to find vehicles
  whose location was set to `Curbside` 10+ seconds ago, while the order was
  still not ready. This is achieved by:
```
  drasi.trueFor(v.location = 'Curbside', duration ({ seconds: 10 }))
```

Here we utilize the future function `drasi.trueFor` which evaluates whether a
  boolean expression remains true for at least a period of time, starting from
  the time when the change being evaluated occurred.

Read more about `trueFor` and other [future functions here](../../reference/query-language/#drasi-future-functions).

For our mock scenario, when we launch the apps some vehicles may already be
  at curbside at the beginning (epoch), and to filter those out we use this:
  `WHERE waitingSinceTimestamp != datetime({epochMillis: 0})`.

The full YAML for this query is present in the file 
  `curbside-pickup/drasi/delay.yaml`.

#### Deploy the queries

{{< tabpane >}}

{{% tab header="VSCode Extension" text=true %}}

Find the `delivery` query in the workspace inside Drasi VSCode Extension as shown here, and click "Apply":

{{< figure src="Codespaces_14_ApplyFirstQuery.png"
  alt="Drasi VS Code extension showing Apply button for delivery query" width="35%" >}}

Similarly apply the `delay` query from the extension:

{{< figure src="Codespaces_15_ApplySecondQuery.png"
  alt="Drasi VS Code extension showing Apply button for delay query" width="35%" >}}

Wait for both queries to be Ready. This will be indicated by both turning `Green` like this:

{{< figure src="Codespaces_16_BothQueriesReady.png"
  alt="Drasi VS Code extension showing both queries ready with green icons" width="35%" >}}

{{% /tab %}}

{{% tab header="Drasi CLI" text=true %}}

Use the command below to apply the first query:
```sh
drasi apply -f delivery.yaml
```
<br/>

To check the status, use the command:

```sh
drasi list query
```
<br/>

The `STATUS` should be `Running`, and there should be nothing in the column
  `ERRORMESSAGE`.

```
     ID    | CONTAINER | ERRORMESSAGE |              HOSTNAME        | STATUS   
-----------+-----------+--------------+------------------------------+----------
  delivery | default   |              | default-query-host-xxxx-xxxx | Running  
```

Use the command below to apply the second query:

```sh
drasi apply -f delay.yaml
```

To check the status, use the command:

```sh
drasi list query
```

The `STATUS` should be `Running`, and there should be nothing in the column
  `ERRORMESSAGE`.

```
     ID    | CONTAINER | ERRORMESSAGE |              HOSTNAME        | STATUS   
-----------+-----------+--------------+------------------------------+----------
  delivery | default   |              | default-query-host-xxxx-xxxx | Running  
  delay    | default   |              | default-query-host-xxxx-xxxx | Running  
```

{{% /tab %}}

{{% /tabpane %}}

### Drasi SignalR Reaction

Reactions process the stream of query result changes output by one or more
  Drasi Queries and act on them. You can read
  {{< relurl "concepts/reactions" "more about Reactions here" >}}.

To implement a reactive dashboard, we can use any number of frameworks, and we
  would need something that can host a websocket for bidirectional
  communication with the frontend. This should also reliably fall back
  to ServerSentEvents (SSE) or long polling, ensuring broad support across
  different network and client configurations. One could use libraries like
  SignalR, Sockets.IO, Django Channels.

Drasi has a reaction for SignalR available. This simplifies the process, as a
  simple YAML configuration enables a SignalR hub to push updates from any
  Drasi query to the UI. Following is the config located in `curbside-pickup/drasi`
  directory that lists the queries we're interested in exposing:

```yaml
apiVersion: v1
kind: Reaction
name: signalr
spec:
  kind: SignalR
  queries:
    delivery:
    delay:
```

{{< tabpane >}}

{{% tab header="VSCode Extension" text=true %}}

Find the reaction in the Workspace inside Drasi VSCode Extension as shown here, and click "Apply":

{{< figure src="Codespaces_17_ApplyReaction.png"
  alt="Drasi VS Code extension showing Apply button for SignalR reaction" width="30%" >}}

You will notice the reaction deploying. The red icon means that it is not ready yet. Wait for the reaction to get fully deployed.

{{< figure src="Codespaces_18_WaitForReaction.png"
  alt="Drasi VS Code extension showing SignalR reaction deploying with red icon" width="30%" >}}

Once the reaction is ready, the icon will turn green like this:

{{< figure src="Codespaces_19_ReactionReady.png"
  alt="Drasi VS Code extension showing SignalR reaction ready with green icon" width="30%" >}}

Now you have a websocket server up & running inside the Drasi Cluster.
Since our frontend dashboard will be running on localhost, we need to create a tunnel.
For this, **Right Click** on the reaction and select **Open Tunnel** as shown here:

{{< figure src="Codespaces_20_DrasiTunnel.png"
  alt="Drasi VS Code extension context menu showing Open Tunnel option" width="30%" >}}

You will get a prompt to specify the port number. We have setup the dashboard to expect signalR hub at port **`8080`**. Therefore, please **set the value as 8080 here** as shown here:

{{< figure src="Codespaces_21_TunnelPort.png"
  alt="VS Code prompt to enter port number 8080 for tunnel" width="80%" >}}

{{% /tab %}}

{{% tab header="Drasi CLI" text=true %}}

In the terminal where you're in directory `curbside-pickup/drasi`, run the following
  commands to have a SignalR Reaction deployed to your Drasi instance.

```sh
drasi apply -f reaction.yaml
```
<br/>

You can expect the following response:
```
✓ Apply: Reaction/signalr: complete
```

Note that reactions might take some time to come up. You can use the following
  convenient command to wait for it (up to 120 seconds) to come up:

```sh
drasi wait -f reaction.yaml -t 120
```
<br/>

Once a reaction is online you should be able to see it like so:

```sh
drasi list reaction
```
<br/>

Following should be the output with nothing in the 'Messages' column:
```
    ID    | AVAILABLE | MESSAGES  
----------+-----------+-----------
  signalr | true      |           
```
<br />

Now you have a websocket server up & running inside the Drasi Cluster.
Since our frontend dashboard will be running on localhost, we need to create a tunnel.
Use the following command to create a tunnel:

```sh
drasi tunnel reaction signalr 8080
```
<br/>

**Note:** Keep this running, as long as you want the dashboard to be live.
{{% /tab %}}

{{% /tabpane %}}

##### Troubleshooting the reaction
Following commands can be used on the terminal to troubleshoot the reaction.

Check messages in output of `drasi list reaction`.

For more details you can also use
  `drasi describe reaction signalr`.

Check the logs of pods created for the services `signalr-gateway`.
  These are deployed under drasi's namespace (default: drasi-system) in your
  kubernetes cluster. You should also investigate the logs of the pods
  created for source which will have names like `signalr-xxxxx-xxxx`.

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

{{< figure src="Codespaces_22_MakePortPublic.png"
  alt="VS Code Ports tab showing how to make port 8080 public" width="100%" >}}

The demo should now be accessible at **`https://<your-codespace-id>-8123.app.github.dev/`**, and it should look like this:

{{< figure src="Codespaces_23_DashboardsConnected.png"
  alt="Demo portal showing connected delivery and delay dashboards" width="100%" >}}

If you refresh, you will notice that both dashboards will show their connection status as **Live**.

{{< figure src="Codespaces_23_DashboardsLive.png"
  alt="Screenshot of the demo portal showing both the Delivery and Delay dashboards with a 'Live' connection status." width="100%" >}}

{{% /tab %}}

{{% tab header="VSCode DevContainer" text=true %}}

Drasi is running inside a k3d cluster inside your github codespaces container.
The Drasi tunnel for SignalR reaction has made the port accessible inside the codespace at port `8080`.
The dashboard will however run your local browser. VS Code usually forwards port `8080` to the same port on localhost automatically.

**Note: Please make sure that port 8080 is forwarded to 8080 on localhost:**
1. Go to the PORTS tab in VS Code
{{< figure src="Devcontainer_24_PortForwarded.png"
  alt="VS Code Ports tab showing port 8080 forwarded to localhost" width="80%" >}}

2. Make sure an entry for port 8080 exists. If it does not, then please add one like this:

{{< figure src="Devcontainer_22_PortForwardingTab.png"
  alt="VS Code Ports tab showing Add Port button" width="80%" >}}

{{< figure src="Devcontainer_23_EnterPortNumber.png"
  alt="VS Code prompt to enter port number 8080 for forwarding" width="80%" >}}

The demo should now be accessible at **`http://localhost:8123/`**, and it should look like this:

{{< figure src="Devcontainer_25_LiveDashboard.png"
  alt="Demo portal showing live connected dashboards" width="100%" >}}

If you refresh, you will notice that both dashboards will show their connection status as **Live**.

{{< figure src="Codespaces_23_DashboardsLive.png"
  alt="Screenshot of the demo portal showing both the Delivery and Delay dashboards with a 'Live' connection status." width="100%" >}}

{{% /tab %}}

{{% tab header="Local Setup" text=true %}}

**No need to port forward**. The Drasi Tunnel should already make your signalR reaction available in your machine at local port 8080.

The demo should now be accessible at **`http://localhost:8123/`**, and it should look like this:

{{< figure src="Devcontainer_25_LiveDashboard.png"
  alt="Demo portal showing live connected dashboards" width="100%" >}}

If you refresh, you will notice that both dashboards will show their connection status as **Live**.

{{< figure src="Codespaces_23_DashboardsLive.png"
  alt="Screenshot of the demo portal showing both the Delivery and Delay dashboards with a 'Live' connection status." width="100%" >}}

{{% /tab %}}

{{% /tabpane %}}

### Testing the Reactiveness

Open the demo portal to see all four applications in a grid layout. Try these scenarios:

#### Test Matched Orders
1. In Physical Operations (bottom-left), move the Blue Toyota Camry (A1234) to "Curbside" by clicking the "-> Curb" button. This should move the car to the Curbside in the app UI as shown here:
{{< figure src="Codespaces_24_MoveBlueCar.png"
  alt="Physical Operations app showing Blue Toyota Camry moved to Curbside" width="100%" >}}

2. In Retail Operations (bottom-right), click on "Mark Ready" button for "Order #1". The order will move from "In Preparations" card to "Ready for Pickup" card in the app UI as shown here:
{{< figure src="Codespaces_25_OrderOneReady.png"
  alt="Demo portal showing Order #1 matched in Delivery Dashboard after marking ready" width="100%" >}}

3. Watch the Delivery Dashboard (top-left) - the matched order appears within a couple seconds:
{{< figure src="Codespaces_25_OrderOneReady.png"
  alt="Demo portal showing Order #1 matched in Delivery Dashboard after marking ready" width="100%" >}}

#### Test Extended Wait Alerts
1. In Physical Operations, move other two cars "Red Ford F-150 (B5678)" and "Black Honda Civic (C9876) to "Curbside":
{{< figure src="Codespaces_26_MoveOtherTwoCars.png"
  alt="Physical Operations app showing Red Ford F-150 and Black Honda Civic moved to Curbside" width="100%" >}}

2. Wait about 10 seconds.

3. Watch the Delay Dashboard (top-right) - **an alert will appear when these drivers have waited for more than 10 seconds for their order**, as shown in the UI here:
{{< figure src="Codespaces_27_WaitTenSeconds.png"
  alt="Delay Dashboard showing two drivers waiting more than 10 seconds with alerts" width="100%" >}}

4. Click "Mark Ready" for "Order #2" as well in the Retail-Operations app. This should remove the order from Extended Wait Times (Delay) dashboard and move it to "Ready For Delivery" because the driver is at curbside and the order is now ready:
{{< figure src="Codespaces_28_OrderTwoReady.png"
  alt="Demo portal showing Order #2 moved from Delay to Delivery Dashboard" width="100%" >}}

4. Finally after few seconds, also Click "Mark Ready" for "Order #3" as well in the Retail-Operations app. This should remove the final remaining order from Extended Wait Times (Delay) dashboard and move it to "Ready For Delivery" because the driver is at curbside and the order is now ready:
{{< figure src="Codespaces_29_OrderThreeReady.png"
  alt="Demo portal showing all three orders ready for delivery with no delays" width="100%" >}}

The dashboards update in real-time as you make changes, demonstrating Drasi's ability to:
- Join data across PostgreSQL and MySQL databases
- Detect complex conditions including time-based rules
- Push updates instantly via SignalR

You can reset the demo by clicking the button on top right corner to play with these orders again, or you can create your own vehicles or orders to further test the reactivity of the dashboards built with help of Drasi.
{{< figure src="Codespaces_30_ResetDemo.png"
  alt="Demo portal showing reset button in top right corner" width="80%" >}}

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

To clean up the tutorial, you can run the following scripts at the path **`tutorial/curbside-pickup`:**

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

## Reflection

Congratulations! You were able to build two reactive dashboards UI for the
  curbside pickup scenario using Drasi. Let's reflect on the journey we've
  been on.

### Multiple data sources

We did not need to make any changes to the existing system we had setup with
  separate data systems for Order management & Vehicle Management. They both
  continue to live in separate databases of different kinds.

In the above walkthrough, we were able to add the existing Postgres and MySql
  instances as Sources in Drasi which opened them up to queries. All we
  needed was a YAML file that describes connection parameters for the DBs.

When writing the queries for our scenario, we did not have to worry about the
  fact that the data lives in two different stores.
  This is the power of Drasi - it allows us to write queries against a virtual graph of nodes and
  relationships that can span across data stored in disparate heterogeneous
  sources.

[Synthetic Relationships](#synthetic-relationships) in Continuous Queries
  helped Drasi in understanding how data across sources is connected so it can
  be modeled as a single virtual graph against which Cypher-style queries can
  be written.

### No Code

Instead of writing complicated stream jobs as demonstrated in
  [the Event Streaming section](#streaming-processing), or maintaining code for
  polling or event hooks, in Drasi we can write declarative Cypher-style
  queries that are fed into the system as a Configuration.

The difference between the effort involved in getting the Delay Dashboard is
  particularly glaring. Let's take a look at what we did for
  [Delay Dashboard with Flink](#delay-dashboard-with-flink).

{{< scrollable-code lang="sql" file="content/tutorials/curbside-pickup/DelayedOrders-Flink.sql" />}}

If we contrast this with the simple YAML file used for the Drasi query, with
  the much simpler Cypher query using future functions, the power and appeal
  of Drasi becomes unmistakably evident. The Cypher query is not just more
  concise but arguably easier to write, understand and maintain over time.

{{< scrollable-code lang="yaml" file="content/tutorials/curbside-pickup/DelayedOrders-Drasi.yaml" />}}

The declarative approach taken by Drasi not only removes the need of writing
  and maintaining code, its choice of Cypher syntax gives it incredible
  expressive power which makes queries far less complicated than can ever be
  in SQL.

### Reactiveness

The dashboards built with Drasi are reactive to changes almost instantaneously.
  This can be observed by fiddling the vehicles & orders data as described in
  the [Demo time](#demo-time) section.

This is in contrast to any approaches involving polling as they would
  inherently have at least have as much delay as the polling interval.

The stream processing approach can be as reactive as Drasi, however it depends
  on the Debezium setup for CDC being accurately tuned and the backend service
  consuming the output topics without delay and pushing the updates to the
  clients in a snappy manner.

With Drasi, all that is taken care of by the platform and the developers
  need to provide simple YAML configs for their data sources, queries and
  reactions to get result sets that are continuously accurate (in near real time).

## Summary

With this example, we hope that we have demonstrated that just by writing a few
  YAML-config files and Cypher-style declarative queries, we can build new
  systems that are truly reactive using data from existing systems even if data
  lives in disparate and heterogeneous systems.

Learn {{< relurl "concepts/overview" "more about \"Why Drasi?\" here" >}}.

## What's next?

Here are some additional resources:

- Learn more about {{< relurl "concepts/sources" "Drasi sources here" >}}.
- Learn more about {{< relurl "concepts/continuous-queries" "Continuous queries here" >}}.
- Learn more about {{< relurl "concepts/reactions" "Drasi Reactions here" >}}.

### Appendix: Database Client

If you want to look at the PostgreSQL database, you may use psql for your local setup.
For codespaces and devcontainers, we have included a helpful DB Client extension:

{{< figure src="Codespaces_31_ConnectPostgres.png"
  alt="Database Client extension showing PostgreSQL connection configuration" width="100%" >}}

**Note:** For this to work, you must run a port-forward on the postgres service running on k3d.

If you want to look at the MySQL database, you may use CLI for your local setup.
For codespaces and devcontainers, you can use the included extension like this:

{{< figure src="Codespaces_32_ConnectMySql.png"
  alt="Database Client extension showing MySQL connection configuration" width="100%" >}}

**Note:** For this to work, you must run a port-forward on the postgres service running on k3d.

### Appendix: Live Debugging of Queries

If you are using the Drasi VSCode Extension, you can also live debug your queries. For instance if you have moved a few vehicles to curbside and marked matching orders as Ready, then click on the Debug button on the `delivery` query like shown here:

{{< figure src="Codespaces_33_DebugQuery.png"
  alt="Drasi VS Code extension showing Debug button for delivery query" width="100%" >}}

This will show you the live results of the query like this:

{{< figure src="Codespaces_34_DebugResult.png"
  alt="Drasi VS Code extension showing live query results for matched orders" width="100%" >}}

For CLI users, you can also use the `drasi watch` command on the terminal to achieve the same.

### Appendix: App Code

- **Delivery Dashboard** (top-left): Real-time order matching.
  - This app can be directly accessed by adding `/delivery-dashboard` to the demo URL.
  - The code for this dashboard is available in the `tutorial/curbside-pickup/delivery-dashboard` directory.
- **Delay Dashboard** (top-right): Identify extended wait times in real time.
  - This app can be directly accessed by adding `/delay-dashboard` to the demo URL.
  - The code for this dashboard is available in the `tutorial/curbside-pickup/delay-dashboard` directory.
- **Retail Operations** (bottom-right): Simulate order management
  - This app can be directly accessed by adding `/retail-ops` to the demo URL.
  - The code for this dashboard is available in the `tutorial/curbside-pickup/retail-ops` directory.
  - The API for this app is available at URL `/retail-ops/docs`.
- **Physical Operations** (bottom-left): Simulate vehicle movement
  - This app can be directly accessed by adding `/physical-ops` to the demo URL.
  - The code for this dashboard is available in the `tutorial/curbside-pickup/physical-ops` directory.
  - The API for this app is available at URL `/physical-ops/docs`.

If you want to modify the applications, the tutorial includes helpful scripts:

#### Hot Reload for Development

**macOS/Linux:**
```sh
# Rebuild and deploy a specific app with your changes
cd tutorial/curbside-pickup
./scripts/dev-reload.sh retail-ops
```

**Windows (PowerShell):**
```powershell
cd tutorial\curbside-pickup
.\scripts\dev-reload.ps1 retail-ops
```

This script:
- Builds a new Docker image from local source
- Imports it into the k3d cluster
- Updates the deployment to use your custom image

#### Reset to Official Images

**macOS/Linux:**
```sh
# Reset a single app
./scripts/reset-images.sh retail-ops

# Reset all apps
./scripts/reset-images.sh all
```

**Windows (PowerShell):**
```powershell
# Reset a single app
.\scripts\reset-images.ps1 retail-ops

# Reset all apps
.\scripts\reset-images.ps1 all
```