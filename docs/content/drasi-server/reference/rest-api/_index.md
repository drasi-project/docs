---
type: "docs"
title: "REST API Reference"
linkTitle: "REST API"
weight: 10
description: "HTTP endpoints for managing Drasi Server"
---

# REST API Reference

Drasi Server exposes a REST API for managing sources, queries, and reactions.

## Base URL

```
http://localhost:8080/api/v1/
```

## API Documentation

Interactive API documentation is available at:

```
http://localhost:8080/api/v1/docs/
```

OpenAPI specification:

```
http://localhost:8080/api/v1/openapi.json
```

## Response Format

All responses follow this structure:

```json
{
  "status": "success",
  "message": "Operation completed",
  "data": { ... }
}
```

Error responses:

```json
{
  "status": "error",
  "message": "Error description",
  "data": null
}
```

## Health

### Check Health

```
GET /health
```

**Response:**

```json
{"status":"healthy"}
```

**Use for:** Load balancer health checks, monitoring.

## API Versions

### List API Versions

```
GET /api/versions
```

**Response:**

```json
{
  "versions": ["v1"]
}
```

## Instances

### List Instances

```
GET /api/v1/instances
```

**Response:**

```json
{
  "status": "success",
  "data": [
    {
      "id": "default",
      "sources_count": 2,
      "queries_count": 3,
      "reactions_count": 2
    }
  ]
}
```

## Sources

### List Sources

```
GET /api/v1/sources
```

**Response:**

```json
{
  "status": "success",
  "data": [
    {
      "id": "my-source",
      "kind": "postgres",
      "status": "running",
      "auto_start": true
    }
  ]
}
```

### Create Source

```
POST /api/v1/sources
Content-Type: application/json
```

**Request Body:**

```json
{
  "kind": "postgres",
  "id": "my-source",
  "auto_start": true,
  "host": "localhost",
  "port": 5432,
  "database": "mydb",
  "user": "postgres",
  "password": "secret",
  "tables": ["public.orders"]
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Source created",
  "data": {
    "id": "my-source",
    "kind": "postgres",
    "status": "starting"
  }
}
```

### Get Source

```
GET /api/v1/sources/{id}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "id": "my-source",
    "kind": "postgres",
    "status": "running",
    "config": { ... }
  }
}
```

### Delete Source

```
DELETE /api/v1/sources/{id}
```

**Response:**

```json
{
  "status": "success",
  "message": "Source deleted"
}
```

### Start Source

```
POST /api/v1/sources/{id}/start
```

**Response:**

```json
{
  "status": "success",
  "message": "Source started"
}
```

### Stop Source

```
POST /api/v1/sources/{id}/stop
```

**Response:**

```json
{
  "status": "success",
  "message": "Source stopped"
}
```

## Queries

### List Queries

```
GET /api/v1/queries
```

**Response:**

```json
{
  "status": "success",
  "data": [
    {
      "id": "my-query",
      "status": "running",
      "sources": ["my-source"]
    }
  ]
}
```

### Create Query

```
POST /api/v1/queries
Content-Type: application/json
```

**Request Body:**

```json
{
  "id": "my-query",
  "query": "MATCH (n:Order) RETURN n",
  "sources": [
    {"source_id": "my-source"}
  ],
  "auto_start": true
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Query created",
  "data": {
    "id": "my-query",
    "status": "starting"
  }
}
```

### Get Query

```
GET /api/v1/queries/{id}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "id": "my-query",
    "status": "running",
    "query": "MATCH (n:Order) RETURN n",
    "sources": ["my-source"]
  }
}
```

### Get Query Results

```
GET /api/v1/queries/{id}/results
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "results": [
      {"id": "1", "total": 100, "status": "pending"},
      {"id": "2", "total": 250, "status": "shipped"}
    ],
    "count": 2
  }
}
```

### Delete Query

```
DELETE /api/v1/queries/{id}
```

### Start Query

```
POST /api/v1/queries/{id}/start
```

### Stop Query

```
POST /api/v1/queries/{id}/stop
```

## Reactions

### List Reactions

```
GET /api/v1/reactions
```

**Response:**

```json
{
  "status": "success",
  "data": [
    {
      "id": "my-reaction",
      "kind": "log",
      "status": "running",
      "queries": ["my-query"]
    }
  ]
}
```

### Create Reaction

```
POST /api/v1/reactions
Content-Type: application/json
```

**Request Body:**

```json
{
  "kind": "log",
  "id": "my-reaction",
  "queries": ["my-query"],
  "auto_start": true
}
```

### Get Reaction

```
GET /api/v1/reactions/{id}
```

### Delete Reaction

```
DELETE /api/v1/reactions/{id}
```

### Start Reaction

```
POST /api/v1/reactions/{id}/start
```

### Stop Reaction

```
POST /api/v1/reactions/{id}/stop
```

## Instance-Specific Endpoints

For multi-instance configurations, use instance-prefixed routes:

### Sources
- `GET /api/v1/instances/{instanceId}/sources`
- `POST /api/v1/instances/{instanceId}/sources`
- `GET /api/v1/instances/{instanceId}/sources/{id}`
- `DELETE /api/v1/instances/{instanceId}/sources/{id}`
- `POST /api/v1/instances/{instanceId}/sources/{id}/start`
- `POST /api/v1/instances/{instanceId}/sources/{id}/stop`

### Queries
- `GET /api/v1/instances/{instanceId}/queries`
- `POST /api/v1/instances/{instanceId}/queries`
- `GET /api/v1/instances/{instanceId}/queries/{id}`
- `DELETE /api/v1/instances/{instanceId}/queries/{id}`
- `GET /api/v1/instances/{instanceId}/queries/{id}/results`
- `POST /api/v1/instances/{instanceId}/queries/{id}/start`
- `POST /api/v1/instances/{instanceId}/queries/{id}/stop`

### Reactions
- `GET /api/v1/instances/{instanceId}/reactions`
- `POST /api/v1/instances/{instanceId}/reactions`
- `GET /api/v1/instances/{instanceId}/reactions/{id}`
- `DELETE /api/v1/instances/{instanceId}/reactions/{id}`
- `POST /api/v1/instances/{instanceId}/reactions/{id}/start`
- `POST /api/v1/instances/{instanceId}/reactions/{id}/stop`

## Examples

### Create PostgreSQL Source

```bash
curl -X POST http://localhost:8080/api/v1/sources \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "postgres",
    "id": "orders-db",
    "host": "localhost",
    "port": 5432,
    "database": "ecommerce",
    "user": "postgres",
    "password": "secret",
    "tables": ["public.orders"]
  }'
```

### Create Query with Join

```bash
curl -X POST http://localhost:8080/api/v1/queries \
  -H "Content-Type: application/json" \
  -d '{
    "id": "order-details",
    "query": "MATCH (o:orders)-[:CUSTOMER]->(c:customers) RETURN o.id, c.name",
    "sources": [{"source_id": "orders-db"}],
    "joins": [{
      "id": "CUSTOMER",
      "keys": [
        {"label": "orders", "property": "customer_id"},
        {"label": "customers", "property": "id"}
      ]
    }]
  }'
```

### Create HTTP Reaction

```bash
curl -X POST http://localhost:8080/api/v1/reactions \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "http",
    "id": "webhook",
    "queries": ["order-details"],
    "base_url": "https://api.example.com",
    "routes": {
      "order-details": {
        "added": {
          "url": "/orders",
          "method": "POST"
        }
      }
    }
  }'
```
