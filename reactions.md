# Defining a reaction

A custom reaction can be deployed by packaging it as a docker container, and applying a custom resources as follows

```yaml
apiVersion: query.reactive-graph.io/v1
kind: Reactor
metadata:
  name: (your reaction name)
spec:
  reactorImage: (your docker image)
  queries:
    - queryId: (a query you want to react to)
      options: >
        some custom metadata for your query (optional)
   properties:
    - name: (some env variable to be mounted)
      value: (value of env variable)
    - name: (some secret env variable to be mounted)
      valueFrom:
        secretKeyRef:
          name: (name of secret)
          key: (name of key)
   endpoints:
    - name: (name of a port you want to expose (optional))
      port: 8080
   daprAppPort: 80 (optional override, default = 80)
```

- A volume will be mounted at `/etc/queries` where each file will be the name of a query and the contents of each file will be custom metadata.
- All the key/value pairs from `properties` will be mounted as environment variables.  You can also reference secrets and config maps as you would normally do with environment variables.
- Any entries in `endpoints` will create a network service with the name `<reaction name>-<endpoint name>` and map to the container port specified in `port`
- The Dapr server within your reaction should listen on port 80, this can be overridden with `daprAppPort`


## Examples

### Debug Reaction

```yaml
apiVersion: query.reactive-graph.io/v1
kind: Reactor
metadata:
  name: debug1
spec:
  reactorImage: reactive-graph/debug-reactor
  endpoints:
    - name: gateway
      port: 8080
  queries:
    - queryId: my-query1
```

### EventGrid Reaction

```yaml
apiVersion: query.reactive-graph.io/v1
kind: Reactor
metadata:
  name: eventgrid1
spec:
  reactorImage: reactive-graph/eventgrid-reactor
  properties:
    - name: EventGridUri
      value: https://reactive-graph-daniel.westus-1.eventgrid.azure.net/api/events
    - name: EventGridKey
      value: xxxx
  queries:
    - queryId: my-query1
```

### GraphQL Reaction

```yaml
apiVersion: query.reactive-graph.io/v1
kind: Reactor
metadata:
  name: gql1
spec:
  reactorImage: reactive-graph/graphql-reactor
  endpoints:
    - name: gateway
      port: 8080
  queries:
    - queryId: query1
      options: >
        type query1 {
          Category: String
          Id: Int
          Name: String
        }
```

### SignalR Reaction

```yaml
apiVersion: query.reactive-graph.io/v1
kind: Reactor
metadata:
  name: signalr1
spec:
  reactorImage: reactive-graph/signalr-reactor
  properties:
    - name: AzureSignalRConnectionString
      value: xxxxxx
  endpoints:
    - name: gateway
      port: 8080
  queries:
    - queryId: my-query1
```

### StoredProc Reaction

```yaml
apiVersion: query.reactive-graph.io/v1
kind: Reactor
metadata:
  name: storedproc1
spec:
  reactorImage: reactive-graph/storedproc-reactor
  properties:
    - name: SqlCommand
      value: insert into "Item" ("ItemId", "Name", "Category") values (@Id + 1000, @Name, @Category)
    - name: DatabaseHostname
      value: reactive-graph.postgres.database.azure.com
    - name: DatabasePort
      value: "5432"
    - name: DatabaseUser
      value: postgres@reactive-graph
    - name: DatabaseDbname
      value: my-db2
    - name: DatabasePassword
      value: xxxxx
  queries:
    - queryId: my-query1
```