---
type: "docs"
title: "Continuous Queries"
linkTitle: "Continuous Queries"
weight: 20
description: >
    Continuous Queries for Solution Developers
---

**The Drasi Preview is a prototype and is only suitable for experimentation, not for production systems.**

## How to Use Continuous Queries
The [Overview](/solution-developer/overview) section called out 3 high-level approaches to using Drasi:

1. Observing Changes
1. Observing Conditions
1. Observing Collections

The following sections explore each of these in more detail and provide examples. 

### Observing Changes
Most systems that provide the capability for you as a Solution Developer to observe and react to change do so by propagating events (sometimes called notifications) that describe the creation, deletion, or update to some data entity that is modelled in the system. For example: 
- a Retail Operations system might generate create, update, and delete events related to:
  - Orders
  - Products
  - Customers
  - Deliveries
  - Invoices
- a Human Resources system might generate create, update, and delete events related to:
  - Employees
  - Teams
  - Contractors

Database change logs are an obvious examples of this approach; they simply output the details of the entity/record that was created, updated, or deleted. It is the responsibility of the consumer to decide what to do with those changes, including which events can be ignored and which to process.

But this is also the approach with many systems. Although they may contain events that are more related to the domain (not dependent on the underlying data model), the events are often of a fixed schema and represent a single change to a single element.

Drasi can be used to handle this simple case by:
1. Creating a Source to handle the source
2. Creating a Continuous Query that describes the elements you want
3. Reactions

The CQ in this instance would be very somple:

```
MATCH [:Order]
```

But if you wanted to resshape the output, it is a s simple as:

```
MATCH [o:Order]
RETURN 
  o.id AS OrderNumber,
  o.customerId AS CustomerId
  o.total AS OrderTotal
```


### Observing Conditions
More flexible systems allow consumers greater control over which events they received, this is often done using filters or rules. The consumer only reveis events that match the rules criteria. 

In RG you have the ability to specify 
- graph
- properties
- connects that dont exist in the source data
- aggregates

### Observing Collections
Each time a Source propagates a change into Drasi, the change is evaluated by each Continuous Query and the impact of the change on the query result is calculated. This means at any point in time, each Continuous Query has an accurate result, and for each change the COntinuous Query generates a descriptions of exactly which result elements where added, updated, or deleted.

As a Solution Developer, this enables you to think in terms of dynamic collections defined using rich declarative queries that you can incorporate into your solution.

It might help to think of these as 
For example, 

