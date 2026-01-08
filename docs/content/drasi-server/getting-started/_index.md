---
type: "docs"
title: "Getting Started with Drasi Server"
linkTitle: "Getting Started"
weight: 10
description: "Get Drasi Server running in minutes"
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

This guide walks you through getting Drasi Server running and creating your first continuous query. By the end, you'll have a working Drasi Server instance monitoring data changes and reacting to them.

## Get Drasi Server

Choose one of the following options to get Drasi Server:

{{< tabpane persistence="true" >}}
{{< tab header="Download Binary" lang="bash" >}}
# macOS (Apple Silicon)
curl -sL https://github.com/drasi-project/drasi-server/releases/latest/download/drasi-server-darwin-arm64.tar.gz | tar xz
chmod +x drasi-server

# macOS (Intel)
curl -sL https://github.com/drasi-project/drasi-server/releases/latest/download/drasi-server-darwin-amd64.tar.gz | tar xz
chmod +x drasi-server

# Linux (x64)
curl -sL https://github.com/drasi-project/drasi-server/releases/latest/download/drasi-server-linux-amd64.tar.gz | tar xz
chmod +x drasi-server

# Linux (ARM64)
curl -sL https://github.com/drasi-project/drasi-server/releases/latest/download/drasi-server-linux-arm64.tar.gz | tar xz
chmod +x drasi-server
{{< /tab >}}
{{< tab header="Docker" lang="bash" >}}
docker pull ghcr.io/drasi-project/drasi-server:latest
{{< /tab >}}
{{< /tabpane >}}

{{% alert title="Building from Source" color="info" %}}
If you prefer to build Drasi Server from source, see the [Build from Source](/drasi-server/how-to-guides/installation/build-from-source/) guide.
{{% /alert %}}

## Create a Configuration File

Drasi Server uses a YAML configuration file to define **sources** (where data comes from), **queries** (what changes to detect), and **reactions** (what to do when changes occur).

Create a new file named `config.yaml` and add each section below.

### Add Server Settings

Start with basic server settings:

```yaml
host: 0.0.0.0
port: 8080
log_level: info
```

### Add a Source

Sources connect Drasi Server to your data. For this guide, we'll use a **mock source** that generates sample sensor data:

```yaml
sources:
  - kind: mock
    id: demo-source
    auto_start: true
    data_type: sensor
    interval_ms: 2000
```

This creates a source that generates sensor readings (temperature, humidity) every 2 seconds.

### Add a Query

Queries define what data changes you want to monitor. Add a continuous query that watches all sensor data:

```yaml
queries:
  - id: all-sensors
    query: |
      MATCH (s:Sensor)
      RETURN s.id, s.temperature, s.humidity, s.timestamp
    sources:
      - source_id: demo-source
    auto_start: true
```

This query uses [Cypher](/concepts/continuous-queries/) to match all `Sensor` nodes and return their properties.

### Add a Reaction

Reactions define what happens when query results change. Add a log reaction to output changes to the console:

```yaml
reactions:
  - kind: log
    id: console-output
    queries:
      - all-sensors
    auto_start: true
```

### Complete Configuration

Your complete `config.yaml` file should look like this:

```yaml
host: 0.0.0.0
port: 8080
log_level: info

sources:
  - kind: mock
    id: demo-source
    auto_start: true
    data_type: sensor
    interval_ms: 2000

queries:
  - id: all-sensors
    query: |
      MATCH (s:Sensor)
      RETURN s.id, s.temperature, s.humidity, s.timestamp
    sources:
      - source_id: demo-source
    auto_start: true

reactions:
  - kind: log
    id: console-output
    queries:
      - all-sensors
    auto_start: true
```

## Run Drasi Server

Start Drasi Server with your configuration file:

{{< tabpane persistence="true" >}}
{{< tab header="Binary" lang="bash" >}}
./drasi-server --config config.yaml
{{< /tab >}}
{{< tab header="Docker" lang="bash" >}}
docker run --rm -it \
  --name drasi-server \
  -p 8080:8080 \
  -v $(pwd)/config.yaml:/config/config.yaml \
  ghcr.io/drasi-project/drasi-server:latest \
  --config /config/config.yaml
{{< /tab >}}
{{< /tabpane >}}

You should see output like this:

```
[INFO] Drasi Server starting on 0.0.0.0:8080
[INFO] Source 'demo-source' started
[INFO] Query 'all-sensors' started
[INFO] Reaction 'console-output' started
[INFO] Query 'all-sensors' result changed: Added 1 items
[INFO] Added: {"id": "sensor-1", "temperature": 72.5, "humidity": 45.2, "timestamp": "2024-01-15T10:30:00Z"}
```

Every 2 seconds, the mock source generates new sensor data, the query detects the change, and the log reaction outputs the result.

## Interact with Drasi Server

While Drasi Server is running, you can interact with it through the REST API.

### Query Current Results

Open a new terminal and retrieve the current query results:

```bash
curl http://localhost:8080/api/v1/queries/all-sensors/results
```

### Check Server Health

Verify the server is healthy:

```bash
curl http://localhost:8080/health
```

### Explore the API

Open the interactive API documentation in your browser:

```
http://localhost:8080/api/v1/docs/
```

This Swagger UI lets you explore and test all available API endpoints.

### View Source and Query Status

Check the status of your sources and queries:

```bash
# List all sources
curl http://localhost:8080/api/v1/sources

# List all queries
curl http://localhost:8080/api/v1/queries

# Get details for a specific query
curl http://localhost:8080/api/v1/queries/all-sensors
```

## Stop Drasi Server

To stop the server:

{{< tabpane persistence="true" >}}
{{< tab header="Binary" lang="bash" >}}
# Press Ctrl+C in the terminal where the server is running
{{< /tab >}}
{{< tab header="Docker" lang="bash" >}}
# Press Ctrl+C, or in another terminal:
docker stop drasi-server
{{< /tab >}}
{{< /tabpane >}}

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
