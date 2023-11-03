---
type: "docs"
title: "Custom Reactions"
linkTitle: "Custom Reactions"
weight: 40
description: >
    Developing Custom Reactions for Drasi
---

You can develop custom reactions by writing an application in any language that adheres to a certain specification and publish it as a docker image to the registry serving Drasi images to your cluster.

## Query Configuration

The Drasi control plane will mount a folder at `/etc/queries` where each file will be named after each queryId that is configured for the reaction.  The contents of each file will be the `options` field from the config.

Consider the following reaction configuration, this will result in 3 empty files named `query1`, `query2` and `query3` under `/etc/queries`.

```yaml {hl_lines=["7-11"]}
apiVersion: query.reactive-graph.io/v1
kind: Reaction
metadata:
  name: my-reaction
spec:
  reactionImage: my-reaction
  queries:
    - queryId: query1
    - queryId: query2
    - queryId: query3
```

The following reaction configuration shows how to include additional metadata per query.  This will result in a file named `query1` with the contents of `foo` and a file named `query2` with the contents of `bar`

```yaml{hl_lines=["9-10","12-13"]}
apiVersion: query.reactive-graph.io/v1
kind: Reaction
metadata:
  name: my-reaction
spec:
  reactionImage: my-reaction
  queries:
    - queryId: query1
      options: >
      foo
    - queryId: query2
      options: >
      bar
```

The format of the content of the options field is completely up to the developer of that particular reaction, for example you could include yaml or json content and it is up to you to deserialize and make sense of it within the context of your custom reaction.

## Receiving Changes

When the projection of a continuous query is changed, a message will be published to a [Dapr topic](https://docs.dapr.io/developing-applications/building-blocks/pubsub/howto-publish-subscribe/#subscribe-to-topics). The pubsub name will be available on the `PUBSUB` environment variable. The topic name will be `<queryId>-results`, so for each queryId you discover in `/etc/queries`, you should subscribe to that Dapr topic.

A skeleton implementation in Javascript would look something like this

```js
import { DaprServer } from "@dapr/dapr";
import { readdirSync, readFileSync } from 'fs';
import path from 'path';

const pubsubName = process.env["PUBSUB"] ?? "rg-pubsub";
const configDirectory = process.env["QueryConfigPath"] ?? "/etc/queries";
const daprServer = new DaprServer();

let queryIds = readdirSync(configDir);
  for (let queryId of queryIds) {
    if (!queryId || queryId.startsWith("."))
      continue;

    await daprServer.pubsub.subscribe(pubsubName, queryId + "-results", (changes) => {
        //implement code that reacts to changes here
    });
}

await daprServer.start();
```

## Message Format

There are two classes of events that can be read on this stream.  Inspect the `kind` field to determine which one it is.

### Control signals

If the `kind` field is `control`, then this event is a control signal and not a data change.

Inspect the `controlSignal` field to determine the type:

- bootstrapStarted
- bootstrapCompleted
- running
- stopped
- deleted

### Data changes

If the `kind` field is `change`, then this event is a data change.

The format of the of each item itself contains an array for `addedResults`, `deletedResults` and `updatedResults`.

The basic structure looks like this

```js
{
    "kind": "change",
    "queryId": "",
    "addedResults": [],
    "deletedResults": [],
    "updatedResults": [],
    "metadata": {}
}
```

An example of a row being added to the continuous query projection would look like this

```json {hl_lines=["2-7"]}
{
    "addedResults": [
        {
            "Id": 1,
            "Name": "Foo"
        }
    ],
    "deletedResults": [],
    "updatedResults": []
}
```

An example that row being updated would look like this

```json {hl_lines=["4-15"]}
{
    "addedResults": [],
    "deletedResults": [],
    "updatedResults": [
        {
            "before": {
                "Id": 1,
                "Name": "Foo"
            },
            "after": {
                "Id": 1,
                "Name": "Bar"
            }
        }
    ]
}
```

An example that row being deleted would look like this

```json {hl_lines=["3-8"]}
{
    "addedResults": [],
    "deletedResults": [
        {
            "Id": 1,
            "Name": "Bar"
        }
    ],
    "updatedResults": []
}
```

## Global Configuration

Any configuration that you need to pass to your reaction can be mounted as environment variables, by listing them under the `properties` field on the reaction config.  These values can be specified inline or referenced from Kuberenetes secrets or config maps.

For example, the following manifest will 
- Mount the environment variable of `Setting1` with a value of `Value1`
- Mount the environment variable of `Setting2` with the value stored in `my-key` from the secret called `my-secret`

```yaml {hl_lines=["9-16"]}
apiVersion: query.reactive-graph.io/v1
kind: Reaction
metadata:
  name: my-reaction
spec:
  reactionImage: my-reaction
  queries:
    - queryId: query1
  properties:
    - name: Setting1
      value: Value1
    - name: Setting2
      valueFrom:
        secretKeyRef:
          name: my-secret
          key: my-key
```

## Exposing Custom Endpoints

If your reaction has a port that needs to be exposed, you can specify them in the deployment manifest under `endpoints`, for example:

```yaml {hl_lines=["7-9"]}
apiVersion: query.reactive-graph.io/v1
kind: Reaction
metadata:
  name: my-reaction
spec:
  reactionImage: my-reaction
  endpoints:
    - name: gateway
      port: 8080
  queries:
    - queryId: query1
```

This will create a Kubernetes service called `my-reaction-gateway` that will resolve to port 8080 on your reaction container.

## Samples

TODO: How do we link to samples?


**INCORPORATE THIS**
 - A volume will be mounted at `/etc/queries` where each file will be the name of a query and the contents of each file will be custom metadata.
- All the key/value pairs from `properties` will be mounted as environment variables.  You can also reference secrets and config maps as you would normally do with environment variables.
- Any entries in `endpoints` will create a network service with the name `<reaction name>-<endpoint name>` and map to the container port specified in `port`
- The Dapr server within your reaction should listen on port 80, this can be overridden with `daprAppPort`
