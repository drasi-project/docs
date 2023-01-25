---
type: "docs"
title: "Curbside Pickup"
linkTitle: "Curbside Pickup"
weight: 10
description: >
    Installing the Curbside Pickup sample application on self-hosted Drasi
---

## Prerequsites
- [Azure Functions Core Tools](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local?tabs=v4%2Cmacos%2Ccsharp%2Cportal%2Cbash#install-the-azure-functions-core-tools)
- Node

## Overview of the app


## Setup Database

### Add the Pickup zone data

Login to the Azure portal and navigate to the Data explorer blade of your CosmosDb account.

Expand the `Contoso/PhysicalOperations` Graph

Execute each of these Gremlin queries in the query box

```javascript
g.addV('Zone').property('name','Curbside Queue').property('type','Curbside Queue')
```

```javascript
g.addV('Zone').property('name','Parking Lot').property('type','Parking Lot')
```

## Deploy the sources

From the `/apps/curbside-pickup/devops` folder, edit the `phys-ops-source.yaml` and `retail-ops-source.yaml` files to include the keys/connections strings of your CosmosDb account.  The fields to update include `SourceAccountEndpoint`, `SourceKey` and `SourceConnectionString`, you can retrieve these values from the `Keys` blade in the Azure Portal.

Use kubectl to deploy the 2 sources

```bash
kubectl apply -f phys-ops-source.yaml
kubectl apply -f retail-ops-source.yaml
```

## Deploy the queries

From the `/apps/curbside-pickup/devops` folder, use kubectl to deploy the continuous queries

```bash
kubectl apply -f queries-with-gremlin.yaml
```

## Deploy the reactor

From the `/apps/curbside-pickup/devops` folder, use kubectl to deploy the SignalR reactor

```bash
kubectl apply -f signalr-reactor.yaml
```

Create a port forward for the SignalR reactor to a port on your local machine.

```bash
kubectl port-forward services/signalr1-gateway 5001:80 -n default
```

## Configure and start the App backend

From the `/apps/curbside-pickup/functions` folder, create a file named `local.settigns.json` and paste the following content, replacing the values for `RETAIL_OPS_URL`, `RETAIL_OPS_KEY`, `PHYSICAL_OPS_URL` and `PHYSICAL_OPS_KEY` with the values from the `Keys` blade in the Azure Portal from your CosmosDb account.

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

Double check the `config.json` file under `/app/src` to ensure the Urls are correct.

```json
{
  "crudApiUrl": "http://localhost:7071",  //Location of Functions app
  "signalRUrl": "http://localhost:5001/hub", //Location of SignalR port forward
  ...
}
```

From the `curbside-pickup/app` folder, build the react app

```bash
npm install
npm start
```

The front-end should be accessible at http://localhost:3000
