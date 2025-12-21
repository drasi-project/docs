---
type: "docs"
title: "Middleware"
linkTitle: "Middleware"
weight: 60
description: >
    Preprocessing incoming changes with custom logic
related:
  concepts:
    - title: "Continuous Queries"
      url: "/concepts/continuous-queries/"
    - title: "Sources"
      url: "/concepts/sources/"
  howto:
    - title: "Write Continuous Queries"
      url: "/drasi-kubernetes/how-to-guides/write-continuous-queries/"
  reference:
    - title: "Query Language Reference"
      url: "/reference/query-language/"
---

Middleware serves as an intermediary layer that processes incoming changes from data sources before they are passed to the query engine.  Middleware components are modular and can be stacked or combined in a pipeline to process incoming changes sequentially.

Its primary role is transformation, modifying or enriching the data as needed, such as normalizing values, applying mappings, or adding computed fields.

The configuration settings in the **spec.sources.middleware** section of the Continuous Query resource definition hold the individual middleware configurations that can be used in a pipeline for a given source. 

Each middleware definition requires a **name**, which is referenced in by **spec.sources.subscriptions.pipeline**, a **kind**, which defines which middleware implementation to use and and properties required by that specific implementation.

## Middleware components

### Unwind

The **unwind** middleware component can be used to unwind an array of values that is nested inside the properties of a Node or Relation.  Unwinding the array will create new top level elements in the graph that can be referenced as such using Cypher.

The configuration for the **unwind** component are as follows

| Property | Description |
| - | - |
| kind | Must be **unwind** |
| name | The name of this configuration, that can be used in a source pipeline |
| {Node Label} | The unwind configuration for all nodes with the given label. | 

In addition to the **kind** and **name** properties, any additional properties on this configuration object will be a dictionary of unwind configurations, where the key is the label of the incoming node.

The configuration properties for unwinding an element are as follows


| Property | Description |
| - | - |
| selector | A [JSONPath](https://en.wikipedia.org/wiki/JSONPath) expression to locate the array to unwind within the properties of the incoming node.  |
| label | The label of the newly created child Node, there will be one for each element in the array, |
| key | (optional) A [JSONPath](https://en.wikipedia.org/wiki/JSONPath) expression to locate a unique key for the child node within the context of the parent node. This will be used to align updates and deletes.  If none is specified, then the index within the array is used. |
| relation | (optional) The label of the relation that will be created between the parent and child nodes. |
| condition | (optional) A [JSONPath](https://en.wikipedia.org/wiki/JSONPath) expression that filters whether this mapping should be applied. If the expression returns no result or empty, the mapping is skipped. This allows for conditional processing based on the properties of the incoming node. |

#### Example

For example, imagine you had a source that produced nodes with the label of **Vehicle** and the properties looked like this:

```json
{
    "id": "vehicle-1",
    "tires": [
        {
            "position": "Front-Left",
            "pressure": 250
        },
        {
            "position": "Front-Right",
            "pressure": 258
        },
        {
            "position": "Rear-Left",
            "pressure": 243
        },
        {
            "position": "Rear-Right",
            "pressure": 252
        }
    ]
}
```

We could unwind the **tires** array into top level nodes with the following metadata and corresponding query.


```yaml
apiVersion: v1
kind: ContinuousQuery
name: query
spec:
  mode: query
  sources:    
    subscriptions:
      - id: source
        nodes:
          - sourceLabel: Vehicle
        pipeline:
          - extract-tires
    middleware:
      - name: extract-tires
        kind: unwind
        Vehicle:
          - selector: $.tires[*]
            label: Tire
            key: $.position
            relation: HAS
  query: >
    MATCH
        (v:Vehicle)-[:HAS]->(t:Tire)
    RETURN
        v.id,
        t.position,
        t.pressure
```

#### Conditional Unwind Example

The **condition** property allows you to selectively apply the unwind operation based on properties of the incoming node. For example, you might want to unwind arrays only for nodes with a specific action or status.

Consider a scenario where you have Kubernetes Pod events that contain container statuses, but you only want to unwind container information when the action is "update":

```json
{
    "action": "update",
    "metadata": {
        "name": "pod-1",
        "namespace": "default"
    },
    "status": {
        "containerStatuses": [
            {
                "containerID": "c1",
                "name": "nginx"
            },
            {
                "containerID": "c2", 
                "name": "redis"
            }
        ]
    }
}
```

You can use a condition to only unwind containers when the action is "update":

```yaml
apiVersion: v1
kind: ContinuousQuery
name: query
spec:
  mode: query
  sources:    
    subscriptions:
      - id: source
        nodes:
          - sourceLabel: Pod
        pipeline:
          - extract-containers
    middleware:
      - name: extract-containers
        kind: unwind
        Pod:
          - selector: $.status.containerStatuses[*]
            label: Container
            key: $.containerID
            relation: OWNS
            condition: $[?(@.action == 'update')]
  query: >
    MATCH
        (p:Pod)-[:OWNS]->(c:Container)
    RETURN
        p.metadata.name,
        c.containerID,
        c.name
```

In this configuration, the containers will only be unwound into separate Container nodes when the Pod event has `action: "update"`. Events with other actions (like "delete" or "create") will be processed normally but won't trigger the unwinding of container information.


### JQ

The **jq** middleware component can be used to transform an incoming source change into a different shape or project it out into multiple changes. It is built on the popular [jq](https://jqlang.org/) tool.

#### Links

- [JQ Manual](https://jqlang.org/manual/)
- [JQ playground](https://play.jqlang.org/)


The configuration properties for the **jq** component are as follows

| Property | Description |
| - | - |
| kind | Must be **jq** |
| name | The name of this configuration, that can be used in a source pipeline |
| {Label}.insert | The map configuration for all elements with the given label, when an insert change is received from the source | 
| {Label}.update | The map configuration for all elements with the given label, when an update change is received from the source | 
| {Label}.delete | The map configuration for all elements with the given label, when a delete change is received from the source | 

The configuration for mapping an element is as follows

| Property | Description |
| - | - |
| op | The operation to apply to the output element(s), Insert/Update/Delete |
| query | The JQ query to apply to the incoming source change. The output can either be a single object or an array of objects.
| label | (optional )A JQ query that will be used to extract a new label for each element projected by the JQ `query` |
| id | (optional )A JQ query that will be used to extract a new ID for each element projected by the JQ `query` |
| haltOnError | (optional) If true, when an error occurs during JQ processing, the query will stop processing changes. If false, the middleware will skip processing the change causing the error. Default is false.

#### Example

For example, if you had a source that was an append only log of sensor readings, but your query is only ever interested in the latest value. The incoming values are also expressed as strings but you need them as a number.

```json
{
    "id": "log-1",
    "sensorId": "thermostat-1",
    "value": "25"
}
```

```json
{
    "id": "log-2",
    "sensorId": "thermostat-1",
    "value": "27"
}
```

```json
{
    "id": "log-3",
    "sensorId": "thermostat-1",
    "value": "28"
}
```

You can remap the inserts of the `SensorLog` to updates of a `Sensor`, so if you get 3 updates for a given sensor over time, you only need to index the last one, rather than the entire history. In this configuration, the root of the `SensorLog` payload is selected to update a `Sensor` with the ID equal to the `sensorId` field in the incoming change payload. So instead of 3 `SensorLog` nodes, we now have 1 `Sensor` node with the current value.


```yaml
apiVersion: v1
kind: ContinuousQuery
name: query
spec:
  mode: query
  sources:    
    subscriptions:
      - id: source
        nodes:
          - sourceLabel: SensorLog
        pipeline:
          - extract-latest
    middleware:
      - kind: jq
        name: extract-latest
        SensorLog:        
          insert:
            - op: Update
              query: |
                {
                  "sensorId": .sensorId,
                  "currentValue": .value | tonumber
                }
              label: "Sensor"
              id: .sensorId
  query: >
    MATCH
        (s:Sensor)
    RETURN
        s.sensorId,
        s.currentValue    
```

#### Select Example

The [JQ select](https://jqlang.org/manual/#select) enables you to extract values from an array based on a filter.

For example, consider the following vehicle telemetry payload, that includes the speed of the vehicle as an item within an array, identified by the `name` field of the array item as `Vehicle.Speed`.

```json
{
    "signals": [
        {
            "name": "Vehicle.CurrentLocation.Heading",
            "value": "96"
        },
        {
            "name": "Vehicle.Speed",
            "value": "119"
        },
        {
            "name": "Vehicle.TraveledDistance",
            "value": "4563"
        }
    ],
    "vehicleId": "v1"
}
```

For this use case, we want to maintain a set of vehicles with the most recent recorded speed only:

```yaml
apiVersion: v1
kind: ContinuousQuery
name: query
spec:
  mode: query
  sources:    
    subscriptions:
      - id: source
        nodes:
          - sourceLabel: Telemetry
        pipeline:
          - process-telemetry
    middleware:
      - kind: jq
        name: process-telemetry
        Telemetry:        
          insert:
            - op: Insert
              query: |
                {
                  "id": .vehicleId,
                  "currentSpeed": .signals[] | select(.name == "Vehicle.Speed").value | tonumber
                }
              label: "Vehicle"
              id: .id
            
  query: >
    MATCH (v:Vehicle)
    RETURN 
        v.id,
        v.currentSpeed
```


#### Conditional Example

The [JQ conditionals](https://jqlang.org/manual/#if-then-else-end) allow you to apply different mapping operations based on the content of the incoming element. This is particularly useful when working with event-driven data sources where you need to handle different action types differently.

For example, consider a GitHub webhook payload that includes an `action` field indicating the type of event:

```json
{
    "action": "opened",
    "issue": {
        "id": 123,
        "title": "Bug report",
        "state": "open"
    },
    "repository": {
        "id": 456,
        "name": "my-repo"
    }
}
```

You can use conditions to apply different mappings based on the action:

```yaml
apiVersion: v1
kind: ContinuousQuery
name: query
spec:
  mode: query
  sources:    
    subscriptions:
      - id: source
        nodes:
          - sourceLabel: WebhookEvent
        pipeline:
          - process-github-events
    middleware:
      - kind: jq
        name: process-github-events
        WebhookEvent:        
          insert:
            # Map issue opened events to create Issue nodes
            - op: Insert
              query: |
                if .action == "opened" then
                  .issue + { "repositoryId": .repository.id }
                else
                  empty
                end
              label: "Issue"
              id: .id
            # Map issue closed events to update Issue nodes
            - op: Update
              query: |
                if .action == "closed" then
                  { 
                    "id": .issue.id,
                    "state": "closed"
                  }
                else
                  empty
                end
              label: "Issue"
              id: .id
            # Map issue deleted events to delete Issue nodes
            - op: Delete
              query: |
                if .action == "deleted" then
                  { "id": .issue.id }
                else
                  empty
                end
              label: "Issue"
              id: .id
  query: >
    MATCH (i:Issue)
    RETURN 
        i.id,
        i.title,
        i.state,
        i.repositoryId
```

In this configuration:
- When `action` is "opened", a new Issue node is created with all relevant properties
- When `action` is "closed", the existing Issue node is updated to set the state to "closed"
- When `action` is "deleted", the Issue node is removed
- Other action types are ignored as they don't match any condition

This allows a single middleware configuration to handle multiple types of events from the same source, routing them to different operations based on their content.


### Promote

The **promote** middleware processes `SourceChange` events (`Insert` and `Update`) to copy values from deep-nested locations inside an element’s `properties` map to new top-level properties. Selection is performed with JSONPath expressions, and each promoted value is written under an explicit `target_name`. This is useful for flattening complex structures or making frequently accessed data more readily available.

The configuration for the **promote** component is as follows:

| Property             | Type                                | Description                                                                                                | Required | Default       |
|----------------------|-------------------------------------|------------------------------------------------------------------------------------------------------------|----------|---------------|
| `kind`               | String                              | Must be **promote**.                                                                                       | Yes      |               |
| `name`               | String                              | The name of this configuration, that can be used in a source pipeline.                                     | Yes      |               |
| `config`             | Object                              | Contains the specific configuration for the promote middleware.                                            | Yes      |               |
| `config.mappings`    | Array of *Mapping* objects          | Defines the promotion rules. Must contain at least one mapping entry.                                      | Yes      | –             |
| `config.on_conflict` | `"overwrite"` \| `"skip"` \| `"fail"` | Specifies the action to take if a `target_name` already exists in the top-level properties of the element. | No       | `"overwrite"` |
| `config.on_error`    | `"skip"` \| `"fail"`                | Determines the behavior when a mapping encounters an error (e.g., JSONPath selects 0 or >1 items, type conversion fails). | No       | `"fail"`      |

The `Mapping Object` within the `config.mappings` array has the following properties:

| Property      | Type   | Description                                                                    | Required |
|---------------|--------|--------------------------------------------------------------------------------|----------|
| `path`        | String | A [JSONPath](https://en.wikipedia.org/wiki/JSONPath) expression that must select exactly one value from the element's properties. | Yes      |
| `target_name` | String | The name of the new top-level property that will receive the selected value.   | Yes      |

#### Example

Here's an example of how to configure the **promote** middleware to extract user and order data to top-level properties. This configuration will attempt to promote several fields; if a target property already exists, it will be skipped, and if a JSONPath expression fails to resolve, that specific mapping will be skipped.

```yaml
spec:
  sources:
    middleware:
      - name: promote_user_and_order_data
        kind: promote
        config:
          mappings:
            - path: "$.user.id"
              target_name: "userId"
            - path: "$.user.location.city"
              target_name: "city"
            - path: "$.order.total"
              target_name: "orderTotal"
            - path: "$.metadata" # Promoting an entire object
              target_name: "meta"
          on_conflict: skip   # Keep existing values if 'userId', 'city', etc. already exist
          on_error:    skip   # Skip mappings that error (e.g., if '$.order.total' doesn't exist)
```

For instance, if an incoming node has properties like this:
```json
{
    "user": {
        "id": "user123",
        "location": {
            "city": "New York"
        }
    },
    "order": {
        "total": 100.50
    },
    "metadata": { "source": "api", "version": "1.1" }
}
```
After processing with the `promote_user_and_order_data` middleware configured above, the node's properties would be transformed to:
```json
{
    "user": {
        "id": "user123",
        "location": {
            "city": "New York"
        }
    },
    "order": {
        "total": 100.50
    },
    "metadata": { "source": "api", "version": "1.1" },
    "userId": "user123",
    "city": "New York",
    "orderTotal": 100.50,
    "meta": { "source": "api", "version": "1.1" }
}
```
The `userId`, `city`, `orderTotal`, and `meta` fields are now available as top-level properties.

### ParseJson

The **parse_json** middleware processes `SourceChange` events (specifically `Insert` and `Update`) to parse a string property containing a JSON document into a structured `ElementValue` (Object or List). This is useful when a data source provides JSON data embedded within a string field, which needs to be accessible as a structured object or array for querying.

The configuration for the **parse_json** component is as follows:

| Property                  | Type                          | Description                                                                                                                               | Required | Default       |
|---------------------------|-------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------|----------|---------------|
| `kind`                    | String                        | Must be **parse_json**.                                                                                                                   | Yes      |               |
| `name`                    | String                        | The name of this configuration, that can be used in a source pipeline.                                                                    | Yes      |               |
| `config`                  | Object                        | Contains the specific configuration for the parse_json middleware.                                                                        | Yes      |               |
| `config.target_property`  | String                        | The name of the element property containing the JSON string to be parsed.                                                                 | Yes      |               |
| `config.output_property`  | String                        | Optional. The name of the property where the parsed `ElementValue` should be stored. If omitted or `null`, `target_property` will be overwritten. | No       | `null`        |
| `config.on_error`         | String (`"skip"` or `"fail"`) | Defines behavior when an error occurs (e.g., target property not found, value is not a string, JSON parsing fails, or conversion fails). `"skip"` logs a warning and passes the change through unchanged; `"fail"` stops processing and returns an error. | No       | `"fail"`      |
| `config.max_json_size`    | Integer (bytes)               | Maximum size (in bytes) of the JSON string that will be parsed. Helps guard against unexpectedly large payloads.                            | No       | `1_048_576` (1MB) |
| `config.max_nesting_depth`| Integer                       | Maximum allowed nesting depth for objects/arrays within the JSON document. Prevents issues with excessively nested structures.              | No       | `20`          |

#### Example

Here's an example of how to configure the **parse_json** middleware to parse a JSON string from the `raw_event_json` property and store the resulting structured object in a new property named `event_details`. If an error occurs during parsing, the change will be skipped.

```yaml
spec:
  sources:
    middleware:
      - name: parse_event_data
        kind: parse_json
        config:
          target_property: "raw_event_json"
          output_property: "event_details"
          on_error: "skip"
```

For example, if an incoming node has properties like:
```json
{
    "id": "event001",
    "timestamp": "2025-06-01T12:00:00Z",
    "raw_event_json": "{\"user\": \"alice\", \"action\": \"login\", \"details\": {\"ip\": \"192.168.1.100\"}}"
}
```
After processing with the `parse_event_data` middleware, the node's properties would be transformed to:
```json
{
    "id": "event001",
    "timestamp": "2025-06-01T12:00:00Z",
    "raw_event_json": "{\"user\": \"alice\", \"action\": \"login\", \"details\": {\"ip\": \"192.168.1.100\"}}",
    "event_details": {
        "user": "alice",
        "action": "login",
        "details": {
            "ip": "192.168.1.100"
        }
    }
}
```
The `event_details` property now contains the parsed JSON object, which can be queried directly.

### Decoder

The **decoder** middleware processes `SourceChange` events (specifically `Insert` and `Update`) to decode a string value found in a specified property of an `Element`. It supports various common encoding formats such as Base64, Hexadecimal, URL encoding, and JSON string escapes. This is useful when data from a source is encoded for transmission or storage.

The configuration for the **decoder** component is as follows:

| Property                  | Type                                     | Description                                                                                                                               | Required | Default |
|---------------------------|------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------|----------|---------|
| `kind`                    | String                                   | Must be **decoder**.                                                                                                                      | Yes      |         |
| `name`                    | String                                   | The name of this configuration, that can be used in a source pipeline.                                                                    | Yes      |         |
| `config`                  | Object                                   | Contains the specific configuration for the decoder middleware.                                                                           | Yes      |         |
| `config.encoding_type`    | String                                   | The encoding format of the `target_property` value. Supported types: `base64`, `base64url`, `hex`, `url`, `json_escape`.                   | Yes      |         |
| `config.target_property`  | String                                   | The name of the element property containing the encoded string to be decoded.                                                             | Yes      |         |
| `config.output_property`  | String                                   | Optional. The name of the property where the decoded string should be stored. If omitted or `null`, `target_property` will be overwritten. | No       | `null`  |
| `config.strip_quotes`     | Boolean                                  | If `true`, removes surrounding double quotes (`"`) from the `target_property` value *before* attempting to decode it.                     | No       | `false` |
| `config.on_error`         | String (`"skip"` or `"fail"`)            | Defines behavior when an error occurs (e.g., target property not found, value is not a string, or decoding fails). `"skip"` logs a warning and passes the change through unchanged; `"fail"` stops processing and returns an error. | No       | `"fail"`|

#### Encoding Types Supported:
*   **`base64`**: Standard Base64 encoding (RFC 4648).
*   **`base64url`**: URL-safe Base64 encoding (RFC 4648 §5), without padding.
*   **`hex`**: Hexadecimal encoding (e.g., `48656c6c6f`).
*   **`url`**: Percent-encoding (e.g., `Hello%20World`).
*   **`json_escape`**: Decodes JSON string escape sequences (e.g., `\"`, `\\`, `\n`, `\uXXXX`). Assumes the input is the *content* of a JSON string literal, not the literal itself including quotes.

#### Example

Here's an example of how to configure the **decoder** middleware to decode a Base64 encoded string. The string is located in the `raw_user_payload` property, may be surrounded by quotes which should be stripped, and the decoded result will be stored in a new `user_data` property. Errors will be skipped.

```yaml
spec:
  sources:
    middleware:
      - name: decode_user_data
        kind: decoder
        config:
          encoding_type: "base64"
          target_property: "raw_user_payload"
          output_property: "user_data"
          strip_quotes: true
          on_error: "skip"
```

For example, if an incoming node has properties like:
```json
{
    "message_id": "msg123",
    "raw_user_payload": "\"SGVsbG8gV29ybGQh\"" 
}
```
(The string `SGVsbG8gV29ybGQh` is "Hello World!" encoded in Base64.)

After processing with the `decode_user_data` middleware:
1.  `strip_quotes: true` removes the surrounding double quotes from `"SGVsbG8gV29ybGQh"` to yield `SGVsbG8gV29ybGQh`.
2.  This resulting string is then Base64 decoded to `Hello World!`.

The node's properties would be transformed to:
```json
{
    "message_id": "msg123",
    "raw_user_payload": "\"SGVsbG8gV29ybGQh\"",
    "user_data": "Hello World!"
}
```
The `user_data` property now contains the decoded string "Hello World!".

### Relabel

The **relabel** middleware processes `SourceChange` events (`Insert`, `Update`, and `Delete`) and rewrites element labels according to a user‑defined mapping. It is useful for:

* Normalizing heterogeneous source systems to a common domain vocabulary (e.g. `Person` → `User`, `Company` → `Organization`).
* Consolidating legacy or versioned labels into a current canonical label.
* Preparing data so continuous queries can target a simplified, stable set of labels regardless of upstream naming.

#### Configuration

| Property | Description |
| - | - |
| kind | Must be **relabel** |
| name | The name of this configuration, referenced in a source pipeline |
| labelMappings | (Required) Object mapping original labels to new labels. Must contain at least one entry. |

Behavior details:
* Each label on an element is looked up in `labelMappings`. If present it is replaced by the mapped value; otherwise it is retained.
* Multiple different source labels can map to different targets in the same element.
* If two source labels map to the same target label, duplicates may be collapsed by downstream consumers; avoid ambiguous mappings if uniqueness matters for your queries.
* Applies equally to Node and Relation labels, and to `Insert`, `Update`, and `Delete` changes (so deletes still match the expected label in queries).

#### Basic Example

Normalize several personnel related labels for querying only `User` entities:

```yaml
spec:
  sources:
    subscriptions:
      - id: source
        nodes:
          - sourceLabel: RawPeople
        pipeline:
          - normalize-user-labels
    middleware:
      - name: normalize-user-labels
        kind: relabel
        labelMappings:
          Person: User
          Employee: Staff
          Company: Organization
  query: >
    MATCH (u:User)
    RETURN u.name, u.email, u.role
```

Incoming node labels before → after:

| Incoming Labels | After Relabel |
| - | - |
| `[Person]` | `[User]` |
| `[Person, Employee]` | `[User, Staff]` |
| `[Company]` | `[Organization]` |
| `[UnmappedLabel]` | `[UnmappedLabel]` (unchanged) |

#### Relationship Label Remapping

You can also remap relation labels to align with domain terminology:

```yaml
spec:
  sources:
    middleware:
      - name: relabel-links
        kind: relabel
        labelMappings:
          KNOWS: CONNECTED_TO
          WORKS_FOR: EMPLOYED_BY
    subscriptions:
      - id: social
        nodes:
          - sourceLabel: Person
        pipeline: 
          - relabel-links
  query: >
    MATCH (a:User)-[r:CONNECTED_TO]->(b:User)
    RETURN a.name, b.name
```

An incoming relation labeled `KNOWS` will appear to the query as `CONNECTED_TO` after middleware processing.

#### Delete & Update Preservation

Because relabeling also applies to `Update` and `Delete` changes, previously remapped elements continue to match the target labels throughout their lifecycle (e.g. a delete with original label `Person` will be seen with label `User`).

