---
title: "Drasi Server"
linkTitle: "Drasi Server"
weight: 25
type: "docs"
no_list: true
description: "Standalone Drasi server for process or container deployment"
---

<div class="hero-section">
  <h1 class="hero-title">Run Drasi as a Standalone Server</h1>
  <p class="hero-subtitle">Drasi Server is a lightweight, single-process deployment that provides the full power of Drasi's data change processing functionality. Perfect for local development, Docker environments, and small-scale deployments.</p>

  <div class="cta-group">
    <a href="getting-started/" class="cta-button cta-button--primary">
      <i class="fas fa-rocket"></i>
      Get Started
    </a>
    <a href="/concepts/overview/" class="cta-button cta-button--secondary">
      <i class="fas fa-lightbulb"></i>
      Learn Concepts
    </a>
  </div>
</div>

## How Drasi Server Works

<p class="section-intro">Run a single Docker container, connect your data sources via configuration, and start reacting to changes. No Kubernetes required.</p>

<div class="flow-diagram">
  <div class="flow-step">
    <div class="flow-step__icon">
      <i class="fab fa-docker"></i>
    </div>
    <div class="flow-step__label">Run Container</div>
    <div class="flow-step__description">Start Drasi with Docker</div>
  </div>

  <div class="flow-arrow">
    <i class="fas fa-arrow-right"></i>
  </div>

  <div class="flow-step">
    <div class="flow-step__icon">
      <i class="fas fa-database"></i>
    </div>
    <div class="flow-step__label">Connect Sources</div>
    <div class="flow-step__description">Configure your data sources</div>
  </div>

  <div class="flow-arrow">
    <i class="fas fa-arrow-right"></i>
  </div>

  <div class="flow-step">
    <div class="flow-step__icon">
      <i class="fas fa-bolt"></i>
    </div>
    <div class="flow-step__label">React to Changes</div>
    <div class="flow-step__description">Trigger actions automatically</div>
  </div>
</div>

## When to Use Drasi Server

<p class="section-intro">Choose Drasi Server for development, testing, and lightweight production deployments.</p>

<div class="card-grid card-grid--3">
  <div class="unified-card unified-card--concepts">
    <div class="unified-card-icon"><i class="fas fa-laptop-code"></i></div>
    <div class="unified-card-content">
      <h3 class="unified-card-title">Local Development</h3>
      <p class="unified-card-summary">Run Drasi on your development machine for rapid iteration and testing.</p>
    </div>
  </div>
  <div class="unified-card unified-card--concepts">
    <div class="unified-card-icon"><i class="fab fa-docker"></i></div>
    <div class="unified-card-content">
      <h3 class="unified-card-title">Docker Environments</h3>
      <p class="unified-card-summary">Integrate seamlessly with Docker Compose and container-based workflows.</p>
    </div>
  </div>
  <div class="unified-card unified-card--concepts">
    <div class="unified-card-icon"><i class="fas fa-feather-alt"></i></div>
    <div class="unified-card-content">
      <h3 class="unified-card-title">Simple Deployments</h3>
      <p class="unified-card-summary">Full Drasi functionality without Kubernetes infrastructure overhead.</p>
    </div>
  </div>
</div>

## Explore Drasi Server

<div class="card-grid">
  <a href="getting-started/">
    <div class="unified-card unified-card--tutorials">
      <div class="unified-card-icon"><i class="fas fa-rocket"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Getting Started</h3>
        <p class="unified-card-summary">Install and run your first query in minutes</p>
      </div>
    </div>
  </a>
  <a href="tutorials/">
    <div class="unified-card unified-card--tutorials">
      <div class="unified-card-icon"><i class="fas fa-graduation-cap"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Tutorials</h3>
        <p class="unified-card-summary">Learn through hands-on examples</p>
      </div>
    </div>
  </a>
  <a href="how-to-guides/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-tools"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">How-to Guides</h3>
        <p class="unified-card-summary">Step-by-step instructions for common tasks</p>
      </div>
    </div>
  </a>
  <a href="patterns/">
    <div class="unified-card unified-card--concepts">
      <div class="unified-card-icon"><i class="fas fa-puzzle-piece"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Patterns</h3>
        <p class="unified-card-summary">Best practices for building change-driven applications</p>
      </div>
    </div>
  </a>
  <a href="reference/">
    <div class="unified-card unified-card--reference">
      <div class="unified-card-icon"><i class="fas fa-book"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Reference</h3>
        <p class="unified-card-summary">API, CLI, and configuration documentation</p>
      </div>
    </div>
  </a>
  <a href="/learning-paths/">
    <div class="unified-card unified-card--tutorials">
      <div class="unified-card-icon"><i class="fas fa-road"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Learning Paths</h3>
        <p class="unified-card-summary">Structured guides for different roles</p>
      </div>
    </div>
  </a>
</div>

## Key Features

| Feature | Description |
|---------|-------------|
| **PostgreSQL CDC** | Real-time change detection from PostgreSQL using logical replication |
| **HTTP/gRPC Sources** | Receive events via webhooks or gRPC streams |
| **Cypher Queries** | Express complex change detection logic with Cypher |
| **Multiple Reactions** | Log, HTTP, gRPC, SSE, and Platform (Redis) reactions |
| **Synthetic Joins** | Join data across tables without database-level foreign keys |
| **REST API** | Full management API for sources, queries, and reactions |
| **YAML Configuration** | Configure everything in a single config file |
| **Environment Variables** | Secure credential management with variable substitution |

## Available Sources

| Source | Description |
|--------|-------------|
| [PostgreSQL](how-to-guides/configure-sources/configure-postgresql-source/) | Change data capture from PostgreSQL |
| [HTTP](how-to-guides/configure-sources/configure-http-source/) | Receive webhook events |
| [gRPC](how-to-guides/configure-sources/configure-grpc-source/) | Stream events via gRPC |
| [Platform](how-to-guides/configure-sources/configure-platform-source/) | Receive from Redis streams |
| [Mock](how-to-guides/configure-sources/configure-mock-source/) | Generate test data |

## Available Reactions

| Reaction | Description |
|----------|-------------|
| [Log](how-to-guides/configure-reactions/configure-log-reaction/) | Console output with templates |
| [HTTP](how-to-guides/configure-reactions/configure-http-reaction/) | Webhook delivery |
| [gRPC](how-to-guides/configure-reactions/configure-grpc-reaction/) | Stream via gRPC |
| [SSE](how-to-guides/configure-reactions/configure-sse-reaction/) | Server-Sent Events for browsers |
| [Platform](how-to-guides/configure-reactions/configure-platform-reaction/) | Publish to Redis streams |
| [Profiler](how-to-guides/configure-reactions/configure-profiler-reaction/) | Performance metrics |

## Comparison with Drasi for Kubernetes

| Aspect | Drasi Server | Drasi for Kubernetes |
|--------|--------------|---------------------|
| **Deployment** | Single container | Multi-container with operators |
| **Configuration** | YAML file | Kubernetes CRDs |
| **Scaling** | Manual | Kubernetes-native auto-scaling |
| **Best for** | Development, simple prod | Enterprise production |
| **Dependencies** | Docker | Kubernetes cluster |

## Next Steps

- [Get Started](getting-started/) - Install and run your first query
- [PostgreSQL Tutorial](tutorials/postgresql-change-detection/) - Build a complete CDC pipeline
- [Configuration Reference](reference/configuration/) - All configuration options
