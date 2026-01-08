---
type: "docs"
title: "Graph Query Language (GQL)"
linkTitle: "GQL"
weight: 30
description: >
    Graph Query Language support in Drasi
---
## GQL Support
Drasi supports a subset of the [Graph Query Language (GQL)](https://www.iso.org/standard/76120.html) ISO standard for querying graph databases. This subset includes the core statements and functions needed for continuous query processing.

### MATCH

`MATCH` expands the current working table with matches from a graph pattern.
It describes what is being searched for using ASCII art syntax where round brackets represent nodes and arrows represent relationships.
When executed, `MATCH` finds all instances of the specified pattern in the graph and adds them to the working table.

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
| condition | Optional WHERE condition to filter matches |

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
LET color = v.color
RETURN color
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

FILTER is a standalone statement that removes rows from the current working table based on a specified condition.
While GQL still supports a WHERE clause for filtering during the MATCH phase, the FILTER statement provides additional flexibility by allowing results to be filtered after previous steps.

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
| alias | Optional alias name for the projected field |

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

The `GROUP BY` clause defines the set of grouping keys to be used during grouping operations. The clause can contain a list of grouping elements or an empty grouping set for overall aggregation.

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

#### Upper()
The `upper` function converts a string to uppercase.

##### Syntax
```gql
upper(input)
```

##### Arguments
The `upper` function accepts one argument:

| Name | Type | Description |
|------|------|-------------|
| input | STRING | A string to be converted into uppercase |

##### Returns
The `upper` function returns a STRING in uppercase format.

```gql
MATCH (p:Person)
RETURN p.name, upper(p.name) AS upper_name
```

#### Lower()
The `lower` function converts a string to lowercase.

##### Syntax
```gql
lower(input)
```

##### Arguments
The `lower` function accepts one argument:

| Name | Type | Description |
|------|------|-------------|
| input | STRING | A string to be converted into lowercase |

##### Returns
The `lower` function returns a STRING in lowercase format.

```gql
MATCH (p:Person)
RETURN p.name, lower(p.name) AS lower_name
```

#### Trim()
The `trim` function removes leading and trailing whitespace from a string.

##### Syntax
```gql
trim(input)
```

##### Arguments
The `trim` function accepts one argument:

| Name | Type | Description |
|------|------|-------------|
| input | STRING | A value from which all leading and trailing whitespace will be removed |

##### Returns
The `trim` function returns a STRING with whitespace removed from both ends.

```gql
MATCH (p:Person)
RETURN trim(p.name) AS trimmed_name
```

#### Ltrim()
The `ltrim` function removes leading whitespace from a string.

##### Syntax
```gql
ltrim(input)
```

##### Arguments
The `ltrim` function accepts one argument:

| Name | Type | Description |
|------|------|-------------|
| input | STRING | A value from which the leading trim character will be removed |

##### Returns
The `ltrim` function returns a STRING with whitespace removed from the beginning.

```gql
MATCH (p:Person)
RETURN ltrim(p.name) AS left_trimmed
```

#### Rtrim()
The `rtrim` function removes trailing whitespace from a string.

##### Syntax
```gql
rtrim(input)
```

##### Arguments
The `rtrim` function accepts one argument:

| Name | Type | Description |
|------|------|-------------|
| input | STRING | A value from which the trailing trim character will be removed |

##### Returns
The `rtrim` function returns a STRING with whitespace removed from the end.

```gql
MATCH (p:Person)
RETURN rtrim(p.name) AS right_trimmed
```

#### Reverse()
The `reverse` function returns a string with characters in reverse order.

##### Syntax
```gql
reverse(input)
```

##### Arguments
The `reverse` function accepts one argument:

| Name | Type | Description |
|------|------|-------------|
| input | STRING | The string to be reversed |

##### Returns
The `reverse` function returns a STRING with characters in reverse order.

```gql
MATCH (p:Person)
RETURN p.name, reverse(p.name) AS reversed_name
```

#### Left()
The `left` function returns a specified number of leftmost characters from a string.

##### Syntax
```gql
left(input, length)
```

##### Arguments
The `left` function accepts two arguments:

| Name | Type | Description |
|------|------|-------------|
| input | STRING | The string to extract from |
| length | INTEGER | The number of characters to extract |

##### Returns
The `left` function returns a STRING containing the specified number of leftmost characters.

```gql
MATCH (p:Person)
RETURN left(p.name, 3) AS first_three_chars
```

#### Right()
The `right` function returns a specified number of rightmost characters from a string.

##### Syntax
```gql
right(input, length)
```

##### Arguments
The `right` function accepts two arguments:

| Name | Type | Description |
|------|------|-------------|
| input | STRING | The string to extract from |
| length | INTEGER | The number of characters to extract |

##### Returns
The `right` function returns a STRING containing the specified number of rightmost characters.

```gql
MATCH (p:Person)
RETURN right(p.name, 3) AS last_three_chars
```

#### Replace()
The `replace` function replaces all occurrences of a search string with a replacement string.

##### Syntax
```gql
replace(input, search, replacement)
```

##### Arguments
The `replace` function accepts three arguments:

| Name | Type | Description |
|------|------|-------------|
| input | STRING | The original string |
| search | STRING | The substring to find |
| replacement | STRING | The string to replace with |

##### Returns
The `replace` function returns a STRING with all occurrences of the search string replaced.

```gql
MATCH (p:Person)
RETURN replace(p.name, 'John', 'Jane') AS modified_name
```

#### Split()
The `split` function divides a string into a list based on a delimiter or delimiters.

##### Syntax
```gql
split(input, delimiter)
```

##### Arguments
The `split` function accepts two arguments:

| Name | Type | Description |
|------|------|-------------|
| input | STRING | The string to split |
| delimiter | STRING or LIST | The delimiter(s) to split on |

##### Returns
The `split` function returns a LIST of strings. When using a single string delimiter, it splits on the exact string. When using a list of delimiters, it performs character-level matching for any of the characters in the list.

```gql
MATCH (p:Person)
RETURN split(p.full_name, ' ') AS name_parts
```

```gql
MATCH (p:Person)
RETURN split(p.full_name, [' ', ',', '.']) AS name_parts
```

#### Substring()
The `substring` function returns a substring from the given string, beginning with a 0-based index start.

##### Syntax
```gql
substring(original, start, length)
```

##### Arguments
The `substring` function accepts two or three arguments:

| Name | Type | Description |
|------|------|-------------|
| original | STRING | The string to be shortened |
| start | INTEGER | The start position of the new string |
| length | INTEGER | (optional) Length of the new string |

##### Returns
The `substring` function returns a STRING. If length is omitted, returns the substring from start to the end of original. If length is provided, returns a substring of that length.

```gql
MATCH (p:Person)
RETURN substring(p.name, 2) AS name_from_index
```

```gql
MATCH (p:Person)
RETURN substring(p.name, 1, 5) AS name_substring
```

### Numeric Functions

Numeric functions perform mathematical operations on numeric values.

#### Abs()
The `abs` function returns the absolute value of a number.

##### Syntax
```gql
abs(input)
```

##### Arguments
The `abs` function accepts one argument:

| Name | Type | Description |
|------|------|-------------|
| input | INTEGER or FLOAT | A numeric value from which the absolute number will be returned |

##### Returns
The `abs` function returns INTEGER or FLOAT, preserving the original type.

```gql
MATCH (t:Transaction)
RETURN t.amount, abs(t.amount) AS absolute_amount
```

#### Ceil()
The `ceil` function rounds a number up to the nearest integer.

##### Syntax
```gql
ceil(input)
```

##### Arguments
The `ceil` function accepts one argument:

| Name | Type | Description |
|------|------|-------------|
| input | INTEGER or FLOAT | A value to be rounded to the nearest higher integer |

##### Returns
The `ceil` function returns a FLOAT representing the smallest integer greater than or equal to the input.

```gql
MATCH (p:Product)
RETURN p.price, ceil(p.price) AS price_ceiling
```

#### Floor()
The `floor` function rounds a number down to the nearest integer.

##### Syntax
```gql
floor(input)
```

##### Arguments
The `floor` function accepts one argument:

| Name | Type | Description |
|------|------|-------------|
| input | INTEGER or FLOAT | A value to be rounded to the nearest lower integer |

##### Returns
The `floor` function returns a FLOAT representing the largest integer less than or equal to the input.

```gql
MATCH (p:Product)
RETURN p.price, floor(p.price) AS price_floor
```

#### Round()
The `round` function rounds a number to a specified precision using various rounding modes.

##### Syntax
```gql
round(value)
round(value, precision)
round(value, precision, mode)
```

##### Arguments
The `round` function accepts one to three arguments:

| Name | Type | Description |
|------|------|-------------|
| value | INTEGER or FLOAT | A value to be rounded |
| precision | INTEGER | (optional) Rounding precision |
| mode | STRING | (optional) Precision rounding mode: UP, DOWN, CEILING, FLOOR, HALF_UP, HALF_DOWN, HALF_EVEN |

##### Returns
The `round` function returns FLOAT if value is FLOAT, INTEGER if value is INTEGER. The precision parameter specifies decimal places for rounding, and the mode parameter controls the rounding behavior.

```gql
MATCH (p:Product)
RETURN p.price, round(p.price) AS rounded_price
```

### Scalar Functions

Scalar functions operate on individual values and return single results.

#### Char_length()
The `char_length` function returns the number of characters in a string.

##### Syntax
```gql
char_length(input)
```

##### Arguments
The `char_length` function accepts one argument:

| Name | Type | Description |
|------|------|-------------|
| input | STRING | A string value for which the character count will be returned |

##### Returns
The `char_length` function returns an INTEGER representing the number of characters in the string.

```gql
MATCH (p:Person)
RETURN p.name, char_length(p.name) AS name_length
```

#### Size()
The `size` function returns the number of elements in a list or characters in a string.

##### Syntax
```gql
size(input)
```

##### Arguments
The `size` function accepts one argument:

| Name | Type | Description |
|------|------|-------------|
| input | LIST or STRING | A list or string value for which the size will be returned |

##### Returns
The `size` function returns an INTEGER representing the number of elements in a list or characters in a string.

```gql
MATCH (p:Person)
RETURN p.name, size(p.name) AS name_length
```

#### Coalesce()
The `coalesce` function returns the first non-null value from a list of expressions.

##### Syntax
```gql
coalesce(expression1, expression2, ...)
```

##### Arguments
The `coalesce` function accepts multiple arguments:

| Name | Type | Description |
|------|------|-------------|
| expression1, expression2, ... | ANY | A list of expressions to evaluate |

##### Returns
The `coalesce` function returns ANY (type of the first non-null expression), or null if all expressions are null.

```gql
MATCH (p:Person)
RETURN coalesce(p.nickname, p.name, 'Unknown') AS display_name
```

#### Last()
The `last` function returns the last element from a list.

##### Syntax
```gql
last(list)
```

##### Arguments
The `last` function accepts one argument:

| Name | Type | Description |
|------|------|-------------|
| list | LIST | A list from which the last element will be returned |

##### Returns
The `last` function returns ANY (type of the last element in the list), or null if the list is empty.

```gql
MATCH (p:Person)
RETURN p.name, last(p.addresses) AS current_address
```

#### Cast()
The `cast` function converts a value from one data type to another.

##### Syntax
```gql
cast(value AS target_type)
```

##### Arguments
The `cast` function accepts two arguments:

| Name | Type | Description |
|------|------|-------------|
| value | ANY | The value to be converted |
| target_type | STRING | The target data type: STRING, INTEGER, INT, FLOAT, BOOLEAN, BOOL |

##### Returns
The `cast` function returns the value converted to the specified target type.

**Supported Conversions**
- **To STRING**: Converts INTEGER, FLOAT, STRING, BOOLEAN, LIST to string representation
- **To INTEGER**: Converts FLOAT (floor), BOOLEAN (true=1, false=0), STRING (parsed or null)
- **To FLOAT**: Converts INTEGER, STRING (parsed or null)  
- **To BOOLEAN**: Converts INTEGER (0=false, non-zero=true), STRING ("true"/"false" or null)

```gql
MATCH (v:Vehicle)
WHERE cast(v.year_string AS INTEGER) > 2020
RETURN v.make, v.model
```

### List Functions

List functions operate on list data structures.

#### Reduce()
The `reduce` function applies an operation to each element in a list, accumulating results.

##### Syntax
```gql
reduce(accumulator = initial_value, variable IN list | expression)
```

##### Arguments
The `reduce` function accepts three components:

| Name | Type | Description |
|------|------|-------------|
| accumulator | Variable assignment | The accumulator variable and its initial value |
| variable IN list | Iterator expression | Iterates over each element in the list |
| expression | Expression | The operation to perform for each element |

##### Returns
The `reduce` function returns ANY (type depends on the accumulator and operations). It processes each element in the list sequentially, updating the accumulator with the result of the expression.

```gql
MATCH (p:Person)
LET numbers = [1, 2, 3, 4, 5]
RETURN reduce(sum = 0, n IN numbers | sum + n) AS total
```

### Metadata Functions

Metadata functions provide access to element metadata and system information.

#### Element_id()
The `element_id` function returns the unique identifier of a graph element.

##### Syntax
```gql
element_id(element)
```

##### Arguments
The `element_id` function accepts one argument:

| Name | Type | Description |
|------|------|-------------|
| element | ELEMENT | A graph element (node or relationship) |

##### Returns
The `element_id` function returns a STRING representing the unique identifier of the graph element.

```gql
MATCH (n:Person)
RETURN n.name, element_id(n) AS node_id
```

### Aggregation Functions

Aggregation functions compute single values from collections of values.

#### Sum()
The `sum` function calculates the sum of numeric or duration values.

##### Syntax
```gql
sum(expression)
```

##### Arguments
The `sum` function accepts one argument:

| Name | Type | Description |
|------|------|-------------|
| expression | INTEGER, FLOAT, or DURATION | A numeric or duration expression to sum |

##### Returns
The `sum` function returns:
- FLOAT (for INTEGER and FLOAT inputs)
- DURATION (for DURATION inputs)

```gql
MATCH (p:Product)
RETURN sum(p.price) AS total_value
```

#### Avg()
The `avg` function calculates the average of numeric or duration values.

##### Syntax
```gql
avg(expression)
```

##### Arguments
The `avg` function accepts one argument:

| Name | Type | Description |
|------|------|-------------|
| expression | INTEGER, FLOAT, or DURATION | A numeric or duration expression to average |

##### Returns
The `avg` function returns:
- FLOAT (for INTEGER and FLOAT inputs)
- DURATION (for DURATION inputs)

```gql
MATCH (p:Product)
RETURN avg(p.price) AS average_price
```

#### Count()
The `count` function returns the number of non-null values.

##### Syntax
```gql
count(expression)
```

##### Arguments
The `count` function accepts one argument:

| Name | Type | Description |
|------|------|-------------|
| expression | ANY | An expression to count non-null values |

##### Returns
The `count` function returns an INTEGER representing the number of non-null values.

```gql
MATCH (p:Person)
RETURN count(p) AS person_count
```

#### Min()
The `min` function returns the minimum value from a set of values.

##### Syntax
```gql
min(expression)
```

##### Arguments
The `min` function accepts one argument:

| Name | Type | Description |
|------|------|-------------|
| expression | INTEGER, FLOAT, DATE, TIME, DATETIME, or DURATION | An expression to find the minimum value |

##### Returns
The `min` function returns the same type as the input expression, representing the minimum value.

```gql
MATCH (p:Product)
RETURN min(p.price) AS lowest_price
```

#### Max()
The `max` function returns the maximum value from a set of values.

##### Syntax
```gql
max(expression)
```

##### Arguments
The `max` function accepts one argument:

| Name | Type | Description |
|------|------|-------------|
| expression | INTEGER, FLOAT, DATE, TIME, DATETIME, or DURATION | An expression to find the maximum value |

##### Returns
The `max` function returns the same type as the input expression, representing the maximum value.

```gql
MATCH (p:Product)
RETURN max(p.price) AS highest_price
```

#### Collect()
The `collect` function aggregates values into a list. Null values are excluded.

##### Syntax
```gql
collect(expression)
```

##### Arguments
The `collect` function accepts one argument:

| Name | Type | Description |
|------|------|-------------|
| expression | ANY | An expression whose non-null values will be collected into a list |

##### Returns
The `collect` function returns a LIST containing all non-null values. Duplicate values are preserved. The order of elements is not guaranteed.

```gql
MATCH (p:Product)<-[:REVIEWS]-(r:Review)
RETURN p.name AS product, collect(r.rating) AS all_ratings
```

> **Performance Note:** Unlike scalar aggregations (`count()`, `sum()`, `avg()`, `min()`, `max()`) which maintain constant-size state regardless of collection size, `collect()` stores every value in the collection. This means memory usage and update overhead scale linearly with the number of items.
>
> **Practical guidelines:**
> - **Up to ~100 items per group**: Generally appropriate with minimal performance impact
> - **100-500 items**: Use with caution; only when collections are not frequently updated
> - **500+ items**: Not recommended due to significant memory and performance impact
>
> If you only need derived values (count, sum, average, min, max), prefer the dedicated aggregation functions which are optimized for incremental updates.

### Temporal Functions

Temporal functions work with date, time, and duration values.

#### Date()
The `date` function creates or parses date values.

##### Syntax
```gql
date(input)
```

##### Arguments
The `date` function accepts one optional argument:

| Name | Type | Description |
|------|------|-------------|
| input | STRING, OBJECT, or DATE | (optional) Date string to parse, date components object, or existing date |

##### Returns
The `date` function returns a DATE value.

**Behavior**
- **Without input:** Returns the current system date
- **With STRING input:** Parses a date string into a DATE value
- **With OBJECT input:** Constructs a date from component fields
- **With DATE input:** Returns the date unchanged
- **With NULL input:** Returns null

**Object Components**
When using an object, supported keys include:
- `year` - The year
- `month` - The month (1-12)
- `day` - The day of the month
- `week` - Week number
- `ordinalDay` - Day of the year
- `quarter` - Quarter of the year
- `dayOfWeek` - Day of the week
- `dayOfQuarter` - Day within the quarter

```gql
MATCH (p:Person)
RETURN date() AS current_date, 
       date('2024-01-15') AS parsed_date,
       date({year: 2024, month: 3, day: 15}) AS constructed_date
```

#### Time()
The `time` function creates or parses zoned time values.

##### Syntax
```gql
time(input)
```

##### Arguments
The `time` function accepts one optional argument:

| Name | Type | Description |
|------|------|-------------|
| input | STRING, OBJECT, or ZONED_TIME | (optional) Time string to parse, time components object, or existing zoned time |

##### Returns
The `time` function returns a ZONED_TIME value.

**Behavior**
- **Without input:** Returns the current system time in UTC timezone
- **With STRING input:** Parses a time string into a ZONED_TIME value
- **With OBJECT input:** Constructs a time from component fields
- **With ZONED_TIME input:** Returns the time unchanged
- **With NULL input:** Returns null

**Object Components**
When using an object, supported keys include:
- `hour` - The hour (0-23)
- `minute` - The minute (0-59)
- `second` - The second (0-59)
- `millisecond` - The millisecond (0-999)
- `microsecond` - The microsecond (0-999)
- `nanosecond` - The nanosecond (0-999)
- `timezone` - The timezone (IANA timezone name or offset like "+05:00")

**Special timezone behavior:**
- If only `timezone` is specified in the object, returns current time in that timezone
- Default timezone is UTC if not specified

```gql
MATCH (p:Person)
RETURN time() AS current_time,
       time('14:30:00+02:00') AS parsed_time,
       time({hour: 14, minute: 30, timezone: 'America/New_York'}) AS constructed_time
```

#### Local_time()
The `local_time` function creates or parses local time values.

##### Syntax
```gql
local_time(input)
```

##### Arguments
The `local_time` function accepts one optional argument:

| Name | Type | Description |
|------|------|-------------|
| input | STRING, OBJECT, or LOCAL_TIME | (optional) Time string to parse, time components object, or existing local time |

##### Returns
The `local_time` function returns a LOCAL_TIME value.

**Behavior**
- **Without input:** Returns the current system local time (no timezone information)
- **With STRING input:** Parses a time string into a LOCAL_TIME value
- **With OBJECT input:** Constructs a time from component fields
- **With LOCAL_TIME input:** Returns the time unchanged
- **With NULL input:** Returns null

**Object Components**
When using an object, supported keys include:
- `hour` - The hour (0-23)
- `minute` - The minute (0-59)
- `second` - The second (0-59)
- `millisecond` - The millisecond (0-999)
- `microsecond` - The microsecond (0-999)
- `nanosecond` - The nanosecond (0-999)

```gql
MATCH (p:Person)
RETURN local_time() AS current_local_time,
       local_time('14:30:00') AS parsed_local_time,
       local_time({hour: 14, minute: 30, second: 15}) AS constructed_local_time
```

#### Zoned_datetime()
The `zoned_datetime` function creates or parses zoned datetime values.

##### Syntax
```gql
zoned_datetime(input)
```

##### Arguments
The `zoned_datetime` function accepts one optional argument:

| Name | Type | Description |
|------|------|-------------|
| input | STRING, OBJECT, or ZONED_DATETIME | (optional) DateTime string to parse, datetime components object, or existing zoned datetime |

##### Returns
The `zoned_datetime` function returns a ZONED_DATETIME value.

**Behavior**
- **Without input:** Returns the current system datetime in UTC timezone
- **With STRING input:** Parses a datetime string into a ZONED_DATETIME value
- **With OBJECT input:** Constructs a datetime from component fields
- **With ZONED_DATETIME input:** Returns the datetime unchanged
- **With NULL input:** Returns null

**Object Components**
When using an object, supported keys include:

*Date components:*
- `year` - The year
- `month` - The month (1-12)
- `day` - The day of the month
- `week` - Week number
- `ordinalDay` - Day of the year
- `quarter` - Quarter of the year
- `dayOfWeek` - Day of the week
- `dayOfQuarter` - Day within the quarter

*Time components:*
- `hour` - The hour (0-23)
- `minute` - The minute (0-59)
- `second` - The second (0-59)
- `millisecond` - The millisecond (0-999)
- `microsecond` - The microsecond (0-999)
- `nanosecond` - The nanosecond (0-999)

*Timezone and epoch:*
- `timezone` - The timezone (IANA timezone name or offset like "+05:00")
- `epochSeconds` - Unix timestamp in seconds
- `epochMillis` - Unix timestamp in milliseconds

**Special behaviors:**
- If only `timezone` is specified, returns current datetime in that timezone
- If `epochSeconds` or `epochMillis` is provided, creates datetime from Unix timestamp
- Default timezone is UTC if not specified

```gql
MATCH (p:Person)
RETURN zoned_datetime() AS current_datetime,
       zoned_datetime('2024-01-15T14:30:00+02:00') AS parsed_datetime,
       zoned_datetime({year: 2024, month: 1, day: 15, hour: 14, minute: 30, timezone: 'America/New_York'}) AS constructed_datetime
```

#### Local_datetime()
The `local_datetime` function creates or parses local datetime values.

##### Syntax
```gql
local_datetime(input)
```

##### Arguments
The `local_datetime` function accepts one optional argument:

| Name | Type | Description |
|------|------|-------------|
| input | STRING, OBJECT, or LOCAL_DATETIME | (optional) DateTime string to parse, datetime components object, or existing local datetime |

##### Returns
The `local_datetime` function returns a LOCAL_DATETIME value.

**Behavior**
- **Without input:** Returns the current system local datetime (no timezone information)
- **With STRING input:** Parses a datetime string into a LOCAL_DATETIME value
- **With OBJECT input:** Constructs a datetime from component fields
- **With LOCAL_DATETIME input:** Returns the datetime unchanged
- **With NULL input:** Returns null

**Object Components**
When using an object, supported keys include:

*Date components:*
- `year` - The year
- `month` - The month (1-12)
- `day` - The day of the month
- `week` - Week number
- `ordinalDay` - Day of the year
- `quarter` - Quarter of the year
- `dayOfWeek` - Day of the week
- `dayOfQuarter` - Day within the quarter

*Time components:*
- `hour` - The hour (0-23)
- `minute` - The minute (0-59)
- `second` - The second (0-59)
- `millisecond` - The millisecond (0-999)
- `microsecond` - The microsecond (0-999)
- `nanosecond` - The nanosecond (0-999)

*Special timezone behavior:*
- `timezone` - If specified, returns current datetime in that timezone converted to local datetime

**Special behavior:**
- If only `timezone` is specified, returns current datetime from that timezone as local datetime (timezone info is stripped)

```gql
MATCH (p:Person)
RETURN local_datetime() AS current_local_datetime,
       local_datetime('2024-01-15T14:30:00') AS parsed_local_datetime,
       local_datetime({year: 2024, month: 1, day: 15, hour: 14, minute: 30}) AS constructed_local_datetime
```

#### Duration_between()
The `duration_between` function calculates the duration between two temporal values.

##### Syntax
```gql
duration_between(start, end)
```

##### Arguments
The `duration_between` function accepts two arguments:

| Name | Type | Description |
|------|------|-------------|
| start | DATE, LOCAL_TIME, ZONED_TIME, LOCAL_DATETIME, or ZONED_DATETIME | The start temporal value |
| end | DATE, LOCAL_TIME, ZONED_TIME, LOCAL_DATETIME, or ZONED_DATETIME | The end temporal value |

##### Returns
The `duration_between` function returns a DURATION value.

**Behavior**
Calculates the duration between two temporal values. The function supports mixed temporal types and handles timezone conversions automatically.

**Supported type combinations:**
- **DATE to/from any temporal type** - Date is treated as midnight
- **LOCAL_TIME to/from any temporal type** - Uses appropriate date context
- **ZONED_TIME to/from any temporal type** - Handles timezone offsets
- **LOCAL_DATETIME to/from any temporal type** - Converts to appropriate timezone when needed
- **ZONED_DATETIME to/from any temporal type** - Full timezone-aware calculations
- **NULL inputs** - Returns null if either argument is null

**Timezone handling:**
- When mixing zoned and local types, the zoned type's timezone is used for conversion
- When both are zoned types, timezone differences are properly calculated
- Local types are converted using appropriate context (date from other value, etc.)

```gql
MATCH (e:Event)
RETURN duration_between(e.start_date, e.end_date) AS event_duration,
       duration_between(local_time('09:00'), local_time('17:30')) AS work_hours,
       duration_between(date('2024-01-01'), zoned_datetime('2024-01-15T10:30:00+02:00')) AS days_elapsed
```

#### Duration Functions
Additional duration functions are available for working with durations. For detailed documentation on these functions including `duration()`, `duration.inMonths()`, `duration.inDays()`, and `duration.inSeconds()`, see the [Neo4j Cypher Manual Duration Functions](https://neo4j.com/docs/cypher-manual/current/functions/temporal/duration/#functions-durations).