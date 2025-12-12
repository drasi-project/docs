---
type: "docs"
title: "Using Drasi Server"
linkTitle: "Using Drasi Server"
weight: 6
description: >
    Learn how to run Drasi as a standalone server process
related:
  concepts:
    - title: "Deployment Modes"
      url: "/concepts/deployment-modes/"
    - title: "Why Drasi?"
      url: "/concepts/overview/"
  howto:
    - title: "Install Drasi Platform"
      url: "/how-to-guides/installation/"
    - title: "Using drasi-lib"
      url: "/how-to-guides/installation/drasi-lib/"
---

{{% alert color="info" %}}
**Coming Soon**: Documentation for Drasi Server is currently being developed. This page serves as a placeholder for the upcoming content.
{{% /alert %}}

## Overview

**Drasi Server** is a standalone server process that provides Drasi's data change processing capabilities without requiring Kubernetes infrastructure. It runs as a single process on traditional infrastructure like virtual machines, bare metal servers, or containers, making it ideal for development environments and simpler deployments.

## Key Features

- **Standalone Process**: Run Drasi as a single server without Kubernetes
- **Simple Deployment**: Easy to install and configure on any server
- **REST API**: Manage Sources, Queries, and Reactions via HTTP endpoints
- **Command-Line Interface**: Built-in CLI for server management
- **Low Overhead**: Minimal infrastructure requirements
- **Development-Friendly**: Perfect for local development and testing

## Use Cases

Drasi Server is ideal for:

- **Development Environments**: Local development and testing
- **Small Deployments**: Single-server installations
- **Traditional Infrastructure**: VM-based or bare metal deployments
- **Edge Locations**: Remote sites without Kubernetes
- **Proof of Concepts**: Quick setup for evaluations
- **Cost-Sensitive Deployments**: Environments where Kubernetes overhead is undesirable

## Comparison with Other Deployment Modes

| Feature | drasi-lib | Drasi Server | Drasi Platform |
|---------|-----------|--------------|----------------|
| **Deployment** | In-process | Standalone server | Kubernetes |
| **Management** | Code | CLI/REST API | Drasi CLI + kubectl |
| **Infrastructure** | None | Single server | Cluster |
| **Best For** | Embedded apps | Development, simple deployments | Production at scale |

For a detailed comparison of all deployment modes, see [Deployment Modes](/concepts/deployment-modes/).

## Getting Started

{{% alert color="warning" %}}
This section will be available when Drasi Server is released.
{{% /alert %}}

The general steps for using Drasi Server will include:

1. **Download**: Get the Drasi Server binary or container image
2. **Install**: Install on your server or local machine
3. **Start**: Launch the Drasi Server process
4. **Configure**: Set up Sources, Continuous Queries, and Reactions
5. **Monitor**: Use built-in monitoring and logging

## Installation

{{% alert color="warning" %}}
Installation instructions will be available when Drasi Server is released.
{{% /alert %}}

Installation options will likely include:

### Binary Installation

```bash
# Example - actual download URL will be provided when released
# Download the binary
curl -L https://github.com/drasi-project/drasi/releases/latest/download/drasi-server -o drasi-server
chmod +x drasi-server

# Run the server
./drasi-server start
```

### Docker Installation

```bash
# Example - actual image location will be provided when released
# Run as a container
docker run -d \
  --name drasi-server \
  -p 8080:8080 \
  ghcr.io/drasi-project/drasi-server:latest
```

### Package Managers

Installation via package managers like apt, yum, brew, or chocolatey may also be supported.

## Prerequisites

When available, Drasi Server will require:

- Supported operating systems (Linux, macOS, Windows)
- Available network ports (default port TBD)
- Sufficient system resources (CPU, memory, storage)
- Optional: Database for state persistence

## Configuration

{{% alert color="warning" %}}
Configuration documentation will be provided when Drasi Server is released.
{{% /alert %}}

Configuration will likely be done through:

- **Configuration Files**: YAML or TOML configuration files
- **Environment Variables**: For runtime settings
- **Command-Line Flags**: For startup options
- **REST API**: For dynamic configuration

Example configuration structure:

```yaml
# Example configuration (actual format TBD)
server:
  port: 8080
  host: 0.0.0.0

storage:
  type: sqlite
  path: /var/lib/drasi/data.db

logging:
  level: info
  format: json
```

## Managing Drasi Server

{{% alert color="warning" %}}
Management documentation will be provided when Drasi Server is released.
{{% /alert %}}

### Command-Line Interface

The server will include a CLI for management tasks:

```bash
# Start the server
drasi-server start

# Stop the server
drasi-server stop

# Check status
drasi-server status

# View logs
drasi-server logs
```

### REST API

A REST API will be available for programmatic management:

```bash
# Create a source (example)
curl -X POST http://localhost:8080/api/sources \
  -H "Content-Type: application/json" \
  -d @source-definition.json

# Create a query
curl -X POST http://localhost:8080/api/queries \
  -H "Content-Type: application/json" \
  -d @query-definition.json

# Create a reaction
curl -X POST http://localhost:8080/api/reactions \
  -H "Content-Type: application/json" \
  -d @reaction-definition.json
```

## Monitoring and Operations

{{% alert color="warning" %}}
Operations documentation will be provided when Drasi Server is released.
{{% /alert %}}

Drasi Server will provide:

- **Health Endpoints**: Check server health and readiness
- **Metrics**: Prometheus-compatible metrics
- **Logging**: Structured logging output
- **Status Dashboard**: Web-based status interface (optional)

## Upgrading

{{% alert color="warning" %}}
Upgrade documentation will be provided when Drasi Server is released.
{{% /alert %}}

Upgrade procedures will be documented including:

- Backup procedures
- Version compatibility
- Migration steps
- Rollback procedures

## Architecture

Drasi Server consolidates all Drasi components into a single process:

- **Control Plane**: Manages Sources, Queries, and Reactions
- **Query Engine**: Evaluates Continuous Queries
- **Source Connectors**: Connect to data sources
- **Reaction Handlers**: Execute reactions
- **Storage**: Persists configuration and state

All components run within a single process, simplifying deployment while maintaining Drasi's core functionality.

## Limitations

As a single-server deployment, Drasi Server has some limitations compared to the Kubernetes platform:

- **Scaling**: No horizontal scaling (vertical scaling only)
- **High Availability**: Single point of failure
- **Multi-Tenancy**: Limited isolation compared to Kubernetes
- **Orchestration**: Manual process management

For production deployments requiring scale and high availability, consider the [Drasi Platform](/how-to-guides/installation/).

## Migration to Drasi Platform

When you're ready to scale beyond a single server, you can migrate to the Drasi Platform on Kubernetes. Core configurations (Sources, Queries, Reactions) can be exported and imported with minimal changes.

## Next Steps

While Drasi Server is being developed, you can:

- Learn about [Drasi concepts](/concepts/)
- Try [Drasi Platform on Kubernetes](/how-to-guides/installation/)
- Try [drasi-lib for embedded use](/how-to-guides/installation/drasi-lib/)
- Read about [Deployment Modes](/concepts/deployment-modes/) to understand when to use Drasi Server

## Stay Updated

To be notified when Drasi Server becomes available:

- Watch the [Drasi GitHub repository](https://github.com/drasi-project)
- Join the [Drasi Discord community](https://aka.ms/drasidiscord)
- Follow [@drasi_project on X](https://x.com/drasi_project)

## Contributing

Interested in contributing to Drasi Server development? See the [Contributing Guide](https://github.com/drasi-project/docs/blob/main/CONTRIBUTING.md) for information on how to get involved.
