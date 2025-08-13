---
type: "docs"
title: "Graph Query Language (GQL)"
linkTitle: "GQL"
weight: 30
description: >
    Graph Query Language support in Drasi
---

Drasi supports a subset of the [Graph Query Language (GQL)](https://www.iso.org/standard/76120.html) ISO standard for querying graph databases. This subset includes the core statements and functions needed for continuous query processing.

## GQL Support

### MATCH

The `MATCH` statement expands the current working table with matches from a graph pattern. It allows you to describe what you are looking for using ASCII art syntax where round brackets represent nodes and arrows represent relationships. When executed, `MATCH` finds all instances of the specified pattern in the graph and adds them to the working table.

**Supported Path Patterns:**
- Fixed length paths with non-anonymous nodes and relations
- Variable binding for nodes and relationships
- Label expressions
- Property key-value expressions
- Only fixed length MATCH paths with non-anonymous nodes and relations

#### Arguments

| Name | Description |
|------|-------------|
| pattern | A graph pattern consisting of nodes and relationships |
| condition | An optional WHERE condition to filter matches |

#### Basic node matching

To match any node in the graph, use empty round brackets:

```gql
MATCH (n)
RETURN n
```

#### Matching nodes with labels

To match nodes with specific labels, specify the label after a colon:

```gql
MATCH (v:Vehicle)
RETURN v
```

#### Matching relationships

To match relationships between nodes, use square brackets with an arrow:

```gql
MATCH (v:Vehicle)-[r:LOCATED_IN]->(z:Zone)
RETURN v, r, z
```

#### Property matching

You can match nodes and relationships based on their properties:

```gql
MATCH (v:Vehicle {color: 'Red'})
RETURN v
```



### WHERE

The `WHERE` clause computes a new binding table by selecting records from the current working table that fulfill the specified search condition. For each record in the current working table, it evaluates the search condition and includes the record in the result only if the condition evaluates to true.

#### Syntax

```gql
WHERE condition
```

#### Arguments

| Name | Description |
|------|-------------|
| condition | A boolean search condition that determines which records to include |

#### Basic filtering with WHERE

Filter nodes based on property values:

```gql
MATCH (v:Vehicle)
WHERE v.color = 'Red'
RETURN v
```

#### Complex conditions

Use logical operators to combine multiple conditions:

```gql
MATCH (v:Vehicle)
WHERE v.color = 'Red' AND v.year > 2020
RETURN v
```

#### WHERE with relationships

Filter based on relationship patterns:

```gql
MATCH (v:Vehicle)-[r:LOCATED_IN]->(z:Zone)
WHERE z.type = 'Parking' AND v.color = 'Blue'
RETURN v, z
```

#### Using WHERE with computed expressions

Filter based on calculated values:

```gql
MATCH (v:Vehicle)
WHERE 2024 - v.year < 5
RETURN v.make, v.model
```

### LET

The `LET` statement adds columns to the current working table. It defines new variables using a comma-separated list of variable definitions, where each definition assigns a value expression result to a binding variable.

#### Syntax

```gql
LET variable = expression [, variable = expression]*
```

#### Arguments

| Name | Description |
|------|-------------|
| variable | The name of the new variable to create |
| expression | An expression that computes the value for the variable |

#### Basic variable definition

Define a simple computed variable:

```gql
MATCH (v:Vehicle)
LET isRed = v.color = 'Red'
RETURN v.color, isRed
```

#### Multiple variable definitions

Define multiple variables in a single LET statement:

```gql
MATCH (v:Vehicle)
LET isRed = v.color = 'Red',
    age = 2024 - v.year,
    category = CASE WHEN v.year > 2020 THEN 'New' ELSE 'Used' END
RETURN v, isRed, age, category
```

### FILTER

The `FILTER` statement selects a subset of the records of the current working table. It updates the current working table to include only the records that satisfy the specified search condition.

FILTER is a standalone statement that removes rows from the current working table based on a specified condition. While GQL still supports a WHERE clause for filtering during the MATCH phase (similar to openCypher), the FILTER statement provides additional flexibility by allowing you to filter the results after previous steps. It does not create a new table; instead, it updates the working table. Unlike openCypher's WHERE clause, which is tied to a MATCH or WITH, GQL's FILTER can be applied independently at various points in the query pipeline.

#### Syntax

```gql
FILTER condition
```

#### Arguments

| Name | Description |
|------|-------------|
| condition | A boolean expression that determines which rows to keep |

#### Basic filtering

Filter rows based on simple conditions:

```gql
MATCH (v:Vehicle)
FILTER v.color = 'Red'
RETURN v.color, v.make
```

#### Complex conditions

Use logical operators for complex filtering:

```gql
MATCH (v:Vehicle)
FILTER v.color = 'Red' AND v.year > 2020
RETURN v.color, v.make, v.year
```

#### Filtering with computed values

Filter based on computed expressions:

```gql
MATCH (v:Vehicle)
LET age = 2024 - v.year
FILTER age < 5
RETURN v.make, v.model, age
```

#### Multiple FILTER statements

Use multiple FILTER statements for sequential filtering:

```gql
MATCH (v:Vehicle)-[:LOCATED_IN]->(z:Zone)
FILTER v.color = 'Red'
FILTER z.type = 'Parking'
RETURN v.make, z.name
```

### YIELD

The `YIELD` clause selects and renames columns of a binding table. It projects specific columns from the current working table by specifying yield items, where each yield item consists of a field name and an optional alias. When no alias is provided, the field name must be a binding variable and is used as both the source and target name.

#### Syntax

```gql
YIELD field_name [AS alias] [, field_name [AS alias]]*
```

#### Arguments

| Name | Description |
|------|-------------|
| field_name | The name of the field/column to project from the current working table |
| alias | An optional alias name for the projected field |

#### Basic projection with aliases

Project specific field references with aliases:

```gql
MATCH (v:Vehicle)-[e:LOCATED_IN]->(z:Zone)
YIELD v.color AS color, z.type AS type
RETURN color, type
```

#### Projection with binding variables

When yielding binding variables directly, no alias is required:

```gql
MATCH (v:Vehicle)-[e:LOCATED_IN]->(z:Zone)
YIELD v, z
RETURN v.color, z.type
```

#### Limiting scope

Only the columns specified in YIELD are available to subsequent clauses:

```gql
MATCH (v:Vehicle {color: 'Red'})-[:LOCATED_IN]->(z:Zone)
YIELD v.make AS make, z.name AS name
FILTER name = 'Parking Lot'
RETURN make
```

### RETURN

The `RETURN` statement performs projection and aggregation of the current working table. It returns specific columns using a return item list, where each return item consists of an aggregating value expression with an optional alias.

#### Syntax

```gql
RETURN expression [AS alias] [, expression [AS alias]]*
[GROUP BY expression [, expression]*]
```

#### Arguments

| Name | Description |
|------|-------------|
| expression | Column reference or computed expression to include in the result |
| alias | Optional alias name for the expression |

#### Basic projection

Return specific columns from the working table:

```gql
MATCH (v:Vehicle)
RETURN v.make, v.model, v.year
```

#### Projection with aliases

Rename columns in the output using aliases:

```gql
MATCH (v:Vehicle)
RETURN v.make AS manufacturer, v.model AS vehicleModel
```

#### Computed expressions

Return computed values:

```gql
MATCH (v:Vehicle)
RETURN v.make, v.model, 2024 - v.year AS age
```

#### Aggregation

Use aggregate functions to summarize data:

```gql
MATCH (v:Vehicle)
RETURN v.color, count(v) AS vehicle_count
```


### GROUP BY

The `GROUP BY` clause defines the set of grouping keys to be used during grouping operations. It specifies which expressions should be used to partition the data into groups for aggregation. The clause can contain a list of grouping elements or an empty grouping set for overall aggregation.

#### Syntax

```gql
GROUP BY grouping_element [, grouping_element]*
```

or for empty grouping:

```gql  
GROUP BY ()
```

#### Arguments

| Name | Description |
|------|-------------|
| grouping_element | An expression that specifies a grouping key |
| () | Empty grouping set for grand totals and overall aggregation |

#### Implicit grouping

When no `GROUP BY` clause is specified, all non-aggregated expressions in the RETURN clause automatically become grouping keys:

```gql
MATCH (v:Vehicle)
RETURN v.color, v.make, count(v) AS vehicle_count
```

This query implicitly groups by `v.color` and `v.make`.

#### Explicit grouping

When a `GROUP BY` clause is present, only the listed expressions are used as grouping keys:

```gql
MATCH (v:Vehicle)
RETURN v.color AS color, count(v) AS vehicle_count
GROUP BY color
```

#### Grouping constraints

With explicit `GROUP BY`, any non-aggregated column in `RETURN` must be included in the `GROUP BY` clause:

```gql
// Valid: make is in both RETURN and GROUP BY
MATCH (v:Vehicle)
RETURN v.make, count(v) AS vehicle_count  
GROUP BY v.make

// Invalid: color is in RETURN but not in GROUP BY
MATCH (v:Vehicle)
RETURN v.color, v.make, count(v) AS vehicle_count
GROUP BY v.make
```

#### Grouping with computed expressions

Group by computed values using LET:

```gql
MATCH (v:Vehicle)
LET decade = (v.year / 10) * 10
RETURN decade, count(v) AS vehicle_count
GROUP BY decade
```

#### Empty grouping set

Use empty grouping set for overall aggregation:

```gql
MATCH (v:Vehicle)
RETURN count(v) AS total_count
GROUP BY ()
```

### NEXT

The `NEXT` statement enables linear composition of query statements in a statement block. Each NEXT statement contains a statement that receives the working table from the previous statement's result. The NEXT statement can optionally include a YIELD clause to project and rename columns before passing them to the next statement.

#### Syntax

```gql
statement1
NEXT [YIELD ...] statement2
[NEXT [YIELD ...] statement3]*
```

#### Arguments

| Name | Description |
|------|-------------|
| statement1 | The initial query statement |
| YIELD | Optional YIELD clause to project columns before the next statement |
| statement2 | The subsequent query statement that receives the working table from statement1 |

#### Basic composition

Chain simple query statements:

```gql
MATCH (v:Vehicle) 
RETURN v 
NEXT FILTER v.color = 'Red' 
RETURN v.color, v.make
```

#### Post-aggregation filtering

Filter results after aggregation operations:

```gql
MATCH (v:Vehicle)
RETURN v.color AS color, count(v) AS vehicle_count
NEXT FILTER vehicle_count > 5
RETURN color, vehicle_count
```

#### Using NEXT with YIELD

Use YIELD to project specific columns before the next statement:

```gql
MATCH (v:Vehicle)-[:LOCATED_IN]->(z:Zone)
RETURN v, z
NEXT YIELD v.color AS color, z.type AS location_type
FILTER location_type = 'Parking'
RETURN color, location_type
```

### Unsupported GQL Features
The following GQL features are not currently supported:
- Optional MATCH statements
- ORDER BY clause
- LIMIT and OFFSET/SKIP clauses
- DISTINCT in RETURN statements
- CALL statements for procedures
- Some functions and operators

## Functions

GQL provides various built-in functions for data manipulation, type conversion, and computation within queries.


### Text Functions

Text functions provide string manipulation capabilities for processing textual data in queries.

#### UPPER

Converts a string to uppercase.

```gql
MATCH (p:Person)
RETURN p.name, upper(p.name) AS upper_name
```

#### LOWER

Converts a string to lowercase.

```gql
MATCH (p:Person)
RETURN p.name, lower(p.name) AS lower_name
```

#### TRIM

Removes whitespace from both ends of a string.

```gql
MATCH (p:Person)
RETURN trim(p.name) AS trimmed_name
```

#### LTRIM

Removes whitespace from the left end of a string.

```gql
MATCH (p:Person)
RETURN ltrim(p.name) AS left_trimmed
```

#### RTRIM

Removes whitespace from the right end of a string.

```gql
MATCH (p:Person)
RETURN rtrim(p.name) AS right_trimmed
```

#### REVERSE

Reverses the characters in a string.

```gql
MATCH (p:Person)
RETURN p.name, reverse(p.name) AS reversed_name
```

#### LEFT

Returns a substring from the left side of a string.

```gql
MATCH (p:Person)
RETURN left(p.name, 3) AS first_three_chars
```

#### RIGHT

Returns a substring from the right side of a string.

```gql
MATCH (p:Person)
RETURN right(p.name, 3) AS last_three_chars
```

#### REPLACE

Replaces occurrences of a substring with another string.

```gql
MATCH (p:Person)
RETURN replace(p.name, 'John', 'Jane') AS modified_name
```

#### SPLIT

Splits a string into a list based on a delimiter.

```gql
MATCH (p:Person)
RETURN split(p.full_name, ' ') AS name_parts
```

#### SUBSTRING

Extracts a substring from a string.

```gql
MATCH (p:Person)
RETURN substring(p.name, 1, 5) AS name_substring
```

### Numeric Functions

Numeric functions perform mathematical operations on numeric values.

#### ABS

Returns the absolute value of a number.

```gql
MATCH (t:Transaction)
RETURN t.amount, abs(t.amount) AS absolute_amount
```

#### CEIL

Returns the smallest integer greater than or equal to a number.

```gql
MATCH (p:Product)
RETURN p.price, ceil(p.price) AS price_ceiling
```

#### FLOOR

Returns the largest integer less than or equal to a number.

```gql
MATCH (p:Product)
RETURN p.price, floor(p.price) AS price_floor
```

#### ROUND

Rounds a number to the nearest integer.

```gql
MATCH (p:Product)
RETURN p.price, round(p.price) AS rounded_price
```

### Scalar Functions

Scalar functions operate on individual values and return single results.

#### CHAR_LENGTH

Returns the number of characters in a string.

```gql
MATCH (p:Person)
RETURN p.name, char_length(p.name) AS name_length
```

#### SIZE

Returns the size of a list or string.

```gql
MATCH (p:Person)
RETURN p.name, size(p.name) AS name_length
```

#### COALESCE

Returns the first non-null value from a list of expressions.

```gql
MATCH (p:Person)
RETURN coalesce(p.nickname, p.name, 'Unknown') AS display_name
```

#### LAST

Returns the last element of a list.

```gql
MATCH (p:Person)
RETURN p.name, last(p.addresses) AS current_address
```

#### CAST

Performs explicit type conversion by converting values from one data type to another.

```gql
MATCH (v:Vehicle)
WHERE cast(v.year_string AS INTEGER) > 2020
RETURN v.make, v.model
```

### List Functions

List functions operate on list data structures.

#### REDUCE

Applies an operation across all elements in a list to produce a single result.

```gql
MATCH (order:Order)-[:CONTAINS]->(items:Item)
WITH order, collect(items.price) AS prices
RETURN order.id, reduce(total = 0, price IN prices | total + price) AS order_total
```

### Metadata Functions

Metadata functions provide access to element metadata and system information.

#### ELEMENT_ID

Returns the unique identifier of a graph element.

```gql
MATCH (n:Person)
RETURN n.name, element_id(n) AS node_id
```

### Aggregation Functions

Aggregation functions compute single values from collections of values.

#### SUM

Returns the sum of numeric values.

```gql
MATCH (p:Product)
RETURN sum(p.price) AS total_value
```

#### AVG

Returns the average of numeric values.

```gql
MATCH (p:Product)
RETURN avg(p.price) AS average_price
```

#### COUNT

Returns the count of values or rows.

```gql
MATCH (p:Person)
RETURN count(p) AS person_count
```

#### MIN

Returns the minimum value.

```gql
MATCH (p:Product)
RETURN min(p.price) AS lowest_price
```

#### MAX

Returns the maximum value.

```gql
MATCH (p:Product)
RETURN max(p.price) AS highest_price
```

### Temporal Functions

Temporal functions work with date, time, and duration values.

#### WIP