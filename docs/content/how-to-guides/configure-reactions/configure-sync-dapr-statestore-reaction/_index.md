---
type: "docs"
title: "Configure a Sync Dapr State Store Reaction"
linkTitle: "Sync Dapr State Store"
weight: 30
description: >
    Learn how to configure a Reaction to synchronize Drasi Continuous Query results with a Dapr State Store.
---

The Sync Dapr State Store Reaction materializes the results of Drasi Continuous Queries into a [Dapr state store](https://docs.dapr.io/developing-applications/building-blocks/state-management/state-management-overview/). It performs an initial bulk load of all query results and then incrementally processes changes (adds, updates, deletes) from a Continuous Query to keep the Dapr state store up-to-date.

This enables Dapr-based microservices to easily access sophisticated, pre-computed, and continuously updated data views through the standard Dapr state management API.

## Scenarios powered by this reaction

This reaction can power several vital scenarios for Dapr users:

*   **Simplified Composite API Implementation**: Pre-compute and materialize aggregated data views from multiple sources. API-serving microservices can then read this data directly from Dapr State with low latency, simplifying their logic.
*   **Building New Functionality without Disruption**: Introduce new features or services that consume tailored data views from existing systems without modifying those original services. In Drasi, Continuous Queries transform and project data, and this reaction makes it available in Dapr State for new microservices.
*   **Efficient Query Side of CQRS**: Use Drasi Continuous Queries to define and maintain read models for CQRS. The reaction materializes these optimized query views into Dapr State, allowing query-handling microservices to read them efficiently.
*   **Decoupled Data Views**: Provide different microservices with specific "slices" or perspectives of the same underlying data, each materialized in Dapr State for easy consumption.
*   **Improved Read Performance**: Offload complex querying from source databases by having read-optimized views readily available in a Dapr state store, accessed via simple key-value lookups.

## Requirements

On the computer from where you will create the Reaction, you need the following software:
- [Drasi CLI](/reference/command-line-interface/)
- [Kubectl](https://kubernetes.io/docs/reference/kubectl/) (for Dapr component configuration)
- Note the namespace in which Drasi was installed. By default, Drasi uses `drasi-system` namespace. If you chose a custom namespace during installation of Drasi, use that in place of `drasi-system` when configuring the reaction.

## Dapr Environment Prerequisites

Before deploying this reaction, ensure the following are in place in your Kubernetes environment:

1.  **Application's Dapr State Store**: Your Dapr microservice(s) (e.g., running in `my-app-namespace`) must have a Dapr state store component configured and deployed. This component tells your application's Dapr sidecar how to connect to the underlying state store (e.g., Redis, Cosmos DB). Let's say this component is named `mystatestore`.

2.  **Data Store Accessibility**: The actual data store (e.g., your Redis instance) that backs your Dapr state component must be network-accessible from the Kubernetes namespace in which drasi was installed (default: `drasi-system`). This is because the Drasi Reaction pod runs in `drasi-system` (or the namespace chosen during installation) and will need to connect to this data store.

3.  **Crucial: Dapr State Store Component for Drasi in `drasi-system` Namespace**:
    This is a key step. The Drasi `SyncDaprStateStore` Reaction runs as a pod in the Kubernetes namespace in which Drasi was installed (default: `drasi-system`). Like any Dapr-enabled application, it relies on its *own* Dapr sidecar (running alongside it in `drasi-system`) to interact with Dapr building blocks, including state stores.
    Therefore, you **must** deploy a Dapr state store component manifest specifically for the Drasi Reaction in the `drasi-system` namespace. This component tells the Reaction's Dapr sidecar how to connect to your *existing* state store.

    *   **`metadata.name`**: The `name` of this Dapr component in `drasi-system` **must match** the `stateStoreName` you will specify in the Drasi Reaction's configuration (see `spec.queries` later). For example, if your application uses a state store component named `mystatestore`, and you want the Reaction to write to it, you will create a component also named `mystatestore` in the `drasi-system` namespace.
    *   **`metadata.namespace`**: This component manifest must specify `namespace: drasi-system`.
    *   **`spec` (type, version, metadata/connection details)**: The `spec` section of this component (including `type`, `version`, and all connection `metadata` like `redisHost`, `redisPassword`, etc.) must be **identical** to the Dapr state store component used by your application. It needs to point to the *same underlying physical state store*.
    *   **`spec.metadata.keyPrefix`**: **IMPORTANT!** For both the application's Dapr state store component AND the corresponding component in `drasi-system`, it is highly recommended to explicitly set the `keyPrefix` strategy to `"none"`. This ensures that the keys used by the Drasi Reaction (derived directly from the `keyField` in your query results) are stored and retrieved without any automatic Dapr-managed prefixes. This consistency is vital for both the Reaction and your application to access the same data items using the same keys.
        ```yaml
        # Example snippet for spec.metadata in your Dapr component
        # ...
        spec:
          type: state.redis # Or your chosen state store type
          version: v1
          metadata:
          - name: redisHost
            value: your-shared-redis.default.svc.cluster.local:6379
          - name: redisPassword
            value: "yourRedisPassword"
          - name: keyPrefix # Add this line
            value: "none"   # Explicitly set to "none"
        # ...
        ```

    **Why is `keyPrefix: "none"` important?**
    If `keyPrefix` is not set to `"none"` (e.g., it defaults to `appid` or is explicitly set to another strategy), Dapr will automatically add prefixes (like the Dapr App ID) to the keys. The Drasi Reaction writes keys based purely on your query's `keyField`. If your application's Dapr component expects prefixed keys, it won't find the data written by the Reaction, and vice-versa. Setting `keyPrefix: "none"` on both components ensures that the raw `keyField` value is the actual key in the underlying store, accessible by both.

    **Example Structure:**

    Let's say your application in `my-app-namespace` uses a Redis state store defined in `my-app-components/app-statestore.yaml`:
    ```yaml
    # filepath: my-app-components/app-statestore.yaml
    apiVersion: dapr.io/v1alpha1
    kind: Component
    metadata:
      name: mystatestore # Name used by your application
      namespace: my-app-namespace # Your application's namespace
    spec:
      type: state.redis
      version: v1
      metadata:
      - name: redisHost
        value: your-shared-redis.default.svc.cluster.local:6379 # Points to your actual Redis
      - name: redisPassword
        value: "yourRedisPassword"
      - name: keyPrefix # Explicitly set this to none
        value: "none"
      # ... other configurations
    ```

    You **must** create a corresponding Dapr component for Drasi in the namespace in which drasi was installed (by default, `drasi-system`), for example, in `drasi-components/drasi-statestore-access.yaml`:
    ```yaml
    # filepath: drasi-components/drasi-statestore-access.yaml
    apiVersion: dapr.io/v1alpha1
    kind: Component
    metadata:
      name: mystatestore # CRITICAL: Same name as your app's component if the Reaction targets it
      namespace: drasi-system # CRITICAL: Must be drasi-system (or the namespace in which drasi was installed)
    spec:
      type: state.redis # Identical spec to your app's component
      version: v1
      metadata:
      - name: redisHost # Identical connection details
        value: your-shared-redis.default.svc.cluster.local:6379 # Points to the SAME actual Redis
      - name: redisPassword
        value: "yourRedisPassword"
      - name: keyPrefix # Explicitly set this to none
        value: "none"
      # ... other configurations identical to your app's component
    ```
    Apply this second component definition to your Kubernetes cluster:
    ```bash
    kubectl apply -f drasi-components/drasi-statestore-access.yaml
    ```
    This allows the Drasi Reaction (via its sidecar in `drasi-system`) to find and use the Dapr component named `mystatestore` to write to your shared Redis instance.

## Registering the Reaction Provider (If Necessary)

The Drasi environment needs to be aware of the `SyncDaprStateStore` reaction type.

1.  **Check if registered**:
    ```bash
    drasi list reactionprovider
    ```
    Look for `SyncDaprStateStore` in the output.

2.  **If not listed, register it**:
    Create a `reaction-provider.yaml` file:
    ```yaml
    # filepath: reaction-provider.yaml
    apiVersion: v1
    kind: ReactionProvider
    name: SyncDaprStateStore
    spec:
      services:
        reaction:
          image: drasi-project/reaction-sync-dapr-statestore:latest # Use the correct image name and tag for your reaction
    ```
    Apply it:
    ```bash
    drasi apply -f reaction-provider.yaml
    ```

## Creating the Reaction

To create a Reaction, execute the `drasi apply` command as follows:

```text
drasi apply -f my-sync-dapr-reaction.yaml
```
The `-f` flag specifies that the definition of the new Reaction is contained in the referenced YAML file `my-sync-dapr-reaction.yaml`.

## Reaction Definition

Here is an example of a `SyncDaprStateStore` Reaction definition:

```yaml
# filepath: my-sync-dapr-reaction.yaml
kind: Reaction
apiVersion: v1
name: my-app-state-synchronizer # A unique name for your reaction instance
spec:
  kind: SyncDaprStateStore # Must match the registered ReactionProvider name
  queries:
    # Example 1: Sync results from 'orders-ready-for-pickup' query
    # This will use the Dapr component named 'mystatestore' in the drasi-system namespace
    orders-ready-for-pickup: '{"stateStoreName": "mystatestore", "keyField": "orderId"}'
    
    # Example 2: Sync results from 'active-user-profiles' query
    # This will use the Dapr component named 'userprofilecache' in the drasi-system namespace
    active-user-profiles: '{"stateStoreName": "userprofilecache", "keyField": "profileId"}'
```

In this definition:
-   `apiVersion` must be `v1`.
-   `kind` property tells Drasi to create a `Reaction` resource.
-   `name` property is the unique identity of the Reaction within the Drasi environment.
-   `spec.kind` property tells Drasi the type of Reaction to create, in this case `SyncDaprStateStore`.

This table describes the settings in the `spec` section:

| Property        | Description                                                                                                                                                                                             |
|-----------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `queries`       | An object where each key is the **name** of a Drasi Continuous Query to subscribe to. The value for each key is a JSON string specifying the configuration for that query's synchronization.             |
|                 | The JSON string for each query must contain:                                                                                                                                                            |
|                 | - `stateStoreName` (string): The `metadata.name` of the Dapr state store component (e.g., `"mystatestore"`, `"userprofilecache"`) that the Reaction should use. **It is important to note that this refers to the Dapr component defined in the namespace in which drasi was installed (by default - `drasi-system`).** |
|                 | - `keyField` (string): The name of the field within each result item from the Drasi Continuous Query that will be used as the unique key when storing that item in the Dapr state store.                 |

## How Dapr Microservices Access the Synchronized Data

Once the reaction is running and has synchronized data into the shared underlying state store (e.g., your Redis instance):

Your Dapr microservices (running in their own namespace, e.g., `my-app-namespace`) can access this data using their standard Dapr state management client SDKs. They will target their *own* Dapr state store component (e.g., `mystatestore` in `my-app-namespace`), which points to the same underlying physical store that the Drasi Reaction is writing to.

**Example (C# using Dapr.Client):**
```csharp
// In your Dapr microservice (e.g., in my-app-namespace)
using Dapr.Client;

// ...

var daprClient = new DaprClientBuilder().Build();

// Your app uses its 'mystatestore' component, which points to the same Redis
// as the 'mystatestore' component in 'drasi-system' used by the Reaction.
string daprStateStoreNameForApp = "mystatestore"; 
string orderIdToFetch = "some-specific-order-id"; // This key comes from the 'keyField' of a query result

var orderDetails = await daprClient.GetStateAsync<MyOrderDataType>(daprStateStoreNameForApp, orderIdToFetch);

if (orderDetails != null)
{
    // Process orderDetails
    Console.WriteLine($"Fetched order: {orderDetails.CustomerName}");
}
else
{
    Console.WriteLine($"Order with ID {orderIdToFetch} not found in {daprStateStoreNameForApp}.");
}

// Define MyOrderDataType according to the structure of your query results
// public class MyOrderDataType {
//    public string OrderId { get; set; } // Matches 'keyField' if it's part of the data
//    public string CustomerName { get; set; }
//    // ... other fields from your query result
// }
```

## Inspecting the Reaction

As soon as the Reaction is created it will start running. You can check its status:

```text
drasi list reaction
```
Example output:
```
        ID                      | AVAILABLE
--------------------------------+------------
  my-app-state-synchronizer     | true
```
If an error occurs, the `AVAILABLE` column will show the error.

For more details:
```text
drasi describe reaction my-app-state-synchronizer
```
This returns the full definition and detailed status.

## Modifying the Reaction

To modify the reaction (e.g., change subscribed queries or their configurations), update your YAML file and re-apply it using the same `drasi apply` command with the same reaction name:
```text
drasi apply -f my-sync-dapr-reaction.yaml
```

## Deleting the Reaction

To delete a Reaction:
1.  By type and name:
    ```text
    drasi delete reaction my-app-state-synchronizer
    ```
2.  Using the YAML file(s):
    ```text
    drasi delete -f my-sync-dapr-reaction.yaml
    ```
This is useful if a single YAML file defines multiple resources.
