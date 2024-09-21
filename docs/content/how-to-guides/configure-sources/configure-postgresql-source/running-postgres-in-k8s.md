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
- 
**NOTE:** This tutorial assumes that you have installed Drasi to the `drasi-system` namespace. If you installed Drasi different namespace, please replace all occurrences of `-n drasi-system` in the command with `-n <your-namespace>`.

### Setting up PostgreSQL deployment
To set up a PostgreSQL database in your Kubernetes cluster suitable for Drasi test/dev, you can either execute the following command

```bash
kubectl apply -f https://drasi.blob.core.windows.net/installs/drasi-postgres.yaml
```

or create a file named `drasi-postgres.yaml` containing the following Kubernetes resource definition:
```yaml {#drasi-postgres}
apiVersion: v1
kind: ConfigMap
metadata:
  name: test-data-init
data:
  init.sql: >
    CREATE TABLE "Message" (
        "MessageId" integer NOT NULL,
        "From" character varying(50) NOT NULL,
        "Message" character varying(200) NOT NULL
    );

    ALTER TABLE "Message" ADD CONSTRAINT pk_message
      PRIMARY KEY ("MessageId");

    INSERT INTO public."Message" VALUES (1, 'Buzz Lightyear', 'To infinity and beyond!');
    INSERT INTO public."Message" VALUES (2, 'Brian Kernighan', 'Hello World');
    INSERT INTO public."Message" VALUES (3, 'Antoninus', 'I am Spartacus');
    INSERT INTO public."Message" VALUES (4, 'David', 'I am Spartacus');
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: test-pg-config
  labels:
    app: postgres
data:
  POSTGRES_DB: hello-world
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

## Azure Database for PostgreSQL (out of date)
If you are using **Azure Database for PostgreSQL**, you can configure the replication to `LOGICAL` from the Azure portal on the **Replication** page, or you can use the CLI as follows:

```azurecli
az postgres server configuration set --resource-group mygroup --server-name myserver --name azure.replication_support --value logical

az postgres server restart --resource-group mygroup --name myserver
```