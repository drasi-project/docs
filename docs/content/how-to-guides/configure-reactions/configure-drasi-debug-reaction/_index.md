---
type: "docs"
title: "Configure a Drasi Debug Reaction"
linkTitle: "Configure a Drasi Debug Reaction"
weight: 50
description: >
    Learn how to configure a Drasi Debug Reaction
---

The Drasi Debug Reaction provides a simple Web-based UI that lets you see the current result of a Continuous Query as a table, and to see the Continuous Query results updating dynamically when changes to the Source data cause the Continuous Query result to change. The Drasi Debug Reaction is intended for use as a development and testing tool for people writing and testing Continuous Queries, not as a way to integrate with Continuous Queries in a production environment.

## Requirements
On the computer from where you will create the Drasi Debug Reaction, you need to install the following software:
- [Drasi CLI](/reference/command-line-interface/) 
- [Kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl)

## Creating the Reaction
To create a Reaction, execute the `drasi apply` command as follows:

```text
drasi apply -f my-reaction.yaml -n drasi-namespace
```

The `drasi apply` command is how you create all new Drasi resources (in this case a Reaction). The `-f` flag specifies that the definition of the new Reaction is contained in the referenced YAML file `my-reaction.yaml` and the `-n` flag specifies the Drasi namespace in which to create the Reaction (Drasi must already be installed in that namespace).

## Reaction Definitions
The YAML file passed to `drasi apply` can contain one or more Reaction definitions. Here is an example of a Drasi Debug Reaction definition:

```yaml {#hello-world-debug-reaction}
apiVersion: v1
kind: Reaction
name: hello-world-debug
spec:
  kind: Debug
  queries:
    hello-world-from:
    message-count:
    inactive-people:
  endpoints:
    gateway: 8080    
```

In this definition: 
- the **apiVersion** must be **v1**.
- the **kind** property tells Drasi to create a **Reaction** resource.
- the **spec.kind** property tells Drasi the kind of Reaction to create, in this case a **Debug** Reaction. 
- the **name** property tells Drasi the identity of the Reaction and must be unique within the scope of Reactions within the target Drasi environment. In the above example, the **name** of the Reaction is **hello-world-debug**.

This table describes the other settings in the **spec** section of the Reaction definition:
|Property|Description|
|-|-|
|queries|Specifies the set of **names** of the Continuous Queries the Reaction will subscribe to.|
|endpoints.gateway|Specifies the **port** on which the Drasi Debug Reaction will expose its Web UI. If not specified, this defaults to 8080. |

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
        ID          | AVAILABLE
--------------------+------------
  hello-world-debug | true
```

If an error has occurred during the creation or operation of a Reaction, the `AVAILABLE` column will contain the error text instead of `true` or `false`.

For more details about the Reaction you can use the [drasi describe](/reference/command-line-interface#drasi-describe) command:

```text
drasi describe reaction hello-world-debug
```

This will return the full definition used to create the Reaction along with more detailed status information.

## Viewing the Debug Reaction UI
Because the Drasi Debug Reaction is running inside a Kubernetes cluster, you need to enable access to the port through which you can view its Web UI. The easiest way to do this is to setup a port forward using `kubectl` and the following command:

```kubectl
kubectl port-forward -n drasi-namespace services/hello-world-debug-gateway 8080:8080
```

The `-n` flag specifies the Kubernetes namespace containing the Drasi environment where you installed the Reaction. The name used to reference the Reaction has the structure`services/<reaction_name>-gateway`.

This will make the Drasi Debug Reaction UI available through port 8080 on the computer where you ran the port forward command. Assuming this is your local computer, you can open the Drasi Debug UI by browsing to the address [http://localhost:8080](http://localhost:8080), where you will see the Debug Reaction UI shown here:

{{< figure src="debug-reaction-ui.png" alt="Debug Reaction UI" width="70%" >}}

On the left hand side is a menu listing the three Continuous Queries contained in the Reaction definition. Select one of the Continuous Queries in this list and the right hand pane will show the current results of the selected Continuous Query. 

{{< figure src="hello-world-from-debug.png" alt="Hello World From" width="70%" >}}

If changes occur to the result of the selected Continuous Query while you are viewing it in the Drasi Debug Reaction, you will see the table content update dynamically.

At the top of the left sidebar, you can view the raw event stream received by the Reaction by clicking on the `Event Stream` button. The results are displayed in `packed` format.

{{< figure src="event-stream.png" alt="Event Stream Page" width="70%" >}}

## Modifying the Reaction
Currently, Drasi does not support the modification of existing Reactions. You must [Delete the Reaction](#deleting-the-reaction), make changes to the Reaction definition file, and [Create the Reaction](#creating-the-reaction) again.

## Deleting the Reaction
To delete a Reaction you use the `drasi delete` command. There are two ways to do this. 

Firstly, you can specify the type of resource (Reaction) and its name, for example:

```text
drasi delete reaction hello-world-debug
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