---
type: "docs"
title: "Cypher Query Language"
linkTitle: "Cypher"
weight: 20
description: >
    openCypher subset supported by Drasi
related:
  concepts:
    - title: "Continuous Queries"
      url: "/concepts/continuous-queries/"
  tutorials:
    - title: "Getting Started (Kubernetes)"
      url: "/drasi-kubernetes/getting-started/"
    - title: "Getting Started (Server)"
      url: "/drasi-server/getting-started/"
  howto:
    - title: "Write Continuous Queries (Kubernetes)"
      url: "/drasi-kubernetes/how-to-guides/write-continuous-queries/"
  reference:
    - title: "Drasi Custom Functions"
      url: "/reference/query-language/drasi-custom-functions/"
    - title: "GQL Reference"
      url: "/reference/query-language/gql/"
---

{{< term "Continuous Query" "Continuous Queries" >}} are written using a subset of the {{< term "openCypher" "Cypher Query Language" >}}. If you are new to Cypher, Neo4J the original creators of the Cypher Query Language, have a lot of resources to help you understand, learn, and try Cypher, including:
  - [Getting Started](https://neo4j.com/docs/getting-started/cypher-intro/)
  - [Cheat Sheet](https://neo4j.com/docs/cypher-cheat-sheet/current/)

## Cypher Support
Drasi currently supports the following subset of the Cypher Query Language:
- MATCH clause:
  - Path patterns containing:
    - {{< term "Node" "nodes" >}} and {{< term "Relationship" "relations" >}}
    - variable binding
    - label expressions
    - property key-value expressions
    - WHERE clauses
    - Only fixed length MATCH paths with non-anonymous nodes and relations
- WITH clause
- WHERE clause
- RETURN clause
  - Aliases on RETURN values
  - Non-aggregated RETURN values are automatically used as aggregation groups
- Query Parameters
- Data Types:
  - Basic: BOOLEAN, FLOAT, INTEGER, STRING, NULL
  - Temporal: DATE, DURATION, LOCAL DATETIME, LOCAL TIME, ZONED DATETIME, ZONED TIME
  - Structured: LIST, MAP
- Operators:
  - Property: . 
  - Boolean: AND, OR, NOT
  - Mathematical: +, -, *, /, %, ^
  - Comparison: =, !=, >, >=, <, <=, IS NULL, IS NOT NULL
  - String: + (concatenation)
  - Temporal: +, -
  - Map: ., []
  - List: +, IN, []
- Functions:
  - Scalar: 
    - elementId, head, last, timestamp
    - char_length, character_length, size
    - toInteger, toIntegerOrNull, toFloat, toFloatOrNull, toBoolean, toBooleanOrNull
  - Aggregating: count, sum, avg, min, max in both WITH and RETURN clauses
  - List: reduce, tail, range 
  - Numeric: abs, ceil, floor, rand, round, sign
  - String: left, ltrim, replace, reverse, right, rtrim, split, substring, toLower, toString, toStringOrNull, toUpper, trim
  - Temporal: 
    - Instant: date, datetime, localdatetime, loocaltime, time
    - Duration: duration, duration.between, duration.inMonths, duration.inDays, duration.inSeconds
  - CASE expressions:
    - simple and generic forms

*Functions that are not documented in the openCypher [Cypher Query Language Reference](https://s3.amazonaws.com/artifacts.opencypher.org/openCypher9.pdf), are based on [Neo4js Cypher version 4.4 documentation](https://neo4j.com/docs/cypher-manual/4.4/functions/temporal/)*

## Identifier Escaping

In Cypher, identifiers such as labels, property names, and variable names must follow certain naming conventions. However, when working with data sources that contain identifiers with special characters (such as spaces, dashes, or other symbols), or when you need to avoid conflicts with reserved words, you can use backticks (`) to escape these identifiers.

This is particularly common when working with data sources that have labels or property names containing dashes, or when your data contains identifiers that match Cypher reserved words like `MATCH`, `WHERE`, `RETURN`, etc. For example, if you have a label called `Customer-Account`, a property named `first-name`, or a label that conflicts with a reserved word like `Match`, you would need to escape them using backticks.

### Examples

```cypher
// Escaping a label with dashes
MATCH (c:`Customer-Account`)
RETURN c

// Escaping property names with special characters
MATCH (p:Person)
RETURN p.`first-name`, p.`last-name`

// Escaping identifiers that conflict with reserved words
MATCH (m:`Match`)  // 'Match' conflicts with the MATCH keyword
RETURN m.`return`  // 'return' conflicts with the RETURN keyword

// Escaping variable names (though this is less common)
MATCH (`customer-node`:Customer)
RETURN `customer-node`.name
```

Without backticks, these identifiers would cause syntax errors as Cypher would interpret the dashes as subtraction operators or mistake the identifiers for reserved keywords.