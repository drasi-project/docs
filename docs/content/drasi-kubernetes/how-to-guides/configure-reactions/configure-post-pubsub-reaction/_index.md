---
type: "docs"
title: "Configure a Post Dapr Pub/Sub Reaction"
linkTitle: "Configure a Post Dapr Pub/Sub Reaction"
weight: 40
description: >
    Learn how to configure a Reaction to forward Drasi Continuous Query results to Dapr Pub/Sub topics.
---

The `PostDaprPubSub` Reaction forwards change events and control signals from Drasi Continuous Queries to specified [Dapr publish/subscribe topics](https://docs.dapr.io/developing-applications/building-blocks/pubsub/pubsub-overview/). This enables Dapr-enabled microservices to react to sophisticated, real-time data changes detected by Drasi in various backend systems.

Messages are published as [CloudEvents](https://cloudevents.io/), with the Drasi event (either in "packed" or "unpacked" format) contained within the `data` field of the CloudEvent.

 ### CloudEvent Envelope Structure

  All events published by this reaction include the following CloudEvents  attributes:

  | Attribute | Description | Example |
  |-----------|-------------|---------|
  | `specversion` | CloudEvents specification version | `"1.0"` |
  | `type` | Event type identifier | `"com.dapr.event.sent"` |
  | `source` | Identifies the reaction instance | `"stock-notifications-publisher-reaction"` |
  | `id` | Unique event identifier | `"378d12a1-ce64-4477-81e0-ed025609923a"` |
  | `time` | Timestamp of when the event was created | `"2025-06-09T20:33:02Z"` |
  | `datacontenttype` | Content type of the data field | `"application/json"` |
  | `data` | The Drasi event payload | (see format examples below) |


## Scenarios Powered by this Reaction

This reaction unlocks several powerful scenarios for Dapr users:

*   **Decoupled Event-Driven Architectures**: Enable Dapr services to subscribe to highly specific business events derived by Drasi's continuous queries, fostering loose coupling and scalability.
*   **Enhanced Real-time Responsiveness**: Allow Dapr applications to become instantly aware of and react to complex changes as they occur, without implementing custom change detection logic.
*   **Simplified Integration with Diverse Data Sources**: Abstract away the complexity of monitoring various data stores (SQL, NoSQL, etc.) by using Drasi as the change detection engine and Dapr as the event distribution backbone.
*   **Triggering Dapr Workflows and Actors**: Use sophisticated, Drasi-detected events to initiate Dapr Workflows or send targeted messages to Dapr Actors for complex business process automation.
*   **Building Resilient Data Pipelines**: Leverage Dapr's pub/sub resiliency features (like retries) for delivering Drasi events to consuming microservices.

## Requirements

On the computer from where you will create the Reaction, you need the following software:
- [Drasi CLI](/reference/command-line-interface/)
- [Kubectl](https://kubernetes.io/docs/reference/kubectl/) (for Dapr component configuration)

## Dapr Environment Prerequisites

Before deploying this reaction, ensure the following are in place in your Kubernetes environment:

1.  **Application's Dapr Pub/Sub Component**: Your Dapr microservice(s) (e.g., running in `my-app-namespace`) must have a Dapr pub/sub component configured and deployed. This component tells your application's Dapr sidecar how to connect to the underlying message broker (e.g., Redis, RabbitMQ, Azure Service Bus). Let's say this component is named `myapp-pubsub`.

2.  **Message Broker Accessibility**: The actual message broker (e.g., your Redis instance) that backs your Dapr pub/sub component must be network-accessible from the `drasi-system` Kubernetes namespace. This is because the Drasi Reaction pod runs in `drasi-system` and will need to connect to this broker via its Dapr sidecar.

3.  **Crucial: Dapr Pub/Sub Component for Drasi in `drasi-system` Namespace**:
    The Drasi `PostDaprPubSub` Reaction runs as a pod in the `drasi-system` namespace. Like any Dapr-enabled application, it relies on its *own* Dapr sidecar (running alongside it in `drasi-system`) to interact with Dapr building blocks.
    Therefore, you **must** deploy a Dapr pub/sub component manifest specifically for the Drasi Reaction in the `drasi-system` namespace. This component tells the Reaction's Dapr sidecar how to connect to your *existing* message broker.

    *   **`metadata.name`**: The `name` of this Dapr component in `drasi-system` **must match** the `pubsubName` you will specify in the Drasi Reaction's configuration (see `spec.queries` later). For example, if your reaction configuration specifies `pubsubName: "drasisystem-pubsub"`, you must create a Dapr component with this name in `drasi-system`.
    *   **`metadata.namespace`**: This component manifest must specify `namespace: drasi-system`.
    *   **`spec` (type, version, metadata/connection details)**: The `spec` section of this component (including `type`, `version`, and all connection `metadata` like `redisHost`, `connectionString`, etc.) must be **identical** to the Dapr pub/sub component used by your application if they are intended to use the same broker instance. It needs to point to the *same underlying physical message broker*.

    **Example Structure:**

    Let's say your application in `my-app-namespace` uses a Redis-backed Dapr pub/sub component defined in `my-app-components/app-pubsub.yaml`:
    ```yaml
    # filepath: my-app-components/app-pubsub.yaml
    apiVersion: dapr.io/v1alpha1
    kind: Component
    metadata:
      name: myapp-pubsub # Name used by your application
      namespace: my-app-namespace # Your application's namespace
    spec:
      type: pubsub.redis
      version: v1
      metadata:
      - name: redisHost
        value: shared-redis.default.svc.cluster.local:6379 # Points to your actual Redis
      - name: redisPassword
        value: "yourRedisPassword" # If applicable
    # ... other configurations
    ```

    You **must** create a corresponding Dapr component for Drasi in the `drasi-system` namespace, for example, in `drasi-components/drasi-pubsub-access.yaml`. If the reaction is intended to publish to the same Redis broker for your app to consume, the connection details would be the same. The `metadata.name` here (`drasisystem-pubsub`) is what the reaction's `pubsubName` configuration will refer to.
    ```yaml
    # filepath: drasi-components/drasi-pubsub-access.yaml
    apiVersion: dapr.io/v1alpha1
    kind: Component
    metadata:
      name: drasisystem-pubsub # CRITICAL: This name is used in the Reaction's 'pubsubName' config
      namespace: drasi-system # CRITICAL: Must be drasi-system
    spec:
      type: pubsub.redis # Identical spec if targeting the same broker
      version: v1
      metadata:
      - name: redisHost # Identical connection details if targeting the same broker
        value: shared-redis.default.svc.cluster.local:6379 # Points to the SAME actual Redis
      - name: redisPassword
        value: "yourRedisPassword" # If applicable
    # ... other configurations identical if targeting the same broker
    ```
    Apply this component definition to your Kubernetes cluster:
    ```bash
    kubectl apply -f drasi-components/drasi-pubsub-access.yaml
    ```
    This allows the Drasi Reaction (via its sidecar in `drasi-system`) to find and use the Dapr component named `drasisystem-pubsub` to publish messages.

## Registering the Reaction Provider (If Necessary)

The Drasi environment needs to be aware of the `PostDaprPubSub` reaction type.

1.  **Check if registered**:
    ```bash
    drasi list reactionprovider
    ```
    Look for `PostDaprPubSub` in the output.

2.  **If not listed, register it**:
    Create a `reaction-provider.yaml` file (if you don't have one for this reaction type already):
    ```yaml
    # filepath: postdaprpubsub-reaction-provider.yaml
    apiVersion: v1
    kind: ReactionProvider
    name: PostDaprPubSub
    spec:
      services:
        reaction:
          # Ensure this image name and tag are correct for your deployed reaction image
          image: your-docker-registry/reaction-post-dapr-pubsub:latest
    ```
    Apply it:
    ```bash
    drasi apply -f postdaprpubsub-reaction-provider.yaml
    ```

## Creating the Reaction

To create a Reaction, execute the `drasi apply` command with a YAML file defining your reaction:

```text
drasi apply -f my-post-dapr-reaction.yaml
```
The `-f` flag specifies that the definition of the new Reaction is contained in the referenced YAML file.

## Reaction Definition

Here is an example of a `PostDaprPubSub` Reaction definition:

```yaml
# filepath: my-post-dapr-reaction.yaml
kind: Reaction
apiVersion: v1
name: product-change-publisher # A unique name for your reaction instance
spec:
  kind: PostDaprPubSub # Must match the registered ReactionProvider name
  queries:
    # Example 1: Publish results from 'product-updates-query' in Packed format
    product-updates-query: >
      {
        "pubsubName": "drasisystem-pubsub",
        "topicName": "product-updates-packed",
        "format": "Packed",
        "skipControlSignals": false
      }
    
    # Example 2: Publish results from 'inventory-alerts-query' in Unpacked format, skipping control signals
    inventory-alerts-query: >
      {
        "pubsubName": "drasisystem-pubsub",
        "topicName": "inventory-alerts-unpacked",
        "format": "Unpacked",
        "skipControlSignals": true
      }
```

In this definition:
-   `apiVersion` must be `v1`.
-   `kind` property tells Drasi to create a `Reaction` resource.
-   `name` property is the unique identity of the Reaction within the Drasi environment.
-   `spec.kind` property tells Drasi the type of Reaction to create, in this case `PostDaprPubSub`.

This table describes the per-query configuration settings within the `spec.queries` object:

| Property             | Description                                                                                                                                                              | Required | Default    |
|----------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|------------|
| `pubsubName`         | (string) The `metadata.name` of the Dapr pub/sub component (defined in the `drasi-system` namespace) that the Reaction should use for publishing.                         | Yes      |            |
| `topicName`          | (string) The name of the Dapr topic to which messages for this Drasi query will be published.                                                                              | Yes      |            |
| `format`       | (string, optional) Specifies the format of the Drasi event within the CloudEvent's `data` field. Can be `"Packed"` or `"Unpacked"`.                                        | No       | `Unpacked` |
| `skipControlSignals` | (boolean, optional) If `true`, control signals (like `RELOAD`) from this Drasi query will not be published. If `false`, they will be published.                           | No       | `false`    |

## Output Formats

The reaction publishes messages to Dapr topics as CloudEvents. The Drasi-specific event data is contained within the `data` field of the CloudEvent.

### `Packed` Format
When `format` is set to `"Packed"`, the entire `ChangeEvent` or `ControlEvent` object, as received from the Drasi Reaction SDK, is serialized to JSON and placed into the `data` field of the CloudEvent.

**Example (ChangeEvent in Packed Format within a CloudEvent):**
```json
{
  "specversion": "1.0",
  "type": "com.dapr.event.sent",
  "source": "reaction-post-dapr-pubsub-app-id",
  "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "datacontenttype": "application/json",
  "pubsubname": "drasisystem-pubsub",
  "topic": "product-updates-packed",
  "data": { // This is the Drasi SDK ChangeEvent object
    "queryId": "product-updates-query",
    "sourceTimeMs": 1678886400123,
    "addedResults": [
      { "product_id": "P101", "name": "Laptop X", "price": 1200.00 }
    ],
    "updatedResults": [],
    "deletedResults": [],
    "sequence": 1
  }
}
```

### `Unpacked` Format
When `format` is set to `"Unpacked"` (the default), individual changes (adds, updates, deletes) and control signals are transformed into a Drasi-specific native JSON structure and published as separate messages. Each of these native structures is placed into the `data` field of its own CloudEvent.

**1. Item Added (op: "i")**
The `data` field of the CloudEvent:
```json
{
    "op": "i",
    "ts_ms": 1678886400200,
    "seq": 0,
    "payload": {
        "source": {
            "queryId": "inventory-alerts-query",
            "ts_ms": 1678886400150
        },
        "after": { 
            "itemId": "SKU789", 
            "stockLevel": 5,
            "status": "low"
        }
    }
}
```

**2. Item Updated (op: "u")**
The `data` field of the CloudEvent:
```json
{
    "op": "u",
    "ts_ms": 1678886400350,
    "seq": 1,
    "payload": {
        "source": {
            "queryId": "inventory-alerts-query",
            "ts_ms": 1678886400300
        },
        "before": {
            "itemId": "SKU789", 
            "stockLevel": 5,
            "status": "low"
        },
        "after": { 
            "itemId": "SKU789", 
            "stockLevel": 3,
            "status": "critically-low"
        }
    }
}
```

**3. Item Deleted (op: "d")**
The `data` field of the CloudEvent:
```json
{
    "op": "d",
    "ts_ms": 1678886400500,
    "seq": 3,
    "payload": {
        "source": {
            "queryId": "inventory-alerts-query",
            "ts_ms": 1678886400450
        },
        "before": { 
            "itemId": "SKU789", 
            "stockLevel": 3
        }
    }
}
```

**4. Control Signal (op: "x")**
The `data` field of the CloudEvent:
```json
{
    "op": "x",
    "ts_ms": 1678886400600,
    "seq": 1,
    "payload": {
        "source": {
            "queryId": "inventory-alerts-query",
            "ts_ms": 1678886400550
        },
        "signal": { // The content of the Drasi ControlEvent.Signal
            "type": "RELOAD_REQUESTED",
            "reason": "Manual trigger"
        }
    }
}
```

## How Dapr Microservices Consume Messages

Your Dapr microservices subscribe to the configured `topicName` on their respective Dapr `pubsubName` component. They will receive messages as CloudEvents. The specific Drasi event (Packed or Unpacked) will be in the `data` field of the CloudEvent.

**Example (C# Dapr Subscriber):**
```csharp
// In your Dapr microservice
using Dapr; // For [Topic] attribute
using Dapr.Client; // For CloudEvent<T> or JsonElement for data
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

// ...

[ApiController]
public class ProductEventsController : ControllerBase
{
    private readonly ILogger<ProductEventsController> _logger;

    public ProductEventsController(ILogger<ProductEventsController> logger)
    {
        _logger = logger;
    }

    // Subscribe to the "product-updates-packed" topic on the "myapp-pubsub" Dapr component
    [Topic("myapp-pubsub", "product-updates-packed")]
    [HttpPost("/product-updates-packed")] // Route for the subscription
    public async Task<ActionResult> HandlePackedProductUpdate(CloudEvent<JsonElement> cloudEvent)
    {
        _logger.LogInformation("Received packed event. ID: {Id}, Source: {Source}, Type: {Type}, Topic: {Topic}", 
            cloudEvent.Id, cloudEvent.Source, cloudEvent.Type, cloudEvent.Topic);

        // cloudEvent.Data contains the Drasi SDK ChangeEvent as a JsonElement
        // You can deserialize it to a specific type if you have the model
        // For example, if Drasi SDK ChangeEvent model is DrasiChangeEvent:
        // var drasiPackedEvent = cloudEvent.Data.Deserialize<DrasiChangeEvent>();
        _logger.LogInformation("Packed Event Data: {Data}", cloudEvent.Data.ToString());
        
        // Process the event
        // ...

        return Ok();
    }

    // Subscribe to the "inventory-alerts-unpacked" topic
    [Topic("myapp-pubsub", "inventory-alerts-unpacked")]
    [HttpPost("/inventory-alerts-unpacked")]
    public async Task<ActionResult> HandleUnpackedInventoryAlert(CloudEvent<UnpackedDrasiEvent> cloudEvent)
    {
        _logger.LogInformation("Received unpacked event. ID: {Id}, Topic: {Topic}, Op: {Op}", 
            cloudEvent.Id, cloudEvent.Topic, cloudEvent.Data?.Op);

        if (cloudEvent.Data != null)
        {
            _logger.LogInformation("Unpacked Event Payload: {Payload}", JsonSerializer.Serialize(cloudEvent.Data.Payload));
            // Process based on cloudEvent.Data.Op ("i", "u", "d", "x")
            // and the content of cloudEvent.Data.Payload
        }
        // ...

        return Ok();
    }
}

// Example model for deserializing the 'data' field of an unpacked event CloudEvent
public class UnpackedDrasiEvent
{
    [JsonPropertyName("op")]
    public string? Op { get; set; }

    [JsonPropertyName("ts_ms")]
    public long TsMs { get; set; }

    [JsonPropertyName("payload")]
    public JsonElement Payload { get; set; } // Or a more specific type for payload
}
```

## Inspecting the Reaction
As soon as the Reaction is created it will start running, subscribing to the specified list of Continuous Queries and publishing changes.

You can check the status of the Reaction using the `drasi list` command:
```text
drasi list reaction
```
This will return a simple list of all Reactions in the current namespace and their overall status. For example:
```
        ID                      | AVAILABLE
--------------------------------+------------
  product-change-publisher      | true
```
If an error has occurred during the creation or operation of a Reaction, the `AVAILABLE` column will contain the error text instead of `true` or `false`.

For more details about the Reaction you can use the [drasi describe](/reference/command-line-interface#drasi-describe) command:
```text
drasi describe reaction product-change-publisher
```
This will return the full definition used to create the Reaction along with more detailed status information.

## Modifying the Reaction
To modify the reaction (e.g., change subscribed queries, their topics, or output formats), update your YAML definition file and re-apply it using the `drasi apply` command with the same reaction name:
```text
drasi apply -f my-post-dapr-reaction.yaml
```

## Deleting the Reaction
To delete a Reaction you use the `drasi delete` command. There are two ways to do this.

Firstly, you can specify the type of resource (Reaction) and its name, for example:
```text
drasi delete reaction product-change-publisher
```

Secondly, you can refer to the YAML file(s) that contain the definitions used to create the Reaction(s):
```text
drasi delete -f my-post-dapr-reaction.yaml
```
This is a convenience, especially if a single YAML file contains multiple Reaction definitions.
