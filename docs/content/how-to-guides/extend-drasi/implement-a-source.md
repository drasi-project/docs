---
type: "docs"
title: "Implement a Source"
linkTitle: "Implement a Source"
weight: 10
description: >
    Implementing a Custom Source
---

{{< figure src="source.jpg" alt="Source" width="65%" >}}
### Source proxy
-	The Source proxy is responsible for bootstrapping the initial data when a continuous query is deployed. 
-	For any source proxy, we need to set up an HTTP server that listens for a POST request on the route ‘/acquire’. The bootstrap logic will be implemented under this section. As a result, when a POST request is received, the initial data will be obtained based on the logic here. 
    - For example, the SQL proxy uses knex to query and retrieve all of the rows in a SQL table and use the data as the bootstrapping data.
    - It is also worth noting that the passthru proxy might be useful in certain situations. The passthru proxy handles the bootstrapping process by using dapr to invoke a HTTP Post method called “acquire”, which is defined in the Source reactivator.

Sample code block:
```js
require("dotenv").config();

const fs = require('fs');
const dapr =  require("@dapr/dapr");

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const port = parseInt(process.env["PORT"] ?? "4002");
const sourceId = process.env["SOURCE_ID"];
const daprClient = new dapr.DaprClient();

async function main() {
  const app = express();
  app.use(cors());
  app.use(bodyParser.urlencoded( { extended: false }));
  app.use(bodyParser.json());

  app.post('/acquire', async (req, res, next) => {
    try {
      // Implement the bootstrap logic here

      res.status(200).json(result);   // Send the retrieved result as the response body
    } catch (err) {
      next(err);
    }
  });

  app.listen(port, () => console.log(`sourceProxy.main - Reactive Graph Source Node Proxy listening on port:${port}`));
}
```

### Source reactivator
-	The Source Reactivator is responsible for tracking and propagating any changes in the data to the subsequent Source component, the change service. You will implement the logic for tracking the changes in your source System in this component.
- The Source reactivator and the Source change service uses the [pub/sub](https://docs.dapr.io/developing-applications/building-blocks/pubsub/pubsub-overview/) feature from Dapr to transmit the events. The reactivator acts as the publisher while the change service acts as the subscriber. The pubsub name will be available on the ‘PUBSUB’ environment variable (default is ‘rg-pubsub’) and the topic name will be ‘<queryId>-change’.

#### Formatting a change event:
The code blocks below showcase how the change event should be formatted depending on the operation. For any change event, three fields are required in the json block: `op`, `payload` and `ts_ms`. 

Insert operation:
```json
{
  "op": "i",
  "payload": {
    "after": {
      "id": <id>,
      "labels": [<labels>],
      "properties": {} // Any additional data of the change event
    },
    "before": {}, // empty
    "source": {
      "db": "", 
      "lsn": "",
      "table": "", // Oneof `node` or `relation`. Use `relation` if we are working with a relational Source event
      "ts_ms": "",
      "ts_sec": ""
    }
  },
  "ts_ms": <Current time in milliseconds>
}
```
Delete Operation:
```json
{
  "op": "d",
  "payload": {
    "after": {}, // Empty
    "before": {
      "id": <id>,
      "labels": [<labels>],
      "properties": {}
    },
    "source": {
      "db": "",
      "lsn": "",
      "table": "", // Oneof `node` or `relation`
      "ts_ms": "",
      "ts_sec": ""
    }
  },
  "ts_ms": <Current time in milliseconds>
}
```

Update Operation:
```json
{
  "op": "u",
  "payload": {
    "after": {
      "id": <id>,
      "labels": [<labels>],
      "properties": {} // different across sources
    },
    "before": {
      "id": <id>,
      "labels": [<labels>],
      "properties": {
      }
    }, 
    "source": {
      "db": "", 
      "lsn": "",
      "table": "", // Oneof `node` or `relation`
      "ts_ms": "",
      "ts_sec": ""
    }
  },
  "ts_ms": <Current time in milliseconds>
}
```

#### pub/sub sample code
Sample Dapr publisher code:
```java
import com.fasterxml.jackson.databind.JsonNode;
import io.dapr.client.DaprClient;
import io.dapr.client.DaprClientBuilder;

import java.util.List;

public class DaprChangePublisher implements ChangePublisher {
    private DaprClient client;
    private String pubsubName;
    private String sourceId;

    public DaprChangePublisher(String sourceId, String pubsubName) {
        this.sourceId = sourceId;
        this.pubsubName = pubsubName;
        client = new DaprClientBuilder().build();
    }

    @Override
    public void Publish(List<JsonNode> changes) {
        client.publishEvent(pubsubName, sourceId + "-change", changes).block();
    }

    @Override
    public void close() throws Exception {
        client.close();
    }
}
```



## Registering a new Source

To add support for a new kind of source to Drasi, you must develop the services that will connect to the source and register a new Source Provider with Drasi. The Source Provider definition describes the services Drasi must run, where to get the images, and the configuration settings that are required when an instance of that Source is created

The definition for a SourceProvider has the following basic structure:

```yaml
apiVersion: v1
kind: SourceProvider
name: <name>
tag: <tag>   # Optional.
spec:
  services:
    proxy: # One of the required services.
        image: <image_name> # Required. Cannot be overwritten.
        dapr: # Optional; used for specifying dapr-related annotations
            app-port: <value> # Optional
            app-protocol: <value> # Optional
        endpoints: # Optional; used for configuring internal/external endpoints
            <endpoint_name>:
                setting: internal/external
                target: <target>  # endpoint target
            (any additional endpoints)...
        config_schema: # Optional; used for specifying any additional environment variables
            type: object
            properties: 
                <name>:
                    type: <type>  # One of [string, integer, boolean, array or object]
                    default: <value> # Optional.
                (any additioanl properties)...
            required: # Optional. List any required properties here
    reactivator: # One of the required services.
        image: <image_name> # Required. Cannot be overwritten.
        dapr: # Optional; used for specifying dapr-related annotations
            app-port: <value> # Optional
            app-protocol: <value> # Optional
        endpoints: # Optional; used for configuring internal/external endpoints
            <endpoint_name>:
                setting: internal/external
                target: <target>  # endpoint target
            (any additional endpoints)...
        config_schema: # Optional; used for specifying any additional environment variables
            type: object
            properties: 
                <name>:
                    type: <type>  # One of [string, integer, boolean, array or object]
                    default: <value> # Optional.
                (any additioanl properties)...
            required: # Optional. List any required properties here
    (any additional services)...
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

In the SourceProvider definition:
- **apiVersion**: Must be **v1**
- **kind**: Must be **SourceProvider**
- **name**: Specifies the kind of Source that we are trying to register
- **tag**: Optional. This is used for specifying the "version" of the SourceProvider


The section below provides a more detailed walkthrough of the various fields under the `spec` section.

### Services

The `services` field configures the definition of the serivce(s) of a Source. For any SourceProvider, you must define two required services: `proxy` and `reactivator`, and you can choose to define additional services if needed. Every service will be rendered into an unique Kubernetes deployment and ultimately a Kubernetes pod. For each `service`, there are four fields that you can configure:
- `image`
  - `image` is a required field and you can specify the image to use for this source service here. 
    - (NOTE: Drasi assumes that the image lives in the same registry that you used when you executed `drasi init`).
  - `endpoints`
    - If your source has a port that needs to be exposed, you can specify them under the `endpoints` section. The `endpoints` section takes in a series of `endpoint`, which is a JSON object. Each `endpoint` object should have two properties: `setting` and `target`. `setting` can be either "internal" or "external", althrough we currently only support internal endpoints. For the `target` attribute, if the setting is set to `internal`, the `target` should be a port number.
    - Each endpoint will be rendered into a Kuberentes Service, with the value of `target` being set as the port number.
    - The following block defines a Source that will create a Kubernetes service called `<source-name>-gateway` with a port of `4318` when deployed.
      - ```yaml 
          endpoints:
            gateway:
              setting: internal
              target: "4318" 
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


### Config Schema

The `config_schema` section that is at the same level as the `services` section is used for defining any enviroment variables that will be shared and accessible by all services. Similarly, this field can be defined in a similar way as how you would define the `config_schema` field for each service.

For example, the following section will specify two environment variables `foo` and `isTrue` for this source. `foo` is a required environment variable and it expects the input to be of type `string`, whereas `isTrue` expects the input to be of type `boolean` and is not a required value (default value is set to `true`)

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





### Validating the SourceProvider file
To validate a SourceProvider yaml file, there are two approaches:
1. Using `apply` command from the Drasi CLI. The CLI will automatically validate the SourceProvider before registering it. 
2. Using the [Drasi VSCode Extension](/solution-developer/vscode-extension/). The extension will detect all of the SourceProvider yaml files in the current workspace. Click on the `Validate` button next to each instance to validate a specific SourceProvider definition.

### Sample SourceProvider and Source file
This section contains a sample SourceProvider file and a Source file for the `Postgres` source.
The `Postgres` source:
- Contains two services: `proxy` and `reactivator`
  - `proxy` uses the image `source-sql-proxy`, and its dapr app-port should be set to `4002`.
  - `reactivator` uses the image `source-debezium-reactivator`. It has an additional environment variable with the name of `client` and a default value of `pg`.
- Has five required environment variables: database, host, port, password, user
SourceProvider file:
```yaml
apiVersion: v1
kind: SourceProvider
name: PostgreSQL
spec: 
  services:
    proxy:
      image: source-sql-proxy
      dapr:
        app-port: "4002"
    reactivator: 
      image: source-debezium-reactivator
      config_schema:
        type: object
        properties:
          client:
            type: string
            default: pg
      endpoints:
        gateway:
          setting: internal
          target: "8080"
  config_schema:
    type: object
    properties:
      database:
        type: string
      host:
        type: string
      password:
        type: string
      port:
        type: number
      ssl:
        type: boolean
        default: false
      user:
        type: string
      tables:
        type: array
    required:
      - database
      - host
      - port
      - password
      - user
      - tables
```
To register a SourceProvider file, use the `apply` command from the Drasi `CLI`: 
```bash
drasi apply -f <name-of-source-provider-file>.yaml
```

You can list all of the registered types of Source using the following command:
```bash
drasi list sourceprovider
```


To deploy a `PostgreSQL` source, we simply need to create a Source file that supplies all of the required values. In this case, we need to supply a value for all of the environment variables that are marked as required. Below is a sample Source file for deploying a `PostgreSQL` source (Notice that since we are not overwritting any service configurations, we can simply omit the `services` field in this file):
```yaml
apiVersion: v1
kind: Source
name: hello-world
spec:
  kind: PostgreSQL
  properties:
    host: postgres
    user: test
    port: 5432
    ssl: false
    password: test
    database: hello-world
    tables:
      - public.Message
```
Similarly, this source file can also be registered using the CLI:
```
drasi apply -f <name-of-the-source-file>.yaml
```