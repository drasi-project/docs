---
type: "docs"
title: "How-to Guides"
linkTitle: "How-to Guides"
weight: 20
description: "Step-by-step instructions for working with Drasi Server"
---

# Drasi Server How-to Guides

Practical, task-oriented guides for deploying and operating Drasi Server.

<div class="card-grid">
  <a href="installation/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-download"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Installation</h3>
        <p class="unified-card-summary">Deploy Drasi Server with Docker, Docker Compose, or build from source</p>
      </div>
    </div>
  </a>
  <a href="configure-sources/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-database"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Configure Sources</h3>
        <p class="unified-card-summary">Connect to PostgreSQL, HTTP, gRPC, and other data sources</p>
      </div>
    </div>
  </a>
  <a href="write-continuous-queries/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-search"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Write Continuous Queries</h3>
        <p class="unified-card-summary">Define Cypher queries with joins, filters, and aggregations</p>
      </div>
    </div>
  </a>
  <a href="configure-reactions/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-bolt"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Configure Reactions</h3>
        <p class="unified-card-summary">Set up Log, HTTP, gRPC, SSE, and Platform reactions</p>
      </div>
    </div>
  </a>
  <a href="configure-bootstrap-providers/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-play-circle"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Configure Bootstrap Providers</h3>
        <p class="unified-card-summary">Initialize queries with existing data</p>
      </div>
    </div>
  </a>
  <a href="operations/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-cogs"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Operations</h3>
        <p class="unified-card-summary">Monitor, troubleshoot, and maintain in production</p>
      </div>
    </div>
  </a>
</div>

## Quick Links

### Installation

| Guide | Description |
|-------|-------------|
| [Docker](installation/install-with-docker/) | Run as a single container |
| [Docker Compose](installation/install-with-docker-compose/) | Run with dependent services |
| [Build from Source](installation/build-from-source/) | Compile from Rust source |
| [Configuration File](installation/configuration-file/) | Create and customize config |

### Sources

| Guide | Description |
|-------|-------------|
| [PostgreSQL](configure-sources/configure-postgresql-source/) | Change data capture from PostgreSQL |
| [HTTP](configure-sources/configure-http-source/) | Receive webhook events |
| [gRPC](configure-sources/configure-grpc-source/) | Stream events via gRPC |
| [Platform](configure-sources/configure-platform-source/) | Receive from Redis streams |
| [Mock](configure-sources/configure-mock-source/) | Generate test data |

### Reactions

| Guide | Description |
|-------|-------------|
| [Log](configure-reactions/configure-log-reaction/) | Console output with templates |
| [HTTP](configure-reactions/configure-http-reaction/) | Webhook delivery |
| [gRPC](configure-reactions/configure-grpc-reaction/) | Stream via gRPC |
| [SSE](configure-reactions/configure-sse-reaction/) | Server-Sent Events for browsers |
| [Platform](configure-reactions/configure-platform-reaction/) | Publish to Redis streams |
| [Profiler](configure-reactions/configure-profiler-reaction/) | Performance metrics |

## Related Resources

- [Tutorials](/drasi-server/tutorials/) - Hands-on learning experiences
- [Reference](/drasi-server/reference/) - API, CLI, and configuration details
- [Patterns](/drasi-server/patterns/) - Best practices and design patterns
