---
type: "docs"
title: "Configure a Drasi Result Reaction"
linkTitle: "Configure a Drasi Result Reaction"
weight: 60
description: >
    Learn how to configure a Drasi Result Reaction
---

The Drasi Result Reaction is primarily designed for programmatic access to the result set of a Continuous Query by providing an endpoint accessible via HTTP GET requests. Users can use this reaction to either retrieve the current result set, or to view the result set of a query at a specific timestamp.

## Requirements
On the computer from where you will create the Drasi Debug Reaction, you need to install the following software:
- [Drasi CLI](/reference/command-line-interface/) 
- [Kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl)

**Optional**: For debugging scenarios, you can use tools such as [curl](https://curl.se/) or [Postman](https://www.postman.com/) to create HTTP GET requests. The examples below use `curl`.

## Creating the Reaction
To create a Reaction, execute the `drasi apply` command as follows:

```text
drasi apply -f my-reaction.yaml
```

The `drasi apply` command is how you create all new Drasi resources (in this case a Reaction). The `-f` flag specifies that the definition of the new Reaction is contained in the referenced YAML file `my-reaction.yaml`. The Reaction will be created in the current namespace to which Drasi is set. If you wish to apply the Reaction to a different namespace, you can specify it using the `-n` flag.

## Reaction Definitions
The YAML file passed to `drasi apply` can contain one or more Reaction definitions. Here is an example of a Drasi Debug Reaction definition:

```yaml {#quick-result-reaction}
kind: Reaction
apiVersion: v1
name: quick-result-reaction
spec:
  kind: Result
  queries:
    query1:
  properties:
    QueryContainerId: default
```

In this definition: 
- the **apiVersion** must be **v1**.
- the **kind** property tells Drasi to create a **Reaction** resource.
- the **spec.kind** property tells Drasi the kind of Reaction to create, in this case a **Result** Reaction. 
- the **name** property tells Drasi the identity of the Reaction and must be unique within the scope of Reactions within the target Drasi environment. In the above example, the **name** of the Reaction is **quick-result-reaction**.

This table describes the other settings in the **spec** section of the Reaction definition:
|Property|Description|
|-|-|
|queries|Specifies the set of **names** of the Continuous Queries the Reaction will subscribe to.|
|properties.QueryContainerId|Specifies the ID of the Query Container where the Continuous Query resides. If this field is not set, the ID `default` will be used, which is the default Query Container ID created during `drasi init`.|

By default, the Drasi Result Reaction will expose its Web UI on port 8080. If you wish to create an ingress for the Result Reaction, please refer to the [Ingress documentation](/reference/ingress/) for more information.

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
        ID              | AVAILABLE
------------------------+------------
  quick-result-reaction | true
```

If an error has occurred during the creation or operation of a Reaction, the `AVAILABLE` column will contain the error text instead of `true` or `false`.

For more details about the Reaction you can use the [drasi describe](/reference/command-line-interface#drasi-describe) command:

```text
drasi describe reaction quick-result-reaction
```

This will return the full definition used to create the Reaction along with more detailed status information.


## Using the Result Reaction

### Port-forwarding the Result Reaction

The only way to retrieve the result set from the Result Reaction is through sending HTTP GET requests to the endpoints. For development and testing purposes, since the Result Reaction lives in a Kubernetes pod, it needs to be exposed using Kubernetes port-forwarding. This allows you to send HTTP GET requests to the Result Reaction endpoint from your local machine or from another application. Use the following command to set up port-forwarding for the Result Reaction deployed in the previous steps:

```bash
drasi tunnel reaction quick-result-reaction 8080
```

You can now access the service locally at `http://localhost:8080` and you can send GET requests to retrieve the result set of a particular query.

Alternatively, you can create a Kubernetes Ingress to expose the service externally. This allows you to define a hostname and path for external access without relying on port forwarding.

### Retrieving the current result set
This endpoint will return the current result set as well as its metadata, which contains information such as the sequence number and the timestamp. 

#### HTTP Request
```bash
GET http://localhost:<servicePort>/<queryId>
```

#### URL Parameters

|Parameter|Description|
|-|-|
|servicePort|The port on your local machine that was forwarded earlier|
|queryId|The id of the Continuous Query you are interested in|

#### Returned Output
The output from this GET Request will be an array of JSON elements. The first element will contain the header information, and the remaining elements will be JSON objects with a "data" key.
```json
[{"header":{"sequence":<sequence-num>,"timestamp":<timestamp>,"state":"running"}},{"data":{"foo":"bar"}},...]
```

#### Examples
The examples below showcase how to retrieve the current result set for a Continuous Query with the id of `query1`.

{{< tabpane >}}
{{< tab header="bash(curl)" lang="bash" >}}
curl -X GET "localhost:8080/query1"
{{< /tab >}}

{{< tab header="JavaScript" lang="JavaScript" >}}
fetch("http://localhost:8080/query1", {
  method: "GET"
})
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json(); 
  })
  .then(data => {
    // Output the data
    console.log(data);

    // Retrieve the header information
    const headerObject = data.find(item => item.header);

    const header = headerObject ? headerObject.header : null;

    console.log(header);
  })
  .catch(error => {
    console.error("Error:", error);
  });

{{< /tab >}}
{{< /tabpane >}}

### Retrieving the data from the current result set
If you wish to retrieve only the data content of the result set, you can append `/data` to the end of your endpoint. 

#### HTTP Request
```bash
GET http://localhost:<servicePort>/<queryId>/data
```

#### URL Parameters

|Parameter|Description|
|-|-|
|servicePort|The port on your local machine that was forwarded earlier|
|queryId|The id of the Continuous Query you are interested in|

#### Returned Output
The output from this GET Request will be an array of JSON elements.
```bash
[{"foo":"bar"},...]
``` 

#### Examples
The examples below showcase how to retrieve the data of the current result set for a Continuous Query with the id of `query1`.

{{< tabpane >}}
{{< tab header="bash(curl)" lang="bash" >}}
curl -X GET "localhost:8080/query1/data"
{{< /tab >}}

{{< tab header="JavaScript" lang="JavaScript" >}}
fetch("http://localhost:8080/query1/data", {
  method: "GET"
})
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json(); 
  })
  .then(data => {
    // Output the data
    console.log(data);

    // Retrieve the header information
    const headerObject = data.find(item => item.header);

    const header = headerObject ? headerObject.header : null;

    console.log(header);
  })
  .catch(error => {
    console.error("Error:", error);
  });

{{< /tab >}}
{{< /tabpane >}}
       

### Retrieving the result set at a particular timestamp
**NOTE:** This feature requires the `view` field of the Continuous Query to be set to `true`, and the `view/retentionPolicy` field to be set to `all` or `expire`. For more information, please navigate to this [link](/concepts/continuous-queries/#configuration).

You can also use the Result Reaction to retrieve the result set for a specific timestamp, provided in milliseconds since the epoch.


#### HTTP Request
```bash
GET http://localhost:<servicePort>/<queryId>/<timestamp>
```

#### URL Parameters

|Parameter|Description|
|-|-|
|servicePort|The port on your local machine that was forwarded earlier|
|queryId|The id of the Continuous Query you are interested in|
|timestamp|The timestamp to retrieve the result set from. The timestamp should be provided in milliseconds since the Unix epoch.|

#### Returned Output
The output from this GET Request will be an array of JSON elements. The first element will contain the header information, and the remaining elements will be JSON objects with a "data" key.
```json
[{"header":{"sequence":<sequence-num>,"timestamp":<timestamp>,"state":"running"}},{"data":{"foo":"bar"}},...]
```

#### Examples
The examples below showcase how to retrieve the result set at timestamp `123456789` for a Continuous Query with the id of `query1`.

{{< tabpane >}}
{{< tab header="bash(curl)" lang="bash" >}}
curl -X GET "localhost:8080/query1/123456789"
{{< /tab >}}

{{< tab header="JavaScript" lang="JavaScript" >}}
fetch("http://localhost:8080/query1/123456789", {
  method: "GET"
})
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json(); 
  })
  .then(data => {
    // Output the data
    console.log(data);

    // Retrieve the header information
    const headerObject = data.find(item => item.header);

    const header = headerObject ? headerObject.header : null;

    console.log(header);
  })
  .catch(error => {
    console.error("Error:", error);
  });

{{< /tab >}}
{{< /tabpane >}}


### Retrieving the data of the result set at a particular timestamp
**NOTE:** This feature requires the `view` field of the Continuous Query to be set to `true`, and the `view/retentionPolicy` field to be set to `all` or `expire`. For more information, please navigate to this [link](/concepts/continuous-queries/#configuration).

You can also use the Result Reaction to retrieve the data of the result set for a specific timestamp, provided in milliseconds since the epoch.


#### HTTP Request
```bash
GET http://localhost:<servicePort>/<queryId>/<timestamp>/data
```

#### URL Parameters

|Parameter|Description|
|-|-|
|servicePort|The port on your local machine that was forwarded earlier|
|queryId|The id of the Continuous Query you are interested in|
|timestamp| The timestamp to retrieve the result set from. The timestamp should be provided in milliseconds since the Unix epoch|


#### Returned Output
The output from this GET Request will be an array of JSON elements.
```bash
[{"foo":"bar"},...]
``` 

#### Examples
The examples below showcase how to retrieve the data of the result set at timestamp `123456789` for a Continuous Query with the id of `query1`.

{{< tabpane >}}
{{< tab header="bash(curl)" lang="bash" >}}
curl -X GET "localhost:8080/query1/123456789/data"
{{< /tab >}}

{{< tab header="JavaScript" lang="JavaScript" >}}
fetch("http://localhost:8080/query1/123456789/data", {
  method: "GET"
})
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json(); 
  })
  .then(data => {
    // Output the data
    console.log(data);

    // Retrieve the header information
    const headerObject = data.find(item => item.header);

    const header = headerObject ? headerObject.header : null;

    console.log(header);
  })
  .catch(error => {
    console.error("Error:", error);
  });

{{< /tab >}}
{{< /tabpane >}}

## Modifying the Reaction
If you want to modify an existing reaction, you can use the `drasi apply` command to apply the updated YAML file. Ensure that the name of the reaction remains consistent.

## Deleting the Reaction
To delete a Reaction you use the `drasi delete` command. There are two ways to do this. 

Firstly, you can specify the type of resource (Reaction) and its name, for example:

```text
drasi delete reaction quick-result-reaction
```

Secondly, you can refer to the YAML file(s) that contain the definitions used to create the Reaction(s):

```text
drasi delete -f my-reaction.yaml <file2.yaml> <file3.yaml> <...>
```

This is a convenience, especially if a single YAML file contains multiple Reaction definitions. 

If the Reaction is not in the default Drasi namespace, you should specific the target namespace using the `-n` flag as usual:

```text
drasi delete -f my-reaction.yaml -n drasi-namespace
```