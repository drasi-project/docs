---
type: "docs"
title: "Middleware"
linkTitle: "Middleware"
weight: 40
related:
  concepts:
    - title: "Continuous Queries"
      url: "/concepts/continuous-queries/"
    - title: "Sources"
      url: "/concepts/sources/"
  howto:
    - title: "Write Continuous Queries (Kubernetes)"
      url: "/drasi-kubernetes/how-to-guides/write-continuous-queries/"
    - title: "Write Continuous Queries (Server)"
      url: "/drasi-server/how-to-guides/write-continuous-queries/"
  reference:
    - title: "Middleware Reference"
      url: "/reference/middleware/"
    - title: "Query Language Reference"
      url: "/reference/query-language/"
---

Middleware transforms and enriches incoming data changes before they reach your Continuous Queries. This is useful when source data needs preprocessing--normalizing values, extracting nested data, remapping labels, or converting formats.

## How Middleware Works

Middleware sits between Sources and Continuous Queries in the data pipeline. When a Source pushes a change, the middleware processes it before the change reaches the query engine. This allows you to:

- **Transform data shapes**: Reshape incoming data to match what your queries expect
- **Extract nested structures**: Unwind arrays or promote nested properties to top-level fields
- **Normalize labels**: Remap element labels from different sources to a common vocabulary
- **Decode and parse**: Convert encoded strings or parse embedded JSON
- **Filter conditionally**: Apply transformations only when certain conditions are met

Middleware is configured as part of Continuous Query definitions. Each query can have its own middleware pipeline, and multiple middleware components can be chained together to process changes sequentially.

## Middleware Pipeline

Middleware components are modular and can be combined in a pipeline. Each middleware in the pipeline receives the output of the previous one, allowing you to chain multiple transformations:

```
Source Change → Middleware 1 → Middleware 2 → Middleware 3 → Continuous Query
```

For example, you might:
1. First decode a Base64-encoded field
2. Then parse the decoded JSON string into an object
3. Finally promote nested properties to top-level fields

## Available Middleware Components

| Component | Purpose |
|-----------|---------|
| **Unwind** | Expand nested arrays into separate graph elements |
| **JQ** | Transform data using jq expressions |
| **Promote** | Copy nested values to top-level properties |
| **ParseJson** | Parse JSON strings into structured objects |
| **Decoder** | Decode encoded strings (Base64, Hex, URL, JSON escapes) |
| **Relabel** | Remap element labels to different names |

For detailed configuration options and examples for each middleware type, see the [Middleware Reference](/reference/middleware/).

## Common Use Cases

### Flattening Nested Data

When source data contains deeply nested structures, use **Promote** or **Unwind** to make nested values accessible to your queries:

- **Promote**: Copies a nested value to a top-level property (e.g., `$.user.location.city` becomes `city`)
- **Unwind**: Expands an array into separate graph elements with relationships to the parent

### Normalizing Heterogeneous Sources

When integrating data from multiple sources with different naming conventions, use **Relabel** to map source-specific labels to a common vocabulary. This allows you to write queries against a unified schema.

### Processing Encoded Data

When sources provide encoded or serialized data, chain **Decoder** and **ParseJson** to:
1. Decode the raw string (Base64, Hex, URL encoding)
2. Parse the decoded JSON into a structured object

### Event Routing

Use **JQ** with conditional expressions to route different event types to different operations. For example, map "opened" events to inserts, "closed" events to updates, and "deleted" events to deletions.

## Configuring Middleware

Middleware configuration is product-specific and defined within Continuous Query configuration. See the product-specific guides for details:

- **[Drasi Server](/drasi-server/how-to-guides/write-continuous-queries/)** - Configure middleware in server deployments
- **[Drasi for Kubernetes](/drasi-kubernetes/how-to-guides/write-continuous-queries/)** - Configure middleware in Kubernetes deployments

For **drasi-lib**, middleware is configured programmatically via the Rust API.
