---
type: "docs"
title: "Curbside Pickup"
linkTitle: "Curbside Pickup"
weight: 20
description: >
    Installing the Curbside Pickup sample application on self-hosted Drasi
---

## Prerequisites
- [NodeJs](https://nodejs.org/)
- [Azure Functions Core Tools](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local?tabs=v4%2Cmacos%2Ccsharp%2Cportal%2Cbash#install-the-azure-functions-core-tools)
- Azure Account
- Drasi CLI
- Kubectl
- An instance of Reactive Graph, deployed to the Kubernetes cluster that your kubectl context points to
- The source repo cloned to a folder on your local machine


## Overview of the app

This demo consists of
  - 2 sources, each watching a different database
  - Several continuous queries against each database
  - A continuous query that joins across the 2 databases
  - A SignalR reaction that receives changes and forwards them to any connected front end clients
  - An Azure Function App that provides Http endpoints that directly manipulate the data in each database
  - A React frontend that invokes updates via the Function App and listens for changes via the SignalR reaction


![Architecture](demo-arch.png)

## Setup a Gremlin Database

### Create a CosmosDB account

From the `/apps/curbside-pickup/devops` folder, use the Azure CLI to deploy `database.bicep`

```bash
az deployment group create -f database.bicep --resource-group <your resource group> -p cosmosAccountName=<your account name>
```

Insert your resource group name and pick a name for your CosmosDB account, for example:

```bash
az deployment group create -f database.bicep --resource-group my-resource-group -p cosmosAccountName=my-drasi-db
```

This will create a new CosmosDB account with the Gremlin API and a database named `Contoso` with 2 empty graphs, named `PhysicalOperations` and `RetailOperations`.

### Add the Pickup zone data

Login to the Azure portal and navigate to the Data explorer blade of your CosmosDB account.

Expand the `Contoso/PhysicalOperations` Graph

Execute each of these Gremlin queries in the query box

```javascript
g.addV('Zone').property('name','Curbside Queue').property('type','Curbside Queue')
```

```javascript
g.addV('Zone').property('name','Parking Lot').property('type','Parking Lot')
```

## Deploy the sources
Currently, we are unable to create a Kubernetes Secret using the Drasi CLI, so it needs to be manually created using `kubectl`. Navigate to your CosmosDB account in the Azure Portal. You will need to retrieve the value of `PRIMARY CONNECTION STRING` from the `Keys` blade. Run the following command to create the secrets:

```bash
kubectl create secret generic phys-ops-creds --from-literal=accountEndpoint='${PRIMARY CONNECTION STRING}'
kubectl create secret generic retail-ops-creds --from-literal=accountEndpoint='${PRIMARY CONNECTION STRING}'
```

Navigate to the `/apps/curbside-pickup/devops` folder, and from there, you can deploy the two sources using the Drasi CLI:

```bash
drasi apply -f phys-ops-source.yaml
drasi apply -f retail-ops-source.yaml
```

To verify that both sources are deployed successfully, run `drasi list source`. The expected output should be as follows:

```
      ID     | AVAILABLE  
-------------+------------
  phys-ops   | true       
  retail-ops | true  
```
## Deploy the queries

From the `/apps/curbside-pickup/devops` folder, use the drasi CLI to deploy the continuous queries

```bash
drasi apply -f queries-with-gremlin.yaml
```

Similarly, run `drasi list query` to verify the status of the continuous queries. The expected output should be as follows:
```
           ID            | ERRORMESSAGE |              HOSTNAME               | STATUS  | CONTAINER  
--------------------------+--------------+-------------------------------------+---------+------------
  vehicles-in-parking-lot |              | default-query-host-...-... | RUNNING | default    
  vehicles-in-queue       |              | default-query-host-...-... | RUNNING | default    
  orders-prep             |              | default-query-host-...-... | RUNNING | default    
  orders-ready            |              | default-query-host-...-... | RUNNING | default    
  orders-matched-vehicle  |              | default-query-host-...-... | RUNNING | default
```
## Deploy the reaction

From the `/apps/curbside-pickup/devops` folder, use the drasi CLI to deploy the SignalR reaction

```bash
drasi apply -f signalr-reaction.yaml
```

Create a port forward for the SignalR reaction to a port on your local machine. Currently we have to use `drasi tunnel` to achieve this.

```bash
drasi tunnel reaction signalr1-reaction 5001
```

## Configure and start the App backend

From the `/apps/curbside-pickup/functions` folder, create a file named `local.settings.json` and paste the following content, replacing the values for `RETAIL_OPS_URL`, `RETAIL_OPS_KEY`, `PHYSICAL_OPS_URL` and `PHYSICAL_OPS_KEY` with the values from the `Keys` blade in the Azure Portal from your CosmosDB account.

```json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "RETAIL_OPS_URL": "wss://<my-database>.gremlin.cosmos.azure.com:443/",
    "RETAIL_OPS_DB_NAME": "Contoso",
    "RETAIL_OPS_CNT_NAME": "RetailOperations",
    "RETAIL_OPS_KEY": "<access key>",
    "PHYSICAL_OPS_URL": "wss://<my-database>.gremlin.cosmos.azure.com:443/",
    "PHYSICAL_OPS_DB_NAME": "Contoso",
    "PHYSICAL_OPS_CNT_NAME": "PhysicalOperations",
    "PHYSICAL_OPS_KEY": "<access key>"
  },
  "Host": {
    "LocalHttpPort": 7071
  }
}
```
Install the dependencies.

```bash
npm install
```

Run the Functions app.

```bash
npm start
```

## Configure and start the App frontend

Double check the `config.json` file under `/apps/curbside-pickup/app/src` to ensure the URLs are correct.

```json
{
  "crudApiUrl": "http://localhost:7071",  //Location of Functions app
  "signalRUrl": "http://localhost:5001/hub", //Location of SignalR port forward
  ...
}
```

From the `/apps/curbside-pickup/app` folder, start the react app

```bash
npm install
npm start
```

The front-end should be accessible at [http://localhost:3000](http://localhost:3000)

![UI Overview](ui-overview.png)