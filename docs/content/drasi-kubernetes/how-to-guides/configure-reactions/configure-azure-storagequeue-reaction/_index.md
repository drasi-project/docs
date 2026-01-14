---
type: "docs"
title: "Configure an Azure Storage Queue Reaction"
linkTitle: "Configure an Azure Storage Queue Reaction"
weight: 20
description: >
    Learn how to configure an Azure Storage Queue Reaction
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

The Azure Storage Queue {{< term "Reaction" >}} enqueues messages on [Azure Storage Queues](https://learn.microsoft.com/en-us/azure/storage/queues/storage-queues-introduction) in response to changes to the {{< term "Result Set" "result set" >}} of a Drasi {{< term "Continuous Query" >}}.  The output format can either be the packed format of the raw query output or an unpacked format, where a single message represents one change to the result set.

## Requirements
On the computer from where you will create the Reaction, you need the following software:
- [Drasi CLI](/reference/command-line-interface/) 
- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/) (If using Azure Managed Identities)


## Creating the Reaction
To create a Reaction, execute the `drasi apply` command as follows:

```text
drasi apply -f my-reaction.yaml
```

The `drasi apply` command is how you create all new Drasi resources (in this case a Reaction). The `-f` flag specifies that the definition of the new Reaction is contained in the referenced YAML file `my-reaction.yaml`.

## Reaction Definitions
The YAML file passed to `drasi apply` can contain one or more Reaction definitions. Here is an example of a Storage Queue Reaction definition:

```yaml
kind: Reaction
apiVersion: v1
name: my-reaction
spec:
  kind: StorageQueue
  queries:
    query1:
    query2:  
  properties:    
    queueName: <Name of Queue>
    format: <packed | unpacked>
  identity:
    kind: ConnectionString
    connectionString: <Connection String of Azure Storage Account>  
```

In this definition: 
- the **apiVersion** must be **v1**.
- the **kind** property tells Drasi to create a **Reaction** resource.
- the **spec.kind** property tells Drasi the kind of Reaction to create, in this case a **StorageQueue** Reaction. 
- the **name** property tells Drasi the identity of the Reaction and must be unique within the scope of Reactions within the target Drasi environment. In the above example, the **name** of the Reaction is **my-reaction**.

This table describes the other settings in the **spec** section of the Reaction definition:
|Property|Description|
|-|-|
| queries | Specifies the set of **names** of the Continuous Queries the Reaction will subscribe to. |
| properties.endpoint | Endpoint of the Storage Account queue service, in the form https://{account-name}.queue.core.windows.net, if not using a connection string. |
| properties.queueName | Name of Queue. It should already exist on your storage account. |
| properties.format | The output format for the messages that are enqueued. The can either be **packed** for the raw query output or **unpacked** for a message per result set change. The default value is **packed** |
| identity | The service identity provider used for authentication to the Azure Storage Queue service, discussed below. |


### Identity

The reaction supports the following service identities:

#### Microsoft Entra Workload ID

Microsoft Entra Workload Identity enables your reaction to authenticate to Azure without the need to store sensitive credentials. It works by creating a federated identity between a [managed identity](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview) and the service account the reaction is running against.

| Property | Description |
|-|-|
| kind | MicrosoftEntraWorkloadID |
| clientId | The Client ID of the user managed identity.|

##### Example
```yaml
kind: Reaction
apiVersion: v1
name: my-reaction
spec:
  kind: StorageQueue
  identity:
    kind: MicrosoftEntraWorkloadID
    clientId: <Client ID of Managed Identity>
  properties:
    endpoint: https://{account-name}.queue.core.windows.net
    queueName: <Name of Queue>
    format: <packed | unpacked>
  queries:
    query1:
    query2:
```

##### AKS Setup

1. On the Azure portal, navigate to the `Security configuration` pane of your AKS cluster.
1. Ensure `Enable Workload Identity` is enabled.
1. Take note of the `Issuer URL` under OIDC.
1. Create or use an existing `User Assigned Managed Identity`.
1. Take note of the `Client ID` an the `Overview` pane of the Managed Identity.
1. Grant the `Storage Queue Data Contributor` role to the managed identity in the `Access Control (IAM)` pane of the storage account.
1. Create a federated credential between the managed identity and the reaction.
    ```bash
    az identity federated-credential create \
        --name <Give the federated credential a unique name> \
        --identity-name "<Name of the User Assigned Managed Identity>" \
        --resource-group "<Your Resource Group>" \
        --issuer "<The Issuer URL from your AKS cluster OIDC configuration>" \
        --subject system:serviceaccount:"drasi-system":"reaction.<Name of your Reaction>" \
        --audience api://AzureADTokenExchange
    ```


##### Related links
* [What are managed identities for Azure resources](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview)
* [What are workload identities](https://learn.microsoft.com/en-us/entra/workload-id/workload-identities-overview)
* [Azure AD Workload Identity Docs](https://azure.github.io/azure-workload-identity/docs/introduction.html)
* [Deploy and configure workload identity on an Azure Kubernetes Service (AKS) cluster](https://learn.microsoft.com/en-us/azure/aks/workload-identity-deploy-cluster)
* [Use Microsoft Entra Workload ID with Azure Kubernetes Service (AKS)](https://learn.microsoft.com/en-us/azure/aks/workload-identity-overview)


#### Connection String

An Azure Storage Account connection string.

| Property | Description |
|-|-|
| kind | ConnectionString |
| connectionString | Connection String of Azure Storage Account. Can either be inline or a reference to a secret. |

##### Example

```yaml
kind: Reaction
apiVersion: v1
name: my-reaction
spec:
  kind: StorageQueue
  queries:
    query1:
    query2:  
  properties:    
    queueName: queue1
    format: unpacked
  identity:
    kind: ConnectionString
    connectionString: DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...
```

##### Related links
* [Configure Azure Storage connection strings](https://learn.microsoft.com/en-us/azure/storage/common/storage-configure-connection-string)


#### Secret Configuration
It is best practice to store private credentials in a secret, which can be created using `kubectl`. The example below creates a Secret with the name `storage-creds`, containing one key called `connectionString` in the `drasi-system` namespace.  Secrets must be in the same Kubernetes namespace as your Drasi installation in order to be referenced.

```bash
kubectl create secret generic storage-creds --from-literal="connectionString=DefaultEndpointsProtocol=..." -n drasi-system
```

##### Example

```yaml
kind: Reaction
apiVersion: v1
name: my-reaction
spec:
  kind: StorageQueue
  queries:
    query1:
    query2:  
  properties:    
    queueName: queue1
    format: unpacked
  identity:
    kind: ConnectionString
    connectionString: 
      kind: Secret
      name: storage-creds
      key: connectionString
```

## Output formats

### Packed Format

The packed format produces one message per source change that includes all changes to the result set and looks as follows:

```json
{
    "kind":"change",
    "queryId": "query1",
    "sequence": 2,
    "sourceTimeMs": 0,
    "addedResults": [
        { "id": 10, "temperature": 22 }
    ],
    "updatedResults":[{
        "before": { "id": 11, "temperature": 25 },
        "after": { "id": 11, "temperature": 27 } 
    }],
    "deletedResults":[
        { "id": 12, "temperature": 30 }
    ]
}
```


### Unpacked Format

The Unpacked format flattens all the changed result set items into one message per item and looks as follows:

```json
{
    "op": "i",
    "ts_ms": 0,
    "payload": {
        "source": {
            "queryId": "query1",
            "ts_ms": 0
        },
        "after": { 
            "id": 10, 
            "temperature": 22 
        }
    }
}
```
```json
{
    "op": "u",
    "ts_ms": 0,
    "payload": {
        "source": {
            "queryId": "query1",
            "ts_ms": 0
        },
        "before": {
            "id": 11, 
            "temperature": 25 
        },
        "after": { 
            "id": 11, 
            "temperature": 27
        }
    }
}
```
```json
{
    "op": "d",
    "ts_ms": 0,
    "payload": {
        "source": {
            "queryId": "query1",
            "ts_ms": 0
        },
        "before": { 
            "id": 12, 
            "temperature": 30
        }
    }
}
```


## Inspecting the Reaction
As soon as the Reaction is created it will start running, subscribing to the specified list of Continuous Queries and processing changes to the Continuous Query results.

You can check the status of the Reaction using the `drasi list` command:

```text
drasi list reaction
```

This will return a simple list of all Reactions in the current namespace and their overall status. For example:

```
        ID          | AVAILABLE
--------------------+------------
  my-reaction       | true
```

If an error has occurred during the creation or operation of a Reaction, the `AVAILABLE` column will contain the error text instead of `true` or `false`.

For more details about the Reaction you can use the [drasi describe](/reference/command-line-interface#drasi-describe) command:

```text
drasi describe reaction my-reaction
```

This will return the full definition used to create the Reaction along with more detailed status information.


## Modifying the Reaction
To modify the reaction, you can simply use the `drasi apply` command again with the same reaction name that you used before.

## Deleting the Reaction
To delete a Reaction you use the `drasi delete` command. There are two ways to do this. 

Firstly, you can specify the type of resource (Reaction) and its name, for example:

```text
drasi delete reaction my-reaction
```

Secondly, you can refer to the YAML file(s) that contain the definitions used to create the Reaction(s):

```text
drasi delete -f my-reaction.yaml <file2.yaml> <file3.yaml> <...>
```

This is a convenience, especially if a single YAML file contains multiple Reaction definitions. 

