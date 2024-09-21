---
type: "docs"
title: "Configure an Azure Cosmos Gremlin Source"
linkTitle: "Configure an Azure Cosmos Gremlin Source"
weight: 10
description: >
    Learn how to configure an Azure Cosmos Gremlin Sources
---


The Azure Cosmos DB Gremlin API Source enables Drasi connectivity to Azure Cosmos DB Gremlin API. It uses the Cosmos DB Change Log as the source of database change events, and calls the Gremlin API to retrieve data required to bootstrap Continuous Queries at creation.

#### Source Requirements
For the Cosmos DB Gremlin Source to function, you must ensure the Full Fidelity Change Feed support is enabled on the Cosmos Account you intend to use. Currently (as of 02/03/2023), this needs to be manually requested by [filling out this form](https://forms.office.com/pages/responsepage.aspx?id=v4j5cvGGr0GRqy180BHbR9ecQmQM5J5LlXYOPoIbyzdUOFVRNUlLUlpRV0dXMjFRNVFXMDNRRjVDNy4u).

#### Configuration Settings
The following is an example of a full resource definition for an Azure Cosmos DB Gremlin API Source using Kubernetes Secrets to securely store database credentials:

```
apiVersion: v1
kind: Source
name: retail-ops
spec:
  kind: CosmosGremlin
  properties:
    accountEndpoint: 
      kind: Secret
      name: creds
      key: account-endpoint
    database: Contoso
    container: RetailOperations
    partitionKey: name
```

> Note: You could use the following command to easily create the seret referenced here:
  ```bash
  kubectl create secret generic creds --from-literal=account-endpoint=...
  ```

In the Source resource definition:
- **apiVersion** must be **v1**
- **kind** must be **Source**
- **name** is the **id** of the Source and must be unique. This id is used in a Continuous Query definitions to identify which Sources the Continuous Query subscribes to for change events.
- **spec.kind** must be **CosmosGremlin**

The following table describes the Cosmos Gremlin specific properties that must be configured in the **spec** object:
|Property|Description|
|-|-|
|accountEndpoint|The **PRIMARY** or **SECONDARY CONNECTION STRING** from the **Keys** page of the Azure Cosmsos DB Account page of the Azure Portal.|
|database|**Database Id** from the Cosmos DB account.|
|container|**Graph Id** from the Cosmos DB Database.|
|partitionKey|The **Partition Key** configured on the **Graph**.|

#### Data Transformation
Cosmos DB Gremlin already uses a property graph data model and so the Source does not need to do any data transformation as it processes the inbound changes. The only thing to note is the terminology differences between Gremlin and Drasi summarized in this table:

|Gremlin Name|Drasi Name|
|-|-|
|Vertex|Node|
|Edge|Relation|