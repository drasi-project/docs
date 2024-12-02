---
type: "docs"
title: "Configure a Debezium Reaction"
linkTitle: "Configure a Debezium Reaction"
weight: 40
description: >
    Learn how to configure a Debezium Reaction
---

The Drasi Debezium Reaction connector generates a Debezium-compatible data change event for each Added, Updated, or Removed in a Drasi result for a given Continuous Query. Each event contains a value and optionally a key, with the structure of both depends on the result returned by the Continuous Query.


While Debezium doesn't spell out a specification for the structure of the data change events, the existing implementations do adhere to a roughly common structure: because Debezium expects the structure of the events to potentially change over time, it supports encapsulating the schema of the key and value in the event itself to make each event self-contained. The events produced by this Reaction a should be analogous to the data change events produced by similar Debezium Connectors, which can be used as a reference model and more detailed commentary. For example, refer to the [Vitess events](https://debezium.io/documentation/reference/2.1/connectors/vitess.html#vitess-events).

## Requirements
On the computer from where you will create the Drasi Debezium Reaction, you need to install the following software:
- [Drasi CLI](/reference/command-line-interface/) 

## Creating the Reaction
To create a Reaction, execute the `drasi apply` command as follows:

```text
drasi apply -f my-reaction.yaml -n drasi-namespace
```

The `drasi apply` command is how you create all new Drasi resources (in this case a Reaction). The `-f` flag specifies that the definition of the new Reaction is contained in the referenced YAML file `my-reaction.yaml` and the `-n` flag specifies the Drasi namespace in which to create the Reaction (Drasi must already be installed in that namespace).

## Reaction Definitions
The YAML file passed to `drasi apply` can contain one or more Reaction definitions. Here is an example of a Drasi Debezium Reaction definition:

```yaml {#debezium}
apiVersion: v1
kind: Reaction
name: debezium-reaction
spec:
  kind: Debezium
  queries:
    hello-world-from:
  properties:
    brokers: <kafka-broker>
    topic: <kafka-topic>
    includeKey: true
    includeSchemas: true
```

In this definition: 
- the **apiVersion** must be **v1**.
- the **kind** property tells Drasi to create a **Reaction** resource.
- the **spec.kind** property tells Drasi the kind of Reaction to create, in this case a **Debezium** Reaction. 
- the **name** property tells Drasi the identity of the Reaction and must be unique within the scope of Reactions within the target Drasi environment. In the above example, the **name** of the Reaction is **debezium-reaction**.

This table describes the other settings in the **spec** section of the Reaction definition:
|Property|Description
|--- |---
|`queries`| The list of continuous queries you would like the Debezium Reaction to listen to and publish change events for.
|`properties.brokers`| The Kafka broker to write to, for example `test-kakfa:9092` which is the name of the server set up by applying the `test-kafka.yaml` file.
|`properties.topic`| The name of the Kafka topic to write to, for example `my-kafka-topic`.
|`properties.includeKey`| Whether to include the `key` in the resulting event. This defaults to `false` so only the value is included by default.
|`properties.includeSchemas`| Whether to include the `schema` in the resulting event. If `includeSchemas` is set to `true` this will also include the key schema, otherwise only the value schema is included. This defaults to `false`.


## Inspecting the Reaction
As soon as the Reaction is created it will start running, subscribing to the specified list of Continuous Queries and processing changes to the Continuous Query results.

You can check the status of the Reaction using the `drasi list` command:

```text
drasi list reaction
```

Or including a target namespace:

```text
drasi list reaction -n drasi-namespace
```

This will return a simple list of all Reactions in the default (or specified) namespace and their overall status. For example:

```
        ID               | AVAILABLE
-------------------------+------------
    debezium-reaction    | true
```

If an error has occurred during the creation or operation of a Reaction, the `AVAILABLE` column will contain the error text instead of `true` or `false`.

For more details about the Reaction you can use the [drasi describe](/reference/command-line-interface#drasi-describe) command:

```text
drasi describe reaction debezium-reaction
```

This will return the full definition used to create the Reaction along with more detailed status information.

## Using the Reaction
The following skeleton JSON shows the basic four parts of a standard Debezium change data event, assuming all optional parts of the event are requested as part of the Reaction configuration:

```json
{
 "schema": { // <1>
   ...
  },
 "payload": { // <2>
   ...
 },
 "schema": { // <3>
   ...
 },
 "payload": { // <4>
   ...
 },
}
```

| Item | Field | Description
| --- | --- |---
|1|`schema`| The first `schema` field is part of the event key. It specifies a Kafka Connect schema that describes what is in the event key's `payload` portion. In other words, the first `schema` field describes the structure of the key for the Continuous Query result that contains the change event.
|2|`payload`|The first `payload` field is part of the event key. It has the structure described by the previous `schema` field and it contains the key for the Continuous Query result that contains the change event.
|3|`schema`|The second `schema` field is part of the event value. It specifies the Kafka Connect schema that describes what is in the event value's `payload` portion. In other words, the second `schema` describes the structure of the Continuous Query result data. Typically, this schema contains nested schemas.
|4|`payload`|The second `payload` field is part of the event value. It has the structure described by the previous `schema` field and it contains the actual Continuous Query result data.

### Change event keys

A change event's key contains the schema for the Continuous Query result key and the key value for that Continuous Query result.

Note that in most Debezium Connectors, the key consists of a single `id` field which specifies the unique identifier for the document/row/record's that was changed. This Reaction does not have access to the indexing information used by the query containers, so it instead uses the _sequence number_ of a Continuous Query result as the key. For consistency with existing Debezium Connectors, we treat the sequence number as a string and use the field name `id`, even though this is equivalent to the `seq` numeric field in the change event value `source` data we'll see below.

To illustrate the structure of the key, we treat this Reaction as if it is a connector with the fixed logical name of `drasi`, with a query container in the `default` namespace, and using the `hello-world-from` Continuous Query results:

```json
{
     "schema": { // <1>
        "type": "struct",
        "name": "drasi.hello-world-from.Key", // <2>
        "optional": false, // <3>
        "fields": [ //<4>
            {
                "field": "id",
                "type": "string",
                "optional": false
            }
        ]
    },
    "payload": { //<5>
        "id": "26716600"
    },
}    
```

| Item | Field | Description
| --- | --- |---
|1|`schema`|The schema portion of the key specifies a Kafka Connect schema that describes what is in the key's `payload` portion.
|2|`"drasi.hello-world-from.Key"`|Name of the schema that defines the structure of the key's payload. This schema describes the structure of the key for the Continuous Query result. Key schema names have the format `<connector-name>.<query-id>.Key`. In this example: <ul><li>`drasi` is the name of the connector that generated this event.</li><li>`hello-world-from` is the Continuous Query ID that produced the results.</li></ul>
|3|`optional`|Indicates whether the event key must contain a value in its `payload` field. As a Drasi Reaction, a value in the key's payload is always required (all results have a sequence number).
|4|`fields`|Specifies each field that is expected in the `payload`, including each field's name, type, and whether it is required.
|5|`payload`|Contains the key for the result for which this change event was generated. In this example, the key contains a single `id` field of type `string` whose value is `26716600` that is the sequence number of the result.

### Change event values

Like the key, the value has a `schema` section and a `payload` section. The `schema` section contains the schema that describes the `Envelope` structure of the `payload` section, including its nested fields. Change events for operations that _create_, _update_ or _delete_ data all have a value payload with an envelope structure, with each of those Debezium operations corresponding to an event in the `addedResults`, `updatedResults`, and `deletedResults` lists respectively for a given Continuous Query result.

Continuing the example of this Reaction as a connector with the fixed logical name of `drasi`, pulling results for the `hello-world-from` Continuous Query:

```json
{
    "schema": { // <1>
        "type": "struct",
        "fields": [
            {
                "type": "struct",
                "fields": [
                    {
                        "field": "MessageFrom",
                        "type": "string",
                        "optional": false
                    },
                    {
                        "field": "MessageId",
                        "type": "number",
                        "optional": false
                    }
                ],
                "optional": true,
                "name": "drasi.hello-world-from.Value", // <2>
                "field": "before"
            },
            {
                "type": "struct",
                "fields": [
                    {
                        "field": "MessageFrom",
                        "type": "string",
                        "optional": false
                    },
                    {
                        "field": "MessageId",
                        "type": "number",
                        "optional": false
                    }
                ],
                "optional": true,
                "name": "drasi.hello-world-from.Value",
                "field": "after"
            },
            {
                "type": "struct",
                "fields": [
                    {
                        "field": "version",
                        "type": "string",
                        "optional": false
                    },
                    {
                        "field": "connector",
                        "type": "string",
                        "optional": false
                    },
                    {
                        "field": "container",
                        "type": "string",
                        "optional": false
                    },
                    {
                        "field": "hostname",
                        "type": "string",
                        "optional": false
                    },
                    {
                        "field": "ts_ms",
                        "type": "int64",
                        "optional": false
                    },
                    {
                        "field": "seq",
                        "type": "int64",
                        "optional": false
                    }
                ],
                "optional": false,
                "name": "io.debezium.connector.drasi.Source", // <3>
                "field": "source"
            },
            {
                "type": "string",
                "optional": false,
                "field": "op"
            },
            {
                "type": "int64",
                "optional": true,
                "field": "ts_ms"
            }
        ],
        "optional": false,
        "name": "drasi.hello-world-from.Envelope" // <4>
    },
    "payload": { // <5>
        "before": null, // <6>
        "after": { //<7>
            "MessageFrom": "Allen",
            "MessageId": 25
        },
        "source": { // <8>
            "version": "preview.1",
            "connector": "drasi",
            "ts_ms": 1732729776549,
            "seq": 26716600
        },
        "op": "c", // <9>
        "ts_ms": 1732729853215 // <10>
    }
}
```

| Item | Field | Description
| --- | --- |---
|1|`schema`|The value's schema, which describes the structure of the value's payload. A change event's value schema is the same in every change event that the Reaction generates for a particular Continuous Query result.
|2|`name`|In the `schema` section, each `name` field specifies the schema for a field in the value's payload.<br/>In this example, `drasi.hello-world-from.Value` is the schema for both `before` and `after` fields in the payload, and the schema is specific to the `hello-world-from` query.<br/>Names of the schemas for `before` and `after` fields are of the form `<connector-name>.<query-id>.Value` so that they have unique names per query.
|3|`name`|`io.debezium.connector.drasi.Source` is the schema for the payload's `source` field. This schema is specific to the Drasi Debezium Reaction, and is used for all events that it generates.
|4|`name`|`drasi.hello-world-from.Envelope` is the schema for the overall structure of the payload, where `drasi` is the connector name, and `hello-world-from` is the query ID. This schema is specific to the query result.
|5|`payload`|The value's actual data. This is the information that the change event is providing.
|6|`before`|An optional field that specifies the state of the document before the event occurred. In this example, all fields are part of the `hello-world-from` query result. When the `op` field is `c` for _create_, the `before` field will be `null` since it reflects added results.
|7|`after`|An optional field that specifies the state of the document before the event occurred. In this example, all fields are part of the `hello-world-from` query result. When the `op` field is `d` for _delete_, the `after` field will be `null` since it reflects deleted results.
|8|`source`|Mandatory field that describes the source metadata for the event. This field contains information that you can use to compare this event with other events, with regard to the origin of the events, the order in which the events occurred, and whether events were part of the same transaction. The source metadata includes:<ul><li>Drasi version.</li><li>Name of Drasi Reaction "connector" that generated the event (i.e. always "drasi").</li><li>Timestamp for when the query was complete and the result published in ms.</li><li>Unique sequence number for the result.</li></ul>
|9|`op`|Mandatory string that describes the type of operation that caused the connector to generate the event. In this example, `u` indicates that the operation is _updated_ so the value is one of the Continuous Query `updatedResults`. Valid values are:<ul><li>`c` = create</li><li>`u` = update</li><li>`d` = delete</li></ul>
|9|`ts_ms`|Optional field that displays the time at which the Drasi Debezium Reaction processed the event. The time is based on the system clock in running in the Reaction reported in ms. Note that the current implementation always fills in a value here despite it being schematically optional.<br/>In the `source` object, `ts_ms` indicates the time that the query result was published. By comparing the value for `payload.source.ts_ms` with the value for `payload.ts_ms`, you can determine the lag between the query result and the Reaction's handling of it.

### Data type mappings

Note that unlike other connectors, the Drasi Debezium Reaction doesn't inherit type information from the underlying data sources (e.g. SQL, MongoDB, etc.). Instead, it infers the type information from the Continuous Query result JSON, representing the schema. This means that the type information in the event is not necessarily the same as the type information in the underlying data source, and are limited to the 6 broad JSON types:

- `string`
- `number`
- `boolean`
- `null`
- `object`
- `array`

> ⚠️ This is one area where it potentially breaks compatibility with Debezium because the type information associated with the event schemas are expected to be Kafka Connect types, not JSON types. This will need to be addressed in the future.

Types used elsewhere in the schema definitions, such as for the Drasi `source` adhere to Kafka Connect types, with most of them being strings and several fields called out as `Int64`:

- `payload.source.seq`: The sequence number of the query result containing the change event.
- `payload.source.ts_ms`: The time that the query result containing the change event was published in ms.
- `payload.ts_ms`: The time that the change event was processed by the Drasi Reaction in ms.

### Testing the Reaction
Please navigate this [link](https://github.com/drasi-project/drasi-platform/tree/main/reactions/debezium/debezium-reaction#deployment-and-testing) for guidance on how to test the Debezium Reaction.

## Modifying the Reaction
If you want to modify an existing reaction, you can use the `drasi apply` command to apply the updated YAML file. Ensure that the name of the reaction remains consistent.

## Deleting the Reaction
To delete a Reaction you use the `drasi delete` command. There are two ways to do this. 

Firstly, you can specify the type of resource (Reaction) and its name, for example:

```text
drasi delete reaction debezium-reaction
```

Secondly, you can refer to the YAML file(s) that contain the definitions used to create the Reaction(s):

```text
drasi delete -f my-reaction.yaml <file2.yaml> <file3.yaml> <...>
```

This is a convenience, especially if a single YAML file contains multiple Reaction definitions. 

If the Reaction is not in the default Drasi namespace, you should specific the target namespace using the `-n` flag as usual:

```text
drasi delete -f my-reaction.yaml -n drasi-namespace