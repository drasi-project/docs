---
type: "docs"
title: "Deployment Modes"
linkTitle: "Deployment Modes"
weight: 15
description: >
    Understand the different ways you can deploy and run Drasi
related:
  concepts:
    - title: "Why Drasi?"
      url: "/concepts/overview/"
  howto:
    - title: "Install Drasi Platform"
      url: "/how-to-guides/installation/"
    - title: "Using Drasi Server"
      url: "/how-to-guides/installation/drasi-server/"
    - title: "Using drasi-lib"
      url: "/how-to-guides/installation/drasi-lib/"
---

## Introduction

Drasi offers flexible deployment options to meet different application needs and infrastructure requirements. Whether you're building a small embedded application, running a standalone service, or deploying a distributed platform on Kubernetes, Drasi adapts to your environment.

## Deployment Modes

Drasi can be deployed in three distinct modes, each optimized for different use cases:

<div class="card-grid">
  <div class="unified-card unified-card--concepts">
    <div class="unified-card-icon">
      <i class="fas fa-book"></i>
    </div>
    <div class="unified-card-content">
      <h3 class="unified-card-title">Drasi Library (drasi-lib)</h3>
      <p class="unified-card-summary">Embed Drasi directly into your Rust applications as a library crate. Perfect for applications that need change processing capabilities without external dependencies.</p>
      <p><strong>Best for:</strong> Embedded systems, single applications, minimal footprint deployments</p>
      <p><a href="/how-to-guides/installation/drasi-lib/">Learn more →</a></p>
    </div>
  </div>
  
  <div class="unified-card unified-card--concepts">
    <div class="unified-card-icon">
      <i class="fas fa-server"></i>
    </div>
    <div class="unified-card-content">
      <h3 class="unified-card-title">Drasi Server</h3>
      <p class="unified-card-summary">Run Drasi as a standalone server process. Provides a complete change processing service without Kubernetes overhead.</p>
      <p><strong>Best for:</strong> Development environments, single-server deployments, traditional hosting</p>
      <p><a href="/how-to-guides/installation/drasi-server/">Learn more →</a></p>
    </div>
  </div>
  
  <div class="unified-card unified-card--concepts">
    <div class="unified-card-icon">
      <i class="fas fa-cloud"></i>
    </div>
    <div class="unified-card-content">
      <h3 class="unified-card-title">Drasi Platform (Kubernetes)</h3>
      <p class="unified-card-summary">Deploy Drasi as a distributed platform on Kubernetes. Provides scalability, high availability, and enterprise-grade operations.</p>
      <p><strong>Best for:</strong> Production deployments, multi-tenant environments, high-scale applications</p>
      <p><a href="/how-to-guides/installation/">Learn more →</a></p>
    </div>
  </div>
</div>

## Comparison

The following table helps you choose the right deployment mode for your needs:

| Feature | drasi-lib | Drasi Server | Drasi Platform |
|---------|-----------|--------------|----------------|
| **Deployment** | Embedded in application | Standalone process | Kubernetes cluster |
| **Management** | Programmatic API | Command-line/API | CLI + Kubernetes API |
| **Scaling** | Single instance | Single instance | Horizontal scaling |
| **Dependencies** | Minimal | Minimal | Kubernetes, Dapr, databases |
| **Operations** | Application lifecycle | Process management | Kubernetes orchestration |
| **Use Case** | Embedded applications | Development, simple deployments | Production, enterprise |
| **Availability** | Single instance | Single instance | High availability |
| **Multi-tenancy** | Single application | Single server | Multi-tenant capable |

## Choosing a Deployment Mode

### Use drasi-lib when:
- You're building a Rust application that needs change processing
- You want to embed Drasi functionality directly in your code
- You need minimal external dependencies
- Your application manages its own lifecycle
- You're building embedded systems or IoT applications

### Use Drasi Server when:
- You need a standalone change processing service
- You're developing or testing locally
- You want to deploy on traditional infrastructure (VMs, bare metal)
- You don't need Kubernetes orchestration
- You're running a single-tenant deployment

### Use Drasi Platform when:
- You're deploying to production at scale
- You need high availability and fault tolerance
- You require horizontal scaling capabilities
- You're already using Kubernetes
- You need multi-tenant isolation
- You want enterprise-grade operations and monitoring

## Architecture Differences

While all three deployment modes provide the same core Drasi functionality—{{< term "Source" "Sources" >}}, {{< term "Continuous Query" "Continuous Queries" >}}, and {{< term "Reaction" "Reactions" >}}—the way they're deployed and managed differs:

### drasi-lib Architecture
The library mode embeds all Drasi components within your application process. Your application code directly interacts with Drasi through Rust APIs, managing Sources, Continuous Queries, and Reactions programmatically.

### Drasi Server Architecture
The server mode runs Drasi as a single standalone process. You interact with it through a REST API or command-line interface. All components run within the same process, but are managed as a service.

### Drasi Platform Architecture
The platform mode distributes Drasi components across multiple pods in Kubernetes. This includes separate components for the control plane, query containers, Sources, and Reactions. The platform leverages Kubernetes for orchestration, Dapr for distributed systems patterns, and provides full horizontal scaling capabilities.

## Configuration and Management

Each deployment mode has different configuration and management approaches:

- **drasi-lib**: Configure through Rust code and configuration files
- **Drasi Server**: Configure through configuration files and command-line arguments
- **Drasi Platform**: Configure through YAML manifests and the Drasi CLI

## Migration Between Modes

While the three deployment modes share the same core concepts and capabilities, migrating between them requires some adaptation:

- **drasi-lib to Drasi Server**: Requires refactoring programmatic API calls to use the server's REST API or CLI
- **Drasi Server to Drasi Platform**: Requires packaging your configuration as Kubernetes manifests
- **Between any modes**: Core query definitions and logic remain the same, only the deployment and management layer changes

## Next Steps

Choose your deployment mode and get started:

- [Get started with drasi-lib](/how-to-guides/installation/drasi-lib/)
- [Get started with Drasi Server](/how-to-guides/installation/drasi-server/)
- [Get started with Drasi Platform](/how-to-guides/installation/)
