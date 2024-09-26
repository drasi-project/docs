---
type: "docs"
title: "Getting Started Tutorial Dataset"
linkTitle: "Getting Started Tutorial Dataset"
weight: 10
toc_hide: true
description: >
    Simple PostgreSQL dataset from the Drasi Getting Started Tutorial
---

## Overview
The Getting Started Tutorial dataset is a PostgreSQL dataset used in the [Getting Started Tutorial](/getting-started/). This page describes how to create a new PostgreSQL server running on Kubernetes and load the Getting Started dataset into the database.

To install this dataset, you will need:
- A Kubernetes cluster
- [kubectl](https://kubernetes.io/docs/tasks/tools/)

Once installed, to connect to the PostgreSQL server and view or edit the dataset, you will need one of:
- [pgAdmin](https://www.pgadmin.org/download/), a PostgreSQL GUI
- [psql](https://www.postgresql.org/docs/current/app-psql.html), a PostgreSQL CLI

## Data Description
The dataset contains a single `Message` table, which holds the content of messages sent by people. The `Message` table contains these three fields:

|Field Name|Type|Description|
|-|-|-|
|MessageId|integer|A unique id for each message.|
|From|character varying(50)|The name of who the message is from.|
|Message|character varying(200)|The text of the message.|

The `Message` table contains the following messages:

|MessageId|From|Message|
|-|-|-|
|1|Buzz Lightyear|To infinity and beyond!|
|2|Brian Kernighan|Hello World|
|3|Antoninus|I am Spartacus|
|4|David|I am Spartacus|

## Setup
Make sure the `kubectl` context is configured for the Kubernetes cluster and namespace where you want to install the PostgreSQL server that will host the dataset. Then run the following command:

```bash
kubectl apply -f https://raw.githubusercontent.com/drasi-project/learning/c0a9a893646ed12bd3ff6b62a7cf3f894875b693/tutorial/getting-started/resources/drasi-postgres.yaml
```

## Connecting to the PostgreSQL database
To manage the PostgreSQL database using pgAdmin, you need to expose a port that pgAdmin can access. To expose port 5432, execute the following command in your terminal:

```bash
kubectl port-forward svc/postgres 5432:5432
```
Now, launch pgAdmin and follow the following steps to connect to the Postgres database:

1. In the pgAdmin interface, locate the "Servers" section on the left-hand side.

2. Right-click on the "Servers" node and select "Register" > "Server..."

3. Navigate to the General tab:
   - Name: Give your server a name, such as "Drasi PostgreSQL"

4. Navigate to the Connection Tab:
   - Host name/address: Enter `127.0.0.1`
   - Port: Enter `5432`
   - Username: Enter `test`
   - Password: Enter `test`

5. Click the "Save" button to save your server configuration.

6. After saving, your new server should appear in the "Servers" list. Right-click on it and select "Connect."

You should now be connected to your locally deployed PostgreSQL server.