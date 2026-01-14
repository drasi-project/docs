---
type: "docs"
title: "Configure a SignalR Reaction"
linkTitle: "Configure a SignalR Reaction"
weight: 80
description: >
    Learn how to configure a SignalR Reaction
related:
  tutorials:
    - title: "Getting Started with Drasi"
      url: "/drasi-kubernetes/getting-started/"
    - title: "Connecting Frontends to Queries"
      url: "/drasi-kubernetes/tutorials/connecting-frontends/"
  concepts:
    - title: "Reactions"
      url: "/concepts/reactions/"
  howto:
    - title: "Write Continuous Queries"
      url: "/drasi-kubernetes/how-to-guides/write-continuous-queries/"
  reference:
    - title: "CLI Reference"
      url: "/drasi-kubernetes/reference/command-line-interface/"
    - title: "Result Change Event Schema"
      url: "/reference/schema/result-change-event/"
---

The SignalR {{< term "Reaction" >}} exposes a SignalR endpoint where changes to the {{< term "Result Set" "result sets" >}} of the queries it is subscribed to will be published. The details of this format are described below.  Together with the SignalR Reaction, there are also several client libraries that can be used to connect to it.

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
The YAML file passed to `drasi apply` can contain one or more Reaction definitions. Here is an example of a SignalR Reaction definition:

```yaml
kind: Reaction
apiVersion: v1
name: my-reaction
spec:
  kind: SignalR
  queries:
    query1:
    query2:
```

Here is another example, but where the client connections are offloaded to the Azure SignalR Service.
```yaml
kind: Reaction
apiVersion: v1
name: my-reaction
spec:
  kind: SignalR
  properties:
    connectionString: Endpoint=https://<resource_name>.service.signalr.net;AccessKey=<access_key>;Version=1.0;
  queries:
    query1:
    query2:
```


In this definition: 
- the **apiVersion** must be **v1**.
- the **kind** property tells Drasi to create a **Reaction** resource.
- the **spec.kind** property tells Drasi the kind of Reaction to create, in this case a **SignalR** Reaction. 
- the **name** property tells Drasi the identity of the Reaction and must be unique within the scope of Reactions within the target Drasi environment. In the above example, the **name** of the Reaction is **my-reaction**.

This table describes the other settings in the **spec** section of the Reaction definition:
|Property|Description|
|-|-|
| queries | Specifies the set of **names** of the Continuous Queries the Reaction will subscribe to. |
| properties.connectionString | *(optional)* If you wish to use the Azure SignalR service to host the client connections, specify the connection string here. If this is omitted, the client connections will be hosted within the Reaction process itself. A typical connection string takes the format of `Endpoint=https://<resource_name>.service.signalr.net;AccessKey=<access_key>;Version=1.0;`. If you wish to leverage an identity provider, then the connection string should be `Endpoint=https://<resource_name>.service.signalr.net;AuthType=azure` |
| identity | The service identity provider used for authentication to the Azure SignalR Service, discussed below. |


By default, the Drasi SignalR Reaction will expose its Web UI on port 8080. If you wish to create an ingress for the SignalR Reaction, please refer to the [Ingress documentation](/reference/ingress/) for more information.

### Identity

The reaction supports the following service identities:

#### Microsoft Entra Workload ID

Microsoft Entra Workload Identity enables your reaction to authenticate to Azure without the need to store sensitive credentials. It works by creating a federated identity between a [managed identity](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview) and the service account the reaction is running against. To use this identity provider, set the connection string to: `Endpoint=https://<resource_name>.service.signalr.net;AuthType=azure`

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
  kind: SignalR
  identity:
    kind: MicrosoftEntraWorkloadID
    clientId: <Client ID of Managed Identity>
  properties:
    connectionString: Endpoint=https://<resource_name>.service.signalr.net;AuthType=azure
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
1. Grant the `SignalR App Server` role to the managed identity in the `Access Control (IAM)` pane of the SignalR resource.
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


#### Microsoft Entra Application
Microsoft Entra Application Identity enables your reaction to authenticate as an Entra application. 
This provider will mount to appropriate environment variables and key files used by the Azure.Identity SDKs, according to https://learn.microsoft.com/en-us/dotnet/api/azure.identity.environmentcredential
To use this identity provider, set the connection string to: `Endpoint=https://<resource_name>.service.signalr.net;AuthType=azure`

| Property | Description |
|-|-|
| kind | MicrosoftEntraApplication |
| tenantId | The Microsoft Entra tenant (directory) ID.|
| clientId | The client (application) ID of an App Registration in the tenant.|
| secret | A client secret that was generated for the App Registration.|

##### Example
```yaml
kind: Reaction
apiVersion: v1
name: my-reaction
spec:
  kind: SignalR
  identity:
    kind: MicrosoftEntraApplication
    tenantId: <The Microsoft Entra tenant (directory) ID>
    clientId: <The client (application) ID of an App Registration in the tenant>
    secret: 
      kind: Secret
      name: ***
      value: ***
  properties:
    connectionString: Endpoint=https://<resource_name>.service.signalr.net;AuthType=azure
```


#### Secret Configuration
It is best practice to store private credentials in a secret, which can be created using `kubectl`. The example below creates a Secret with the name `signalr-creds`, containing one key called `connectionString` in the `drasi-system` namespace.  Secrets must be in the same Kubernetes namespace as your Drasi installation in order to be referenced.

```bash
kubectl create secret generic signalr-creds --from-literal="Endpoint=https://..." -n drasi-system
```

##### Example

```yaml
kind: Reaction
apiVersion: v1
name: my-reaction
spec:
  kind: SignalR
  queries:
    query1:
    query2:  
  properties:    
    connectionString: queue1
      kind: Secret
      name: signalr-creds
      key: connectionString
      
```

## Exposing the endpoint

### Local dev/test

For dev/test purposes, you can simply use a `kubectl port-forward` to expose the endpoint via a port on your local machine.

The following command will open port 8080 on your local machine, which will point to the SignalR endpoint. 

```
kubectl port-forward services/<reaction name>-gateway 8080:gateway -n drasi-system
```

Now, you could access the SignalR endpoint via `http://localhost:8080`.

### Production

For production environments, you will need to configure an `Ingress` that points to the `<reaction name>-gateway` service.
This configuration will vary depending on how your cluster is hosted, and there will be specific steps for each cloud provider.

#### More information
- [Kubernetes Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/)
- [AWS: Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/latest/)
- [AKS: Managed NGINX ingress with the application routing add-on](https://learn.microsoft.com/en-us/azure/aks/app-routing)
- [AKS: Enable application gateway ingress controller add-on](https://learn.microsoft.com/en-ca/azure/application-gateway/tutorial-ingress-controller-add-on-existing)
- [GKE: Configure Ingress for external Application Load Balancers](https://cloud.google.com/kubernetes-engine/docs/how-to/load-balance-ingress)


## Output format

The reaction flattens all the changed result set items into one message per item and looks as follows:

An item was added to the result set:
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

An item was updated in the result set:
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

An item was removed from the result set:
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

## Client libraries

You can also use one of the client libraries in your front end application to connect to the SignalR endpoint.

### React

#### Install the package

```
npm install --save @drasi/signalr-react
```

#### ResultSet Component

The `ResultSet` component requires an endpoint to the SignalR reaction and a query ID. It will render a copy of it's children for every item in the result set of that query, and keep the data up to date via the SignalR connection.

```jsx
<ResultSet url='<Your Drasi SignalR endpoint>' queryId='<query name>' sortBy={item => item.field1}>
    {item => 
        <div>
            <span>{item.field1}</span>
            <span>{item.field2}</span>
        </div>
    }
</ResultSet>
```

#### Basic example

```javascript
function App() {
  return (
    <div className="App">
      <header className="App-header">
        <table>
          <thead>
            <tr>
              <th>Message ID</th>
              <th>Message From</th>
            </tr>  
          </thead>
          <tbody>
            <ResultSet url='http://localhost:8080/hub' queryId='hello-world-from'>
              {item => 
                <tr>
                  <td>{item.MessageId}</td>
                  <td>{item.MessageFrom}</td>
                </tr>
              }
            </ResultSet>
          </tbody>
        </table>
      </header>
    </div>
  );
}
```

### Vue

#### Install the package

```
npm install --save @drasi/signalr-vue
```

#### ResultSet Component

The `ResultSet` component requires an endpoint to the SignalR reaction and a query ID. It will render a copy of it's children for every item in the result set of that query, and keep the data up to date via the SignalR connection.

```vue
<ResultSet url="<your signalr endpoint>" queryId="<query name>" :sortBy="item => item.field1">
    <template #default="{ item, index }">
        <span>{{ item.field1 }}</span>
        <span>{{ item.field2 }}</span>
    </template>
</ResultSet>
```

#### Basic example

```vue
<script setup>
import { ResultSet } from '@drasi/signalr-vue';
</script>

<template>
  <main>
    <table>
      <thead>
        <tr>
          <th>Message ID</th>
          <th>Message From</th>
        </tr>
      </thead>
      <tbody>
        <ResultSet url="http://localhost:8080/hub" queryId="hello-world-from" :sortBy="x => x.MessageFrom">
          <template #default="{ item, index }">
            <tr>              
              <td>{{ item.MessageId }}</td>
              <td>{{ item.MessageFrom }}</td>
            </tr>
          </template>
        </ResultSet>
      </tbody>
    </table>
  </main>
</template>
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

