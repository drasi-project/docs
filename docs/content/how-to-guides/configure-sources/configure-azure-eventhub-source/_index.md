---
type: "docs"
title: "Connect to Azure EventHub"
linkTitle: "Connect to Azure EventHub"
weight: 70
description: >
    Learn how to configure an Azure EventHub Source to connect to an Azure EventHub
---

The Event Hubs source enables messages streaming through Azure Event Hubs to be mapped into graph nodes that can be referenced by a continuous query.
It can observe multiple Event Hubs within the same Event Hubs namespace, each incoming message will upsert graph node that will carry the label of the Event Hub name, and be queryable from a continuous query.


## Requirements
On the computer from where you will create the Source, you need the following software:
- [Drasi CLI](/reference/command-line-interface/) 
- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/) (If using Azure Managed Identities)


## Creating the Source
To create a Source, execute the `drasi apply` command as follows:

```text
drasi apply -f my-source.yaml
```

The `drasi apply` command is how you create all new Drasi resources (in this case a Source). The `-f` flag specifies that the definition of the new Source is contained in the referenced YAML file `my-source.yaml`.

## Source Definitions
The YAML file passed to `drasi apply` can contain one or more Source definitions. Here is an example of an EventHub source definition:

```yaml
kind: Source
apiVersion: v1
name: my-source
spec:
  kind: EventHub
  properties:
    connectionString: <connecting string>
    host: <Fully qualified EventHub namespace, eg. my-hubs.servicebus.windows.net>
    eventHubs:
      - hub1
      - hub2
    bootstrapWindow: 0
```
In the Source resource definition:

- **apiVersion** must be **v1**
- **kind** must be **Source**
- **name** is the **id** of the Source and must be unique. This id is used in a Continuous Query definitions to identify which Sources the Continuous Query subscribes to for change events.
- **spec.kind** must be **EventHub**

The following table describes the EventHub specific properties:
|Property|Description|
|-|-|
|connectionString|Connection string for the Event Hubs endpoint. This is only required if not using Managed Identities.|
|host|Fully qualified EventHub namespace, eg. `my-hubs.servicebus.windows.net`. This is only required when using Managed Identities.|
|eventHubs|A list of Event Hubs within the Event Hubs namespace to observe|
|bootstrapWindow|When a query bootstraps, it can also fetch all the messages for the previous (n) minutes.  This value defines how many minutes of backfill data to bootstrap the query with.|

### Secret Configuration

It is best practice to store the connection string to your Event Hubs instance in a secret.

```bash
kubectl create secret generic eventhub-creds --from-literal=eventHubConnectionString=...
```

You can then reference the secret when you create an Event Hub source as follows:

```yaml
kind: Source
apiVersion: v1
name: my-source
spec:
  kind: EventHub
  properties:
    connectionString: 
      kind: Secret
      name: eventhub-creds
      key: eventHubConnectionString
    eventHubs:
      - hub1
      - hub2
    bootstrapWindow: 0
```

### Identity

The source supports the following service identities:

#### Microsoft Entra Workload ID

Microsoft Entra Workload Identity enables your source to authenticate to Azure without the need to store sensitive credentials. It works by creating a federated identity between a [managed identity](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview) and the service account the source is running against.

| Property | Description |
|-|-|
| kind | MicrosoftEntraWorkloadID |
| clientId | The Client ID of the user managed identity.|

##### Example

```yaml
kind: Source
apiVersion: v1
name: my-source
spec:
  kind: EventHub
  identity:
    kind: MicrosoftEntraWorkloadID
    clientId: <Client ID of Managed Identity>
  properties:
    host: <Fully qualified EventHub namespace, eg. my-hubs.servicebus.windows.net>
    eventHubs:
      - hub1
      - hub2
    bootstrapWindow: 0
```

##### AKS Setup

1. On the Azure portal, navigate to the `Security configuration` pane of your AKS cluster.
1. Ensure `Enable Workload Identity` is enabled.
1. Take note of the `Issuer URL` under OIDC.
1. Create or use an existing `User Assigned Managed Identity`.
1. Take note of the `Client ID` an the `Overview` pane of the Managed Identity.
1. Grant the `Storage Queue Data Contributor` role to the managed identity in the `Access Control (IAM)` pane of the storage account.
1. Create a federated credential between the managed identity and the source.
    ```bash
    az identity federated-credential create \
        --name <Give the federated credential a unique name> \
        --identity-name "<Name of the User Assigned Managed Identity>" \
        --resource-group "<Your Resource Group>" \
        --issuer "<The Issuer URL from your AKS cluster OIDC configuration>" \
        --subject system:serviceaccount:"drasi-system":"source.<Name of your Source>" \
        --audience api://AzureADTokenExchange
    ```


##### Related links
* [What are managed identities for Azure resources](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview)
* [What are workload identities](https://learn.microsoft.com/en-us/entra/workload-id/workload-identities-overview)
* [Azure AD Workload Identity Docs](https://azure.github.io/azure-workload-identity/docs/introduction.html)
* [Deploy and configure workload identity on an Azure Kubernetes Service (AKS) cluster](https://learn.microsoft.com/en-us/azure/aks/workload-identity-deploy-cluster)
* [Use Microsoft Entra Workload ID with Azure Kubernetes Service (AKS)](https://learn.microsoft.com/en-us/azure/aks/workload-identity-overview)


## Inspecting the Source

You can check the status of the Source using the `drasi list` command:

```text
drasi list source
```

This will return a simple list of all Sources in the current namespace and their overall status. For example:

```
        ID          | AVAILABLE
--------------------+------------
  my-source         | true
```

If an error has occurred during the creation or operation of a Source, the `AVAILABLE` column will contain the error text instead of `true` or `false`.

For more details about the Source you can use the [drasi describe](/reference/command-line-interface#drasi-describe) command:

```text
drasi describe source my-source
```

This will return the full definition used to create the Source along with more detailed status information.


## Modifying the Source
To modify the Source, you can simply use the `drasi apply` command again with the same source name that you used before.

## Deleting the Source
To delete a Source you use the `drasi delete` command. There are two ways to do this. 

Firstly, you can specify the type of resource (Source) and its name, for example:

```text
drasi delete source my-source
```

Secondly, you can refer to the YAML file(s) that contain the definitions used to create the Source(s):

```text
drasi delete -f my-source.yaml <file2.yaml> <file3.yaml> <...>
```

This is a convenience, especially if a single YAML file contains multiple Source definitions. 

