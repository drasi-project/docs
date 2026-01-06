---
type: "docs"
title: "Getting Started with Drasi Server"
linkTitle: "Getting Started"
weight: 10
description: "Get Drasi Server running in minutes with Docker or from source"
related:
  concepts:
    - title: "Drasi Overview"
      url: "/concepts/overview/"
    - title: "Sources"
      url: "/concepts/sources/"
    - title: "Continuous Queries"
      url: "/concepts/continuous-queries/"
  howto:
    - title: "Configure Sources"
      url: "/drasi-server/how-to-guides/configure-sources/"
    - title: "Configure Reactions"
      url: "/drasi-server/how-to-guides/configure-reactions/"
  reference:
    - title: "CLI Reference"
      url: "/drasi-server/reference/cli/"
    - title: "Configuration Reference"
      url: "/drasi-server/reference/configuration/"
---

This guide walks you through getting Drasi Server running and creating your first continuous query. By the end, you'll have a working Drasi Server instance monitoring data changes.

## Prerequisites

Before you begin, ensure you have one of the following:

**For Docker deployment (recommended):**
- [Docker](https://docs.docker.com/get-docker/) 20.10 or later

**For building from source:**
- [Rust](https://www.rust-lang.org/tools/install) 1.70 or later
- Git with submodule support

## Quick Start with Docker

The fastest way to get started is using the pre-built Docker image.

### 1. Run Drasi Server

```bash
docker run -d \
  --name drasi-server \
  -p 8080:8080 \
  -v drasi-config:/config \
  -v drasi-data:/data \
  ghcr.io/drasi-project/drasi-server:latest
```

This command:
- Starts Drasi Server in detached mode
- Maps port 8080 for the REST API
- Creates persistent volumes for configuration and data

### 2. Verify Installation

Check that Drasi Server is running:

```bash
curl http://localhost:8080/health
```

You should see a response indicating the server is healthy:

```json
{"status":"healthy"}
```

### 3. Explore the API Documentation

Open the interactive API documentation in your browser:

```
http://localhost:8080/api/v1/docs/
```

This Swagger UI lets you explore and test all API endpoints.

## Quick Start from Source

If you prefer to build from source or need to modify the server:

### 1. Clone the Repository

```bash
git clone --recurse-submodules https://github.com/drasi-project/drasi-server.git
cd drasi-server
```

{{< alert title="Important" color="warning" >}}
The `--recurse-submodules` flag is required. Drasi Server depends on the DrasiLib library as a submodule.
{{< /alert >}}

### 2. Build the Server

```bash
cargo build --release
```

The compiled binary will be at `target/release/drasi-server`.

### 3. Create a Configuration File

Use the interactive configuration wizard:

```bash
cargo run --release -- init --output config/server.yaml
```

Or create a minimal configuration file manually:

```yaml
# config/server.yaml
host: 0.0.0.0
port: 8080
log_level: info

sources: []
queries: []
reactions: []
```

### 4. Start the Server

```bash
cargo run --release -- --config config/server.yaml
```

Or using the compiled binary:

```bash
./target/release/drasi-server --config config/server.yaml
```

## Your First Continuous Query

Let's create a simple setup with a mock data source to see Drasi Server in action.

### 1. Create a Configuration File

Create a file named `config/quickstart.yaml`:

```yaml
host: 0.0.0.0
port: 8080
log_level: info

sources:
  - kind: mock
    id: test-source
    auto_start: true
    data_type: sensor
    interval_ms: 3000

queries:
  - id: all-sensors
    query: "MATCH (n:Sensor) RETURN n.id, n.value, n.timestamp"
    sources:
      - source_id: test-source
    auto_start: true

reactions:
  - kind: log
    id: log-output
    queries: [all-sensors]
    auto_start: true
```

This configuration:
- Creates a **mock source** that generates sensor data every 3 seconds
- Defines a **continuous query** that monitors all sensor nodes
- Adds a **log reaction** that outputs query results to the console

### 2. Start the Server

```bash
# With Docker
docker run -d \
  --name drasi-quickstart \
  -p 8080:8080 \
  -v $(pwd)/config:/config \
  ghcr.io/drasi-project/drasi-server:latest \
  --config /config/quickstart.yaml

# Or from source
./target/release/drasi-server --config config/quickstart.yaml
```

### 3. View the Results

Watch the server logs to see query results as data changes:

```bash
# Docker
docker logs -f drasi-quickstart

# Or check the console output if running directly
```

You'll see output like:

```
[INFO] Query 'all-sensors' result changed: Added 1 items
[INFO] Added: {"id": "sensor-1", "value": 72.5, "timestamp": "2024-01-15T10:30:00Z"}
```

### 4. Query Current Results via API

You can also retrieve the current query results via the REST API:

```bash
curl http://localhost:8080/api/v1/queries/all-sensors/results
```

## Understanding the Configuration

Drasi Server uses YAML configuration files with three main sections:

| Section | Purpose |
|---------|---------|
| **sources** | Define where data comes from (databases, APIs, streams) |
| **queries** | Define what changes to detect using Cypher queries |
| **reactions** | Define what happens when query results change |

### Environment Variables

Configuration values support environment variable interpolation:

```yaml
sources:
  - kind: postgres
    id: production-db
    host: ${DB_HOST:-localhost}
    password: ${DB_PASSWORD}  # Required - fails if not set
```

Syntax:
- `${VAR}` - Required variable, server fails to start if not set
- `${VAR:-default}` - Optional variable with default value

## Validate Your Configuration

Before starting the server, you can validate your configuration:

```bash
# From source
./target/release/drasi-server validate --config config/server.yaml

# Show resolved values (with environment variables expanded)
./target/release/drasi-server validate --config config/server.yaml --show-resolved
```

## Check System Dependencies

Run the doctor command to verify your system is ready:

```bash
./target/release/drasi-server doctor

# Include optional dependencies
./target/release/drasi-server doctor --all
```

## Next Steps

Now that you have Drasi Server running, explore these topics:

<div class="card-grid">
  <a href="../how-to-guides/configure-sources/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-database"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Configure Sources</h3>
        <p class="unified-card-summary">Connect to PostgreSQL, HTTP endpoints, gRPC streams, and more</p>
      </div>
    </div>
  </a>
  <a href="../how-to-guides/configure-reactions/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-bolt"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Configure Reactions</h3>
        <p class="unified-card-summary">Set up webhooks, SSE streams, gRPC outputs, and logging</p>
      </div>
    </div>
  </a>
  <a href="../tutorials/">
    <div class="unified-card unified-card--tutorials">
      <div class="unified-card-icon"><i class="fas fa-graduation-cap"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Tutorials</h3>
        <p class="unified-card-summary">Follow hands-on tutorials for real-world scenarios</p>
      </div>
    </div>
  </a>
  <a href="/concepts/overview/">
    <div class="unified-card unified-card--concepts">
      <div class="unified-card-icon"><i class="fas fa-lightbulb"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Learn Concepts</h3>
        <p class="unified-card-summary">Understand how Drasi works under the hood</p>
      </div>
    </div>
  </a>
</div>
