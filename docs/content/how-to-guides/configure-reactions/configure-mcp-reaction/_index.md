---
type: "docs"
title: "Configure an MCP Reaction"
linkTitle: "Configure an MCP Reaction"
weight: 90
description: >
    Learn how to configure an MCP Reaction
---

The MCP Reaction provides a Model Context Protocol (MCP) server that enables MCP clients to connect and subscribe to Drasi queries for real-time updates. MCP clients can use the resource subscription feature to receive notifications when query results change, making it ideal for integrating Drasi with AI agents and other MCP-compatible tools.

## Requirements

On the computer from where you will create the Reaction, you need the following software:
- [Drasi CLI](/reference/command-line-interface/)

## Creating the Reaction

To create a Reaction, execute the `drasi apply` command as follows:

```text
drasi apply -f my-reaction.yaml
```

The `drasi apply` command is how you create all new Drasi resources (in this case a Reaction). The `-f` flag specifies that the definition of the new Reaction is contained in the referenced YAML file `my-reaction.yaml`.

## Reaction Definitions

The YAML file passed to `drasi apply` can contain one or more Reaction definitions. Here is an example of an MCP Reaction definition:

```yaml
kind: Reaction
apiVersion: v1
name: mcp-reaction
spec:
  kind: MCP
  queries:
    freezer-alerts:
      description: "Freezer temperature alert for when it goes above 32 degrees for more than 10 seconds"
      added:
        template: |
          {
            "freezerId": "{{after.id}}",
            "temperature": "{{after.temp}}",
            "description": "Temperature of freezer {{after.id}} exceeded threshold for more than 10 seconds"
          }
      updated:
        template: |
          {
            "freezerId": "{{after.id}}",
            "previousTemperature": "{{before.temp}}",
            "currentTemperature": "{{after.temp}}",
            "description": "Temperature of freezer {{after.id}} changed from {{before.temp}} to {{after.temp}}"
          }
      deleted:
        template: |
          {
            "freezerId": "{{before.id}}",
            "temperature": "{{before.temp}}",
            "description": "Temperature of freezer {{before.id}} below threshold"
          }
```

In this definition:
- the **apiVersion** must be **v1**.
- the **kind** property tells Drasi to create a **Reaction** resource.
- the **spec.kind** property tells Drasi the kind of Reaction to create, in this case an **MCP** Reaction.
- the **name** property tells Drasi the identity of the Reaction and must be unique within the scope of Reactions within the target Drasi environment. In the above example, the **name** of the Reaction is **mcp-reaction**.

This table describes the settings in the **spec** section of the Reaction definition:

|Property|Description|
|--- |---|
|`queries`| The list of continuous queries you would like the MCP Reaction to expose as resources. Each query becomes an MCP resource that clients can subscribe to.|

### Per-Query Configuration

For each query, you can define the following properties:

|Property|Description|
|--- |---|
|`description`| A human-readable description of the query resource.|
|`added`| Configuration for when items are added to the query result set.|
|`updated`| Configuration for when items in the query result set are modified.|
|`deleted`| Configuration for when items are removed from the query result set.|

Each change type (`added`, `updated`, `deleted`) supports the following property:

|Property|Description|
|--- |---|
|`template`| Handlebars template that defines the notification payload format.|

### Handlebars Templating
The MCP Reaction uses Handlebars templating to format notification payloads. The result of evaluating the Handlebars template is emitted as the resource notification payload to subscribed MCP clients.

- `{{after}}` - Contains the new/current state of the data
- `{{before}}` - Contains the previous state of the data (available for `updated` and `deleted` operations)

Example usage:
```yaml
template: |
  {
    "id": "{{after.userId}}",
    "name": "{{after.name}}",
    "timestamp": "{{after.updatedAt}}"
  }
```

## MCP Client Connection

### Connection Details

MCP clients can connect to the server using Streamable HTTP transport with Server-Sent Events (SSE):

```
HTTP Endpoint: http://<reaction-service>:3000/
Transport: Streamable HTTP (preferred) with SSE fallback
Protocol Version: 2025-03-26 (with 2024-11-05 compatibility)
```

### Resource URIs

Query resources are accessible via URIs in the format:
```
drasi://query/{queryId}
```

Where `{queryId}` is the query name defined in the reaction configuration.

### Subscription Workflow

1. Client connects to the MCP server via HTTP
2. Client establishes SSE stream for notifications
3. Client subscribes to specific query resources using `resources/subscribe`
4. When Drasi sends change events for subscribed queries, the server sends `notifications/resources/updated` notifications containing:
   - Resource URI (`drasi://query/{queryId}`)
   - Operation type (`added`, `updated`, or `deleted`)
   - Formatted data based on the Handlebars template

### Notification Format

When a subscribed resource changes, MCP clients receive a `notifications/resources/updated` message in the following format:

For an `added` operation:
```json
{
  "jsonrpc": "2.0",
  "method": "notifications/resources/updated",
  "params": {
    "uri": "drasi://query/freezer-alerts",
    "operation": "added",
    "data": {
      "freezerId": "F-101",
      "temperature": "35",
      "description": "Temperature of freezer F-101 exceeded threshold for more than 10 seconds"
    }
  }
}
```

For an `updated` operation:
```json
{
  "jsonrpc": "2.0",
  "method": "notifications/resources/updated",
  "params": {
    "uri": "drasi://query/freezer-alerts",
    "operation": "updated",
    "data": {
      "freezerId": "F-101",
      "previousTemperature": "35",
      "currentTemperature": "38",
      "description": "Temperature of freezer F-101 changed from 35 to 38"
    }
  }
}
```

For a `deleted` operation:
```json
{
  "jsonrpc": "2.0",
  "method": "notifications/resources/updated",
  "params": {
    "uri": "drasi://query/freezer-alerts",
    "operation": "deleted",
    "data": {
      "freezerId": "F-101",
      "temperature": "30",
      "description": "Temperature of freezer F-101 below threshold"
    }
  }
}
```

The `data` field contains the result of evaluating the Handlebars template for the corresponding operation type.

## Exposing the Endpoint

### Local dev/test

For dev/test purposes, you can simply use a `kubectl port-forward` to expose the endpoint via a port on your local machine.

The following command will open port 3000 on your local machine, which will point to the MCP endpoint:

```
kubectl port-forward services/<reaction-name> 3000:3000 -n drasi-system
```

Now, you can access the MCP endpoint via `http://localhost:3000`.

### Production
For production environments, you will need to configure an `Ingress` that points to the `<reaction-name>` service on port 3000. This configuration will vary depending on how your cluster is hosted, and there will be specific steps for each cloud provider.

#### More information
- [Kubernetes Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/)
- [AWS: Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/latest/)
- [AKS: Managed NGINX ingress with the application routing add-on](https://learn.microsoft.com/en-us/azure/aks/app-routing)
- [AKS: Enable application gateway ingress controller add-on](https://learn.microsoft.com/en-ca/azure/application-gateway/tutorial-ingress-controller-add-on-existing)
- [GKE: Configure Ingress for external Application Load Balancers](https://cloud.google.com/kubernetes-engine/docs/how-to/load-balance-ingress)

## Protocol Support
This implementation follows the MCP specification and supports:
- **Modern Streamable HTTP Transport** (2025-03-26): Primary transport method
- **Legacy SSE Transport** (2024-11-05): Backward compatibility support
- **Session Management**: Proper session ID generation and tracking
- **Resource Management**: Dynamic resource registration and subscription
- **Real-time Notifications**: Standard MCP `notifications/resources/updated` with structured payload
- **Error Handling**: Comprehensive error responses with proper JSON-RPC format

## Example: AI Agent Integration
Here's an example that exposes inventory alerts to MCP clients:

```yaml
kind: Reaction
apiVersion: v1
name: inventory-mcp
spec:
  kind: MCP
  queries:
    low-stock-alerts:
      description: "Products with inventory below reorder threshold"
      added:
        template: |
          {
            "productId": "{{after.productId}}",
            "productName": "{{after.productName}}",
            "currentStock": {{after.stock}},
            "reorderLevel": {{after.reorderLevel}},
            "alert": "Product {{after.productName}} is now below reorder level"
          }
      updated:
        template: |
          {
            "productId": "{{after.productId}}",
            "productName": "{{after.productName}}",
            "previousStock": {{before.stock}},
            "currentStock": {{after.stock}},
            "reorderLevel": {{after.reorderLevel}},
            "alert": "Stock level changed from {{before.stock}} to {{after.stock}}"
          }
      deleted:
        template: |
          {
            "productId": "{{before.productId}}",
            "productName": "{{before.productName}}",
            "alert": "Product {{before.productName}} stock is now above reorder level"
          }
```

## Inspecting the Reaction
As soon as the Reaction is created it will start running, subscribing to the specified list of Continuous Queries and processing changes to the Continuous Query results.

You can check the status of the Reaction using the `drasi list` command:

```text
drasi list reaction
```

This will return a simple list of all Reactions in the current namespace and their overall status. For example:

```
        ID          | AVAILABLE
--------------------+------------
  mcp-reaction      | true
```

If an error has occurred during the creation or operation of a Reaction, the `AVAILABLE` column will contain the error text instead of `true` or `false`.

For more details about the Reaction you can use the [drasi describe](/reference/command-line-interface#drasi-describe) command:

```text
drasi describe reaction mcp-reaction
```

This will return the full definition used to create the Reaction along with more detailed status information.

## Modifying the Reaction
To modify the Reaction, you can simply use the `drasi apply` command again with the same Reaction name that you used before.

## Deleting the Reaction
To delete a Reaction you use the `drasi delete` command. There are two ways to do this.

Firstly, you can specify the type of resource (Reaction) and its name, for example:

```text
drasi delete reaction mcp-reaction
```

Secondly, you can refer to the YAML file(s) that contain the definitions used to create the Reaction(s):

```text
drasi delete -f my-reaction.yaml <file2.yaml> <file3.yaml> <...>
```

This is a convenience, especially if a single YAML file contains multiple Reaction definitions.

## Related Resources
- [Model Context Protocol Specification](https://modelcontextprotocol.io/specification/2025-03-26/server/resources)
- [MCP Resources Documentation](https://modelcontextprotocol.io/specification/2025-03-26/server/resources)
- [MCP Subscriptions Documentation](https://modelcontextprotocol.io/specification/2025-03-26/server/resources#subscriptions)
