---
type: "docs"
title: "Connect to Microsoft Dataverse"
linkTitle: "Connect to Microsoft Dataverse"
weight: 30
description: >
    Learn how to configure a Dataverse Source to connect to Microsoft Dataverse
---

The Dataverse Source connects to Microsoft Dataverse tables and tracks changes in real-time using Dataverse's change tracking capabilities.

## Data Model
The Dataverse Source translates Dataverse table data into a format that can be processed by Drasi Continuous Queries. Similar to how relational databases are handled, the Dataverse Source treats each table row as a graph node:

- Each change to a table row is represented as a change to a node, with the table columns represented as properties of the node.
- Each node is assigned a unique **id** that corresponds to the row's **primary key** in Dataverse (typically in GUID format). This **id** is part of the node's metadata, not a property of the node.
- The node is assigned a **label** name that matches the **logical name of the Dataverse table** (e.g., `<dataverse_prefix>_account` for the Account table).

The Dataverse Source uses Dataverse's built-in change tracking feature to detect data modifications. It maintains delta tokens to track the position in the change stream, ensuring that all changes are captured even if the source restarts. The Dataverse Source **does not** interpret relationships or lookups from Dataverse as graph relations or edges.

The Dataverse Source supports the following data types:

|Dataverse Data Type|Processed As|
|-|-|
|Text|String|
|Whole Number|Integer|
|Decimal Number|Float|
|Floating Point Number|Float|
|Date and Time|DateTime|
|Currency|Float|
|Choice (Yes/No)|Boolean|
|Choice (single-select)|Integer (underlying value)|
|Choices (multi-select)|Array of integers|

## Requirements
On the computer from where you will create the Source, you need the following software:
- [Drasi CLI](/reference/command-line-interface/) 
- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/) (If using Azure Managed Identities)

The Dataverse table you want to use to must have Change Tracking enabled. For more information, see [Enable change tracking for an entity (table)](https://learn.microsoft.com/en-us/power-platform/admin/enable-change-tracking-control-data-synchronization).

You also need a Kubernetes cluster with Drasi installed. For more information, see [Install Drasi](/how-to-guides/installation/).

## Creating the Source
To create a Dataverse Source, execute the `drasi apply` command as follows:

```text
drasi apply -f my-source.yaml -n drasi-namespace
```

The `drasi apply` command is how you create all new Drasi resources (in this case a Source). The `-f` flag specifies that the definition of the new Source is contained in the referenced YAML file `my-source.yaml` and the `-n` flag specifies the Drasi namespace in which to create the Source (Drasi must already be installed in that namespace).

## Source Definitions
The YAML file passed to `drasi apply` can contain one or more Source definitions.

Here is an example of a Dataverse source definition:

```yaml
kind: Source
apiVersion: v1
name: my-source
spec:
  kind: Dataverse
  identity:
    kind: MicrosoftEntraWorkloadID
    clientId: <client-id>
  properties:
    endpoint: <https://your-org.api.crm.dynamics.com>
    entities: <logical_name_of_table1>,<logical_name_of_table2>
    maxInterval: <max-interval-in-seconds>
```


In the Source resource definition:

- **apiVersion** must be **v1**
- **kind** must be **Source**
- **name** is the **id** of the Source and must be unique. This id is used in a Continuous Query definitions to identify which Sources the Continuous Query subscribes to for change events.
- **spec.kind** must be **Dataverse**


The following table describes the Dataverse specific properties:
|Property|Description|
|-|-|
|endpoint|The Dataverse API endpoint URL for your organization (e.g., `https://your-org.api.crm.dynamics.com`).|
|entities|A comma-separated list of **logical names** of the Dataverse tables to track. The logical name can be found in the table's settings in the Power Apps portal and typically has a prefix that corresponds to your Dataverse environment.|
|maxInterval|Optional. The maximum interval in seconds between checks. The default value is calculated based on the number of entities being tracked. Increasing this value can reduce API calls but may increase latency in change detection. |

### Authentication using Microsoft Entra Workload Identity
Microsoft Entra Workload Identity enables your source to authenticate to Azure without the need to store sensitive credentials. It works by creating a federated identity between a [managed identity](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview) and the service account the source is running against. You can use Workload Identity with Azure Kubernetes Service (AKS) clusters.

To configure the Dataverse Source to use Microsoft Entra Workload Identity, follow these steps:

1. On the Azure portal, navigate to the `Security configuration` pane of your AKS cluster.
2. Ensure `Enable Workload Identity` is enabled.
3. Take note of the `Issuer URL` under OIDC.
4. Create or use an existing `User Assigned Managed Identity`.
5. Take note of the `Client ID` an the `Overview` pane of the Managed Identity.
6. Grant the managed identity access in Dataverse  
   1. Go to [Power Platform Admin Center](https://admin.powerplatform.microsoft.com) → **Environments** → select your environment → **Settings** → **Application users** → **+ New app user**.  
   2. Add the **User-Assigned Managed Identity** by pasting its **Client ID**.  
   3. Assign the **Basic User** security role (or desired role).  
   4. Click **Create**.
7. Create a federated credential between the managed identity and the source.
    ```bash
    az identity federated-credential create \
        --name <Give the federated credential a unique name> \
        --identity-name "<Name of the User Assigned Managed Identity>" \
        --resource-group "<Your Resource Group>" \
        --issuer "<The Issuer URL from your AKS cluster OIDC configuration>" \
        --subject system:serviceaccount:"drasi-system":"source.<Name of your Source>" \
        --audience api://AzureADTokenExchange
    ```

8. In the Source definition YAML file, set the `spec.identity.kind` property to `MicrosoftEntraWorkloadID` and set the `spec.identity.clientId` property to the Client ID of the managed identity.

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
     ID     | AVAILABLE | INGRESS URL | MESSAGES  
------------+-----------+-------------+-----------
  my-source | true      |             |           
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


