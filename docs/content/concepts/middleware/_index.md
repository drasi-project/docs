---
type: "docs"
title: "Middleware"
linkTitle: "Middleware"
weight: 60
description: >
    Preprocessing incoming changes with custom logic
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
| relation | The label of the relation that will be created between the parent and child nodes. |

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


### Map

The **map** middleware component can be used to remap an incoming insert/update/delete from a source to a different insert/update/delete for another element.

The configuration properties for the **map** component are as follows

| Property | Description |
| - | - |
| kind | Must be **map** |
| name | The name of this configuration, that can be used in a source pipeline |
| {Label}.insert | The map configuration for all elements with the given label, when an insert change is received from the source | 
| {Label}.update | The map configuration for all elements with the given label, when an update change is received from the source | 
| {Label}.delete | The map configuration for all elements with the given label, when a delete change is received from the source | 

The configuration for mapping an element is as follows

| Property | Description |
| - | - |
| selector | A [JSONPath](https://en.wikipedia.org/wiki/JSONPath) expression to locate the part of the payload to use for the new mapped element.  |
| op | The operation to apply to the mapped element, Insert/Update/Delete |
| label | The label of the new mapped element. |
| id | A [JSONPath](https://en.wikipedia.org/wiki/JSONPath) expression to locate the value to use for the unique identity of the new mapped element. `$` points to the root of the incoming element, and `$['$selected']` points to the payload extracted by the **selector** expression |
| properties | A map of JSONPath expressions. Each key will be a property name on the new element, with the value coming from the JSONPath expression. `$` points to the root of the incoming element, and `$['$selected']` points to the payload extracted by the **selector** expression. |

#### Example

For example, if you had a source that was an append only log of sensor readings, but your query is only ever interested in the latest value. 

```json
{
    "id": "log-1",
    "sensorId": "thermostat-1",
    "value": 25
}
```

```json
{
    "id": "log-2",
    "sensorId": "thermostat-1",
    "value": 27
}
```

```json
{
    "id": "log-3",
    "sensorId": "thermostat-1",
    "value": 28
}
```

You can remap the inserts of the `SensorLog` to updates of a `Sensor`, so if you get 3 updates for a given sensor over time, you only need to index the last one, rather than the entire history. In this configuration, the root of the `SensorLog` payload is selected to update a `Sensor` with the ID equal to the `sensorId` field in the incoming change payload. So instead of 3 `SensorLog` nodes, we now have 1 `Sensor` node with the current value.


```yaml
apiVersion: v1
kind: ContinuousQuery
name: query
spec:
  sources:    
    subscriptions:
      - id: source
        nodes:
          - sourceLabel: SensorLog
        pipeline:
          - extract-latest
    middleware:
      - kind: map
        name: extract-latest
        SensorLog:        
          insert:
            - selector: $
              op: Update
              label: Sensor
              id: $.sensorId
              properties:
                sensorId: $.sensorId
                currentValue: $.value

  query: >
    MATCH
        (s:Sensor)
    RETURN
        s.sensorId,
        s.currentValue    
```

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

The configuration for the **parse_json** component are as follows:

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