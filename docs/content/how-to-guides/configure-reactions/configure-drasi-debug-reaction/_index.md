---
type: "docs"
title: "Configure a Drasi Debug Reaction"
linkTitle: "Configure a Drasi Debug Reaction"
weight: 50
description: >
    Learn how to configure a Drasi Debug Reaction
---

The Debug Reaction provides a simple Web-based UI that lets you see the current result of a Continuous Query as a table, and to view the query results updating dynamically as the source data changes. It is intended for use as a development and testing tool for people writing and testing Continuous Queries, not as a way to consume Continuous Queries in a live environment.

To configure and deploy an instance of the Drasi Debug Reaction, you will need to:

1. Create a .yaml file that contains the configuration for the Drasi Debug Reaction.
1. Deploy the Drasi Debug Reaction to your Drasi environment using the [Drasi CLI](/reference/command-line-interface).
1. Make the Drasi Debug Reaction Web-UI accessible using ```kubectl```.

These steps are described in the following sections.

## Creation
Reactions can be created and managed using the `drasi` CLI tool. 

The easiest way to create a Reaction, and the way you will often create one as part of a broader software solution, is to:

1. Collect ID's of the Continuous Queries the Reaction will subscribe to.
1. Collect credentials and endpoint addresses that provide access to any external system the Reaction interacts with.
1. Create a YAML file containing the Reaction Resource Definition. This will include the configuration settings that enable the Reaction to connect to external systems. This can be stored in your solution repo and versioned along with all the other solution code / resources.
1. Run `drasi apply` to apply the Reaction resource definition to the Kubernetes cluster where your Drasi environment is deployed.

As soon as the Reaction is created it will start running, subscribing to its Continuous Queries and processing query result changes.

The definition for a Reaction has the following structure:

```
apiVersion: v1
kind: Reaction
name: <reaction-id>
spec:
  kind: <reaction kind>
  queries:
    query1: <custom metadata for query1 (optional)>
    query2: <custom metadata for query2 (optional)>
  properties:
    <property_1_name>: <property_1_value>
    <property_2_name>: 
      kind: Secret
      name: <secret_id>
      key: <secret_key>          
  endpoints:
    <endpoint_name>: <enpoint_port_num>
```

The following table provides a summary of these configuration settings:

|Name|Description|
|-|-|
|apiVersion|Must have the value **v1**|
|kind|Must have the value **Reaction**|
|name|The **id** of the Reaction. Must be unique within the scope of the Reactions in the Drasi deployment. The  **id** is used to manage the Reaction.|
|spec.kind|The type of Reaction to deploy.|
|spec.queries|The list of Continuous Query IDs the Reaction will subscribe to. Some Reactions also need per-query configuration, which can be passed using the options property of the queryId. These are unique to the type of Reaction and are detailed in the sections below.|
|spec.properties|Name/value pairs used to configure the Reaction. These are unique to the type of Reaction and are detailed in the sections below.|
|spec.endpoints|Names and port numbers to use for Reactions that expose accessible ports for clients to connect to.|  

Once configured, to create a Reaction defined in a file called `reaction.yaml`, you would run the command:

```
drasi apply -f reaction.yaml
```

You can then use additional `drasi` commands to query the existence and status of the Reaction resource. For example, to see a list of the active Reactions, run the following command:

```
drasi list reaction
```

## Deletion
To delete an active Reaction, run the following command:

```
drasi delete reaction <reaction-id>
```

For example, if the Reaction ID is `update-gremlin`, you would run,

```
drasi delete reaction update-gremlin
```