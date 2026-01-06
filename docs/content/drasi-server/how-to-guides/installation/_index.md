---
type: "docs"
title: "Installation"
linkTitle: "Installation"
weight: 10
description: "Deploy Drasi Server with Docker, Docker Compose, or build from source"
---

# Installing Drasi Server

Drasi Server can be deployed in several ways depending on your environment and requirements.

## Deployment Options

<div class="card-grid">
  <a href="install-with-docker/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fab fa-docker"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Docker</h3>
        <p class="unified-card-summary">Run Drasi Server as a single container. Best for quick starts and simple deployments.</p>
      </div>
    </div>
  </a>
  <a href="install-with-docker-compose/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fab fa-docker"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Docker Compose</h3>
        <p class="unified-card-summary">Deploy Drasi Server with related services like PostgreSQL. Best for development environments.</p>
      </div>
    </div>
  </a>
  <a href="build-from-source/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-code"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Build from Source</h3>
        <p class="unified-card-summary">Compile Drasi Server from source code. Best for contributors and custom builds.</p>
      </div>
    </div>
  </a>
  <a href="configuration-file/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-file-alt"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Configuration File</h3>
        <p class="unified-card-summary">Learn the YAML configuration file structure and options.</p>
      </div>
    </div>
  </a>
</div>

## Choosing a Deployment Method

| Method | Best For | Prerequisites |
|--------|----------|---------------|
| **Docker** | Quick starts, production, CI/CD | Docker 20.10+ |
| **Docker Compose** | Development, multi-service setups | Docker 20.10+, Docker Compose |
| **Build from Source** | Development, custom modifications | Rust 1.70+, Git |

## Quick Comparison

### Docker (Recommended)

```bash
docker run -d \
  --name drasi-server \
  -p 8080:8080 \
  ghcr.io/drasi-project/drasi-server:latest
```

**Pros:**
- Fastest deployment method
- No build required
- Easy upgrades

**Cons:**
- Less control over build configuration

### Docker Compose

```bash
docker-compose up -d
```

**Pros:**
- Easy multi-service orchestration
- Development-friendly
- Reproducible environments

**Cons:**
- Requires Docker Compose
- More configuration files

### Build from Source

```bash
cargo build --release
./target/release/drasi-server --config config/server.yaml
```

**Pros:**
- Full control over build
- Can modify source code
- Debug builds available

**Cons:**
- Requires Rust toolchain
- Longer initial setup

## System Requirements

### Minimum Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 1 core | 2+ cores |
| Memory | 512 MB | 2+ GB |
| Disk | 100 MB | 1+ GB (for state persistence) |

### Network Requirements

| Port | Purpose | Required |
|------|---------|----------|
| 8080 | REST API and Swagger UI | Yes |
| Custom | SSE reaction endpoints | If using SSE |
| Custom | HTTP/gRPC source endpoints | If using HTTP/gRPC sources |

## Next Steps

After installation, proceed to:

1. [Configure Sources](/drasi-server/how-to-guides/configure-sources/) - Connect to your data
2. [Write Continuous Queries](/drasi-server/how-to-guides/write-continuous-queries/) - Define what changes to detect
3. [Configure Reactions](/drasi-server/how-to-guides/configure-reactions/) - Define what happens when changes occur
