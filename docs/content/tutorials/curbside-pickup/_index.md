---
type: "docs"
title: "Curbside Pickup with Drasi"
linkTitle: "Curbside Pickup with Drasi"
weight: 40
description: >
    Learn how to use Drasi to power reactive dashboards over multiple data sources
---

## Scenario
Imagine a hypothetical scenario where a store operating curbside pickup for
    customer orders.

The order information is stored in a PostgreSQL database and it includes:
* Customer Name
* Driver Name
* Pickup Vehicle Plate
* Order Status

When the retail team is ready with an order, they can mark the Order status as
    "Ready". The PostgreSQL database reflects the realtime state of orders.

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

### Order Delivery

Let us say we want to build a reactive front end dashboard that would alert
    the delivery staff when an order is ready and is matched to a driver who
    has arrived at the curbside pickup zone. The dashboard should get
    dynamically updated as the vehicle location changes or when the order
    status changes.

What would it take to build such a reactive dashboard that has incoming data
    from two different databases?

### Delayed Orders

What if we also wanted a dashboard that can alert the retail backend team
    when the pickup driver has been waiting in the curbside zone and
    the order has not been ready for more than a fixed amount of time?

How would we build such a dashboard?

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
  alt="Screenshot showing configuration for Codespaces" width="45%" >}}

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
  alt="Screenshot showing configuration for Codespaces" width="45%" >}}

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
  alt="Screenshot showing configuration for Codespaces" width="70%" >}}

## Curbside Pickup with Drasi

The rest of this tutorial will guide us step by step in setting up the mock
    scenario discussed earlier and create the two realtime dashboards with
    minimal effort.

### Tutorial Modes

You can follow along the steps below in a Github codespace, a VSCode Dev
  Container or your own Kubernetes environment.

{{< tabpane >}}

{{% tab header="Github Codespaces" text=true %}}

The easiest way to follow along with this tutorial is to launch a Github
  Codespace using the link below. This will allow you to run the example
  application within your browser without setting up anything on your own
  machines.

[![Open in Github Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/drasi-project/learning?devcontainer_path=.devcontainer%2Fcurbside-pickup%2Fdevcontainer.json&machine=standardLinux32gb)

This will open a page with some configuration options. Make sure that the
  'Branch' selected is `main` and set the 'Dev Container configuration' to
  'Curbside Pickup with Drasi'.

{{< figure src="Screenshot_CodespacesConfig.png"
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

Once the solution is open in VS Code, follow these steps:
- Press Cmd + Shift + P (on MacOS) or Ctrl + Shift + P (Windows or Linux) to
    launch the command palette.
- Select `Dev Containers: Rebuild and Reopen in Container`.
- Select the `Curbside Pickup with Drasi` option to launch this tutorial.

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

### Setting up Retail Ops
Note: For this section, all of the code and configuration lives inside the `curbside-pickup/retail-ops` directory of the project.
Please navigate to that before running any of the commands below.

#### Database setup
The retail operations team deals with Orders.
The order information is stored in a PostgreSQL DB.
Here's how to set it up:

{{< tabpane >}}

{{% tab header="Github Codespaces" text=true %}}

Your PostgreSQL DB was already setup inside your codespace and is ready to use.

{{% /tab %}}

{{% tab header="VSCode DevContainer" text=true %}}

Your PostgreSQL DB was already setup inside your dev container and is ready to use.

{{% /tab %}}

{{% tab header="Local Setup" text=true %}}

Please apply the `postgres-database.yaml` found in the `retail-ops` directory:

```sh
kubectl apply -f postgres-database.yaml
```

Check if the pod running postgres is up:

```sh
kubectl get pods
```

Once the pod running Postgres is successfully running, you can proceed to the next step.

```
NAME                       READY   STATUS    RESTARTS   AGE
postgres-xxxxx-xxxxx   1/1     Running   0          63s
```

Forward the port to localhost using:

```sh
kubectl port-forward svc/postgres 5432:5432
```

{{% /tab %}}

{{% /tabpane %}}


#### Retail Ops Backend
We have a simple backend that allows CRUD on the PostgreSQL DB.
This is written in Python using FAST API.
You can start the server in a new terminal window using the following commands.
Make sure you are in the `curbside-pickup/retail-ops` directory prior to running the commands.

```sh
cd retail-ops/backend

python3 -m venv venv && source venv/bin/activate && pip3 install -r requirements.txt

uvicorn main:app --reload --port 8004
```

{{< tabpane >}}

{{% tab header="Github Codespaces" text=true %}}

The above commands should launch the backend server listening on port 8004.
    GitHub will expose the backend on a URL like
    `https://<your-codespace-id>-8004.app.github.dev/`
    where you need to plug in your codespace id.

You should also see a pop-up notification on the bottom-right of the screen like:
{{< figure src="Screenshot_RetailOps_BrowserPort.png"
    alt="Screenshot showing port exposed for Retail Ops Backend."
    width="50%" >}}

Check if you can access the docs resource on the above URL.
You should also get a pop-up on the bottom right of your screen to open it.

The `https://<your-codespace-id>-8004.app.github.dev/docs` path should show the
    Swagger page for the API exposed by the backend, like in the screenshot
    below.

<br />

##### Troubleshooting
During the codespace launch, we have a few scripts that setup PostgreSQL as a
  serve on a k3d cluster. We then use a `port-forward` which helps the backend
  app to connect to the database. Check that the port-forward is running:

```sh
ps aux | grep "[k]ubectl port-forward"
```

If it is not, then you can run this in a separate terminal to ensure that the
  port is forwarded.

```sh
nohup kubectl port-forward svc/postgres 5432:5432 > "$LOG_DIR/postgres-port-forward.log" 2>&1 &
```

{{% /tab %}}

{{% tab header="VSCode DevContainer" text=true %}}

Your backend server will listen on port 8004. This should be accessible on
    localhost.

Your port will be automatically forwarded by VSCode. You can check this from
    the ports tab in VS Code.

You can check if the Swagger page for the backend API is accessible at
  `http://localhost:8004/docs/` like shown in the screenshot below.

##### Troubleshooting
During dev-container launch, we have a few scripts that setup PostgreSQL as a
  serve on a k3d cluster. We then use a `port-forward` which helps the backend
  app to connect to the database. Check that the port-forward is running:

```sh
ps aux | grep "[k]ubectl port-forward"
```

If it is not, then you can run this in a separate terminal to ensure that the
  port is forwarded.

```sh
nohup kubectl port-forward svc/postgres 5432:5432 > "$LOG_DIR/postgres-port-forward.log" 2>&1 &
```

{{% /tab %}}

{{% tab header="Local Setup" text=true %}}

Your backend server will listen on port 8004. This should be accessible on
  localhost.

You should be able to access the Swagger page for the backend API at
  `http://localhost:8004/docs/` like shown in the screenshot below.

##### Troubleshooting

Make sure that your PostgreSQL is running and is accessible to the backend.
Ensure that the port-forward we did in the DB setup is still running.

{{% /tab %}}

{{% /tabpane %}}

{{< figure src="Screenshot_RetailOps_BackendApi.png" alt="Screenshot showing Swagger docs for Retail Ops Backend." width="50%" >}}

#### Retail Ops Frontend

Let's deploy a React frontend App that uses the APIs exposed by the backend.

{{< tabpane >}}

{{% tab header="Github Codespaces" text=true %}}

Open the config file located at `curbside-pickup/retail-ops/frontend/.env`.

Set the `VITE_API_BASE_URL` to the backend URL for your codespace, which
    should look something like this:
    `https://<your-codespace-id>-8004.app.github.dev/`.

Here is how the file should look like:

```
VITE_API_BASE_URL=https://<your-codespace-id>-8004.app.github.dev/
VITE_PORT=3004
```

You must also make this backend port accessibly publicly by updating the PORTS
  section like this:
{{< figure src="Screenshot_RetailOps_MakePortPublic.png" alt="Screenshot showing how to make the Retail Ops Backend port public" width="100%" >}}


{{% /tab %}}

{{% tab header="VSCode DevContainer" text=true %}}

The commands below assumes that you have your retail ops backend running on port
    8004 on localhost.

If that is not the case, please provide the correct URL
    for the backend app in the variable `VITE_API_BASE_URL` configured in
    the file located at `curbside-pickup/retail-ops/frontend/.env`.

{{% /tab %}}

{{% tab header="Local Setup" text=true %}}

The commands below assumes that you have your retail ops backend running on port
    8004 on localhost.

If that is not the case, please provide the correct URL
    for the backend app in the variable `VITE_API_BASE_URL` configured in
    the file located at `curbside-pickup/retail-ops/frontend/.env`.

{{% /tab %}}

{{% /tabpane %}}

Run the following commands when you're in the `curbside-pickup/retail-ops`
    directory to launch the front end.

```sh
cd retail-ops/frontend

npm install

npm start
```

{{< tabpane >}}

{{% tab header="Github Codespaces" text=true %}}

The above command should launch a simple frontend react app for Retail Ops on
    port 3004. For your codespace, this should be accessible at the URL like:
    `https://<your-codespace-id>-3004.app.github.dev/`
  
You can also click on the pop-up notification to open the link in your browser:
{{< figure src="Screenshot_RetailOps_FrontendPort.png" alt="Screenshot showing popup notification for Retail Ops front-end." width="50%" >}}


##### Troubleshooting
You might see this error:
{{< figure src="Screenshot_RetailOps_FailedToFetch.png" alt="Screenshot showing popup notification for Retail Ops front-end." width="50%" >}}

Make sure that the backend port has been made public in the the `PORTS` tab in
  the codespace like explained in the previous section.

{{% /tab %}}

{{% tab header="VSCode DevContainer" text=true %}}

The above command should launch a simple frontend react app for Retail Ops on
    port 3004 on localhost.

If you want to use a different port, then please update the `PORT` variable in
    the file located at `curbside-pickup/retail-ops/frontend/.env`.

{{% /tab %}}

{{% tab header="Local Setup" text=true %}}

The above command should launch a simple frontend react app for Retail Ops on
    port 3004 on localhost.

If you want to use a different port, then please update the `PORT` variable in
    the file located at `curbside-pickup/retail-ops/frontend/.env`.

{{% /tab %}}

{{% /tabpane %}}

The frontend UI should look like the screenshot below.

{{< figure src="Screenshot_RetailOps_FrontendUI.png" alt="Screenshot showing the Retail Ops frontend app." width="50%" >}}

This completes the mock setup for the system used by the Backend team.
You can add new orders in the UI and mark existing orders `Ready`.

### Setting up Physical Ops
Just like we did for retail ops, we will setup a database, a backend and a
    frontend app to mock the Physical Operations side of the business.

Note: For this section, all of the code and configuration lives inside the
    `curbside-pickup/physical-ops` directory of the project. Please navigate
    to that before running any of the commands below.

#### Database setup
The physical operations team deals with Vehicles.
The order information is stored in a MySQL DB.
Here's how to set it up:

{{< tabpane >}}

{{% tab header="Github Codespaces" text=true %}}

Your MySQL DB was already setup inside your codespace and is ready to use.

{{% /tab %}}

{{% tab header="VSCode DevContainer" text=true %}}

Your MySQL DB was already setup inside your codespace and is ready to use.

{{% /tab %}}

{{% tab header="Local Setup" text=true %}}

Please apply the `mysql-database.yaml` found in the `physical-ops` directory:

```sh
kubectl apply -f mysql-database.yaml
```

Check if the pod running postgres is up:

```sh
kubectl get pods
```

Once the pod running MySQL is successfully running, you can proceed to the next step.

```
NAME                       READY   STATUS    RESTARTS   AGE
mysql-xxxxx-xxxxx   1/1     Running   0          63s
```

Forward the port to localhost using the following:

```sh
kubectl port-forward svc/mysql 3306:3306
```

{{% /tab %}}

{{% /tabpane %}}


#### Physical Ops Backend
Let's deploy a simple Python FAST API backend that allows CRUD on the MySQL DB.

Make sure you are in the `curbside-pickup/physical-ops` directory prior to
    running the commands below.

```sh
cd physical-ops/backend

python3 -m venv venv && source venv/bin/activate && pip3 install -r requirements.txt

uvicorn main:app --reload --port 8003
```

{{< tabpane >}}

{{% tab header="Github Codespaces" text=true %}}

The above commands should launch the backend server listening on port 8003.
    GitHub will expose the backend on a URL like
    `https://<your-codespace-id>-8003.app.github.dev/`
    where you need to plug in your codespace id.

You should also see a pop-up notification on the bottom-right of the screen like:
{{< figure src="Screenshot_PhysicalOps_BackendPort.png"
    alt="Screenshot showing port exposed for Physical Ops Backend."
    width="50%" >}}

Check if you can access the docs resource on the above URL.
You should also get a pop-up on the bottom right of your screen to open it.

The `https://<your-codespace-id>-8003.app.github.dev/docs` path should show the
    Swagger page for the API exposed by the backend, like in the screenshot
    below.

<br />

##### Troubleshooting
During the codespace launch, we have a few scripts that setup PostgreSQL as a
  serve on a k3d cluster. We then use a `port-forward` which helps the backend
  app to connect to the database. Check that the port-forward is running:

```sh
ps aux | grep "[k]ubectl port-forward"
```

If it is not, then you can run this in a separate terminal to ensure that the
  port is forwarded.

```sh
nohup kubectl port-forward svc/mysql 3306:3306 > "$LOG_DIR/mysql-port-forward.log" 2>&1 &
```

{{% /tab %}}

{{% tab header="VSCode DevContainer" text=true %}}

Your backend server will listen on port 8003. This should be accessible on
    localhost.

Your port will be automatically forwarded by VSCode. You can check this from
    the ports tab in VS Code.

You can check if the Swagger page for the backend API is accessible at
  `http://localhost:8003/docs/` like shown in the screenshot below.

##### Troubleshooting
During dev-container launch, we have a few scripts that setup MySQL as a
  serve on a k3d cluster. We then use a `port-forward` which helps the backend
  app to connect to the database. Check that the port-forward is running:

```sh
ps aux | grep "[k]ubectl port-forward"
```

If it is not, then you can run this in a separate terminal to ensure that the
  port is forwarded.

```sh
nohup kubectl port-forward svc/mysql 3306:3306 > "$LOG_DIR/mysql-port-forward.log" 2>&1 &
```

{{% /tab %}}

{{% tab header="Local Setup" text=true %}}

Your backend server will listen on port 8003. This should be accessible on
  localhost.

You should be able to access the Swagger page for the backend API at
  `http://localhost:8003/docs/` like shown in the screenshot below.

##### Troubleshooting

Make sure that your MySQL is running and is accessible to the backend.
Ensure that the port-forward we did in the DB setup is still running.

{{% /tab %}}

{{% /tabpane %}}

{{< figure src="Screenshot_PhysicalOps_BackendApi.png" alt="Screenshot showing Swagger docs for Physical Ops Backend." width="50%" >}}

#### Physical Ops Frontend

Let's deploy the React frontend App that uses the APIs exposed by the backend.

{{< tabpane >}}

{{% tab header="Github Codespaces" text=true %}}

Open the config file located at `curbside-pickup/physical_ops/frontend/.env`.

Set the `VITE_API_BASE_URL` to the backend URL for your codespace, which
    should look something like this:
    `https://<your-codespace-id>-8003.app.github.dev/`.

This is how the file should look:
```
VITE_API_BASE_URL=https://<your-codespace-id>-8003.app.github.dev
VITE_PORT=3003
```

You must also make this backend port accessibly publicly by updating the PORTS
  section like this:
{{< figure src="Screenshot_PhysicalOps_MakePortPublic.png" alt="Screenshot showing how to make the Retail Ops Backend port public" width="100%" >}}


{{% /tab %}}

{{% tab header="VSCode DevContainer" text=true %}}

The commands below assumes that you have your physical ops backend running on port
    8003 on localhost.

If that is not the case, please provide the correct URL
    for the backend app in the variable `VITE_API_BASE_URL` configured in
    the file located at `curbside-pickup/physical_ops/frontend/.env`.

{{% /tab %}}

{{% tab header="Local Setup" text=true %}}

The commands below assumes that you have your physical ops backend running on port
    8003 on localhost.

If that is not the case, please provide the correct URL
    for the backend app in the variable `VITE_API_BASE_URL` configured in
    the file located at `curbside-pickup/physical_ops/frontend/.env`.

{{% /tab %}}

{{% /tabpane %}}

Run the following commands when you're in the `curbside-pickup/physical-ops`
    directory to launch the front end.

```sh
cd physical-ops/frontend

npm install

npm start
```

{{< tabpane >}}

{{% tab header="Github Codespaces" text=true %}}

The above command should launch a simple frontend react app for Retail Ops on
    port 3003. For your codespace, this should be accessible at the URL like:
    `https://<your-codespace-id>-3003.app.github.dev/`
  
You can also click on the pop-up notification to open the link in your browser:
{{< figure src="Screenshot_PhysicalOps_FrontendPort.png" alt="Screenshot showing popup notification for Physical Ops front-end." width="50%" >}}

##### Troubleshooting
You might see this error:
{{< figure src="Screenshot_PhysicalOps_FailedToFetch.png" alt="Screenshot showing popup notification for Physical Ops front-end." width="50%" >}}

Make sure that the backend port has been made public in the the `PORTS` tab in
  the codespace like explained in the previous section.

{{% /tab %}}

{{% tab header="VSCode DevContainer" text=true %}}

The above command should launch a simple frontend react app for Physical Ops on
    port 3003 on localhost.

If you want to use a different port, then please update the `PORT` variable in
    the file located at `curbside-pickup/physical_ops/frontend/.env`.

{{% /tab %}}

{{% tab header="Local Setup" text=true %}}

The above command should launch a simple frontend react app for Physical Ops on
    port 3003 on localhost.

If you want to use a different port, then please update the `PORT` variable in
    the file located at `curbside-pickup/physical_ops/frontend/.env`.

{{% /tab %}}

{{% /tabpane %}}

The frontend UI should look like the screenshot below.

{{< figure src="Screenshot_PhysicalOps_FrontendUI.png" alt="Screenshot showing the Physical Ops frontend app." width="50%" >}}

This completes the mock setup for the system used for vehicle management.
You can add new vehicles in the UI and move them between Parking & Curbside.

### Configure Drasi

Now we have the complete setup for our mock scenario with two teams having
    their own separate databases. The frontend & backend apps for each allow
    us to fiddle with data stored in these databases.

Let us see how easy it is to build two realtime dashboards that utilize
    change data from the PostgreSQL DB and MySQL DB for incremental updates.

Here are the two dashboards we will create:
1. Delivery Dashboard - displays orders that are `Ready` for which vehicles are
    at `Curbside`.
1. Delay Dashboard - displays orders that are not `Ready` whilst the pickup
    driver has been waiting at `Curbside` for more than a fixed amount of time.

#### Installation

{{< tabpane >}}
{{% tab header="Github Codespaces" text=true %}}

Your codespace should have Drasi already installed and setup.
  Continue along with steps below.

{{% /tab %}}
{{% tab header="VSCode DevContainer" text=true %}}

Your dev container should have Drasi already installed and setup.
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

### Add Drasi Sources

Sources in Drasi provide connectivity to the data sources and monitor them for
  change. Learn {{< relurl "concepts/sources" "more about Sources here" >}}.
 
The retail team uses a PostgreSQL database which can be added as a Drasi source
    by using the YAML file below. This gives the connection parameters to Drasi
    and lists out the tables (`orders`) that we want to model and query.

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

Likewise, we can use the following YAML to configure a Drasi source for MySQL.
This gives Drasi the connection parameters and the tables of interest.

```yaml
apiVersion: v1
kind: Source
name: physical-ops
spec:
  kind: MySQL
  properties:
    host: mysql.default.svc.cluster.local
    user: test
    port: 3306
    ssl: false
    password: test
    database: PhysicalOperations
    tables:
      - PhysicalOperations.vehicles
```

Run the following command to create the Drasi source for Retail Ops.

```sh
cd drasi/

drasi apply -f retail-ops-source.yaml

drasi wait -f retail-ops-source.yaml -t 120
```

You can expect the following responses:
```
✓ Apply: Source/retail-ops: complete
✓ Wait Source/retail-ops online
```

Once the source is online you should be able to see it like so:

```sh
drasi list source
```

Following should be the output with nothing in the 'Messages' column:
```
      ID     | AVAILABLE | MESSAGES  
-------------+-----------+-----------
  retail-ops | true      |           
```

Likewise, run the following command to setup Drasi source for MySQL:

```sh
cd drasi/

drasi apply -f physical-ops-source.yaml

drasi wait -f physical-ops-source.yaml -t 120
```

You can expect the following responses:

```
✓ Apply: Source/physical-ops: complete
✓ Wait Source/physical-ops online
```

Once the source is online you should be able to see it like so:

```sh
drasi list source
```

Following should be the output with nothing in the 'Messages' column:

```
       ID      | AVAILABLE | MESSAGES  
---------------+-----------+-----------
  retail-ops   | true      |
  physical-ops | true      |
```


##### Troubleshooting the source
Check messages in output of `drasi list source`.

For more details you can also use `drasi describe source <source-name>`.

Check the logs of pods `<source-name>-reactivator-xxxxx` or
  `<source-name>-proxy-xxxxx`. These are deployed under drasi's namespace
  (default: drasi-system) in your kubernetes cluster.

### Write Drasi Queries
Continuous Queries are the mechanism by which you tell Drasi what changes to
  detect in source systems as well as the data you want distributed when changes
  are detected. You can read
  {{< relurl "concepts/continuous-queries" "more about them here" >}}.

#### Query for matched orders

When writing queries, Drasi allows us to model all of our data coming possibly
    coming from disparate heterogeneous systems as a single virtual graph of
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

This `joins` section helps Drasi understand on how to stitch together a graph
  of entities and relationships across arbitrary heterogeneous data sources.

To be able to create that virtualized graph, we need to tell Drasi on how to
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
Use the command below to apply it:

```sh
drasi apply -f delivery.yaml
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
```

#### Query for delayed orders
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

Here we utilize the temporal function `drasi.trueFor` which evaluates whether a
  boolean expression remains true for at least a period of time, starting from
  the time when the change being evaluated occurred.

Read more about `trueFor` and other [temporal functions here](http://localhost:1313/reference/query-language/#drasi-temporal-functions).

For our mock scenario, when we launch the apps some vehicles may already be
  at curbside at the beginning (epoch), and to filter those out we use this:
  `WHERE waitingSinceTimestamp != datetime({epochMillis: 0})`.

The full YAML for this query is present in the file 
  `curbside-pickup/drasi/delay.yaml`. To apply this query in Drasi, use:

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

### Drasi Reaction

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

In the terminal where you're in directory `curbside-pickup/drasi`, run the following
  commands to have a SignalR Reaction deployed to your Drasi instance.

```sh
drasi apply -f reaction.yaml
```

You can expect the following response:
```
✓ Apply: Reaction/signalr: complete
```

Note that reactions might take some time to come up. You can use the following
  convenient command to wait for it (up to 120 seconds) to come up:

```sh
drasi wait -f reaction.yaml -t 120
```

Once a reaction is online you should be able to see it like so:

```sh
drasi list reaction
```

Following should be the output with nothing in the 'Messages' column:
```
    ID    | AVAILABLE | MESSAGES  
----------+-----------+-----------
  signalr | true      |           
```

##### Troubleshooting the reaction
Check messages in output of `drasi list reaction`.

For more details you can also use
  `drasi describe reaction signalr`.

Check the logs of pods created for the services `signalr-gateway`.
  These are deployed under drasi's namespace (default: drasi-system) in your
  kubernetes cluster. You should also investigate the logs of the pods
  created for source which will have names like `signalr-xxxxx-xxxx`.

##### Port forwarding for Dashboard

The Drasi reaction creates a Kubernetes service `signalr-gateway` in the
  namespace `drasi-system`. This is the SignalR hub our frontend accessible
  within the Kubernetes cluster.

Since the Dashboard will run in your browser, you will need port forwarding.

Run the following command in the terminal.

```sh
kubectl -n drasi-system port-forward svc/signalr-gateway 8080:8080
```

This will ensure that the SignalR hub can be accessed from localhost on port 8080. 

{{< tabpane >}}
{{% tab header="Github Codespaces" text=true %}}

Github will also automatically create URL like
  `http://<your-codespace-url>-8080.app.github.dev`. This port needs to be
  made public by by right clicking on port 8080 on the `PORTS` tab like so:

{{< figure src="Screenshot_PortVisibility.png" alt="Screenshot showing how to make port public" width="80%" >}}

If all works well, you should be able to access the hub URL:
  `https://<your-codespace-url>-8080.app.github.dev/hub` in your browser
  and see `Connection ID required` on a blank page.

{{< figure src="Screenshot_SignalRHub.png" alt="Screenshot showing Connection ID Required" width="60%" >}}

{{% /tab %}}
{{% tab header="VSCode DevContainer" text=true %}}

VS Code will automatically forward port 8080 to localhost.
  You should be able to access the hub URL:
  `http://localhost:8080/hub` in your browser and see
  `Connection ID required` on a blank page.

{{< figure src="Screenshot_SignalRHub.png" alt="Screenshot showing Connection ID Required" width="60%" >}}

{{% /tab %}}
{{% tab header="Local Setup" text=true %}}

No extra step should be needed if you are going to run the realtime dashboard
  locally. You should be able to access the hub URL:
  `http://localhost:8080/hub` in your browser and see
  `Connection ID required` on a blank page.

{{< figure src="Screenshot_SignalRHub.png" alt="Screenshot showing Connection ID Required" width="60%" >}}

{{% /tab %}}
{{< /tabpane >}}

### Realtime Dashboards

With the SignalR hub available we can write a reactive dashboard with ease. We
  are able to receive all changelog events from the data source in any frontend
  application.

#### Delivery Dashboard

In this section we can finally fulfill the requirements laid out for
  [Realtime dashboard for order delivery](#realtime-dashboard-for-order-delivery).

We have written an example react app for this using the
  [react components package](https://www.npmjs.com/package/@drasi/signalr-react).
  This library provides React components for streaming changes from the Drasi
  SignalR Reaction.

All the code resides in the `curbside-pickup/delivery-dashboard` directory.

Before launching the dashboard app, we must configure the SignalR backend URL.
The configuration for the app is in `curbside-pickup/delivery-dashboard/.env`.

{{< tabpane >}}
{{% tab header="Github Codespaces" text=true %}}

Provide the URL of the signalR hub in `.env` file. Replace port `8080` if you
  used a different port number when forwarding the port.

The frontend app will launch by default on port 3001. This can also be
  configured in the `.env` file as shown below:

```
# SignalR endpoint URL
VITE_SIGNALR_URL=http://<your-codespace-url>-8080.app.github.dev/hub

# Query ID for ready-for-delivery orders
VITE_QUERY_ID=delivery

# PORT for hosting this dashboard
VITE_PORT=3001
```

{{% /tab %}}
{{% tab header="VSCode DevContainer" text=true %}}

Replace port `8080` if you used a different port number when forwarding the port.

The frontend app will launch by default on port 3001. This can also be
  configured in the `.env` file as shown below:

```
# SignalR endpoint URL
VITE_SIGNALR_URL=http://localhost:8080/hub

# Query ID for ready-for-delivery orders
VITE_QUERY_ID=delivery

# PORT for hosting this dashboard
VITE_PORT=3001
```

{{% /tab %}}
{{% tab header="Local Setup" text=true %}}

Replace port `8080` if you used a different port number when forwarding the port.

The frontend app will launch by default on port 3001. This can also be
  configured in the `.env` file as shown below:

```
# SignalR endpoint URL
VITE_SIGNALR_URL=http://localhost:8080/hub

# Query ID for ready-for-delivery orders
VITE_QUERY_ID=delivery

# PORT for hosting this dashboard
VITE_PORT=3001
```

{{% /tab %}}
{{% /tabpane %}}

Once configured, you can launch the app by running this command inside the
  `delivery-dashboard` directory:

```sh
cd delivery-dashboard

npm install

npm start
```

And you should then be able to see the following dashboard:

{{< figure src="Screenshot_DeliveryDashboard.png" alt="Screenshot showing the realtime dashboard for matched orders" width="70%" >}}

You can try to play with [Physical-Ops frontend app](#physical-ops-frontend)
  to move vehicles to/from Curbside location. You can also toggle orders
  as ready or not using the [Retail-Ops frontend](#retail-ops-frontend).

You should notice that any matched orders immediately show up on the dashboard.

{{< figure src="Screenshot_DeliveryMatched.png" alt="Screenshot showing the matched orders in real time" width="70%" >}}


#### Delay Dashboard

In this section we can fulfill the requirements laid out for
  [Realtime dashboard for delayed orders](#realtime-dashboard-for-delayed-orders).

We have written an example Vue app for this using the
  [vue components package](https://www.npmjs.com/package/@drasi/signalr-vue).
  This library provides Vue components for streaming changes from the Drasi
  SignalR Reaction.

All the code resides in the `curbside-pickup/delay-dashboard` directory.

Before launching the dashboard app, we must configure the SignalR backend URL.
The configuration for the app is in `curbside-pickup/delay-dashboard/.env`.

{{< tabpane >}}
{{% tab header="Github Codespaces" text=true %}}

Provide the URL of the signalR hub in `.env` file. Replace port `8080` if you
  used a different port number when forwarding the port.

The frontend app will launch by default on port 3002. This can also be
  configured in the `.env` file as shown below:

```
# SignalR endpoint URL
VITE_SIGNALR_URL=https://<your-codespace-url>-8080.app.github.dev/hub

# Query ID for orders with extended wait times
VITE_QUERY_ID=delay

# PORT for hosting this dashboard
VITE_PORT=3002
```

{{% /tab %}}
{{% tab header="VSCode DevContainer" text=true %}}

Replace port `8080` if you used a different port number when forwarding the port.

The frontend app will launch by default on port 3002. This can also be
  configured in the `.env` file as shown below:

```
# SignalR endpoint URL
VITE_SIGNALR_URL=http://localhost:8080/hub

# Query ID for orders with extended wait times
VITE_QUERY_ID=delay

# PORT for hosting this dashboard
VITE_PORT=3002
```

{{% /tab %}}
{{% tab header="Local Setup" text=true %}}

Replace port `8080` if you used a different port number when forwarding the port.

The frontend app will launch by default on port 3002. This can also be
  configured in the `.env` file as shown below:

```
# SignalR endpoint URL
VITE_SIGNALR_URL=http://localhost:8080/hub

# Query ID for orders with extended wait times
VITE_QUERY_ID=delay

# PORT for hosting this dashboard
VITE_PORT=3002
```

{{% /tab %}}
{{% /tabpane %}}

Once configured, you can launch the app by running this command inside the
  `delay-dashboard` directory:

```sh
cd delay-dashboard

npm install

npm start
```

And you should then be able to see the following dashboard:

{{< figure src="Screenshot_DelayDashboard.png" alt="Screenshot showing the realtime dashboard for delayed orders" width="70%" >}}

You can try to play with [Physical-Ops frontend app](#physical-ops-frontend)
  to move vehicles to/from Curbside location. You can also toggle orders
  as ready or not using the [Retail-Ops frontend](#retail-ops-frontend).

You should notice that any vehicles that wait on Curbside without order being
  ready for 10+ seconds, will show up on the dashboard almost immediately.

{{< figure src="Screenshot_DelayedOrders.png" alt="Screenshot showing the delayed orders in real time" width="70%" >}}

### Demo Time

We have built two front end apps to mock the vehicle & order management
  scenarios. We also have built two reactive dashboards. To see all of
  this in action at the same time, let us use the `index.html` file
  located in the `curbside-pickup` directory.

Check if the URLs for the four apps are correct in the file `index.html` in
  root directory of the project. Update the ports if using different ones.

Below example assumes port numbers:
- 3001 for delivery dashboard app
- 3002 for delay dashboard app
- 3003 for physical operations frontend app
- 3004 for retail operations frontend app

{{< tabpane >}}
{{% tab header="Github Codespaces" text=true %}}

Update the Github port URLs carefully in the file located at
  `curbside-pickup/index.html`, as shown below:

```html
<div class="row">
    <div class="iframe-container"><iframe src="https://<your-codespace-id>-3001.app.github.dev" id="delivery-dashboard"></iframe></div>
    <div class="iframe-container"><iframe src="https://<your-codespace-id>-3002.app.github.dev" id="delay-dashboard"></iframe></div>
</div>
<div class="row">
    <div class="iframe-container"><iframe src="https://<your-codespace-id>-3003.app.github.dev" id="physical-operations"></iframe></div>
    <div class="iframe-container"><iframe src="https://<your-codespace-id>-3004.app.github.dev" id="retail-operations"></iframe></div>
</div>
```

<br />

Right click on the file and select `Open in Live Server`:

{{< figure src="Screenshot_OpenLiveServer.png" alt="Screenshot showing how to open live server" width="70%" >}}

This should expose a new port and open the corresponding URL created by Github
  codespaces. Open this URL:

```
https://<your-codespace-id>-5500.app.github.dev/
```

{{% /tab %}}
{{% tab header="VSCode DevContainer" text=true %}}

Ensure that the ports are correct in the file `curbside-pickup/index.html`:

```html
<div class="row">
    <div class="iframe-container"><iframe src="http://localhost:3001" id="delivery-dashboard"></iframe></div>
    <div class="iframe-container"><iframe src="http://localhost:3002" id="delay-dashboard"></iframe></div>
</div>
<div class="row">
    <div class="iframe-container"><iframe src="http://localhost:3003" id="physical-operations"></iframe></div>
    <div class="iframe-container"><iframe src="http://localhost:3004" id="retail-operations"></iframe></div>
</div>
```

<br />

Right click on the file and select `Open in Live Server`:

{{< figure src="Screenshot_OpenLiveServer.png" alt="Screenshot showing how to open live server" width="70%" >}}

{{% /tab %}}
{{% tab header="Local Setup" text=true %}}

Ensure that the ports are correct in the file `curbside-pickup/index.html`:

```html
<div class="row">
    <div class="iframe-container"><iframe src="http://localhost:3001" id="delivery-dashboard"></iframe></div>
    <div class="iframe-container"><iframe src="http://localhost:3002" id="delay-dashboard"></iframe></div>
</div>
<div class="row">
    <div class="iframe-container"><iframe src="http://localhost:3003" id="physical-operations"></iframe></div>
    <div class="iframe-container"><iframe src="http://localhost:3004" id="retail-operations"></iframe></div>
</div>
```

<br />

Open this file path in your browser using URL path like this:

```
file:///<path-to-learning-repo>/apps/curbside-pickup/index.html
```

{{% /tab %}}
{{% /tabpane %}}

You should now be able to see this UI for playing with the reactive dashboard:

{{< figure src="Screenshot_ReactivenessPortal.png" alt="Screenshot showing the reactiveness portal" width="100%" >}}

Try the following steps to test out matched orders.

1. Mark Order #3 as ready in the Retail Operations app.
1. Move the Black Honda Civic (C9876) to Curbside in Physical Operations app.
1. Observe the matched order #3 get displayed as `Ready for Delivery`.

Try the following steps to test out the delay alerts.

1. Move the Red Ford F-150 (B5678) to Curbside in Physical Operations app.
1. Wait for 10 seconds.
1. Observe the delay alert for this driver show up on the delay dashboard.

{{< figure src="Screenshot_ShowReactiveness.png" alt="Screenshot showing the reactiveness of system" width="100%" >}}

Feel free to play with vehicles and orders, and also to add new ones to
  test how instantaneous the dashboards are.

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
  the much simpler Cypher query using temporal functions, the power and appeal
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
  reactions to get result sets that are continuously accurate (in near real
  time).

### Drasi Components

Drasi has three components, which in our scenario look something like this:

{{< figure src="Diagram_DrasiUnderTheHood.png"
  alt="Diagram showing Drasi components" width="70%" >}}

When we deploy a YAML config for a Drasi source, behind the scenes it
  initializes a process that subscribes to the change feed. Drasi has
  a dedicated Drasi-Source for each data-source it subscribes to.

Any system that holds data which provides an API to query the initial state of
  data and a way to subscribe to a feed of changes happening to the data can
  become a Drasi source. We have SDKs available in multiple languages that
  allow you to turn any system into a Drasi source.

- Learn more about {{< relurl "concepts/sources" "Drasi sources here" >}}.
- Checkout [Drasi Source SDK here](https://github.com/drasi-project/drasi-platform/tree/main/sources/sdk).

When we deploy a YAML config with our Cypher query, the continuous query is run
  on a query host. By default it is run on the default query container within
  Drasi.

These continuous queries allow you to model all of your data across multiple,
  disparate and heterogeneous systems as a single graph and specify your query
  declaratively in Cypher.

While a query is running, Drasi maintains an incrementally updated result set.

- Learn more about {{< relurl "concepts/continuous-queries" "Continuous queries here" >}}.
- Checkout the full Query Syntax here {{< relurl "reference/query-language" "full Query Syntax here" >}}.

Finally, Drasi reactions allow Drasi to take arbitrary actions in external
  systems when the result set of a query changes. In our example above, we had
  a SignalR reaction that was used to send updates to the dashboards.

Drasi can perform actions in many different types of systems, and we also have
  an SDK that allows you to write your own reaction in the language of your choice.

- Learn more about {{< relurl "concepts/reactions" "Drasi Reactions here" >}}.
- Checkout the [Drasi Reaction SDK here](https://github.com/drasi-project/drasi-platform/tree/main/reactions/sdk).

## Summary

With this example, we hope that we have demonstrated that just by writing a few
  YAML-config files and Cypher-style declarative queries, we can build new
  systems that are truly reactive using data from existing systems even if data
  lives in disparate and heterogeneous systems.

Learn {{< relurl "concepts/overview" "more about \"Why Drasi?\" here" >}}.

## What's next?

You can try the next guided tutorial in our series that demonstrates how to
{< relurl "tutorials/risky-containers" "build a dashboard of high-risk container images"}}
  running in your Kubernetes cluster using Drasi.

Here are some additional resources:

- Learn more about {{< relurl "concepts/sources" "Drasi sources here" >}}.
- Learn more about {{< relurl "concepts/continuous-queries" "Continuous queries here" >}}.
- Learn more about {{< relurl "concepts/reactions" "Drasi Reactions here" >}}.