---
type: "docs"
title: "Using drasi-lib"
linkTitle: "Using drasi-lib"
weight: 5
description: >
    Learn how to use drasi-lib to embed Drasi in your Rust applications
related:
  concepts:
    - title: "Deployment Modes"
      url: "/concepts/deployment-modes/"
    - title: "Why Drasi?"
      url: "/concepts/overview/"
  howto:
    - title: "Install Drasi Platform"
      url: "/how-to-guides/installation/"
    - title: "Using Drasi Server"
      url: "/how-to-guides/installation/drasi-server/"
---

{{% alert color="info" %}}
**Coming Soon**: Documentation for drasi-lib is currently being developed. This page serves as a placeholder for the upcoming content.
{{% /alert %}}

## Overview

**drasi-lib** is a Rust crate that allows you to embed Drasi's data change processing capabilities directly into your Rust applications. Instead of deploying Drasi as a separate platform or server, you can integrate it as a library dependency, giving you full programmatic control over Sources, Continuous Queries, and Reactions.

## Key Features

- **Embedded Deployment**: Run Drasi within your application process
- **Rust Native**: First-class Rust API for type-safe integration
- **Minimal Dependencies**: No external infrastructure required
- **Programmatic Control**: Configure and manage Drasi entirely through code
- **Lightweight**: Optimized for embedded systems and resource-constrained environments

## Use Cases

drasi-lib is ideal for:

- **Embedded Applications**: IoT devices, edge computing, and embedded systems
- **Standalone Services**: Services that need change processing without external dependencies
- **Testing**: Unit and integration testing of Drasi-based logic
- **Custom Deployments**: Applications with specific deployment requirements
- **Microservices**: Services that need their own embedded change processing

## Comparison with Other Deployment Modes

| Feature | drasi-lib | Drasi Server | Drasi Platform |
|---------|-----------|--------------|----------------|
| **Integration** | Library dependency | Separate process | Kubernetes deployment |
| **Language** | Rust API | REST API | CLI + YAML |
| **Infrastructure** | None required | Single server | Kubernetes cluster |
| **Scaling** | Application-level | Vertical | Horizontal |

For a detailed comparison of all deployment modes, see [Deployment Modes](/concepts/deployment-modes/).

## Getting Started

{{% alert color="warning" %}}
This section will be available when drasi-lib is released.
{{% /alert %}}

The general steps for using drasi-lib will include:

1. **Add Dependency**: Add drasi-lib to your `Cargo.toml`
2. **Initialize**: Create a Drasi instance in your application
3. **Configure Sources**: Define your data sources programmatically
4. **Create Queries**: Set up Continuous Queries
5. **Set Up Reactions**: Configure how to handle query result changes
6. **Run**: Start processing changes

## Example Code

{{% alert color="warning" %}}
Example code will be provided when drasi-lib is released.
{{% /alert %}}

A basic example will look similar to:

```rust
// This is a placeholder example - actual API may differ
use drasi_lib::{Drasi, Source, ContinuousQuery, Reaction};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize Drasi
    let drasi = Drasi::new()?;
    
    // Configure a source
    let source = Source::postgres()
        .host("localhost")
        .database("mydb")
        .build()?;
    
    // Create a continuous query
    let query = ContinuousQuery::new("my-query")
        .cypher("MATCH (n:Person) RETURN n")
        .source(source)
        .build()?;
    
    // Set up a reaction
    let reaction = Reaction::callback(|change| {
        println!("Change detected: {:?}", change);
    });
    
    // Run
    drasi.run()?;
    
    Ok(())
}
```

## Installation

{{% alert color="warning" %}}
Installation instructions will be available when drasi-lib is released.
{{% /alert %}}

Installation will typically involve adding the crate to your `Cargo.toml`:

```toml
[dependencies]
drasi-lib = "0.1.0"  # Version TBD
```

## Prerequisites

When available, drasi-lib will require:

- Rust (version TBD)
- Supported operating systems (Linux, macOS, Windows)
- Sufficient system resources for your use case

## Configuration

{{% alert color="warning" %}}
Configuration documentation will be provided when drasi-lib is released.
{{% /alert %}}

Configuration will be done programmatically through Rust code, with options for:

- Source connections
- Query definitions
- Reaction handlers
- Runtime settings
- Logging and observability

## Next Steps

While drasi-lib is being developed, you can:

- Learn about [Drasi concepts](/concepts/)
- Try [Drasi Platform on Kubernetes](/how-to-guides/installation/)
- Try [Drasi Server](/how-to-guides/installation/drasi-server/)
- Read about [Deployment Modes](/concepts/deployment-modes/) to understand when to use drasi-lib

## Stay Updated

To be notified when drasi-lib becomes available:

- Watch the [Drasi GitHub repository](https://github.com/drasi-project)
- Join the [Drasi Discord community](https://aka.ms/drasidiscord)
- Follow [@drasi_project on X](https://x.com/drasi_project)

## Contributing

Interested in contributing to drasi-lib development? See the [Contributing Guide](https://github.com/drasi-project/docs/blob/main/CONTRIBUTING.md) for information on how to get involved.
