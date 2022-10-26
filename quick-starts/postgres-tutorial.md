# Create a continuous query against PostgreSQL

## Prerequisites

- A PostgreSQL instance of at least version 10 or greater.
- Your PostgreSQL instance must be configured to support `LOGICAL` replication.
- A PostgreSQL user that has at least the LOGIN, REPLICATION and CREATE permissions on the database and SELECT permissions on the tables you are interested in.

### Azure Database for PostgreSQL

If you are using Azure Database for PostgreSQL, you can configure the replication to `LOGICAL` from the Azure portal under the `Replication` tab, or you can use the CLI as follows:

```azurecli
az postgres server configuration set --resource-group mygroup --server-name myserver --name azure.replication_support --value logical

az postgres server restart --resource-group mygroup --name myserver
```

## Create some tables in your database

Use a tool such as [pgAdmin](https://www.pgadmin.org/) to create a new database called `my-db`.

Use the following script to create a table named `Item`.

```sql
CREATE TABLE "Item" (
    "ItemId" integer NOT NULL,
    "Name" character varying(100) NOT NULL,
    "Category" character varying(10) NOT NULL
);

ALTER TABLE "Item" ADD CONSTRAINT pk_item
  PRIMARY KEY ("ItemId");
```

## Create a Reactive Graph source for your database

Create a file named `my-source1.yaml` with the following Kubernetes resources. This includes storing the DB password as a Kubernetes secret and then referencing it from the Reactive Graph Source definition. You also need to list the tables you are interesting in watching as a comma separated list that includes the schema name. eg. `public.Table1,public.Table2`

```yml
apiVersion: v1
kind: Secret
metadata:
  name: pg-creds
type: Opaque
stringData:
  password: xxxxxxxxxxxxx
---
apiVersion: query.reactive-graph.io/v1
kind: Source
metadata:
  name: my-source1
spec:
  sourceType: PostgreSQL
  properties: 
  - name: database.hostname
    value: reactive-graph.postgres.database.azure.com
  - name: database.port
    value: "5432"
  - name: database.user
    value: postgres@reactive-graph
  - name: database.password
    valueFrom:
      secretKeyRef:
        name: pg-creds
        key: password
  - name: database.dbname
    value: my-db
  - name: tables
    value: public.Item

```

Now use kubectl to create the source

```bash
kubectl apply -f my-source1.yaml
```

## Create your first query

Create a file named `my-query1.yaml` with the following Kubernetes resources.

```yml
apiVersion: query.reactive-graph.io/v1
kind: ContinuousQuery
metadata:
  name: my-query1
spec:
  mode: query
  sources:    
    subscriptions:
      - id: my-source1
  query: > 
    MATCH 
      (i:Item {Category: 'A'})
    RETURN 
      i.ItemId AS Id, 
      i.Name as Name,
      i.Category as Category
```

Now use kubectl to deploy the query

```bash
kubectl apply -f my-query1.yaml
```

## Deploy the debug reactor

In order to view live results of the query we need a reactor that will provide a UI to see them, this is the purpose of the debug reactor.  Create a file named `debug-reactor.yaml` with the following Kubernetes resources.

```yml
apiVersion: query.reactive-graph.io/v1
kind: Reactor
metadata:
  name: debug
spec:
  reactorType: Debug
  queries:
    - queryId: my-query1
```

Now use kubectl to deploy the debug reactor

```bash
kubectl apply -f debug-reactor.yaml
```

In order to access the UI of the debug reactor from a local machine, we can forward the port to a local one.

```bash
kubectl port-forward services/debug-gateway 81:80 -n default
```

Now open your browser and navigate to `http://localhost:81`, where you should see a UI with menu options for each query on the left.  Select `my-query1`.

Use a tool such as [pgAdmin](https://www.pgadmin.org/) to add/remove/update rows in the `Item` table and you should see the debug reactor UI update in realtime with all the rows with Category = `A`.
