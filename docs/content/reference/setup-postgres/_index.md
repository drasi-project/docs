---
type: "docs"
title: "Using PostgreSQL"
linkTitle: "Using PostgreSQL"
weight: 50
description: >
    Setup and Configure PostgreSQL for Drasi Solution Development
---

This page describes how to setup and configure a PostgreSQL database to use in the development and testing of Drasi solutions.

## Deploying PostgreSQL in a Kubernetes Cluster

### Prerequisites

- A Kubernetes cluster.
- [Kubectl](https://kubernetes.io/docs/tasks/tools/)
- [pgAdmin 4](https://www.pgadmin.org/download/)

### Setting up PostgreSQL deployment
To set up a PostgreSQL database in your Kubernetes cluster suitable for Drasi test/dev, create a file named `drasi-postgres.yaml` containing the following Kubernetes resource definition.

```
apiVersion: v1
kind: ConfigMap
metadata:
  name: test-data-init
data:
  init.sql: >
    CREATE TABLE "Item" (
        "ItemId" integer NOT NULL,
        "Name" character varying(100) NOT NULL,
        "Category" character varying(10) NOT NULL
    );

    ALTER TABLE "Item" ADD CONSTRAINT pk_item
      PRIMARY KEY ("ItemId");

    INSERT INTO "Item" ("ItemId", "Name", "Category") VALUES (1, 'Foo', '1');
    INSERT INTO "Item" ("ItemId", "Name", "Category") VALUES (2, 'Foo', '1');
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: test-pg-config
  labels:
    app: postgres
data:
  POSTGRES_DB: test-db
  POSTGRES_USER: test
  POSTGRES_PASSWORD: test
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:15-alpine
          args: ["-c", "wal_level=logical"]
          volumeMounts:
          - name: init
            mountPath: "/docker-entrypoint-initdb.d"
          ports:
            - containerPort: 5432
          envFrom:
            - configMapRef:
                name: test-pg-config
      volumes:
        - name: init
          configMap:
            name: test-data-init
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  labels:
    app: postgres
spec:
  type: ClusterIP
  ports:
   - port: 5432
  selector:
   app: postgres

```

The YAML content specifies the creation of a ConfigMap with database schema and data, along with a Deployment for the PostgreSQL instance and a Service for communication.

Then run the following command.

```bash
kubectl apply -f drasi-postgres.yaml
```



### Connecting to the PostgreSQL database
To manage the PostgreSQL database using pgAdmin, you need to expose a port that pgAdmin can access. To expose port 5002, execute the following command in your terminal:

```bash
kubectl port-forward svc/postgres 5002:5432
```

Now, launch pgAdmin and follow the following steps to connect to the Postgres database:

1. In the pgAdmin interface, locate the "Servers" section on the left-hand side.

2. Right-click on the "Servers" node and select "Register" > "Server..."

3. Navigate to the General tab:
   - Name: Give your server a name, such as "Drasi PostgreSQL"

4. Navigate to the Connection Tab:
   - Host name/address: Enter `127.0.0.1`
   - Port: Enter `5002`
   - Username: Enter `test`
   - Password: Enter `test`

5. Click the "Save" button to save your server configuration.

6. After saving, your new server should appear in the "Servers" list. Right-click on it and select "Connect."

You should now be connected to your locally deployed PostgreSQL server.

## Azure Database for PostgreSQL (out of date)
If you are using **Azure Database for PostgreSQL**, you can configure the replication to `LOGICAL` from the Azure portal on the **Replication** page, or you can use the CLI as follows:

```azurecli
az postgres server configuration set --resource-group mygroup --server-name myserver --name azure.replication_support --value logical

az postgres server restart --resource-group mygroup --name myserver
```