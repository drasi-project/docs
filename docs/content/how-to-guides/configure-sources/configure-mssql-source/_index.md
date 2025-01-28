---
type: "docs"
title: "Connect to Microsoft SQL Server"
linkTitle: "Connect to Microsoft SQL Server"
weight: 40
description: >
    Learn how to configure a SQL Server Source to connect to Microsoft SQL Server
---

The SQLServer Source enables Drasi connectivity to Microsoft SQL Server databases.

## Data Model
The SQL Source translates the relational data from change events to more closely resemble property graph data change events so that they can be processed by subscribed Continuous Queries. To achieve this, it represents table rows as graph Nodes, as follows:
- Each row gets represented as a Node with the table columns as properties of the Node.
- The Node is assigned an id the is a composite of the table id and the row's primary key. This is Node metadata, not a property of the Node.
- The name of the table is assigned as a **Label** of the Node.

The SQL Server Source **does not** interpret foreign keys or joins from the relational source, instead relying on the Source Join feature provided by Continuous Queries to mimic graph-style Relations between Nodes based on the values of specified properties. See the [Source Joins](/concepts/continuous-queries/#sources) topic in the [Continuous Queries](/concepts/continuous-queries) section for details. 



## Requirements
On the computer from where you will create the Source, you need the following software:
- Change data capture must be enabled on the database and each table you wish to observe.  See the documentation on [configuring SQL Server for CDC](./setup-sql-server).
- [Drasi CLI](/reference/command-line-interface/) 
- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/) (If using Azure Managed Identities)


{{% alert title="Note" color="warning" %}}
If the schema of your tables change after you have enabled CDC for them, you will need to refresh the capture tables.  Please see the [Debezium documentation](https://debezium.io/documentation/reference/stable/connectors/sqlserver.html#sqlserver-schema-evolution) on this issue.
{{% /alert %}}


## Creating the Source
To create a Source, execute the `drasi apply` command as follows:
```text
drasi apply -f my-source.yaml
```
The `drasi apply` command is how you create all new Drasi resources (in this case a Source). The `-f` flag specifies that the definition of the new Source is contained in the referenced YAML file `my-source.yaml`.
## Source Definitions

The YAML file passed to `drasi apply` can contain one or more Source definitions. Here is an example of a SQL Server source definition:

```yaml
apiVersion: v1
kind: Source
name: my-source
spec:
  kind: SQLServer
  properties:
    host: <SQL Server host name>
    port: 1433
    user: user
    password: password
    database: database
    encrypt: true
    trustServerCertificate: false
    tables:
      - dbo.Table1
      - dbo.Table2
```

In the Source resource definition:
- **apiVersion** must be **v1**
- **kind** must be **Source**
- **name** is the **id** of the Source and must be unique. This id is used in a Continuous Query definitions to identify which Sources the Continuous Query subscribes to for change events.
- **spec.kind** must be **SQLServer**

The following table describes the SQL Server specific properties:
|Property|Description|
|-|-|
|host|The **host name** of the database server.|
|port|The **port** number used to communicate with the database server.|
|user|The **user id** to use for authentication against the server.|
|password|The **password** for the user account specified in the **user** property.|
|database|The name of the SQL database.|
|encrypt|Does the server require a secure connection, valid values are "true" or "false".|
|trustServerCertificate|This property is valid only when connecting to a SQL Server instance with a valid certificate. When it is set to true, the transport layer will use SSL to encrypt the channel and bypass walking the certificate chain to validate trust.|
|authentication|The JDBC authentication type. Set this to `ActiveDirectoryDefault` for Azure Managed Identities.|
|tables| An array of table names that the source should process changes for. Tables must be prefixed with their schema name.|


### Secret Configuration

It is best practice to store the sensitive values, such as passwords in a secret.

```bash
kubectl create secret generic sql-credentials --from-literal=password=xxxxx -n drasi-system
```

You can then reference the secret when you create a SQLServer source as follows:
```yaml
apiVersion: v1
kind: Source
name: my-source
spec:
  kind: SQLServer
  properties:
    host: <SQL Server host name>
    port: 1433
    user: user
    password:
      kind: Secret
      name: sql-credentials
      key: password
    database: database
    encrypt: true
    trustServerCertificate: false
    tables:
      - dbo.Table1
      - dbo.Table2
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
apiVersion: v1
kind: Source
name: my-source
spec:
  kind: SQLServer
    identity:
      kind: MicrosoftEntraWorkloadID
      clientId: <Client ID of Managed Identity>
  properties:
    host: <SQL Server host name>
    port: 1433
    authentication: ActiveDirectoryDefault
    database: database
    tables:
      - dbo.Table1
      - dbo.Table2

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