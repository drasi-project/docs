---
type: "docs"
title: "Drasi Custom Functions"
linkTitle: "Drasi Custom Functions"
weight: 40
description: >
    Extended functions for continuous query processing
---

Drasi is not simply running graph queries across data, it is using the Cypher Query Language as a convenient way to express the data you want to observe for changes. Drasi provides the following functions that extend the base Cypher Query Language in order to meet its needs for detecting and reacting to change (or an absence of change).

| Function                | Description                           |
|-------------------------|---------------------------------------|
| **[METADATA FUNCTIONS](#drasi-metadata-functions)** ||
| [drasi.changeDateTime](#drasichangedatetime) | Gets a ZONED DATETIME of when a specified element was changed |
| **[DELTA FUNCTIONS](#drasi-delta-functions)** ||
| [drasi.beforeChange](#drasibeforechange) | Gets the value of an expression within a query as it was before the current change |
| [drasi.previousDistinctValue](#drasipreviousdistinctvalue) | Gets the previous value of an expression within a query that was different from the current value  |
| **[LIST FUNCTIONS](#drasi-list-functions)** ||
| [drasi.listMin](#drasilistmin)  | Returns the minimum value contained in a LIST |
| [drasi.listMax](#drasilistmax)  | Returns the maximum value contained in a LIST |
| **[TEMPORAL FUNCTIONS](#drasi-temporal-functions)** ||
| [drasi.getVersionByTimestamp](#drasigetversionbytimestamp) | Retrieves the version of a specified Element as it was at a specified point in time |
| [drasi.getVersionsByTimeRange](#drasigetversionsbytimerange) | Retrieves a LIST of all versions of a specified Element that existed within a specified time range |
| **[FUTURE FUNCTIONS](#drasi-future-functions)** ||
| [drasi.trueLater](#drasitruelater) | Evaluates a BOOLEAN expression at a specified later time |
| [drasi.trueUntil](#drasitrueuntil) | Evaluates if a BOOLEAN expression remains TRUE until a specified later time |
| [drasi.trueFor](#drasitruefor) | Evaluates if a BOOLEAN expression remains TRUE for a specified duration |
| **[STATISTICAL FUNCTIONS](#drasi-statistical-functions)** ||
| [drasi.linearGradient](#drasilinearGradient) | Fits a straight line to a set of X and Y coordinates and returns the slope of that line |


## Drasi METADATA Functions

### drasi.changeDateTime()
The `drasi.changeDateTime` function returns the ZONED DATETIME of when the provided element was last changed.

#### Syntax
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


## Drasi DELTA Functions

### drasi.beforeChange()
The `drasi.beforeChange` function returns the value of an expression within a query as it was before the current change.

#### Syntax
```cypher
drasi.beforeChange(expression, default)
```

#### Arguments

| Name | Type | Description |
|-------------------------|-----------------------|----------------|
| expression | EXPRESSION | An expression that resolves to a scalar value.|
| default (optional) | EXPRESSION | The default value, if there has not yet been a value for this expression before the current change.|

#### Returns

The `drasi.beforeChange` function returns the value of the given expression as it was before the current change.

#### Example

For example, if we wanted to know when any `Task` changes from the `pending` state to the `active` state. This could be achieved with the following clause:

```sql
WHERE t.state = 'active' AND drasi.beforeChange(t.state) = 'pending'
```

In this case:
 - When the `Task` transitions from `pending` to `active`, this clause will evaluate to `true`
 - When the `Task` transitions from `cancelled` to `active`, this clause will evaluate to `false`
 - When the `Task` had already transitioned from `pending` to `active` but subsequently the `tag` field was changed but the `state` field remained as `active`, this clause will evaluate to `false` because the value of `t.state` was also `active` prior to the final change


### drasi.previousDistinctValue()
The `drasi.previousDistinctValue` function returns the previous value of an expression within a query that was different from the current value of that expression. 

#### Syntax
```cypher
drasi.previousDistinctValue(expression, default)
```

#### Arguments

| Name | Type | Description |
|-------------------------|-----------------------|----------------|
| expression | EXPRESSION | An expression that resolves to a scalar value.|
| default (optional) | EXPRESSION | The default value, if there has not yet been a value for this expression before the current change.|

#### Returns

The `drasi.previousDistinctValue` function returns the previous value of an expression within a query that was different from the current value of that expression.


#### Example

For example, if we wanted to keep a result set of all the `Tasks` that are currently in the `active` state but which the immediately previous state was `pending`. This could be achieved with the following clause:

```sql
WHERE t.state = 'active' AND drasi.previousDistinctValue(t.state) = 'pending'
```

In this case:
 - When the `Task` transitions from `pending` to `active`, this clause will evaluate to `true`
 - When the `Task` transitions from `cancelled` to `active`, this clause will evaluate to `false`
 - When the `Task` had already transitioned from `pending` to `active` but subsequently the `tag` field was changed but the `state` field remained as `active`, this clause will evaluate to `true` because the previously distinct value of `t.state` was `pending` even though it was not altered by the final change


## Drasi LIST Functions
Drasi LIST functions simplify some LIST handling operations that are common in Drasi Continuous Queries.

### drasi.listMin()
The `drasi.listMin` function returns the minimum value contained in a LIST. Null values are ignored.

#### Syntax
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

#### Syntax
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

A Continuous Query containing TEMPORAL functions must have a temporal Element Index enabled.

### drasi.getVersionByTimestamp()
The `drasi.getVersionByTimestamp` function returns the version of a specified Element as it was at the specified time.

The Continuous Query containing the `drasi.getVersionByTimestamp` function must have a temporal Element Index enabled.

#### Syntax
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

#### Syntax
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
The `drasi.trueLater` function makes it possible to write Continuous Queries that evaluate a BOOLEAN expression at a specific point in time, instead of at the point in time when the change being processed occurred.  

#### Syntax
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
If the *timestamp* is **less than or equal to** the time associated with the change being processed (i.e. the desired time has already occurred), `drasi.trueLater` will evaluate and return the value of *expression*. Otherwise, `drasi.trueLater` will return the special value `drasi.awaiting` indicating the Drasi cannot yet evaluate the expression, and schedules the solution currently being evaluated to be re-evaluated at the time specified by *timestamp*.

More formally:

| Conditions | Schedule | Return |
|--|--|--|
| timestamp =< change_time AND expression == TRUE | n/a | TRUE |
| timestamp =< change_time AND expression == FALSE | n/a | FALSE |
| timestamp > change_time | queue re-evaluation | drasi.awaiting |

### drasi.trueUntil()
The `drasi.trueUntil` function makes it possible to write Continuous Queries that evaluate whether a BOOLEAN expression remains TRUE at least until a specific point in time.  

#### Syntax
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
- If the *timestamp* is **less than or equal to** the time associated with the change being processed (i.e. the desired time has already occurred), `drasi.trueUntil` will evaluate and return the value of *expression*. 
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
The `drasi.trueFor` function makes it possible to write Continuous Queries that evaluate whether a BOOLEAN expression remains TRUE for at least a period of time from the time at which the change being evaluated occurred.  

#### Syntax
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
- If the time when *expression* became TRUE with *duration* added to it is **less than or equal to** the time associated with the change being processed (i.e. the desired time has already occurred), `drasi.trueUntil` will evaluate and return the value of *expression*. 
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

#### Syntax
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