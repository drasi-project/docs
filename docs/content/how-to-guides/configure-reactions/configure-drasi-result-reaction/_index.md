---
type: "docs"
title: "Configure a Drasi Result Reaction"
linkTitle: "Configure a Drasi Result Reaction"
weight: 60
description: >
    Learn how to configure a Drasi Result Reaction
---

The Drasi Result Reaction allows users to retrieve the current result set, or the result set at a specified timestamp, for a particular Continuous Query. This reaction provides an endpoint accessible via HTTP GET requests.

## Requirements
On the computer from where you will create the Drasi Debug Reaction, you need to install the following software:
- [Drasi CLI](/reference/command-line-interface/) 
- [Kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl)

You should also be proficient in creating HTTP requests using tools such as [curl](https://curl.se/) or [Postman](https://www.postman.com/).

## Creating the Reaction
To create a Reaction, execute the `drasi apply` command as follows:

```text
drasi apply -f my-reaction.yaml -n drasi-namespace
```

The `drasi apply` command is how you create all new Drasi resources (in this case a Reaction). The `-f` flag specifies that the definition of the new Reaction is contained in the referenced YAML file `my-reaction.yaml` and the `-n` flag specifies the Drasi namespace in which to create the Reaction (Drasi must already be installed in that namespace).

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
  endpoints:
    gateway: 8080  
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
|endpoints.gateway|Specifies the **port** on which the Drasi Result Reaction operates. If not specified, this defaults to 8080. |

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
Because the Result Reaction is running inside a Kubernetes cluster, you need to enable access to the port through which you can send HTTP requests. For development purposes, the easiest way to do this is to setup a port forward using `kubectl` and the following command:

```bash
kubectl port-forward -n <drasi-namespace> services/quick-result-reaction-gateway 8080:8080
```

The `-n` flag specifies the Kubernetes namespace containing the Drasi environment where you installed the Reaction. The name used to reference the Reaction has the structure`services/<reaction_name>-gateway`.

This will make the Drasi Debug Reaction UI available through port 8080 on the computer where you ran the port-forward command. You can now send GET requests to `localhost:8080` to retrieve the result set of a particular query. The examples below use `curl` and showcase various ways of using the Result Reaction

#### Retrieving the current result set
The following command will retrieve the current result set for a ContinuousQuery with the name `query1`
```bash
curl -X GET "localhost:8080/query1"
```

#### Retrieving the result set at a particular timestamp
**NOTE:** This feature requires the `view` field of the Continuous Query to be set to `true`, and the `view/retentionPolicy` field to be set to `all` or `expire`. For more information, please navigate to this [link](/concepts/continuous-queries/#configuration).

The following command will retrieve the result set for a ContinuousQuery with the name `query1` at timestamp `123456789`.

```bash
curl -X GET "localhost:8080/query1/123456789"
```

## Modifying the Reaction
Currently, Drasi does not support the modification of existing Reactions. You must [Delete the Reaction](#deleting-the-reaction), make changes to the Reaction definition file, and [Create the Reaction](#creating-the-reaction) again.

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