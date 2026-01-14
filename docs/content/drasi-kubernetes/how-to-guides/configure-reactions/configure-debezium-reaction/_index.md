---
type: "docs"
title: "Configure a Debezium Reaction"
linkTitle: "Configure a Debezium Reaction"
weight: 40
description: >
    Learn how to configure a Debezium Reaction
related:
  tutorials:
    - title: "Getting Started with Drasi"
      url: "/drasi-kubernetes/getting-started/"
  concepts:
    - title: "Reactions"
      url: "/concepts/reactions/"
  howto:
    - title: "Write Continuous Queries"
      url: "/drasi-kubernetes/how-to-guides/write-continuous-queries/"
  reference:
    - title: "CLI Reference"
      url: "/drasi-kubernetes/reference/command-line-interface/"
---

The Drasi {{< term "Debezium" >}} {{< term "Reaction" >}} connector generates a Debezium-compatible data change event for each Added, Updated, or Removed in a Drasi result for a given {{< term "Continuous Query" >}}. The events produced by this Reaction should be analogous to the data change events produced by similar Debezium Connectors, which can be used as a reference model and more detailed commentary. 


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
    <query-id>:
  properties:
    brokers: <kafka-broker>
    topic: <kafka-topic>
    saslUsername: <username>
    saslPassword: <password>
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
|`properties.saslUsername`| The username for authenticating with a password-protected Kafka broker. Optional, but required if `saslPassword` is set.
|`properties.saslPassword`| The password for authenticating with a password-protected Kafka broker. Optional, but required if `saslUsername` is set.


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

The Debezium Reaction output differs from standard Debezium data change events (for example, [Vitess events](https://debezium.io/documentation/reference/2.1/connectors/vitess.html#vitess-events)), which typically include four JSON fields: the change event key schema, the actual event key, the change event value schema, and the event value payload. Instead, the Debezium Reaction output contains only a single `payload` field. This field contains the result from a query change event and its metadata.

We removed the event key fields as the change events themselves do not have primary keys, and we removed the change event value schema field as currently the Drasi Reactions do not have the ability to access the definition of the Continuous Queries. In other words, Drasi is currently unable to generate an accurate schema of a Change Event based on the results from a Continuous Query.

The following skeleton JSON shows the basic format of a standard Debezium change data event:

```json
{
   "payload": { // <1>
        "before":  { ... }, // <2>
        "after": { ... }, // <3>
        "source": { // <4>
            "version": "0.1.6",
            "connector": "drasi",
            "ts_ms": 123456789,
            "seq": 26716600
        },
        "op": "c", // <5>
        "ts_ms": 123456789 // <6>
    }
}
```

| Item | Field | Description
| --- | --- |---
|1|`payload`|The payload contains the data from the change event value. 
|2|`before` |An optional field that specifies the state of the document before the event occurred. If the `op` field is set to `c`, the `before` field will be set to `null` as the operation is _created_.
|3|`after`|An optional field that specifies the state of the document before the event occurred. If the `op` field is set to `d`, the `after` field will be set to `null` as the operation is _deleted_.
|4|`source`|Mandatory field that describes the source metadata for the event. This field contains information that you can use to compare this event with other events, with regard to the origin of the events, the order in which the events occurred, and whether events were part of the same transaction. The source metadata includes:<ul><li>Drasi version.</li><li>Name of Drasi Reaction "connector" that generated the event (i.e. always "drasi").</li><li>Timestamp for when the query was complete and the result published in ms.</li><li>Unique sequence number for the result.</li></ul>
|5|`op`|Mandatory string that describes the type of operation that caused the connector to generate the event. In this example, `c` indicates that the operation is _created_ so the value is one of the Continuous Query `addedResults`. Valid values are:<ul><li>`c` = create</li><li>`u` = update</li><li>`d` = delete</li></ul>
|6|`ts_ms`|Optional field that displays the time at which the Drasi Debezium Reaction processed the event. The time is based on the system clock in running in the Reaction reported in ms. Note that the current implementation always fills in a value here despite it being schematically optional.<br/>In the `source` object, `ts_ms` indicates the time that the query result was published. By comparing the value for `payload.source.ts_ms` with the value for `payload.ts_ms`, you can determine the lag between the query result and the Reaction's handling of it.



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