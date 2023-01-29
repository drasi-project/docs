---
type: "docs"
title: "Recipes"
linkTitle: "Recipes"
weight: 65
description: >
    Solving Problems with Drasi
---


## Write a Single Source Query

#### Problem


#### Solution 
```
apiVersion: query.reactive-graph.io/v1
kind: ContinuousQuery
metadata:
  name: room-comfort-level-calc
spec:
  mode: query
  sources:    
    subscriptions:
      - id: facilities
  query: > 
    MATCH 
      (r:Room) 
    RETURN 
      r.id As RoomId, 
      floor( 50 + (r.temp - 72) + (r.humidity - 42) + CASE WHEN r.co2 > 500 THEN (r.co2 - 500) / 25 ELSE 0 END ) AS ComfortLevel
```

#### Description

## Write a Multi Source Query

#### Problem


#### Solution 
```
apiVersion: query.reactive-graph.io/v1
kind: ContinuousQuery
metadata:
  name: orders-matched-vehicle
spec:
  mode: query
  sources:    
    subscriptions:
      - id: phys-ops
        nodes:
          - sourceLabel: Vehicle
          - sourceLabel: Zone
      - id: retail-ops
        nodes:
          - sourceLabel: Driver
          - sourceLabel: Order
          - sourceLabel: OrderPickup
        relations:
          - sourceLabel: PICKUP_DRIVER
          - sourceLabel: PICKUP_ORDER
    joins:
      - id: LOCATED_IN
        keys:
          - label: Vehicle
            property: ZoneId
          - label: Zone
            property: ZoneId
      - id: VEHICLE_TO_DRIVER
        keys:
          - label: Vehicle
            property: Plate
          - label: Driver
            property: plate
  query: > 
    MATCH 
      (o:Order {status:'ready'})<-[:PICKUP_ORDER]-(:OrderPickup)-[:PICKUP_DRIVER]->(d:Driver)-[:VEHICLE_TO_DRIVER]-(v:Vehicle)-[:LOCATED_IN]->(:Zone {type:'Curbside Queue'}) 
    RETURN o.id AS OrderNumber, d.name AS DriverName, v.Plate AS LicensePlate
```

#### Description

## Aggregating Queries

#### Problem


#### Solution 
```
apiVersion: query.reactive-graph.io/v1
kind: ContinuousQuery
metadata:
  name: floor-comfort-level-calc
spec:
  mode: query
  sources:    
    subscriptions:
      - id: facilities
  query: > 
    MATCH 
      (r:Room)-[:PART_OF]->(f:Floor) 
    RETURN 
      f.id As FloorId, avg(r.comfortLevel) AS ComfortLevel
```

#### Description
