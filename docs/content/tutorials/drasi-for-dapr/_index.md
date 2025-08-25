---
type: "docs"
title: "Drasi for Dapr"
linkTitle: "Drasi for Dapr"
weight: 40
description: >
    Learn how Drasi can supercharge your Dapr applications with real-time data change processing across distributed microservices
---


This scenario was also demonstrated as part of Dapr Community Call #123. Watch below:
{{< youtube S-ImhYfLplM >}}

## Scenario

Imagine an e-commerce platform built with Dapr microservices, where each service manages its own state store independently:

* **Products Service**: Manages product inventory and stock levels
* **Customers Service**: Tracks customer information and tier levels (Gold, Silver, Bronze)
* **Orders Service**: Processes customer orders and delivery status
* **Reviews Service**: Handles product reviews and ratings

{{< figure src="02-ecommerce-scenario.png"
  alt="Four Dapr services, each with its own PostgreSQL state store" width="50%" >}}

Each service uses Dapr's state management building block with PostgreSQL as the backing store, following microservices best practices of data isolation.

### The Challenges

While Dapr provides excellent building blocks for microservices, certain cross-service scenarios remain challenging:

#### 1. Derived Data Challenge
The marketing team wants a product catalog that combines:
- Product details from the Products Service
- Average ratings and review counts from the Reviews Service
- Real-time stock levels

{{< figure src="06-derived-data-challenge.png"
  alt="The derived data challenge without Drasi" width="60%" >}}

Without Drasi, this would require:
- API orchestration across multiple services
- Caching layers to avoid constant polling
- Complex synchronization logic when data changes

#### 2. Real-Time Monitoring Challenge
The operations team needs dashboards showing:
- Gold customers with delayed orders (say >2 days)
- Orders at risk due to insufficient stock
- Real-time updates as conditions change

{{< figure src="07-dashboard-challenge.png"
  alt="The real-time monitoring challenge without Drasi" width="60%" >}}

Traditional approaches would involve:
- Periodic polling of multiple services
- Client-side data correlation
- Significant network overhead

#### 3. Intelligent Business Events Challenge
The inventory team needs differentiated alerts:
- **Low stock warning** when inventory drops below 20 units
- **Critical stock alert** when inventory drops below 5 units
- Different teams notified based on severity

{{< figure src="08-eventing-challenge.png"
  alt="The intelligent business events challenge without Drasi" width="60%" >}}

This typically requires:
- Custom event processing logic
- State management for threshold tracking
- Complex pub/sub routing rules

### Traditional Approaches

For the derived data scenario, you could decide to use an API Gateway to aggregate data from multiple services. You could also introduce a caching layer to avoid repeatedly querying the underlying services, but the complexity and failure rates remain high.

For all the scenarios, you could use event sourcing with CQRS, where services publish domain events to an event store and build read models on top of that. Then query services can serve aggregated data and event processors handle business logic. This comes with a complete audit trail, but comes with significant architectural changes and require modifications to existing services.

You could also use Change Data Capture with stream processing, but you will need complex infrastructure setup (Kafka, Flink, etc.) and operational overhead. You must also deal with schema evolution changes.

### Enter Drasi

What if you could solve these challenges without writing backend code or managing complex infrastructure?

Drasi provides a data change processing platform that:
- **Monitors your Dapr state stores** via PostgreSQL logical replication
- **Processes complex queries** across multiple databases in real-time
- **Triggers reactions** only when meaningful conditions are met
- **Requires zero changes** to your existing Dapr services

#### Why Drasi for Dapr Users?

**Built on Dapr**: Drasi itself runs on Dapr and uses Dapr building blocks internally (Actors, State Stores, Pub/Sub). Installing Drasi automatically installs Dapr if not present.

**Non-Invasive Integration**: Connects directly to your PostgreSQL state stores without modifying services or adding SDKs.

**Declarative Queries**: Write Cypher queries to detect complex patterns across services - no imperative code needed.

**Native Dapr Reactions**: Purpose-built reactions for Dapr ecosystems:
- Sync Dapr State Store for materialized views
- Post Dapr Pub/Sub for event generation
- SignalR for real-time updates

Here's how our architecture looks with Drasi:

{{< figure src="01-architecture-overview.png"
  alt="Architecture showing four Dapr services with PostgreSQL state stores, Drasi monitoring via logical replication, and three Drasi-powered services" width="100%" >}}

## Dapr + Drasi Tutorial

This tutorial will guide you through setting up a complete e-commerce scenario demonstrating Drasi's capabilities with Dapr applications.

### What You'll Build

1. **Product Catalog Service**: A materialized view combining products and review statistics
2. **Operations Dashboard**: Real-time monitoring of at-risk orders and Gold customer delays
3. **Notifications Service**: Intelligent inventory alerts with business logic

### Tutorial Modes

You can follow along in three different environments:

{{< tabpane >}}

{{% tab header="GitHub Codespaces" text=true %}}

The easiest way to follow this tutorial is using GitHub Codespaces. Everything will be pre-configured in your browser.

[![Open in Github Codespaces](https://github.com/codespaces/badge.svg)](https://github.com/codespaces/new?hide_repo_select=true&ref=main&repo=778887889&skip_quickstart=true&machine=standardLinux32gb&devcontainer_path=.devcontainer%2Fdapr%2Fdevcontainer.json)

This will open a configuration page like shown below. Ensure the following:
- Branch: `main`
- Dev container configuration: **`Drasi For Dapr`**
- Machine type: Prefer 8-core or higher

{{< figure src="Codespaces_01_Config.png"
  alt="Screenshot showing Codespaces configuration with Drasi For Dapr selected" width="80%" >}}

The Codespace will take about 5 minutes to initialize. You'll see setup logs in the terminal showing:
- K3d cluster creation
- Drasi platform installation (includes Dapr)
- PostgreSQL and Redis deployment
- All microservices deployment
- Load initial data

{{% /tab %}}

{{% tab header="VSCode DevContainer" text=true %}}

To use a Dev Container locally, you'll need:
- [Visual Studio Code](https://code.visualstudio.com/)
- [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
- [Docker Desktop](https://www.docker.com/get-started/)
- At least 16GB available RAM

Steps:
1. [Clone the learning repository](https://github.com/drasi-project/learning)
2. Open the repository in VS Code
3. When prompted, click "Dev Containers: Rebuild and Reopen in Container"
4. Select `Drasi for Dapr` from the list
5. Wait for initialization (~5 minutes)

The Dev Container will automatically:
- Create a k3d cluster
- Install Drasi (includes Dapr)
- Deploy all services
- Load initial data

{{% /tab %}}

{{% tab header="Local Setup" text=true %}}

For local Kubernetes setup, you'll need:
- Docker
- kubectl
- k3d (or another Kubernetes distribution)
- [Drasi CLI](https://drasi.io/reference/command-line-interface/#get-the-drasi-cli)

Navigate to the tutorial directory and run the setup script:

```bash
cd tutorial/dapr

# For Linux/Mac
./scripts/setup-tutorial.sh

# For Windows PowerShell
./scripts/setup-tutorial.ps1
```

The script will:
1. Create a k3d cluster with port mapping
2. Install Drasi platform (includes Dapr)
3. Deploy PostgreSQL databases for each service
4. Deploy Redis for notifications
5. Deploy all Dapr services
6. Load initial data

{{% /tab %}}

{{% /tabpane %}}

### Verify the Setup

Once setup is complete, verify all services are running:

```bash
kubectl get svc
```

You should see:
- 4 core services (products, customers, orders, reviews)
- 3 Drasi-powered services (catalogue, dashboard, notifications)
- PostgreSQL instances for each service
- Redis for notifications

{{< tabpane >}}

{{% tab header="GitHub Codespaces" text=true %}}

Access the services via the forwarded ports. Check the **PORTS** tab in VS Code:

{{< figure src="Codespaces_02_Ports.png"
  alt="Screenshot showing forwarded ports in Codespaces" width="100%" >}}

Your URLs will be:
- Products API: `https://<codespace-name>-80.app.github.dev/products-service/docs`
- Customers API: `https://<codespace-name>-80.app.github.dev/customers-service/docs`
- Orders API: `https://<codespace-name>-80.app.github.dev/orders-service/docs`
- Reviews API: `https://<codespace-name>-80.app.github.dev/reviews-service/docs`

{{% /tab %}}

{{% tab header="VSCode DevContainer" text=true %}}

Services are accessible on `localhost:8123`:

- Products API: http://localhost:8123/products-service/docs
- Customers API: http://localhost:8123/customers-service/docs
- Orders API: http://localhost:8123/orders-service/docs
- Reviews API: http://localhost:8123/reviews-service/docs

{{% /tab %}}

{{% tab header="Local Setup" text=true %}}

Services are accessible on `localhost:8123`:

- Products API: http://localhost:8123/products-service/docs
- Customers API: http://localhost:8123/customers-service/docs
- Orders API: http://localhost:8123/orders-service/docs
- Reviews API: http://localhost:8123/reviews-service/docs

{{% /tab %}}

{{% /tabpane %}}

### Deploy Drasi Components

Now let's deploy the Drasi sources, queries, and reactions that will power our enhanced services:

```bash
# Deploy Drasi Sources and wait for them to be live
drasi apply -f drasi/sources/*
drasi wait -f drasi/sources/*

# Deploy Continuous Queries and wait for them to be live
drasi apply -f drasi/queries/*
drasi wait -f drasi/queries/*

# Deploy Reactions and wait for them to be live
drasi apply -f drasi/reactions/*
drasi wait -f drasi/reactions/*
```

Verify Drasi components are ready:

```bash
drasi list sources
drasi list queries
drasi list reactions
```

### Demo 1: Materialized State Store

The Product Catalog demonstrates how Drasi can maintain a materialized view combining data from multiple services.

#### Understanding the Query

Let's examine the `product-catalogue` query that powers this feature:

```cypher
MATCH
   (r:reviews)-[:REVIEW_TO_PRODUCT]->(p:products)
WITH
   p, avg(r.rating) as avgRating, count(r) as reviewCount
RETURN
   p.productId AS product_id,
   p.productName AS product_name,
   p.productDescription AS product_description,
   avgRating AS avg_rating,
   reviewCount AS review_count
```

This query:
- Matches all products
- Joins with reviews for each product
- Calculates review statistics
- Returns a complete catalog entry

#### The Sync Dapr State Store Reaction

The reaction configuration syncs query results to a new Dapr state store:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: sync-dapr-statestore
data:
  query: product-catalogue
  daprStateStoreName: catalogue-statestore-drasi
  daprAppId: drasi-reaction
```

#### See It In Action

{{< tabpane >}}

{{% tab header="GitHub Codespaces" text=true %}}

1. Open the Catalog UI:
   ```
   https://<codespace-name>-80.app.github.dev/catalogue-service
   ```

2. Note the products display with review statistics

3. In a new terminal, run the demo script:
   ```bash
   cd demo
   ./demo-catalogue-service.sh
   ```

{{% /tab %}}

{{% tab header="VSCode DevContainer" text=true %}}

1. Open the Catalog UI:
   ```
   http://localhost:8123/catalogue-service
   ```

2. Note the products display with review statistics

3. In a new terminal, run the demo script:
   ```bash
   cd demo
   ./demo-catalogue-service.sh
   ```

{{% /tab %}}

{{% tab header="Local Setup" text=true %}}

1. Open the Catalog UI:
   ```
   http://localhost:8123/catalogue-service
   ```

2. Note the products display with review statistics

3. In a new terminal, run the demo script:
   ```bash
   cd demo
   ./demo-catalogue-service.sh
   ```

{{% /tab %}}

{{% /tabpane %}}

The demo will:
1. Show current catalog state
2. Add new reviews to products
3. Demonstrate real-time catalog updates
4. Modify product prices
5. Show immediate reflection in the UI

{{< figure src="03-screenshot-catalog-service.png"
  alt="Product catalog showing materialized view with products and review statistics" width="80%" >}}

Key observations:
- **No API calls** between services
- **No polling** for updates
- **Immediate consistency** when data changes
- **Zero code** for aggregation logic

### Demo 2: Real-Time Dashboard

The dashboard demonstrates complex monitoring queries across multiple services.

#### Query 1: At-Risk Orders

```cypher
MATCH
   (o:orders)-[:ITEM_OF_ORDER]->(oi:orderItem),
   (oi)-[:ORDER_ITEM_TO_PRODUCT]->(p:products)
WHERE
   o.orderStatus IN ['PENDING', 'PAID'] AND
   p.stockOnHand < oi.quantity
RETURN
   o.orderId AS orderId,
   o.customerId AS customerId,
   o.orderStatus AS orderStatus,
   oi.quantity AS quantity,
   p.productId AS productId,
   p.productName AS productName,
   p.stockOnHand AS stockOnHand
```

This query identifies orders that are in `PENDING` or `PAID` state, but cannot be fulfilled due to stock shortages.

#### Query 2: Delayed Gold Orders

```cypher
MATCH
   (o:orders)-[:ORDER_TO_CUSTOMER]->(c:customers)
WHERE
   c.loyaltyTier = 'GOLD'
WITH
   o, c, drasi.changeDateTime(o) as waitingSince
WHERE
   drasi.trueFor(o.orderStatus = 'PROCESSING', duration ({ seconds: 10 }))
RETURN
   o.orderId AS orderId,
   o.orderStatus AS orderStatus,
   c.customerId AS customerId,
   c.customerName AS customerName,
   c.customerEmail AS customerEmail,
   waitingSince
```

This detects orders from Gold customers that are stuck in `PROCESSING` state for more than 10 seconds. Of course, in the real world we can change this to be days or any arbitrary time interval.

But this query highlights the unique ability of Drasi to monitor not just for changes, but also for absence of changes. Here we are using `trueFor` - which is one of Drasi's [many future functions](/reference/query-language/drasi-custom-functions/#drasi-future-functions).

#### SignalR Reaction

The SignalR reaction streams query results in real-time:

```yaml
apiVersion: v1
kind: Reaction
name: signalr
spec:
  kind: SignalR
  queries:
    at-risk-orders-query:
    delayed-gold-orders-query:
```

When you apply this simple YAML file to Drasi, it will deploy a new reaction which is a full fledged web-socket server that is based on SignalR (and therefore gets the websocket fallback mechanisms from SignalR like SSE, etc.).

Drasi also frontend components for [React](/tutorials/connecting-frontends/react) and [Vue](/tutorials/connecting-frontends/vue) published to NPM, which makes it really easy to build reactive front-end dashboards that display the live result set of Drasi's continuous queries.

#### See It In Action

We've written an interactive demo script for you to see the dashboard live in action.

{{< tabpane >}}

{{% tab header="GitHub Codespaces" text=true %}}

1. Open the Dashboard:
   ```
   https://<codespace-name>-80.app.github.dev/dashboard
   ```

2. Run the demo script:
   ```bash
   cd demo
   ./demo-dashboard-service.sh
   ```

{{% /tab %}}

{{% tab header="VSCode DevContainer" text=true %}}

1. Open the Dashboard:
   ```
   http://localhost:8123/dashboard
   ```

2. Run the demo script:
   ```bash
   cd demo
   ./demo-dashboard-service.sh
   ```

{{% /tab %}}

{{% tab header="Local Setup" text=true %}}

1. Open the Dashboard:
   ```
   http://localhost:8123/dashboard
   ```

2. Run the demo script:
   ```bash
   cd demo
   ./demo-dashboard-service.sh
   ```

{{% /tab %}}

{{% /tabpane %}}

The demo will:
1. Create orders for Gold customers
2. Show real-time dashboard updates
3. Simulate order delays
4. Reduce product stock
5. Display at-risk orders immediately

{{< figure src="04-screenshot-dashboard.png"
  alt="Operations dashboard showing Gold customer delays and at-risk orders" width="100%" >}}

Watch for:
- **WebSocket connections** established automatically
- **Instant updates** when conditions are met
- **Automatic removal** when conditions no longer apply
- **Cross-service correlations** without API calls

### Demo 3: Intelligent Notifications

The notifications service demonstrates event transformation and intelligent routing. Let's consider the two queries that give us actionable business events instead of raw change-events.

#### Low Stock Event Query
Following query maintains the list of products for which the stock is below threshold but is still not zero:
```cypher
MATCH
   (p:products)
WHERE
   p.stockOnHand <= p.lowStockThreshold AND p.stockOnHand > 0
RETURN
   p.productId AS productId,
   p.productName AS productName,
   p.stockOnHand AS stockOnHand,
   p.lowStockThreshold AS lowStockThreshold
```

#### Critical Stock Event Query
Following query maintains the list of products for which the stock is completely exhausted:
```cypher
MATCH
   (p:products)
WHERE
   p.stockOnHand = 0
RETURN
   p.productId AS productId,
   p.productName AS productName,
   p.productDescription AS productDescription
```

#### Post Dapr Pub/Sub Reaction

With the following YAML file, we can tell Drasi on how to route the business events to a dapr pub-sub. Here we can control what topic to route events to, their format and other settings. More details on how to setup a Post-Dapr-PubSub Reaction [in Drasi are here](/how-to-guides/configure-reactions/configure-post-pubsub-reaction).

```yaml
kind: Reaction
apiVersion: v1
name: stock-notifications-publisher
spec:
  kind: PostDaprPubSub
  queries:
    # Publish low stock events to the "low-stock-events" topic
    low-stock-event-query: >
      {
        "pubsubName": "notifications-pubsub",
        "topicName": "low-stock-events",
        "format": "Unpacked",
        "skipControlSignals": true
      }
    
    # Publish critical stock events to the "critical-stock-events" topic
    critical-stock-event-query: >
      {
        "pubsubName": "notifications-pubsub",
        "topicName": "critical-stock-events",
        "format": "Unpacked",
        "skipControlSignals": true
      }
```

#### See It In Action

{{< tabpane >}}

{{% tab header="GitHub Codespaces" text=true %}}

1. Open the Notifications UI:
   ```
   https://<codespace-name>-80.app.github.dev/notifications-service
   ```

2. Run the demo script:
   ```bash
   cd demo
   ./demo-notifications-service.sh
   ```

{{% /tab %}}

{{% tab header="VSCode DevContainer" text=true %}}

1. Open the Notifications UI:
   ```
   http://localhost:8123/notifications-service
   ```

2. Run the demo script:
   ```bash
   cd demo
   ./demo-notifications-service.sh
   ```

{{% /tab %}}

{{% tab header="Local Setup" text=true %}}

1. Open the Notifications UI:
   ```
   http://localhost:8123/notifications-service
   ```

2. Run the demo script:
   ```bash
   cd demo
   ./demo-notifications-service.sh
   ```

{{% /tab %}}

{{% /tabpane %}}

The demo will:
1. Show current inventory levels
2. Gradually reduce stock levels
3. Trigger low stock warnings at <20 units
4. Escalate to critical alerts at <5 units
5. Demonstrate different notification routing

{{< figure src="05-screenshot-notifications-service.png"
  alt="Notifications service showing differentiated inventory alerts" width="80%" >}}

Observe:
- **Event transformation** from database changes
- **Business logic** in declarative queries
- **Differentiated routing** based on severity
- **No custom event processing code**


### Cleanup

To remove all resources:

{{< tabpane >}}

{{% tab header="GitHub Codespaces" text=true %}}

Simply delete the Codespace from your GitHub account.

{{% /tab %}}

{{% tab header="VSCode DevContainer" text=true %}}

1. Stop the Dev Container (File → Close Remote Connection)
2. Optional: Remove the container via Docker Desktop

{{% /tab %}}

{{% tab header="Local Setup" text=true %}}

Run the cleanup script, to delete the k3d cluster:

```bash
cd tutorial/dapr

# Linux/Mac
./scripts/cleanup-tutorial.sh

# Windows PowerShell
./scripts/cleanup-tutorial.ps1
```

{{% /tab %}}

{{% /tabpane %}}

## Summary

In this tutorial, you've seen how Drasi enhances Dapr applications by:

1. **Eliminating Integration Code**: No API orchestration or polling logic needed
2. **Providing Real-Time Updates**: Changes detected and propagated instantly
3. **Enabling Complex Queries**: Cross-service patterns detected declaratively
4. **Maintaining Data Isolation**: Services remain independent and decoupled
5. **Reducing Operational Complexity**: No additional infrastructure to manage

### Key Takeaways

**For Dapr Developers**:
- Keep your services simple and focused
- Let Drasi handle cross-service concerns
- Use declarative queries instead of imperative code
- Leverage Dapr building blocks through Drasi reactions

**For Architects**:
- Maintain microservices best practices
- Add real-time capabilities without architectural changes
- Scale monitoring and analytics independently
- Reduce operational overhead

**For Operations**:
- Monitor complex conditions across services
- Get alerts based on business logic, not just metrics
- Reduce database load from polling
- Simplify troubleshooting with declarative queries

### More

- **Explore More Tutorials**: Learn by doing with Drasi in [various scenarios here](/tutorials).
- **Drasi Documentation**: https://drasi.io
- **Dapr Documentation**: https://docs.dapr.io
- **GitHub Repository**: https://github.com/drasi-project
- **Dapr Community Call Recording**: [Watch on YouTube](https://www.youtube.com/watch?v=S-ImhYfLplM&t=90s)
