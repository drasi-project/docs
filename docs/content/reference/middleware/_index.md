---
type: "docs"
title: "Middleware Reference"
linkTitle: "Middleware"
weight: 25
description: >
    Complete reference documentation for all middleware components used to transform and enrich incoming data changes.
related:
  concepts:
    - title: "Middleware Overview"
      url: "/concepts/middleware/"
    - title: "Continuous Queries"
      url: "/concepts/continuous-queries/"
  howto:
    - title: "Write Continuous Queries (Kubernetes)"
      url: "/drasi-kubernetes/how-to-guides/write-continuous-queries/"
    - title: "Write Continuous Queries (Server)"
      url: "/drasi-server/how-to-guides/write-continuous-queries/"
---

Middleware components transform and enrich incoming Source Change Events before they reach your Continuous Queries. This reference provides complete specifications for each available middleware type.

For a conceptual overview of middleware, see [Middleware Concepts](/concepts/middleware/).

## Configuration Structure

Middleware is configured within Continuous Query definitions. The specific syntax varies by product:

- **drasi-lib**: Configured programmatically via the Rust API
- **Drasi Server**: Configured in YAML/JSON configuration files
- **Drasi for Kubernetes**: Configured in the Continuous Query resource manifest

Middleware components are modular and can be combined in a pipeline to process changes sequentially. Each middleware in the pipeline receives the output of the previous one, allowing you to chain multiple transformations.

---

## Available Middleware Components

- [Unwind](#unwind) - Expand nested arrays into top-level graph elements
- [JQ](#jq) - Transform data using jq expressions
- [Promote](#promote) - Copy nested values to top-level properties
- [ParseJson](#parsejson) - Parse JSON strings into structured objects
- [Decoder](#decoder) - Decode encoded string values
- [Relabel](#relabel) - Remap element labels

---

## Unwind

The **unwind** middleware component expands an array of values nested inside a Node or Relation's properties into separate top-level elements in the graph. This allows you to query unwound elements using standard Cypher or GQL patterns.

### Configuration Properties

| Property | Description |
| - | - |
| kind | Must be **unwind** |
| name | The name of this configuration, used in a source pipeline |
| {Node Label} | The unwind configuration for all nodes with the given label |

In addition to the **kind** and **name** properties, any additional properties on this configuration object will be a dictionary of unwind configurations, where the key is the label of the incoming node.

### Unwind Element Configuration

| Property | Description |
| - | - |
| selector | A [JSONPath](https://en.wikipedia.org/wiki/JSONPath) expression to locate the array to unwind within the properties of the incoming node |
| label | The label of the newly created child Node (one for each array element) |
| key | (optional) A JSONPath expression to locate a unique key for the child node within the parent context. If not specified, the array index is used |
| relation | (optional) The label of the relation created between parent and child nodes |
| condition | (optional) A JSONPath expression that filters whether this mapping should be applied. If the expression returns no result or empty, the mapping is skipped |

### Example: Vehicle Tires

Given a source that produces Vehicle nodes with nested tire data:

```json
{
    "id": "vehicle-1",
    "tires": [
        { "position": "Front-Left", "pressure": 250 },
        { "position": "Front-Right", "pressure": 258 },
        { "position": "Rear-Left", "pressure": 243 },
        { "position": "Rear-Right", "pressure": 252 }
    ]
}
```

You can unwind the **tires** array into separate Tire nodes connected to the Vehicle:

**Middleware configuration:**
```yaml
- name: extract-tires
  kind: unwind
  Vehicle:
    - selector: $.tires[*]
      label: Tire
      key: $.position
      relation: HAS
```

**Query:**
```cypher
MATCH (v:Vehicle)-[:HAS]->(t:Tire)
RETURN v.id, t.position, t.pressure
```

### Conditional Unwind Example

The **condition** property allows you to selectively apply the unwind operation based on node properties. For example, only unwind container information when the action is "update":

**Input data:**
```json
{
    "action": "update",
    "metadata": { "name": "pod-1", "namespace": "default" },
    "status": {
        "containerStatuses": [
            { "containerID": "c1", "name": "nginx" },
            { "containerID": "c2", "name": "redis" }
        ]
    }
}
```

**Middleware configuration:**
```yaml
- name: extract-containers
  kind: unwind
  Pod:
    - selector: $.status.containerStatuses[*]
      label: Container
      key: $.containerID
      relation: OWNS
      condition: $[?(@.action == 'update')]
```

When `condition` evaluates to empty or no result, the unwind is skipped for that element.

---

## JQ

The **jq** middleware component transforms incoming source changes using [jq](https://jqlang.org/) expressions. It can reshape data or project a single change into multiple changes.

### External Resources

- [JQ Manual](https://jqlang.org/manual/)
- [JQ Playground](https://play.jqlang.org/)

### Configuration Properties

| Property | Description |
| - | - |
| kind | Must be **jq** |
| name | The name of this configuration, used in a source pipeline |
| {Label}.insert | Mapping configuration for elements with the given label when an insert change is received |
| {Label}.update | Mapping configuration for elements with the given label when an update change is received |
| {Label}.delete | Mapping configuration for elements with the given label when a delete change is received |

### Mapping Configuration

| Property | Description |
| - | - |
| op | The operation to apply to output element(s): Insert, Update, or Delete |
| query | The JQ query to apply. Output can be a single object or an array of objects |
| label | (optional) A JQ query to extract a new label for each projected element |
| id | (optional) A JQ query to extract a new ID for each projected element |
| haltOnError | (optional) If true, errors stop query processing. If false (default), errors skip the problematic change |

### Example: Append-Only Log to Latest Value

Transform an append-only log of sensor readings into updates to a single Sensor node with the latest value:

**Input data (sequence of inserts):**
```json
{ "id": "log-1", "sensorId": "thermostat-1", "value": "25" }
{ "id": "log-2", "sensorId": "thermostat-1", "value": "27" }
{ "id": "log-3", "sensorId": "thermostat-1", "value": "28" }
```

**Middleware configuration:**
```yaml
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
```

Instead of indexing 3 SensorLog nodes, you now have 1 Sensor node with the current value.

### Example: Array Selection

Use [JQ select](https://jqlang.org/manual/#select) to extract specific values from arrays:

**Input data:**
```json
{
    "signals": [
        { "name": "Vehicle.CurrentLocation.Heading", "value": "96" },
        { "name": "Vehicle.Speed", "value": "119" },
        { "name": "Vehicle.TraveledDistance", "value": "4563" }
    ],
    "vehicleId": "v1"
}
```

**Middleware configuration:**
```yaml
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
```

### Example: Conditional Routing

Use [JQ conditionals](https://jqlang.org/manual/#if-then-else-end) to route different event types to different operations:

**Input data (GitHub webhook):**
```json
{
    "action": "opened",
    "issue": { "id": 123, "title": "Bug report", "state": "open" },
    "repository": { "id": 456, "name": "my-repo" }
}
```

**Middleware configuration:**
```yaml
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
            { "id": .issue.id, "state": "closed" }
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
```

---

## Promote

The **promote** middleware copies values from deep-nested locations inside an element's properties to new top-level properties. Selection uses JSONPath expressions.

### Configuration Properties

| Property | Type | Description | Required | Default |
|----------|------|-------------|----------|---------|
| `kind` | String | Must be **promote** | Yes | |
| `name` | String | The name of this configuration, used in a source pipeline | Yes | |
| `config` | Object | Contains the specific configuration for the promote middleware | Yes | |
| `config.mappings` | Array | Defines the promotion rules. Must contain at least one mapping entry | Yes | |
| `config.on_conflict` | `"overwrite"` \| `"skip"` \| `"fail"` | Action when target_name already exists | No | `"overwrite"` |
| `config.on_error` | `"skip"` \| `"fail"` | Behavior when a mapping encounters an error | No | `"fail"` |

### Mapping Object Properties

| Property | Type | Description | Required |
|----------|------|-------------|----------|
| `path` | String | A JSONPath expression that must select exactly one value | Yes |
| `target_name` | String | The name of the new top-level property | Yes |

### Example

**Middleware configuration:**
```yaml
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
      - path: "$.metadata"
        target_name: "meta"
    on_conflict: skip
    on_error: skip
```

**Input:**
```json
{
    "user": {
        "id": "user123",
        "location": { "city": "New York" }
    },
    "order": { "total": 100.50 },
    "metadata": { "source": "api", "version": "1.1" }
}
```

**Output:**
```json
{
    "user": { "id": "user123", "location": { "city": "New York" } },
    "order": { "total": 100.50 },
    "metadata": { "source": "api", "version": "1.1" },
    "userId": "user123",
    "city": "New York",
    "orderTotal": 100.50,
    "meta": { "source": "api", "version": "1.1" }
}
```

---

## ParseJson

The **parse_json** middleware parses a string property containing a JSON document into a structured object or list. Useful when a source provides JSON embedded within a string field.

### Configuration Properties

| Property | Type | Description | Required | Default |
|----------|------|-------------|----------|---------|
| `kind` | String | Must be **parse_json** | Yes | |
| `name` | String | The name of this configuration, used in a source pipeline | Yes | |
| `config` | Object | Contains the specific configuration | Yes | |
| `config.target_property` | String | The property containing the JSON string to parse | Yes | |
| `config.output_property` | String | Where to store the parsed result. If omitted, overwrites target_property | No | `null` |
| `config.on_error` | `"skip"` \| `"fail"` | Behavior on errors | No | `"fail"` |
| `config.max_json_size` | Integer | Maximum JSON string size in bytes | No | `1048576` (1MB) |
| `config.max_nesting_depth` | Integer | Maximum allowed nesting depth | No | `20` |

### Example

**Middleware configuration:**
```yaml
- name: parse_event_data
  kind: parse_json
  config:
    target_property: "raw_event_json"
    output_property: "event_details"
    on_error: "skip"
```

**Input:**
```json
{
    "id": "event001",
    "timestamp": "2025-06-01T12:00:00Z",
    "raw_event_json": "{\"user\": \"alice\", \"action\": \"login\", \"details\": {\"ip\": \"192.168.1.100\"}}"
}
```

**Output:**
```json
{
    "id": "event001",
    "timestamp": "2025-06-01T12:00:00Z",
    "raw_event_json": "{\"user\": \"alice\", \"action\": \"login\", \"details\": {\"ip\": \"192.168.1.100\"}}",
    "event_details": {
        "user": "alice",
        "action": "login",
        "details": { "ip": "192.168.1.100" }
    }
}
```

---

## Decoder

The **decoder** middleware decodes a string value from various encoding formats: Base64, Hexadecimal, URL encoding, and JSON string escapes.

### Configuration Properties

| Property | Type | Description | Required | Default |
|----------|------|-------------|----------|---------|
| `kind` | String | Must be **decoder** | Yes | |
| `name` | String | The name of this configuration, used in a source pipeline | Yes | |
| `config` | Object | Contains the specific configuration | Yes | |
| `config.encoding_type` | String | The encoding format. See supported types below | Yes | |
| `config.target_property` | String | The property containing the encoded string | Yes | |
| `config.output_property` | String | Where to store the decoded result. If omitted, overwrites target_property | No | `null` |
| `config.strip_quotes` | Boolean | Remove surrounding double quotes before decoding | No | `false` |
| `config.on_error` | `"skip"` \| `"fail"` | Behavior on errors | No | `"fail"` |

### Supported Encoding Types

| Type | Description |
|------|-------------|
| `base64` | Standard Base64 encoding (RFC 4648) |
| `base64url` | URL-safe Base64 encoding (RFC 4648 section 5), without padding |
| `hex` | Hexadecimal encoding (e.g., `48656c6c6f`) |
| `url` | Percent-encoding (e.g., `Hello%20World`) |
| `json_escape` | JSON string escape sequences (e.g., `\"`, `\\`, `\n`, `\uXXXX`) |

### Example

**Middleware configuration:**
```yaml
- name: decode_user_data
  kind: decoder
  config:
    encoding_type: "base64"
    target_property: "raw_user_payload"
    output_property: "user_data"
    strip_quotes: true
    on_error: "skip"
```

**Input:**
```json
{
    "message_id": "msg123",
    "raw_user_payload": "\"SGVsbG8gV29ybGQh\""
}
```

**Output:**
```json
{
    "message_id": "msg123",
    "raw_user_payload": "\"SGVsbG8gV29ybGQh\"",
    "user_data": "Hello World!"
}
```

The `strip_quotes: true` removes the surrounding double quotes before Base64 decoding.

---

## Relabel

The **relabel** middleware rewrites element labels according to a user-defined mapping. Useful for:

- Normalizing heterogeneous sources to a common vocabulary
- Consolidating legacy or versioned labels
- Preparing data for queries with a stable set of labels

### Configuration Properties

| Property | Description |
| - | - |
| kind | Must be **relabel** |
| name | The name of this configuration, used in a source pipeline |
| labelMappings | (Required) Object mapping original labels to new labels. Must contain at least one entry |

### Behavior

- Each label is looked up in `labelMappings`. If present, it's replaced; otherwise retained
- Multiple source labels can map to different targets in the same element
- Applies to Node and Relation labels
- Applies to Insert, Update, and Delete changes (so deletes match expected labels)

### Example: Normalize Labels

**Middleware configuration:**
```yaml
- name: normalize-user-labels
  kind: relabel
  labelMappings:
    Person: User
    Employee: Staff
    Company: Organization
```

**Label transformations:**

| Incoming Labels | After Relabel |
| - | - |
| `[Person]` | `[User]` |
| `[Person, Employee]` | `[User, Staff]` |
| `[Company]` | `[Organization]` |
| `[UnmappedLabel]` | `[UnmappedLabel]` (unchanged) |

### Example: Relation Label Remapping

**Middleware configuration:**
```yaml
- name: relabel-links
  kind: relabel
  labelMappings:
    KNOWS: CONNECTED_TO
    WORKS_FOR: EMPLOYED_BY
```

An incoming relation labeled `KNOWS` will appear as `CONNECTED_TO` after middleware processing.
