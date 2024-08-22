---
type: "docs"
title: "Continuous Query Syntax"
linkTitle: "Continuous Query Syntax"
weight: 55
description: >
    Writing Continuous Queries
---

Continuous Queries are written using a subset of the Open Cypher Graph Query Language. If you are new to Open Cypher, here are some useful references to get started:
- [Getting Started](https://opencypher.org/)
- [Language Reference](https://neo4j.com/docs/cypher-manual/current/)
- [Cheat Sheet](https://neo4j.com/docs/cypher-cheat-sheet/current/)

Drasi currently supports the following subset of the Cypher Graph Query Language:
- MATCH clause:
  - Path patterns containing:
    - nodes and relations
    - variable binding
    - label expressions
    - property key-value expressions
    - WHERE clauses
    - Only fixed length MATCH paths with non-anonymous nodes and relations
- WITH clause
- WHERE clause
- RETURN clause:
  - Aliases on RETURN values
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

  *These functions are implemented by closely following the guidelines and specifications outlined in version 9 of the [OpenCypher Cypher Query Language Reference](https://s3.amazonaws.com/artifacts.opencypher.org/openCypher9.pdf).* 
  - Scalar: 
    - elementId, head, last, timestamp
    - char_length, character_length, size
    - toInteger, toIntegerOrNull*, toFloat, toFloatOrNull*, toBoolean, toBooleanOrNull*
  - Aggregating: count, sum, avg, min, max in both **WITH** and **RETURN** clauses
  - List: reduce, tail, range 
  - Numeric: abs, ceil, floor, rand, round, sign
  - String: left, ltrim, replace, reverse, right, rtrim, split, substring, toLower, toString, toStringOrNull*, toUpper, trim
  - Temporal: 
    - *These temporal functions are implemented based on [Neo4j's documentation (version 4.4)](https://neo4j.com/docs/cypher-manual/4.4/functions/temporal/)*
    - Instant: date, datetime, localdatetime, loocaltime, time
    - Duration: duration, duration.between, duration.inMonths, duration.inDays, duration.inSeconds
  - CASE expressions:
    - simple and generic forms

**: Functions that are not documented in the official OpenCypher documentation. These functions are implemented based on the version 4.4 of the Neo4j's Cypher manual*
# Drasi Functions
Drasi provides the following functions that extend the base Cypher Query Language. Each of these functions is described in detail in the linked sections below.

| Function                | Description                           |
|-------------------------|---------------------------------------|
| **[LIST FUNCTIONS](#drasi-list-functions)** ||
| [drasi.listMin](#drasilistmin)  | Returns the minimum value contained in a LIST |
| [drasi.listMax](#drasilistmax)  | Returns the maximum value contained in a LIST |
| **[TEMPORAL FUNCTIONS](#drasi-temporal-functions)** ||
| [drasi.changeDateTime](#drasichangedatetime) | Gets a ZONED DATETIME of when a specified element was changed |
| [drasi.getVersionByTimestamp](#drasigetversionbytimestamp) | Retrieves the version of a specified Element as it was at a specified point in time |
| [drasi.getVersionsByTimeRange](#drasigetversionsbytimerange) | Retrieves a LIST of all versions of a specified Element that existed within a specified time range |
| **[FUTURE FUNCTIONS](#drasi-future-functions)** ||
| [drasi.trueLater](#drasitruelater) | Evaluates a BOOLEAN expression at a specified later time |
| [drasi.trueUntil](#drasitrueuntil) | Evaluates if a BOOLEAN expression remains TRUE until a specified later time |
| [drasi.trueFor](#drasitruefor) | Evaluates if a BOOLEAN expression remains TRUE for a specified duration |

## Drasi LIST Functions
Drasi LIST functions simplify some LIST handling operations that are common in Drasi Continuous Queries.

### drasi.listMin()
The `drasi.listMin` function returns the minimum value contained in a LIST. Null values are ignored.

#### Synax
```cypher
drasi.listMin(list)
```

#### Arguments
The `drasi.listMin` function accepts one argument:

| Name | Type | Description |
|-------------------------|-----------------------|----------------|
| list | LIST | The list of values from which to return the minimum value.|

#### Returns

The `drasi.listMin` function returns a single value, which is the minimum value from the provided list. Determination of which value is minimum depends on the types of values in the list. For example:

- drasi.listMin([45, 33, 66]) returns 33
- drasi.listMin(["banana", "apple", "peach"]) returns "apple"
- drasi.listMin(null) returns null

### drasi.listMax()
The `drasi.listMax` function returns the maximum value contained in a LIST. Null values are ignored.

#### Synax
```cypher
drasi.listMax(list)
```

#### Arguments
The `drasi.listMax` function accepts one argument:

| Name | Type | Description |
|-------------------------|-----------------------|----------------|
| list | LIST | The list of values from which to return the maximum value.|

#### Returns

The `drasi.listMax` function returns a single value, which is the maximum value from the provided list. Determination of which value is maximum depends on the types of values in the list. For example:

- drasi.listMax([45, 33, 66]) returns 66
- drasi.listMax(["banana", "apple", "peach"]) returns "peach"
- drasi.listMax(null) returns null

## Drasi TEMPORAL Functions
Drasi TEMPORAL functions make it possible to write Continuous Queries that use previous values of Nodes and Relations in the logic of the query. 

A Continuous Query containing FUTURE functions must have a temporal Element Index enabled.

### drasi.changeDateTime()
The `drasi.changeDateTime` function returns the ZONED DATETIME of when the provided element was changed.

#### Synax
```cypher
drasi.changeDateTime(element)
```

#### Arguments
The `drasi.changeDateTime` function accepts one argument:

| Name | Type | Description |
|-------------------------|-----------------------|----------------|
| element | ELEMENT | A Node or Relation.|

#### Returns

The `drasi.changeDateTime` function returns a ZONED DATETIME. 

### drasi.getVersionByTimestamp()
The `drasi.getVersionByTimestamp` function returns the version of a specified Element as it was at the specified time.

The Continuous Query containing the `drasi.getVersionByTimestamp` function must have a temporal Element Index enabled.

#### Synax
```cypher
drasi.getVersionByTimestamp(element, timestamp)
```

#### Arguments
The `drasi.getVersionByTimestamp` function accepts two arguments:

| Name | Type | Description |
|-------------------------|-----------------------|----------------|
| element | ELEMENT | A Node or Relation.|
| timestamp | DATE, DATETIME, or INTEGER | The timestamp used to lookup the value of the specified Element. |

#### Returns

The `drasi.getVersionByTimestamp` function returns an Element (Node or Relation). 

### drasi.getVersionsByTimeRange()
The `drasi.getVersionsByTimeRange` function returns a LIST containing all the versions of a specified Element that exist between two points in time.

The Continuous Query containing the `drasi.getVersionsByTimeRange` function must have a temporal Element Index enabled.

#### Synax
```cypher
drasi.getVersionsByTimeRange(element, from_timestamp, to_timestamp, include_initial_version)
```

#### Arguments
The `drasi.getVersionsByTimeRange` function accepts four arguments:

| Name | Type | Description |
|-------------------------|-----------------------|----------------|
| element | ELEMENT | A Node or Relation.|
| from_timestamp | DATE, DATETIME, or INTEGER | The start of the time range. |
| to_timestamp | DATE, DATETIME, or INTEGER | The end of the time range. |
| include_initial_version | BOOLEAN | If TRUE, tells Drasi to also include the Element version prior to *from_timestamp* if *from_timestamp* is less than the timestamp of the first version that would normally be included in the range. This enables you to ensure you have the value of the Element as it was the start of the specified range. |

#### Returns

The `drasi.getVersionsByTimeRange` function returns a LIST of Elements (Node or Relation). 

## Drasi FUTURE Functions
Drasi FUTURE functions makes it possible to use Continuous Queries in situations where it is important to react to the  **absence** of change. For example, if it is important to know when Invoices become 10 days overdue, or which customers haven't logged in to their account for over 2 weeks. Both of these situations (depending on the database schema) might only occur as a result of no change being made to the Invoice or Customer record.

### drasi.trueLater()
The `drasi.trueLater` function makes it possible to write Continuous Queries that evaluate a BOOLEAN expression at a specific point in time, instead of at the point in time when the change being processed occured.  

#### Synax
```cypher
drasi.trueLater(expression, timestamp)
```

#### Arguments
The `drasi.trueLater` function accepts two arguments:

| Name | Type | Description |
|-------------------------|-----------------------|----------------|
| expression | BOOLEAN expression | The BOOLEAN expression to evaluate.|
| timestamp | DATE, DATETIME, or INTEGER | The time at which the *expression* should be evaluated. |

#### Returns
If the *timestamp* is **less than or equal to** the time associated with the change being processed (i.e. the desired time has already occured), `drasi.trueLater` will evaluate and return the value of *expression*. Otherwise, `drasi.trueLater` will return the special value `drasi.awaiting` indicating the Drasi cannot yet evaluate the expression, and schedules the solution currently being evaluated to be re-evaluated at the time specified by *timestamp*.

More formally:

| Conditions | Schedule | Return |
|--|--|--|
| timestamp =< change_time AND expression == TRUE | n/a | TRUE |
| timestamp =< change_time AND expression == FALSE | n/a | FALSE |
| timestamp > change_time | queue re-evaluation | drasi.awaiting |

### drasi.trueUntil()
The `drasi.trueUntil` function makes it possible to write Continuous Queries that evaluate whether a BOOLEAN expression remains TRUE at least until a specific point in time.  

#### Synax
```cypher
drasi.trueUntil(expression, timestamp)
```

#### Arguments
The `drasi.trueUntil` function accepts two arguments:

| Name | Type | Description |
|-------------------------|-----------------------|----------------|
| expression | BOOLEAN expression | The BOOLEAN expression to evaluate.|
| timestamp | DATE, DATETIME, or INTEGER | The time until which the expression should remain TRUE. |

#### Returns
- If the *timestamp* is **less than or equal to** the time associated with the change being processed (i.e. the desired time has already occured), `drasi.trueUntil` will evaluate and return the value of *expression*. 
- Otherwise, if *expression* evaluates to TRUE, `drasi.trueUntil` will return the special value `drasi.awaiting` indicating that Drasi has scheduled the solution currently being evaluated to be re-evaluated (for remaining TRUE) at the time specified by *timestamp*.
- If, at any time before *timestamp*, expression is found to be FALSE, `drasi.trueUntil` returns FALSE and cancels any currently scheduled reprocessing for the current solution.

More formally:

| Conditions | Schedule | Return |
|--|--|--|
| timestamp =< change_time AND expression == TRUE | n/a | TRUE |
| timestamp =< change_time AND expression == FALSE | remove queued re-evaluation (if any) | FALSE |
| timestamp > change_time AND expression == TRUE | queue re-evaluation at timestamp | drasi.awaiting |
| timestamp > change_time AND expression == FALSE | remove queued re-evaluation (if any) | FALSE |

### drasi.trueFor()
The `drasi.trueFor` function makes it possible to write Continuous Queries that evaluate whether a BOOLEAN expression remains TRUE for at least a period of time from the time at which the change being evaluated occured.  

#### Synax
```cypher
drasi.trueFor(expression, duration)
```

#### Arguments
The `drasi.trueFor` function accepts two arguments:

| Name | Type | Description |
|-------------------------|-----------------------|----------------|
| expression | BOOLEAN expression | The BOOLEAN expression to evaluate.|
| duration | DURATION | The duration for which the *expression* should remain TRUE. |

#### Returns
- If the time when *expression* became TRUE with *duration* added to it is **less than or equal to** the time associated with the change being processed (i.e. the desired time has already occured), `drasi.trueUntil` will evaluate and return the value of *expression*. 
- Otherwise, if *expression* evaluates to TRUE, `drasi.trueUntil` will return the special value `drasi.awaiting` indicating that Drasi has scheduled the solution currently being evaluated to be re-evaluated (for remaining TRUE) at the time specified by the current change time plus the *duration*.
- If, at any time before *duration* passes, expression is found to be FALSE, `drasi.trueUntil` returns FALSE and cancels any currently scheduled reprocessing for the current solution.

More formally:

| Conditions | Schedule | Return |
|--|--|--|
| expression_true_time == NULL AND expression == TRUE | queue re-evaluation at change_time + duration | drasi.awaiting |
| expression_true_time == NULL AND expression == FALSE | n/a | FALSE |
| expression_true_time + duration =< change_time AND expression == TRUE | n/a | TRUE |
| expression_true_time + duration =< change_time AND expression == FALSE | remove queued re-evaluation (if any) | FALSE |
| expression_true_time + duration > change_time AND expression == TRUE | n/a | drasi.awaiting |
| expression_true_time + duration > change_time AND expression == FALSE | remove queued re-evaluation (if any) | FALSE |

## Drasi STATISTICAL Functions

### drasi.linearGradient()
The `drasi.linearGradient` function is an aggregating function that fits a straight line to a set of X and Y coordinates, and returns the slope of that line.  As values are added, removed or updated, the line will be adjusted to reflect the relationship between the X and Y values.  The slope of the line can be used to predict a value for Y given a known value of X, by multiplying the slope by the X value.

#### Synax
```cypher
drasi.linearGradient(x, y)
```

#### Arguments
The `drasi.linearGradient` function accepts two arguments:

| Name | Type | Description |
|-------------------------|-----------------------|----------------|
| x | expression | An expression that returns the X value (independent variable) |
| y | expression | An expression that returns the Y value (dependent variable) |

#### Returns
The slope or gradient of the line that best fits the current data set. This can be used to predict the value of Y for a given value of X by multiplying it by the known X value.

#### Example

The following example will return the gradient of each line, given the known points associated with that line.

```cypher
MATCH
  (l:Line)-[:HAS]->(p:Point)
RETURN
  l.id as LineId,
  drasi.linearGradient(p.x, p.y) as Gradient
```

