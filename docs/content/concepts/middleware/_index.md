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