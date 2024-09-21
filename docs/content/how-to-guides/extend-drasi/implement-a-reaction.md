---
type: "docs"
title: "Implement a Reaction"
linkTitle: "Implement a Reaction"
weight: 20
description: >
    Implementing a Custom Reaction
---

You can develop custom reactions by writing an application in any language that adheres to a certain specification and publish it as a docker image to the registry serving Drasi images to your cluster.

### Query Configuration

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

### Receiving Changes

When the projection of a continuous query is changed, a message will be published to a [Dapr topic](https://docs.dapr.io/developing-applications/building-blocks/pubsub/howto-publish-subscribe/#subscribe-to-topics). The pubsub name will be available on the `PUBSUB` environment variable (default is `rg-pubsub`). The topic name will be `<queryId>-results`, so for each queryId you discover in `/etc/queries`, you should subscribe to that Dapr topic.

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

    await daprServer.pubsub.subscribe(pubsubName, queryId + "-results", (events) => {
        //implement code that reacts to changes here
    });
}

await daprServer.start();
```

### Message Format

The format of the incoming messages is a Json array, with each item itself containing an array for `addedResults`, `deletedResults` and `updatedResults`.

The basic structure looks like this

```json
[
    {
        "addedResults": [],
        "deletedResults": [],
        "updatedResults": [],
        "metadata": {}
    }
]
```

An example of a row being added to the continuous query projection would look like this

```json {hl_lines=["3-8"]}
[
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
]
```

An example that row being updated would look like this

```json {hl_lines=["5-16"]}
[
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
]
```

An example that row being deleted would look like this

```json {hl_lines=["4-9"]}
[
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
]
```


## Registering a new reaction
To add support for a new kind of Reaction to Drasi, you must develop the services that will connect to the Reaction and register a new Reaction Provider with Drasi. The Reaction Provider definition describes the services Drasi must run, where to get the images, and the configuration settings that are required when an instance of that Reaction is created

The definition for a ReactionProvider has the following basic structure:

```yaml
apiVersion: v1
kind: ReactionProvider
name: <name>
tag: <tag>   # Optional.
spec:
  services:
    <reaction-name>: 
        image: <image_name> # Required. Cannot be overwritten.
        dapr: # Optional; used for specifying dapr-related annotations
            app-port: <value> # Optional
            app-protocol: <value> # Optional
        endpoints: # Optional; used for configuring internal/external endpoints
            <endpoint_name>:
                setting: internal/external
                target: <target>  # name of the config to use, which
                                  # should be defined under the 
                                  # `config_schema` section of the service
            (any additional endpoints)...
        config_schema: # Optional; used for specifying any additional environment variables
            type: object
            properties: 
                <name>:
                    type: <type>  # One of [string, integer, boolean, array or object]
                    default: <value> # Optional.
                (any additioanl properties)...
            required: # Optional. List any required properties here
  config_schema: # Optional; 
                 # The environment variables defined here will be 
                 # accessible by all services
    type: object
    properties: 
        <name>:
            type: <type>  # One of [string, integer, boolean, array or object]
            default: <value> # Optional.
        (any additioanl properties)...
    required: # Optional. List any required properties here
    
```
In the ReactionProvider definition:
- **apiVersion**: Must be **v1**
- **kind**: Must be **ReactionProvider**
- **name**: Specifies the kind of Reaction that we are trying to create
- **tag**: Optional. This is used for specifying the "version" of the ReactionProvider


The section below provides a more detailed walkthrough of the various fields under the `spec` section.
### Config Schema

The `config_schema` section that is at the top level is used for defining any enviroment variables that will be shared and accessible by all services. Similarly, this field can be defined in a similar way as how you would define the `config_schema` field for each service.

For example, the following section will specify two environment variables `foo` and `isTrue` for this Reaction. `foo` is a required environment variable and it expects the input to be of type `string`, whereas `isTrue` expects the input to be of type `boolean` and is not a required value (default value is set to `true`)

```yaml
spec:
   services:
     ...
   config_schema:
      type: object
      properties:
        foo:
          type: string
        isTrue:
          type: boolean
          default: true
      required:
        - foo
```


### Services

The `services` field configures the definition of the serivce(s) of a Reaction. At the moment, a service must be defined for any ReactionProvider. For each `service`, there are four fields that you can configure:
- `image`
  - `image` is a required field and you can specify the image to use for this Reaction service here. 
    - (NOTE: Drasi assumes that the image lives in the same registry that you used when you executed `drasi init`).
  - `endpoints`
    - If your Reaction has a port that needs to be exposed, you can specify them under the `endpoints` section. The `endpoints` section takes in a series of `endpoint`, which is a JSON object. Each `endpoint` object should have two properties: `setting` and `target`. `setting` can be either "internal" or "external", althrough we currently only support internal endpoints. The `target` field will reference the value of a config that is defined under the `config_schema` section of the service. You can provide a default value when defining the ReactionProvider and/or overwrite in the actual Reaction definition file.
    - Each endpoint will be rendered into a Kuberentes Service, with the value of `target` being set as the port number.
    - The following block defines a Reaction that will create a Kubernetes service called `<Reaction-name>-gateway` with a default port of `4318` when deployed.
      - ```yaml 
          endpoints:
            gateway:
              setting: internal
              target: gateway-port
          config_schema:
            type: object
            gateway-port:
              type: number
              default: 4318
  - `dapr`: optional. This field is used for specifying any [dapr annotation](https://docs.dapr.io/reference/arguments-annotations-overview/) that the user wishes to include. Currently we only support `app-port` and `app-protocol`. 
    - The `app-port` annotation is used to tell Dapr which port the application is listening on, whereas the `app-protocol` annotation configures the protocol that Dapr uses to communicate with your app
      - Sample yaml block:
      - ```yaml 
          dapr:
            app-port: 4002
  - `config_schema`
    - This is used for defining environment variables; however, the environment variables that are defined here are only accessible for this particular service.
    - The configurations are defined by following JSON Schema. We define this field to be of type `object`, and list all of the configs (environment variables) under the `properties` section. For each of the property, you need to specify its type and an optional default value. For any required environment variables, you can list them under the `require` section as an array of elements
    - Sample:
     ```yaml
        config_schema:
          type: object
          properties:
            foo:
              type: string
              default: bar
            property2:
              type: boolean
              default: true
          required:
            - foo


### Validating the ReactionProvider file
To validate a ReactionProvider yaml file, there are two approaches:
1. Using `apply` command from the Drasi CLI. The CLI will automatically validate the ReactionProvider before registering it. 
2. Using the [Drasi VSCode Extension](/solution-developer/vscode-extension/). The extension will detect all of the ReactionProvider yaml files in the current workspace. Click on the `Validate` button next to each instance to validate a specific ReactionProvider definition.

### Sample ReactionProvider and Reaction file
This section contains a sample Reactionprovider file and Reaction file for the `Debug` reaction. 
The `Debug` reaction:
- Only needs one service with the name `debug`.
- Uses the `reaction-debug` image
- Needs to have an internal (k8s) endpoint at port "8080"
- `tag` should be `v1`

ReactionProvider file:
```yaml
apiVersion: v1
kind: ReactionProvider
name: Debug
spec:
  queries:
    type: objects
  services:
    debug:
      image: reaction-debug
      endpoints:
        gateway:
          setting: internal
          target: port
      config_schema:
        type: object
        properties:
          port:
            type: number
            default: 8080
```

The ReactionProvider can be applied using the Drasi CLI: 
```
drasi apply -f <name-of-the-provider-file>.yaml
```


Reaction file:
```yaml
apiVersion: v1
kind: Reaction
name: hello-world-debug
spec:
  kind: Debug:v1
  queries:
    hello-world-from:
    message-count: 
    inactive-people: 
```
Similarly, this Reaction file can also be applied using the CLI:
```
drasi apply -f <name-of-the-reaction-file>.yaml
```