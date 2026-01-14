---
type: "docs"
title: "Getting Started"
linkTitle: "Getting Started"
weight: 5
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
      url: "/drasi-server/how-to-guides/configuration/configure-sources/"
    - title: "Configure Reactions"
      url: "/drasi-server/how-to-guides/configuration/configure-reactions/"
  reference:
    - title: "CLI Reference"
      url: "/drasi-server/reference/cli/"
    - title: "Configuration Reference"
      url: "/drasi-server/reference/configuration/"
---

This guide walks you through getting Drasi Server running and creating your first continuous query. By the end, you'll have a working Drasi Server instance monitoring data changes and reacting to them.

## Get Drasi Server

Choose one of the following options to get Drasi Server:

{{< tabpane persist="header" >}}
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

Drasi Server uses a YAML configuration file to define {{< term "Source" "Sources" >}} (where data comes from), {{< term "Continuous Query" "Continuous Queries" >}} (what changes to detect), and {{< term "Reaction" "Reactions" >}} (what to do when changes occur).

Create a new file named `config.yaml` and add each section below.

### Add Server Settings

Start with basic server settings:

```yaml
host: 0.0.0.0
port: 8080
log_level: info
auto_start: true
```

### Add a Source

Sources connect Drasi Server to your data. For this tutorial, we'll use a **mock source** that generates sample sensor data:

```yaml
sources:
  - kind: mock
    id: demo-source
    auto_start: true
    data_type: sensor_live
    interval_ms: 2000
```

This creates a source that generates sensor readings (temperature, humidity) every 2 seconds.

### Add a Continuous Query

Continuous Queries define what data changes you want to monitor. Add a Continuous Query that watches all sensor data:

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

This Continuous Query uses {{< term "openCypher" >}} to match all `Sensor` {{< term "Node" "nodes" >}} and return their properties.

### Add a Reaction

Reactions define what happens when a Continuous Query's results change. Add a Log Reaction to output changes to the console:

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
auto_start: true

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

{{< tabpane persist="header" >}}
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
[2026-01-12T22:20:28Z INFO  drasi_server] Starting Drasi Server
[2026-01-12T22:20:28Z INFO  drasi_server] Config file: /config/config.yaml
[2026-01-12T22:20:28Z INFO  drasi_server] Port: 8080
...
[2026-01-12T22:20:28Z INFO  drasi_server::server] Starting web API on 0.0.0.0:8080
[2026-01-12T22:20:28Z INFO  drasi_server::server] API v1 available at http://0.0.0.0:8080/api/v1/
[2026-01-12T22:20:28Z INFO  drasi_server::server] Swagger UI available at http://0.0.0.0:8080/api/v1/docs/
[2026-01-12T22:20:28Z INFO  drasi_server::server] Drasi Server started successfully with API on port 8080
```

Every 2 seconds, the mock source generates new sensor data, the query detects the change, and the log reaction outputs the result like this:

```
[console-output] Query 'all-sensors' (1 items):
[console-output]   [ADD] {"humidity":"49.597562498637316","sensor_id":"sensor_2","temperature":"20.904670200458263","timestamp":"2026-01-13T02:03:49.880559+00:00"}
[console-output] Query 'all-sensors' (1 items):
[console-output]   [ADD] {"humidity":"52.12288411730867","sensor_id":"sensor_1","temperature":"21.993493026464385","timestamp":"2026-01-13T02:03:51.882287+00:00"}
[console-output] Query 'all-sensors' (1 items):
[console-output]   [UPDATE] {"humidity":"52.12288411730867","sensor_id":"sensor_1","temperature":"21.993493026464385","timestamp":"2026-01-13T02:03:51.882287+00:00"} -> {"humidity":"55.46429973696152","sensor_id":"sensor_1","temperature":"20.64979756129898","timestamp":"2026-01-13T02:03:53.882430+00:00"}
[console-output] Query 'all-sensors' (1 items):
[console-output]   [UPDATE] {"humidity":"40.44525294610261","sensor_id":"sensor_4","temperature":"24.062226270290086","timestamp":"2026-01-13T02:03:47.881694+00:00"} -> {"humidity":"48.72444652395867","sensor_id":"sensor_4","temperature":"22.79714222963862","timestamp":"2026-01-13T02:03:55.881525+00:00"}
[console-output] Query 'all-sensors' (1 items):
[console-output]   [UPDATE] {"humidity":"48.72444652395867","sensor_id":"sensor_4","temperature":"22.79714222963862","timestamp":"2026-01-13T02:03:55.881525+00:00"} -> {"humidity":"49.48011637466249","sensor_id":"sensor_4","temperature":"27.065236611653194","timestamp":"2026-01-13T02:03:57.882055+00:00"}
[console-output] Query 'all-sensors' (1 items):
[console-output]   [ADD] {"humidity":"51.33780369006803","sensor_id":"sensor_3","temperature":"26.786339702814317","timestamp":"2026-01-13T02:03:59.882022+00:00"}
[console-output] Query 'all-sensors' (1 items):
[console-output]   [UPDATE] {"humidity":"49.597562498637316","sensor_id":"sensor_2","temperature":"20.904670200458263","timestamp":"2026-01-13T02:03:49.880559+00:00"} -> {"humidity":"47.39639661702978","sensor_id":"sensor_2","temperature":"27.119829345535607","timestamp":"2026-01-13T02:04:01.881317+00:00"}
[console-output] Query 'all-sensors' (1 items):
[console-output]   [UPDATE] {"humidity":"49.48011637466249","sensor_id":"sensor_4","temperature":"27.065236611653194","timestamp":"2026-01-13T02:03:57.882055+00:00"} -> {"humidity":"46.11804098462849","sensor_id":"sensor_4","temperature":"26.902895834274503","timestamp":"2026-01-13T02:04:03.881792+00:00"}
[console-output] Query 'all-sensors' (1 items):
[console-output]   [UPDATE] {"humidity":"47.39639661702978","sensor_id":"sensor_2","temperature":"27.119829345535607","timestamp":"2026-01-13T02:04:01.881317+00:00"} -> {"humidity":"57.09494971225041","sensor_id":"sensor_2","temperature":"29.94252332023011","timestamp":"2026-01-13T02:04:05.881658+00:00"}
```

## Interact with Drasi Server

While Drasi Server is running, you can interact with it through the REST API.

### Query Current Results

Open a new terminal and retrieve the current query results:

```bash
curl http://localhost:8080/api/v1/queries/all-sensors/results
```

This returns the current results of the `all-sensors` query in JSON format, like this:

```
{"success":true,"data":[{"humidity":"46.11804098462849","sensor_id":"sensor_4","temperature":"26.902895834274503","timestamp":"2026-01-13T02:04:03.881792+00:00"},{"humidity":"47.39639661702978","sensor_id":"sensor_2","temperature":"27.119829345535607","timestamp":"2026-01-13T02:04:01.881317+00:00"},{"humidity":"55.46429973696152","sensor_id":"sensor_1","temperature":"20.64979756129898","timestamp":"2026-01-13T02:03:53.882430+00:00"},{"humidity":"51.33780369006803","sensor_id":"sensor_3","temperature":"26.786339702814317","timestamp":"2026-01-13T02:03:59.882022+00:00"}],"error":null}
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

{{< tabpane persist="header" >}}
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
