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

Create a file named `my-source1.yaml` with the following resource. This includes storing the DB password as a Kubernetes secret and then referencing it from the Reactive Graph Source definition. You also need to list the tables you are interesting in watching as a comma separated list that includes the schema name. eg. `public.Table1,public.Table2`

```bash
kubectl create secret generic pg-creds --from-literal=password=xxxxx
```

```yml
apiVersion: v1
kind: Source
name: my-source1
spec:
  kind: PostgreSQL
  host: reactive-graph.postgres.database.azure.com
  port: 5432
  user: postgres@reactive-graph
  password:
    kind: Secret
    name: pg-creds
    key: password
  database: my-db2
  ssl: true
  tables:
    - public.Item
```

Now use `drasi apply` to create the source

```bash
drasi apply -f my-source1.yaml
```

## Create your first query

Create a file named `my-query1.yaml` with the following resource.

```yml
apiVersion: v1
kind: ContinuousQuery
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

Now use `drasi apply` to deploy the query

```bash
drasi apply -f my-query1.yaml
```

## Deploy the debug reaction

In order to view live results of the query we need a reaction that will provide a UI to see them, this is the purpose of the debug reaction.  Create a file named `debug-reaction.yaml` with the following resource.

```yml
apiVersion: v1
kind: Reaction
metadata:
  name: debug
spec:
  image: reaction-debug
  queries:
    my-query1:
  endpoints:
    gateway: 8080
```

Now use `drasi apply` to deploy the debug reaction

```bash
drasi apply -f debug-reaction.yaml
```

In order to access the UI of the debug reaction from a local machine, we can forward the port to a local one.

```bash
kubectl port-forward services/debug-gateway 8080:8080 -n default
```

Now open your browser and navigate to `http://localhost:8080`, where you should see a UI with menu options for each query on the left.  Select `my-query1`.

Use a tool such as [pgAdmin](https://www.pgadmin.org/) to add/remove/update rows in the `Item` table and you should see the debug reaction UI update in realtime with all the rows with Category = `A`.
